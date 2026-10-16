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
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-logo-badge">
              <span>2027</span>
            </div>
            <div className="brand-info">
              <h1>
                <span>GMG Seoul 2027</span>
                <span className="initiative-category-badge brand-subbadge" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Don Bosco Asti
                </span>
              </h1>
              <p className="brand-subtitle">Raccolta Fondi • Oratorio Salesiano Asti</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop only) */}
          {isAuthenticated && (
            <div className="section-nav-tabs desktop-only-nav">
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
                      ? 'Mod'
                      : 'Utente'}
                  </span>
                </div>

                {/* Pulsante rapido Nuova Iniziativa per moderatori (Desktop) */}
                {isModerator && (
                  <button
                    className="btn btn-primary btn-sm desktop-only-btn"
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
                  aria-label="Cambia tema"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Logout */}
                <button
                  className="btn btn-ghost btn-sm btn-logout"
                  onClick={logout}
                  title="Esci dal portale"
                  aria-label="Esci"
                >
                  <LogOut size={16} />
                  <span className="logout-text">Esci</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline btn-icon-only"
                  onClick={toggleTheme}
                  title="Cambia tema"
                  aria-label="Cambia tema"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
                  <LogIn size={16} />
                  <span>Accedi</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Barra di Navigazione Mobile Inferiore (Mobile Bottom Navigation) */}
      {isAuthenticated && (
        <nav className="mobile-bottom-nav" aria-label="Navigazione mobile">
          <button
            className={`mobile-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            className={`mobile-nav-item ${activeSection === 'fundraising' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('fundraising');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Coins size={20} />
            <span>Raccolta</span>
          </button>

          {isModerator && (
            <button
              className="mobile-nav-item mobile-nav-action-btn"
              onClick={onOpenNewInitiative}
              title="Crea nuova attività"
            >
              <div className="mobile-action-circle">
                <PlusCircle size={22} />
              </div>
              <span>Nuova</span>
            </button>
          )}

          {(isAdmin || isModerator) && (
            <button
              className={`mobile-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('settings');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                {isAdmin ? <Settings size={20} /> : <Users size={20} />}
                {pendingCount > 0 && (
                  <span className="mobile-tab-badge">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span>{isAdmin ? 'Parametri' : 'Utenti'}</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
}
