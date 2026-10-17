// Client-side helper per la gestione delle Notifiche Web Push (PWA)

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('Errore lettura sottoscrizione push:', err);
    return null;
  }
}

export async function subscribeUserToPush(token) {
  if (!isPushSupported()) {
    throw new Error('Le notifiche push non sono supportate da questo browser o dispositivo.');
  }

  // 1. Chiedi il permesso all'utente
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Permesso notifiche negato nelle impostazioni del browser.'
        : 'Permesso notifiche non concesso.'
    );
  }

  // 2. Ottieni la chiave pubblica VAPID dal backend
  const keyRes = await fetch('/api/notifications/vapid-public-key');
  if (!keyRes.ok) {
    throw new Error('Impossibile recuperare la chiave di cifratura notifiche.');
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    throw new Error('Chiave pubblica notifiche non configurata sul server.');
  }

  // 3. Registra la sottoscrizione col Service Worker
  const reg = await navigator.serviceWorker.ready;
  const convertedKey = urlBase64ToUint8Array(publicKey);

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });
  }

  // 4. Invia la sottoscrizione al backend
  const subRes = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ subscription })
  });

  if (!subRes.ok) {
    const errData = await subRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Errore salvataggio sottoscrizione sul server.');
  }

  return subscription;
}

export async function unsubscribeUserFromPush(token) {
  if (!isPushSupported()) return true;

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      }).catch(err => console.warn('Errore notifica disiscrizione backend:', err));

      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error('Errore durante disattivazione notifiche:', err);
    throw err;
  }
}

export async function sendTestPush(token) {
  const res = await fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore invio notifica test.');
  }

  return await res.json();
}

/**
 * Attiva automaticamente le notifiche push di default se il browser lo consente:
 * - Se il permesso è già 'granted', registra la sottoscrizione in background
 * - Se non è ancora stato fatto opt-out, tenta la sottoscrizione
 */
export async function autoSubscribeIfPossible(token) {
  if (!isPushSupported() || !token) return false;
  if (localStorage.getItem('gmg_push_optout') === 'true') return false;

  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      await subscribeUserToPush(token);
      return true;
    }
  } catch (err) {
    console.log('Auto-sottoscrizione push di default:', err.message);
  }
  return false;
}
