import React, { useState, useEffect } from 'react';
import { BellRing, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, subscribeUserToPush } from '../utils/notifications';

export default function PushNotificationAutoPrompt() {
  const { token, isAuthenticated, showToast } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setVisible(false);
      return;
    }

    if (!isPushSupported()) return;

    // Se l'utente ha esplicitamente scelto di non volerle, non mostrare il prompt
    if (localStorage.getItem('gmg_push_optout') === 'true') return;
    if (sessionStorage.getItem('gmg_prompt_dismissed') === 'true') return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Se il permesso è 'default' (non ancora concesso né rifiutato), mostriamo l'invito ad attivare
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => {
          setVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, token]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('gmg_push_optout');
      await subscribeUserToPush(token);
      setVisible(false);
      showToast('🔔 Notifiche attivate con successo! Riceverai gli aggiornamenti sul bilancio.', 'success');
    } catch (err) {
      console.warn('Errore attivazione notifiche prompt:', err);
      showToast(err.message || 'Impossibile attivare le notifiche.', 'error');
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('gmg_prompt_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <aside
      className="push-auto-prompt"
      aria-label="Avviso attivazione notifiche push"
      style={{
        margin: '0 0 20px 0',
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(99, 102, 241, 0.15) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        flexWrap: 'wrap',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
          }}
        >
          <BellRing size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
            Notifiche attive di default per il bilancio
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
            Consenti la ricezione degli avvisi per essere informato in tempo reale su nuove entrate, spese e iniziative.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleEnable}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Check size={14} />
          <span>{loading ? 'Attivazione...' : 'Consenti Notifiche'}</span>
        </button>

        <button
          className="btn btn-ghost btn-sm btn-icon-only"
          onClick={handleDismiss}
          title="Non ora"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
