import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  isPushSupported,
  isStandalonePWA,
  getExistingSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  sendTestPush
} from '../utils/notifications';
import InstallPwaModal from './InstallPwaModal';

export default function PushNotificationManager({ mode = 'card' }) {
  const { token, showToast, isAuthenticated, isAdmin } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const isSup = isPushSupported();
    setSupported(isSup);
    setIsStandalone(isStandalonePWA());

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    if (isSup) {
      getExistingSubscription().then((sub) => {
        if (sub) {
          setSubscribed(true);
        } else if (token && localStorage.getItem('gmg_push_optout') !== 'true') {
          // Attivazione automatica di default se già concesso
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            subscribeUserToPush(token)
              .then(() => setSubscribed(true))
              .catch(() => {});
          }
        }
      });
    }
  }, [token]);

  const handleToggle = async () => {
    if (!supported) {
      showToast('Il tuo browser o dispositivo non supporta le Notifiche Web Push.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (subscribed) {
        localStorage.setItem('gmg_push_optout', 'true');
        await unsubscribeUserFromPush(token);
        setSubscribed(false);
        showToast('Notifiche push disattivate su questo dispositivo.', 'info');
      } else {
        localStorage.removeItem('gmg_push_optout');
        await subscribeUserToPush(token);
        setSubscribed(true);
        setPermission('granted');
        showToast('🔔 Notifiche attivate! Riceverai un avviso quando viene aggiunta una nuova voce di bilancio.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Errore durante l\'aggiornamento delle notifiche.', 'error');
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await sendTestPush(token);
      showToast('🚀 Notifica di test inviata! Controlla il tuo dispositivo.', 'success');
    } catch (err) {
      showToast(err.message || 'Errore durante l\'invio della notifica di test.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Compact mode for Navbar
  if (mode === 'navbar') {
    if (!supported) return null;

    return (
      <button
        className={`btn btn-outline btn-icon-only ${subscribed ? 'btn-push-active' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        title={
          subscribed
            ? 'Notifiche Push attive (clicca per disattivare)'
            : 'Attiva Notifiche Push per nuove voci di bilancio e iniziative'
        }
        aria-label="Notifiche Push"
        style={{
          position: 'relative',
          borderColor: subscribed ? 'rgba(99, 102, 241, 0.6)' : undefined,
          color: subscribed ? '#818cf8' : undefined
        }}
      >
        {subscribed ? <BellRing size={18} /> : <Bell size={18} />}
        {subscribed && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981'
            }}
          />
        )}
      </button>
    );
  }

  // Full Card mode for Settings or Dashboard
  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}
          >
            <BellRing size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Notifiche Web App & Push
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Rimani informato in tempo reale su bilancio, spese e attività dell'oratorio
            </p>
          </div>
        </div>

        <div>
          <span
            className={`status-pill ${subscribed ? 'status-approved' : 'status-pending'}`}
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {subscribed ? (
              <>
                <CheckCircle2 size={13} />
                <span>Notifiche Attive</span>
              </>
            ) : (
              <>
                <BellOff size={13} />
                <span>Non attive</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
          {/* Box Notifica Voci di Bilancio */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.03))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💰 Nuove Voci di Bilancio</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Ricevi un avviso push immediato sul telefono/PC ogni volta che viene inserita un'entrata (🟢) o una spesa (🔴) in un'iniziativa.
            </p>
          </div>

          {/* Box Rimborsi e Approvazioni */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.03))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💶 Rimborsi Spese e Iscrizioni</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Chi anticipa una spesa riceve una notifica appena la cassa registra il rimborso. Gli amministratori ricevono avviso per nuovi utenti.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className={`btn ${subscribed ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleToggle}
              disabled={loading || !supported}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? (
                'Attendere...'
              ) : subscribed ? (
                <>
                  <BellOff size={16} />
                  <span>Disattiva Notifiche su questo Dispositivo</span>
                </>
              ) : (
                <>
                  <BellRing size={16} />
                  <span>🔔 Attiva Notifiche Push</span>
                </>
              )}
            </button>

            {/* Test Invio Notifica: Riservato SOLO al profilo Admin */}
            {isAdmin && subscribed && (
              <button
                className="btn btn-outline btn-sm"
                onClick={handleTest}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(99, 102, 241, 0.4)'
                }}
                title="Invia una notifica push di prova al tuo dispositivo (riservato al profilo amministratore)"
              >
                <Send size={14} style={{ color: '#818cf8' }} />
                <span>Test Notifica (Admin)</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isStandalone ? (
              <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Smartphone size={13} /> Web App installata nella Home
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowInstallGuide(true)}
                style={{ fontSize: '0.78rem', padding: '4px 10px', color: '#38bdf8' }}
              >
                <Smartphone size={13} />
                <span>Come installare l'App sulla Home...</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup Istruzioni Installazione */}
      <InstallPwaModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
    </div>
  );
}
