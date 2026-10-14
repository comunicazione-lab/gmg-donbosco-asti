import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  Users,
  Sliders,
  LogOut,
  LogIn,
  Sun,
  Moon,
  LayoutDashboard,
  Coins,
  Settings
} from 'lucide-react';

export default function Navbar({
  activeSection,
  setActiveSection,
  onOpenNewInitiative,
  onOpenAuth,
  theme,
  toggleTheme
}) {
  const { user, isAuthenticated, isModerator, isAdmin, logout, pendingCount } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-badge">
            <span>2027</span>
          </div>
          <div className="brand-info">
            <h1>
              GMG Seoul 2027
              <span className="initiative-category-badge" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                Don Bosco Asti
              </span>
            </h1>
            <p>Raccolta Fondi • Oratorio Salesiano Asti</p>
          </div>
        </div>

        {/* Navigation Tabs (Sezioni Principali) per utenti autenticati */}
        {isAuthenticated && (
          <div className="section-nav-tabs">
            <button
              className={`section-tab-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </button>

            <button
              className={`section-tab-btn ${activeSection === 'fundraising' ? 'active' : ''}`}
              onClick={() => setActiveSection('fundraising')}
            >
              <Coins size={17} />
              <span>Raccolta Fondi</span>
            </button>

            {(isAdmin || isModerator) && (
              <button
                className={`section-tab-btn ${activeSection === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveSection('settings')}
              >
                {isAdmin ? <Settings size={17} /> : <Users size={17} />}
                <span>{isAdmin ? 'Parametri & Quote' : 'Approvazione Utenti'}</span>
                {pendingCount > 0 && (
                  <span className="section-tab-badge" title={`${pendingCount} utenti da approvare`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Azioni Utente & Controlli */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {/* Badge Utente */}
              <div className="user-pill">
                <span className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {user.full_name}
                </span>
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'admin'
                    ? 'Admin'
                    : user.role === 'moderator'
                    ? 'Moderatore'
                    : 'Utente'}
                </span>
              </div>

              {/* Pulsante rapido Nuova Iniziativa per moderatori */}
              {isModerator && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenNewInitiative}
                  title="Aggiungi una nuova attività"
                >
                  <PlusCircle size={15} />
                  <span>Nuova Attività</span>
                </button>
              )}

              {/* Toggle Tema Luminoso / Notte */}
              <button
                className="btn btn-outline btn-icon-only"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Passa alla modalità luminosa' : 'Passa alla modalità notte'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Logout */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Esci dal portale"
              >
                <LogOut size={16} />
                <span>Esci</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline btn-icon-only"
                onClick={toggleTheme}
                title="Cambia tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
                <LogIn size={16} />
                <span>Accedi o Registrati</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
