import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialToken = null }) {
  const { login, register, forgotPassword, resetPassword, showToast } = useAuth();

  // Modal mode: 'login' | 'register' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Login & Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState(null);

  // Password reset fields
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSentSuccess, setForgotSentSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setResetToken(initialToken);
      setMode('reset');
    }
  }, [initialToken]);

  if (!isOpen) return null;

  // 1. Submit Login (Solo con Email)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Inserisci il tuo indirizzo email', 'error');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  // 2. Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register({
      username: username.trim() || email.split('@')[0],
      email: email.trim(),
      password,
      full_name: fullName.trim()
    });
    setLoading(false);
    if (result.success) {
      setRegSuccessMessage(result.message);
    }
  };

  // 3. Submit Richiesta Recupero Password (invia email da noreply@dbasti.com)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Inserisci il tuo indirizzo email', 'error');
      return;
    }
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) {
      if (result.backupCode) {
        setResetCode(result.backupCode);
      }
      setForgotSentSuccess(true);
      setMode('reset');
    }
  };

  // 4. Submit Nuova Password (tramite codice 6 cifre o token)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('La nuova password deve contenere almeno 6 caratteri', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Le due password non coincidono', 'error');
      return;
    }

    setLoading(true);
    const result = await resetPassword({
      token: resetToken,
      email: email.trim(),
      code: resetCode.trim(),
      new_password: newPassword
    });
    setLoading(false);

    if (result.success) {
      setMode('login');
      setPassword('');
      setResetCode('');
      setResetToken(null);
      setNewPassword('');
      setConfirmPassword('');
      setForgotSentSuccess(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header Modale */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-logo-badge" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
              <span>27</span>
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>
              {mode === 'login' && 'Accedi al Portale GMG'}
              {mode === 'register' && 'Richiedi Accesso al Portale'}
              {mode === 'forgot' && 'Recupera Password'}
              {mode === 'reset' && 'Nuova Password'}
            </h2>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher (solo per Login e Registrati) */}
        {(mode === 'login' || mode === 'register') && (
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
              <span>Accedi con Email</span>
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
        )}

        <div className="modal-body">
          {/* ==================== 1. FORM LOGIN (SOLO EMAIL) ==================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="es. marco@donboscoasti.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Password
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', color: '#2563eb', padding: '0 4px', height: 'auto' }}
                    onClick={() => {
                      setMode('forgot');
                      setForgotSentSuccess(false);
                    }}
                  >
                    Password dimenticata?
                  </button>
                </div>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Inserisci la tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
                disabled={loading}
              >
                {loading ? 'Accesso in corso...' : 'Accedi al Portale'}
              </button>
            </form>
          )}

          {/* ==================== 2. FORM RECUPERO PASSWORD (FORGOT) ==================== */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <div
                style={{
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  fontSize: '0.84rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.5
                }}
              >
                📬 Inserisci l'indirizzo email del tuo account. Ti invieremo un'email da <strong>noreply@dbasti.com</strong> contenente il link e il codice di verifica per reimpostare la tua password.
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  La tua Email registrata
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="es. marco@donboscoasti.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={loading}
              >
                <Send size={15} />
                <span>{loading ? 'Invio email in corso...' : 'Invia Email di Recupero'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMode('login')}
                  style={{ fontSize: '0.82rem' }}
                >
                  <ArrowLeft size={14} />
                  <span>Torna al Login</span>
                </button>
              </div>
            </form>
          )}

          {/* ==================== 3. FORM RESET PASSWORD (CODICE / TOKEN) ==================== */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit}>
              {forgotSentSuccess && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    fontSize: '0.84rem',
                    color: '#059669',
                    lineHeight: 1.5
                  }}
                >
                  ✅ Email inviata da <strong>noreply@dbasti.com</strong> a <strong>{email}</strong>! Inserisci il codice a 6 cifre ricevuto e scegli la tua nuova password.
                </div>
              )}

              {/* Se non abbiamo il token diretto da URL, chiedi email e codice */}
              {!resetToken && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email dell'account</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <KeyRound size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Codice di Verifica a 6 Cifre
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="form-input"
                      placeholder="es. 834921"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      style={{
                        fontSize: '1.25rem',
                        letterSpacing: '0.25em',
                        textAlign: 'center',
                        fontWeight: 700
                      }}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Nuova Password (almeno 6 caratteri)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nuova password sicura"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Conferma Nuova Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Ripeti la nuova password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
                disabled={loading}
              >
                <ShieldCheck size={16} />
                <span>{loading ? 'Salvataggio...' : 'Conferma Nuova Password'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setMode('login');
                    setResetToken(null);
                  }}
                  style={{ fontSize: '0.82rem' }}
                >
                  <ArrowLeft size={14} />
                  <span>Torna al Login</span>
                </button>
              </div>
            </form>
          )}

          {/* ==================== 4. FORM REGISTRAZIONE ==================== */}
          {mode === 'register' && (
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
                      color: '#0284c7'
                    }}
                  >
                    ℹ️ Per garantire la trasparenza e la sicurezza dell'oratorio, ogni nuova iscrizione deve essere approvata da un moderatore dello staff.
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nome e Cognome *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="es. Matteo Astesano"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Indirizzo Email (utilizzato per il Login) *
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="es. matteo@email.it"
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
                      placeholder="Scegli una password sicura"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
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
