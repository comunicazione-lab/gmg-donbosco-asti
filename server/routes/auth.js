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

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Inserisci username e password.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await query.get(
      'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [cleanUsername, cleanUsername]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide. Verifica username o password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenziali non valide. Verifica username o password.' });
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
      { id: user.id, username: user.username, role: user.role },
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

// Profilo utente corrente
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Cambio password
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
