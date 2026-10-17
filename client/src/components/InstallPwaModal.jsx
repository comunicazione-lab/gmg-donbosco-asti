import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  BellRing,
  CheckCircle2,
  MoreVertical,
  Download,
  Info
} from 'lucide-react';

export default function InstallPwaModal({ isOpen, onClose }) {
  const [deviceTab, setDeviceTab] = useState('ios');

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDeviceTab('ios');
      } else if (/android/.test(ua)) {
        setDeviceTab('android');
      } else {
        setDeviceTab('ios');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px', borderRadius: '18px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="modal-header" style={{ padding: '20px 24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="brand-logo-badge"
              style={{ width: '42px', height: '42px', padding: '3px' }}
            >
              <img
                src="/logo-korea-transparent.png"
                alt="Logo GMG Corea"
                className="brand-logo-img"
              />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                Installa l'App sulla Home
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                GMG Seoul 2027 • Don Bosco Asti
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon-only"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Modale */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Badge informativo */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              marginBottom: '18px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.45
            }}
          >
            <BellRing size={18} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Usa il portale come vera App:</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Aggiungendola alla schermata Home la userai a schermo intero e potrai ricevere le <strong>notifiche push istantanee</strong> su entrate, spese e bilancio!
              </div>
            </div>
          </div>

          {/* Selettore Dispositivo (iOS vs Android) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.05))',
              borderRadius: '10px',
              padding: '4px',
              gap: '6px',
              marginBottom: '18px'
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${deviceTab === 'ios' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.84rem' }}
              onClick={() => setDeviceTab('ios')}
            >
              <span>🍎 iPhone / iPad (iOS)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${deviceTab === 'android' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.84rem' }}
              onClick={() => setDeviceTab('android')}
            >
              <span>🤖 Android / Chrome</span>
            </button>
          </div>

          {/* Istruzioni iOS */}
          {deviceTab === 'ios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>
                  In <strong>Safari</strong>, tocca il pulsante <strong>Condividi</strong> in basso al centro:
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        fontWeight: 600,
                        fontSize: '0.82rem'
                      }}
                    >
                      <Share size={14} /> Condividi
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>
                  Scorri il menu delle opzioni e tocca:
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        fontWeight: 600,
                        fontSize: '0.82rem'
                      }}
                    >
                      <PlusSquare size={14} /> Aggiungi alla schermata Home
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.45 }}>
                  Tocca <strong>"Aggiungi"</strong> in alto a destra. Poi <strong>apri l'app direttamente dalla Schermata Home</strong> per abilitare la ricezione delle notifiche push!
                </div>
              </div>
            </div>
          )}

          {/* Istruzioni Android */}
          {deviceTab === 'android' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>
                  In <strong>Google Chrome</strong>, tocca il menu con i <strong>tre puntini</strong> in alto a destra:
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        fontWeight: 600,
                        fontSize: '0.82rem'
                      }}
                    >
                      <MoreVertical size={14} /> Menu Opzioni
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-glass-subtle, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.06))'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>
                  Tocca <strong>"Installa applicazione"</strong> oppure <strong>"Aggiungi a schermata Home"</strong>.
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.45 }}>
                  Conferma l'installazione. L'applicazione verrà aggiunta alla tua Home per un'esperienza completa e veloce!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modale */}
        <div
          className="modal-footer"
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: 'var(--glass-border)'
          }}
        >
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Puoi rivedere queste istruzioni in qualsiasi momento nella scheda Impostazioni.
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ minWidth: '120px', justifyContent: 'center' }}
          >
            <span>Ho capito, continua</span>
          </button>
        </div>
      </div>
    </div>
  );
}
