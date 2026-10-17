const webpush = require('web-push');
const { query } = require('../db');

// Chiavi VAPID per le notifiche Web Push (PWA)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKFrZ4UudkcVkaTh-hL20Q8f_j35zwV5iNu4f59UWKqazz_gtx6hIF8JwRHdaHYV6ZPgdQow73z2Kb-tjz2E8hU';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'TUyrC_m6sbASbN9RmIoSinzc2TfrUB39qODa4vRzkTo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@dbasti.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push VAPID configurato con successo.');
} catch (err) {
  console.error('Errore configurazione VAPID:', err.message);
}

function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

// Salva o aggiorna la sottoscrizione push di un utente
async function saveSubscription(userId, subscription, userAgent = '') {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Sottoscrizione push non valida');
  }

  const { endpoint, keys } = subscription;
  const p256dh = keys.p256dh;
  const auth = keys.auth;

  await query.run(`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = excluded.user_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      user_agent = excluded.user_agent,
      created_at = CURRENT_TIMESTAMP
  `, [userId, endpoint, p256dh, auth, userAgent]);

  return true;
}

// Rimuove una sottoscrizione push
async function deleteSubscription(endpoint) {
  if (!endpoint) return;
  await query.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
}

// Invia una notifica a una singola sottoscrizione
async function sendToSubscription(sub, payloadString) {
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth
    }
  };

  try {
    await webpush.sendNotification(pushSubscription, payloadString);
    return true;
  } catch (err) {
    // Se la sottoscrizione non è più valida (404 Not Found o 410 Gone), la rimuoviamo dal database
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`Rimozione sottoscrizione scaduta: ${sub.endpoint.slice(0, 30)}...`);
      await deleteSubscription(sub.endpoint);
    } else {
      console.warn('Errore invio push notification:', err.message);
    }
    return false;
  }
}

// Invia notifica push a tutti i dispositivi di un utente
async function sendPushToUser(userId, payload) {
  try {
    const subs = await query.all('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]);
    if (!subs || subs.length === 0) return 0;

    const payloadString = JSON.stringify(payload);
    let successCount = 0;
    for (const sub of subs) {
      const ok = await sendToSubscription(sub, payloadString);
      if (ok) successCount++;
    }
    return successCount;
  } catch (err) {
    console.error('Errore sendPushToUser:', err.message);
    return 0;
  }
}

// Invia notifica a tutti gli utenti con uno specifico ruolo (es. 'admin')
async function sendPushToRole(role, payload) {
  try {
    const subs = await query.all(`
      SELECT ps.* FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      WHERE u.role = ? AND u.status = 'approved'
    `, [role]);

    if (!subs || subs.length === 0) return 0;
    const payloadString = JSON.stringify(payload);
    let sent = 0;
    for (const sub of subs) {
      const ok = await sendToSubscription(sub, payloadString);
      if (ok) sent++;
    }
    return sent;
  } catch (err) {
    console.error('Errore sendPushToRole:', err.message);
    return 0;
  }
}

// Invia notifica a tutti gli utenti approvati (opzionalmente escludendo l'autore dell'azione)
async function sendPushToAll(payload, excludeUserId = null) {
  try {
    let sql = `
      SELECT ps.* FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      WHERE u.status = 'approved'
    `;
    const params = [];
    if (excludeUserId) {
      sql += ' AND ps.user_id != ?';
      params.push(excludeUserId);
    }

    const subs = await query.all(sql, params);
    if (!subs || subs.length === 0) return 0;

    const payloadString = JSON.stringify(payload);
    let sent = 0;
    for (const sub of subs) {
      const ok = await sendToSubscription(sub, payloadString);
      if (ok) sent++;
    }
    return sent;
  } catch (err) {
    console.error('Errore sendPushToAll:', err.message);
    return 0;
  }
}

// 1. Notifica: Nuova voce di bilancio inserita (Entrata o Spesa)
async function notifyNewEntry({ initiativeTitle, entry, authorName, authorId }) {
  const isIncome = entry.type === 'income';
  const symbol = isIncome ? '🟢 +' : '🔴 -';
  const typeLabel = isIncome ? 'Entrata' : 'Spesa';
  const formattedAmount = `€${Number(entry.amount).toFixed(2)}`;

  const payload = {
    title: `💰 Nuova voce: ${initiativeTitle}`,
    body: `${authorName || 'Un utente'} ha registrato una ${typeLabel} (${symbol}${formattedAmount}): "${entry.title}"`,
    icon: '/icon-192.png',
    badge: '/icon.svg',
    url: '/',
    tag: `entry-${Date.now()}`
  };

  return await sendPushToAll(payload, authorId);
}

// 2. Notifica: Nuovo utente registrato in attesa di approvazione (inviata agli Admin)
async function notifyNewUserRegistration(newUser) {
  const payload = {
    title: '👤 Nuova richiesta di accesso',
    body: `${newUser.full_name} (${newUser.email}) si è registrato ed è in attesa di approvazione.`,
    icon: '/icon-192.png',
    badge: '/icon.svg',
    url: '/',
    tag: `user-reg-${newUser.id || Date.now()}`
  };

  return await sendPushToRole('admin', payload);
}

// 3. Notifica: Account approvato dall'amministrazione (inviata al nuovo utente)
async function notifyUserApproved(user) {
  const payload = {
    title: '🎉 Benvenuto in GMG Seoul 2027!',
    body: `Ciao ${user.full_name}, la tua iscrizione è stata approvata. Ora puoi accedere e visualizzare le iniziative.`,
    icon: '/icon-192.png',
    badge: '/icon.svg',
    url: '/',
    tag: `user-approved-${user.id}`
  };

  return await sendPushToUser(user.id, payload);
}

// 4. Notifica: Stato rimborso aggiornato per chi ha anticipato una spesa
async function notifyReimbursementUpdated(entry, newStatus) {
  if (!entry || !entry.sustained_by_id) return 0;

  let statusText = 'da rimborsare';
  if (newStatus === 'rimborsato') statusText = '✅ Rimborsata dalla cassa dell\'oratorio';
  else if (newStatus === 'donato') statusText = '🔵 Registrata come Donazione libera';

  const payload = {
    title: '💶 Aggiornamento Rimborso Spesa',
    body: `La spesa di €${Number(entry.amount).toFixed(2)} per "${entry.title}" è stata aggiornata a: ${statusText}.`,
    icon: '/icon-192.png',
    badge: '/icon.svg',
    url: '/',
    tag: `reimb-${entry.id}-${Date.now()}`
  };

  return await sendPushToUser(entry.sustained_by_id, payload);
}

module.exports = {
  getVapidPublicKey,
  saveSubscription,
  deleteSubscription,
  sendPushToUser,
  sendPushToRole,
  sendPushToAll,
  notifyNewEntry,
  notifyNewUserRegistration,
  notifyUserApproved,
  notifyReimbursementUpdated
};
