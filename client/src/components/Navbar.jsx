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
  Shield,
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  onOpenNewInitiative,
  onOpenUsers,
  onOpenSettings,
  onOpenAuth,
  theme,
  toggleTheme
}) {
  const { user, isAuthenticated, isAdmin, isModerator, logout, pendingCount } = useAuth();

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

        {/* Navigation & Controls */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {/* User badge */}
              <div className="user-pill">
                <span className="user-name" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
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

              {/* Bottoni Moderatori e Admin */}
              {isModerator && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={onOpenNewInitiative}
                    title="Crea una nuova attività di raccolta fondi"
                  >
                    <PlusCircle size={16} />
                    <span>Nuova Iniziativa</span>
                  </button>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={onOpenUsers}
                    title="Gestione utenti e approvazione iscrizioni"
                  >
                    <Users size={16} />
                    <span>Utenti</span>
                    {pendingCount > 0 && (
                      <span className="pending-notification-badge" title={`${pendingCount} utenti in attesa di approvazione`}>
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Bottoni esclusivi Admin */}
              {isAdmin && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={onOpenSettings}
                  title="Configura numero partenti e costi stimati"
                >
                  <Sliders size={16} />
                  <span>Partenti & Quote</span>
                </button>
              )}

              {/* Toggle Tema Dark / Light */}
              <button
                className="btn btn-ghost btn-icon-only"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Logout */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Disconnetti"
              >
                <LogOut size={16} />
                <span style={{ display: 'none', '@media (minWidth: 640px)': { display: 'inline' } }}>Esci</span>
              </button>
            </>
          ) : (
            <>
              {/* Toggle Tema */}
              <button
                className="btn btn-ghost btn-icon-only"
                onClick={toggleTheme}
                title="Cambia tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
                <LogIn size={16} />
                <span>Accedi / Registrati</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
