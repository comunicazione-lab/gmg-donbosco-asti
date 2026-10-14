const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// Registrazione pubblica (diventa pending e deve essere approvata da un moderatore o admin)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Tutti i campi (username, email, password, nome e cognome) sono obbligatori.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La password deve contenere almeno 6 caratteri.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Verifica se username o email sono già in uso
    const existing = await query.get(
      'SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername) {
        return res.status(409).json({ error: 'Nome utente già utilizzato. Scegline un altro.' });
      }
      return res.status(409).json({ error: 'Indirizzo email già registrato.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'user', 'pending')
    `, [cleanUsername, cleanEmail, passwordHash, full_name.trim()]);

    // Log attività
    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'REGISTRAZIONE', ?)
    `, [result.lastID, full_name.trim(), `Nuova richiesta di account per ${cleanUsername} (${cleanEmail})`]);

    return res.status(201).json({
      success: true,
      message: 'Registrazione inviata con successo! Un moderatore o l\'amministratore dell\'oratorio dovrà approvare il tuo account prima del primo accesso.',
      status: 'pending'
    });
  } catch (err) {
    console.error('Errore durante la registrazione:', err);
    return res.status(500).json({ error: 'Errore interno del server durante la registrazione.' });
  }
});

// Login (Accesso SOLO con Email)
router.post('/login', async (req, res) => {
  try {
    const inputEmail = (req.body.email || req.body.username || '').trim().toLowerCase();
    const { password } = req.body;

    if (!inputEmail || !password) {
      return res.status(400).json({ error: 'Inserisci l\'indirizzo email e la password.' });
    }

    // Ricerca utente per email (o fallback username solo per script di sincronizzazione admin)
    const user = await query.get(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
      [inputEmail, inputEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide. Verifica indirizzo email o password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenziali non valide. Verifica indirizzo email o password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Il tuo account è in attesa di approvazione da parte di un moderatore o dell\'amministratore dell\'oratorio.',
        status: 'pending'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: 'La tua richiesta di registrazione non è stata approvata. Rivolgiti agli animatori Don Bosco Asti.',
        status: 'rejected'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Errore durante il login:', err);
    return res.status(500).json({ error: 'Errore interno del server durante il login.' });
  }
});

// Richiesta recupero password: invia email da noreply@dbasti.com
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Inserisci il tuo indirizzo email.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await query.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(404).json({
        error: 'Nessun account trovato associato a questo indirizzo email. Verifica l\'indirizzo o registrati.'
      });
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // codice a 6 cifre

    // Scadenza a 1 ora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalida token precedenti non utilizzati
    await query.run('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0', [user.id]);

    // Registra nuovo reset
    await query.run(`
      INSERT INTO password_resets (user_id, email, token, code, expires_at, used)
      VALUES (?, ?, ?, ?, ?, 0)
    `, [user.id, user.email, resetToken, resetCode, expiresAt]);

    // Genera URL di reset completo per il pulsante nell'email
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const resetLink = `${baseUrl}/?reset_token=${resetToken}`;

    // Invia email con HTML moderno
    const { sendPasswordResetEmail } = require('../services/email');
    await sendPasswordResetEmail({
      toEmail: user.email,
      fullName: user.full_name,
      resetToken,
      resetCode,
      resetLink
    });

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'RICHIESTA_RECUPERO_PASSWORD', ?)
    `, [user.id, user.full_name, `Inviata email di recupero a ${user.email}`]);

    return res.json({
      success: true,
      message: `Abbiamo inviato un'email con il codice di verifica a ${user.email}. Controlla la posta in arrivo o lo spam!`
    });
  } catch (err) {
    console.error('Errore invio email recupero password:', err);
    return res.status(500).json({ error: 'Errore durante l\'invio dell\'email di recupero: ' + err.message });
  }
});

// Verifica codice a 6 cifre o token
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code, token } = req.body;

    let resetRecord;
    if (token) {
      resetRecord = await query.get(`
        SELECT r.*, u.full_name, u.email as user_email
        FROM password_resets r
        JOIN users u ON r.user_id = u.id
        WHERE r.token = ? AND r.used = 0 AND datetime(r.expires_at) > datetime('now')
      `, [token]);
    } else if (email && code) {
      resetRecord = await query.get(`
        SELECT r.*, u.full_name, u.email as user_email
        FROM password_resets r
        JOIN users u ON r.user_id = u.id
        WHERE LOWER(r.email) = ? AND r.code = ? AND r.used = 0 AND datetime(r.expires_at) > datetime('now')
      `, [email.trim().toLowerCase(), code.trim()]);
    }

    if (!resetRecord) {
      return res.status(400).json({ error: 'Codice di verifica o link non valido o scaduto.' });
    }

    return res.json({
      success: true,
      message: 'Codice verificato con successo!',
      token: resetRecord.token,
      email: resetRecord.user_email
    });
  } catch (err) {
    console.error('Errore verifica codice reset:', err);
    return res.status(500).json({ error: 'Errore verifica codice.' });
  }
});

// Impostazione nuova password tramite token o codice
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, code, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'La nuova password deve contenere almeno 6 caratteri.' });
    }

    let resetRecord;
    if (token) {
      resetRecord = await query.get(`
        SELECT * FROM password_resets
        WHERE token = ? AND used = 0 AND datetime(expires_at) > datetime('now')
      `, [token]);
    } else if (email && code) {
      resetRecord = await query.get(`
        SELECT * FROM password_resets
        WHERE LOWER(email) = ? AND code = ? AND used = 0 AND datetime(expires_at) > datetime('now')
      `, [email.trim().toLowerCase(), code.trim()]);
    }

    if (!resetRecord) {
      return res.status(400).json({ error: 'Richiesta di ripristino non valida o scaduta. Richiedi un nuovo codice.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await query.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newHash,
      resetRecord.user_id
    ]);

    await query.run('UPDATE password_resets SET used = 1 WHERE id = ?', [resetRecord.id]);

    const user = await query.get('SELECT full_name, email FROM users WHERE id = ?', [resetRecord.user_id]);

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'RESET_PASSWORD_COMPLETATO', ?)
    `, [resetRecord.user_id, user ? user.full_name : 'Utente', 'Password reimpostata con successo tramite email']);

    return res.json({
      success: true,
      message: 'Password reimpostata con successo! Ora puoi accedere con la tua nuova password.'
    });
  } catch (err) {
    console.error('Errore reimpostazione password:', err);
    return res.status(500).json({ error: 'Errore durante la reimpostazione della password.' });
  }
});

// Profilo utente corrente
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Cambio password dall'interno del portale
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Fornisci la password attuale e la nuova password.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nuova password deve contenere almeno 6 caratteri.' });
    }

    const user = await query.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'La password attuale non è corretta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newHash,
      req.user.id
    ]);

    res.json({ success: true, message: 'Password aggiornata con successo!' });
  } catch (err) {
    console.error('Errore cambio password:', err);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento della password.' });
  }
});

module.exports = router;
