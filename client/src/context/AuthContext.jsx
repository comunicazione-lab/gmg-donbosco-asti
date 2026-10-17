import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  isPushSupported,
  autoSubscribeIfPossible,
  subscribeUserToPush
} from '../utils/notifications';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gmg_token'));
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Sistema toast globale
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Carica info utente all'avvio se il token esiste
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Attivazione automatica notifiche se consentito
          autoSubscribeIfPossible(token).catch(() => {});
        } else {
          // Token scaduto o non valido
          localStorage.removeItem('gmg_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Errore validazione sessione:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Se utente è moderatore o admin, recupera il conteggio utenti in attesa
  const fetchPendingCount = async () => {
    if (!token || !user || (user.role !== 'admin' && user.role !== 'moderator')) {
      setPendingCount(0);
      return;
    }
    try {
      const res = await fetch('/api/users/pending-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingCount || 0);
      }
    } catch (err) {
      console.error('Errore conteggio pending:', err);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [token, user]);

  // Login (esclusivamente con Email)
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante il login');
      }

      localStorage.setItem('gmg_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Bentornato, ${data.user.full_name}!`, 'success');

      // Attivazione notifiche push di default al login
      if (isPushSupported() && localStorage.getItem('gmg_push_optout') !== 'true') {
        setTimeout(() => {
          subscribeUserToPush(data.token).catch((pushErr) => {
            console.log('Attivazione notifiche di default al login:', pushErr.message);
          });
        }, 800);
      }

      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Richiesta recupero password
  const forgotPassword = async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'invio del link di recupero');
      }

      showToast(data.message, 'success');
      return { success: true, message: data.message, emailSent: data.emailSent, backupCode: data.backupCode };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Verifica codice a 6 cifre o token
  const verifyResetCode = async ({ email, code, token }) => {
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, token })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Codice non valido o scaduto');
      }

      return { success: true, data };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Conferma nuova password
  const resetPassword = async ({ token, email, code, new_password }) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, code, new_password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'aggiornamento della password');
      }

      showToast(data.message, 'success');
      return { success: true, message: data.message };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Registrazione
  const register = async ({ username, email, password, full_name }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, full_name })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la registrazione');
      }

      showToast(data.message, 'success');
      return { success: true, message: data.message };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('gmg_token');
    setToken(null);
    setUser(null);
    setPendingCount(0);
    showToast('Disconnessione effettuata.', 'info');
  };

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isModerator,
        login,
        register,
        logout,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        showToast,
        pendingCount,
        refreshPendingCount: fetchPendingCount
      }}
    >
      {children}

      {/* Render Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`} onClick={() => removeToast(toast.id)}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
