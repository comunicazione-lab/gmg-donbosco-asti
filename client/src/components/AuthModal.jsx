import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, UserCheck, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState(null);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register({
      username,
      email,
      password,
      full_name: fullName
    });
    setLoading(false);
    if (result.success) {
      setRegSuccessMessage(result.message);
    }
  };

  // Quick Demo Login helper
  const handleQuickLogin = async (userType) => {
    setLoading(true);
    let u = 'admin';
    if (userType === 'moderator') u = 'moderatore';
    if (userType === 'user') u = 'giovane';

    const result = await login(u, 'DonBosco2027!');
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-logo-badge" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
              <span>27</span>
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>
              {mode === 'login' ? 'Accedi al Portale GMG' : 'Richiedi Accesso al Portale'}
            </h2>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: 'var(--glass-border)' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              flex: 1,
              borderRadius: 0,
              borderBottom: mode === 'login' ? '2px solid #e11d48' : 'none',
              color: mode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: mode === 'login' ? 700 : 500
            }}
            onClick={() => {
              setMode('login');
              setRegSuccessMessage(null);
            }}
          >
            <LogIn size={15} />
            <span>Accedi</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{
              flex: 1,
              borderRadius: 0,
              borderBottom: mode === 'register' ? '2px solid #e11d48' : 'none',
              color: mode === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: mode === 'register' ? 700 : 500
            }}
            onClick={() => setMode('register')}
          >
            <UserPlus size={15} />
            <span>Registrati</span>
          </button>
        </div>

        <div className="modal-body">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Nome Utente o Email</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="admin, moderatore, oppure email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Inserisci la password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Accesso in corso...' : 'Accedi al Portale'}
              </button>

              {/* Box Accesso Rapido Demo */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center', letterSpacing: '0.05em' }}>
                  🚀 Accesso Rapido per Prova & Dimostrazione
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '6px 4px' }}
                    onClick={() => handleQuickLogin('admin')}
                    title="Accedi come Don Marco (Admin)"
                  >
                    👑 Admin
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '6px 4px' }}
                    onClick={() => handleQuickLogin('moderator')}
                    title="Accedi come Chiara (Moderatore)"
                  >
                    🛡️ Moderatore
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '6px 4px' }}
                    onClick={() => handleQuickLogin('user')}
                    title="Accedi come Matteo (Giovane GMG)"
                  >
                    🎒 Utente GMG
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              {regSuccessMessage ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Richiesta Inviata!</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {regSuccessMessage}
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '18px' }}
                    onClick={() => {
                      setMode('login');
                      setRegSuccessMessage(null);
                    }}
                  >
                    Torna al Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      fontSize: '0.8rem',
                      color: '#38bdf8'
                    }}
                  >
                    ℹ️ Per garantire la privacy e la sicurezza della comunità dell'oratorio, ogni nuova registrazione deve essere confermata da un moderatore.
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nome e Cognome *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="es. Marco Asti"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nome Utente Desiderato *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="es. marco.asti"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Indirizzo Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="marco@email.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password (min. 6 caratteri) *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Scegli una password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '10px' }}
                    disabled={loading}
                  >
                    {loading ? 'Invio in corso...' : 'Invia Richiesta di Registrazione'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
