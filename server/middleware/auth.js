const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'gmg_don_bosco_asti_korea_secret_key_2027_secure';

async function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await query.get(
      'SELECT id, username, email, full_name, role, status FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(401).json({ error: 'Accesso non autorizzato. Effettua il login.' });
  }

  const user = await verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sessione scaduta o non valida. Effettua nuovamente il login.' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({
      error: 'Il tuo account è in attesa di approvazione da parte di un moderatore o dell\'amministratore.',
      status: 'pending'
    });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({
      error: 'La tua richiesta di registrazione non è stata approvata. Contatta i referenti dell\'oratorio.',
      status: 'rejected'
    });
  }

  req.user = user;
  next();
}

function requireModerator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Accesso non autorizzato.' });
  }
  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permesso negato: questa azione richiede il ruolo di Moderatore o Admin.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Accesso non autorizzato.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permesso negato: solo l\'Amministratore può eseguire questa operazione.' });
  }
  next();
}

async function optionalAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (token) {
    const user = await verifyToken(token);
    if (user && user.status === 'approved') {
      req.user = user;
    }
  }
  next();
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireModerator,
  requireAdmin,
  optionalAuth
};
