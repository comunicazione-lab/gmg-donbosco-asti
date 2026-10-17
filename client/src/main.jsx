import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Registrazione del Service Worker per Progressive Web App e Notifiche Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ Service Worker GMG 2027 registrato, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ Errore registrazione Service Worker:', err);
      });
  });
}
