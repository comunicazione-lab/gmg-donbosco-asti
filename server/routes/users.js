const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { requireAuth, requireModerator, requireAdmin } = require('../middleware/auth');

// Lista utenti (Accessibile a Moderatori e Admin)
// I moderatori ne hanno bisogno per vedere e approvare gli utenti pendenti
router.get('/', requireAuth, requireModerator, async (req, res) => {
  try {
    const { status, role, search } = req.query;
    let sql = 'SELECT id, username, email, full_name, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (role && role !== 'all') {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      sql += ' AND (LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(full_name) LIKE ?)';
      const s = `%${search.toLowerCase().trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY CASE status WHEN "pending" THEN 1 WHEN "approved" THEN 2 ELSE 3 END, created_at DESC';

    const users = await query.all(sql, params);
    res.json({ users });
  } catch (err) {
    console.error('Errore recupero utenti:', err);
    res.status(500).json({ error: 'Errore nel recupero della lista utenti.' });
  }
});

// Lista utenti registrati approvati per selezione nelle spese e bilancio (Accessibile a tutti gli utenti autenticati)
router.get('/registered-list', requireAuth, async (req, res) => {
  try {
    const users = await query.all(
      "SELECT id, full_name, email, role FROM users WHERE status = 'approved' ORDER BY full_name ASC"
    );
    res.json({ users });
  } catch (err) {
    console.error('Errore recupero lista utenti registrati:', err);
    res.status(500).json({ error: 'Errore nel recupero della lista utenti.' });
  }
});

// Conteggio utenti in attesa di approvazione (badge notifiche per moderatori e admin)
router.get('/pending-count', requireAuth, requireModerator, async (req, res) => {
  try {
    const result = await query.get('SELECT COUNT(*) as pendingCount FROM users WHERE status = "pending"');
    res.json({ pendingCount: result ? result.pendingCount : 0 });
  } catch (err) {
    res.status(500).json({ error: 'Errore conteggio utenti in attesa.' });
  }
});

// Approvazione utente (Accessibile sia a Moderatori che ad Admin)
router.post('/:id/approve', requireAuth, requireModerator, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const targetUser = await query.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    await query.run('UPDATE users SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

    // Log azione
    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'APPROVAZIONE_UTENTE', ?)
    `, [req.user.id, req.user.full_name, `Approvato l'utente ${targetUser.username} (${targetUser.email}) da parte di ${req.user.full_name}`]);

    // Notifica push all'utente approvato
    try {
      const { notifyUserApproved } = require('../services/notifications');
      notifyUserApproved(targetUser).catch(pushErr => console.warn('⚠️ Errore invio push notifica utente approvato:', pushErr.message));
    } catch (e) {
      console.warn('⚠️ Impossibile notificare utente approvato via push:', e.message);
    }

    res.json({ success: true, message: `Utente ${targetUser.full_name} approvato con successo!` });
  } catch (err) {
    console.error('Errore approvazione utente:', err);
    res.status(500).json({ error: 'Errore durante l\'approvazione dell\'utente.' });
  }
});

// Rifiuto utente (Accessibile sia a Moderatori che ad Admin)
router.post('/:id/reject', requireAuth, requireModerator, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const targetUser = await query.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'Non è possibile rifiutare un amministratore.' });
    }

    await query.run('UPDATE users SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

    // Log azione
    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'RIFIUTO_UTENTE', ?)
    `, [req.user.id, req.user.full_name, `Rifiutata la registrazione di ${targetUser.username} (${targetUser.email})`]);

    res.json({ success: true, message: `Richiesta di ${targetUser.full_name} rifiutata.` });
  } catch (err) {
    console.error('Errore rifiuto utente:', err);
    res.status(500).json({ error: 'Errore durante il rifiuto dell\'utente.' });
  }
});

// Creazione diretta nuovo utente (SOLO ADMIN: "admin ha tutti i permessi, può creare nuovi utenti")
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Tutti i campi (username, email, password, nome e cognome) sono obbligatori.' });
    }

    const assignedRole = ['admin', 'moderator', 'user'].includes(role) ? role : 'user';
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Verifica unicità
    const existing = await query.get(
      'SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername) {
        return res.status(409).json({ error: 'Nome utente già occupato.' });
      }
      return res.status(409).json({ error: 'Email già registrata.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Utente creato dall'admin è già 'approved'
    const result = await query.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, ?, 'approved')
    `, [cleanUsername, cleanEmail, passwordHash, full_name.trim(), assignedRole]);

    // Log attività
    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'CREAZIONE_UTENTE_ADMIN', ?)
    `, [req.user.id, req.user.full_name, `Admin ha creato l'utente ${cleanUsername} con ruolo ${assignedRole}`]);

    res.status(201).json({
      success: true,
      message: `Utente ${full_name} creato con successo con ruolo ${assignedRole}.`,
      userId: result.lastID
    });
  } catch (err) {
    console.error('Errore creazione utente da admin:', err);
    res.status(500).json({ error: 'Errore durante la creazione del nuovo utente.' });
  }
});

// Modifica ruolo utente (SOLO ADMIN)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido (selezionare admin, moderator o user).' });
    }

    const targetUser = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    // Se l'utente è l'unico admin, impedisci di togliere il ruolo
    if (targetUser.role === 'admin' && role !== 'admin') {
      const adminCount = await query.get('SELECT COUNT(*) as c FROM users WHERE role = "admin"');
      if (adminCount.c <= 1) {
        return res.status(400).json({ error: 'Impossibile retrocedere l\'ultimo amministratore del sistema.' });
      }
    }

    await query.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, userId]);

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'MODIFICA_RUOLO', ?)
    `, [req.user.id, req.user.full_name, `Modificato ruolo di ${targetUser.username} in ${role}`]);

    res.json({ success: true, message: `Ruolo di ${targetUser.full_name} aggiornato a ${role}.` });
  } catch (err) {
    console.error('Errore modifica ruolo:', err);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento del ruolo.' });
  }
});

// Reset password utente da Admin (SOLO ADMIN)
router.post('/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nuova password deve contenere almeno 6 caratteri.' });
    }

    const targetUser = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, userId]);

    res.json({ success: true, message: `Password per ${targetUser.full_name} reimpostata con successo.` });
  } catch (err) {
    console.error('Errore reset password:', err);
    res.status(500).json({ error: 'Errore durante la reimpostazione della password.' });
  }
});

// Eliminazione utente (SOLO ADMIN)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Non puoi eliminare il tuo stesso account.' });
    }

    const targetUser = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    await query.run('DELETE FROM users WHERE id = ?', [userId]);

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'ELIMINAZIONE_UTENTE', ?)
    `, [req.user.id, req.user.full_name, `Eliminato utente ${targetUser.username} (${targetUser.email})`]);

    res.json({ success: true, message: `Utente ${targetUser.full_name} eliminato.` });
  } catch (err) {
    console.error('Errore eliminazione utente:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente.' });
  }
});

module.exports = router;
