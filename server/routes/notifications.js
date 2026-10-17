const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db');
const {
  getVapidPublicKey,
  saveSubscription,
  deleteSubscription,
  sendPushToUser
} = require('../services/notifications');

// Recupera chiave pubblica VAPID per il client (Accessibile anche da non autenticati per preparare la sottoscrizione)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// Registra la sottoscrizione push per l'utente loggato
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Dati di sottoscrizione mancanti o non validi.' });
    }

    const userAgent = req.headers['user-agent'] || '';
    await saveSubscription(req.user.id, subscription, userAgent);

    res.json({ success: true, message: 'Notifiche push attivate con successo sul tuo dispositivo!' });
  } catch (err) {
    console.error('Errore subscribe push:', err);
    res.status(500).json({ error: 'Impossibile salvare la sottoscrizione push.' });
  }
});

// Rimuove la sottoscrizione push
router.post('/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await deleteSubscription(endpoint);
    }
    res.json({ success: true, message: 'Dispositivo disiscritto dalle notifiche.' });
  } catch (err) {
    console.error('Errore unsubscribe push:', err);
    res.status(500).json({ error: 'Errore durante la disiscrizione.' });
  }
});

// Verifica se l'utente ha dispositivi attivi per le notifiche push
router.get('/status', requireAuth, async (req, res) => {
  try {
    const count = await query.get(
      'SELECT COUNT(*) as c FROM push_subscriptions WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ subscribed: Boolean(count && count.c > 0), count: count ? count.c : 0 });
  } catch (err) {
    res.status(500).json({ error: 'Errore verifica stato notifiche.' });
  }
});

// Test notifica immediata inviata all'utente stesso
router.post('/test', requireAuth, async (req, res) => {
  try {
    const sent = await sendPushToUser(req.user.id, {
      title: '🔔 Test Notifiche GMG 2027',
      body: `Ciao ${req.user.full_name}, le notifiche push sul tuo dispositivo funzionano perfettamente!`,
      icon: '/icon-192.png',
      badge: '/icon.svg',
      url: '/',
      tag: `test-${Date.now()}`
    });

    if (sent > 0) {
      res.json({ success: true, message: 'Notifica di test inviata al tuo dispositivo!' });
    } else {
      res.status(400).json({ error: 'Nessun dispositivo registrato trovato per questo account.' });
    }
  } catch (err) {
    console.error('Errore test push:', err);
    res.status(500).json({ error: 'Errore durante l\'invio della notifica di test.' });
  }
});

module.exports = router;
