import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  UserX,
  Users,
  Shield,
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersModal({ isOpen, onClose }) {
  const { token, isAdmin, isModerator, showToast, refreshPendingCount } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all', 'create'
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Stato form creazione utente da Admin
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creatingUser, setCreatingUser] = useState(false);

  // Stato reset password
  const [resettingUserId, setResettingUserId] = useState(null);
  const [resetNewPass, setResetNewPass] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        showToast('Impossibile caricare gli utenti', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore di connessione', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Approvazione utente (Moderatori e Admin)
  const handleApprove = async (userId, userName) => {
    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        fetchUsers();
        refreshPendingCount();
      } else {
        showToast(data.error || 'Errore durante l\'approvazione', 'error');
      }
    } catch (err) {
      showToast('Errore durante l\'operazione', 'error');
    }
  };

  // Rifiuto utente (Moderatori e Admin)
  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Rifiutare la richiesta di registrazione per ${userName}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'info');
        fetchUsers();
        refreshPendingCount();
      } else {
        showToast(data.error || 'Errore durante il rifiuto', 'error');
      }
    } catch (err) {
      showToast('Errore durante l\'operazione', 'error');
    }
  };

  // Creazione nuovo utente da Admin
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newFullName || !newPassword) {
      showToast('Compila tutti i campi obbligatori', 'error');
      return;
    }
    setCreatingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          full_name: newFullName.trim(),
          password: newPassword,
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setNewUsername('');
        setNewEmail('');
        setNewFullName('');
        setNewPassword('');
        setNewRole('user');
        setActiveTab('all');
        fetchUsers();
      } else {
        showToast(data.error || 'Errore creazione utente', 'error');
      }
    } catch (err) {
      showToast('Errore durante la creazione utente', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  // Modifica ruolo utente (Solo Admin)
  const handleRoleChange = async (userId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        fetchUsers();
      } else {
        showToast(data.error || 'Errore cambio ruolo', 'error');
      }
    } catch (err) {
      showToast('Errore cambio ruolo', 'error');
    }
  };

  // Reset password utente (Solo Admin)
  const handleResetPassword = async (userId) => {
    if (!resetNewPass || resetNewPass.length < 6) {
      showToast('La nuova password deve contenere almeno 6 caratteri', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: resetNewPass })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setResettingUserId(null);
        setResetNewPass('');
      } else {
        showToast(data.error || 'Errore reset password', 'error');
      }
    } catch (err) {
      showToast('Errore durante il reset della password', 'error');
    }
  };

  // Eliminazione utente (Solo Admin)
  const handleDeleteUser = async (userId, fullName) => {
    if (!window.confirm(`Sei sicuro di voler eliminare definitivamente l'account di "${fullName}"?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'info');
        fetchUsers();
        refreshPendingCount();
      } else {
        showToast(data.error || 'Errore durante l\'eliminazione', 'error');
      }
    } catch (err) {
      showToast('Errore durante l\'eliminazione', 'error');
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.full_name.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <Users size={20} style={{ color: '#38bdf8' }} />
              <span>Gestione Utenti & Approvazioni</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Approva le nuove registrazioni e gestisci i permessi (Admin, Moderatore, Utente)
            </p>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: 'var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={15} />
              <span>In Attesa di Approvazione</span>
              {pendingUsers.length > 0 && (
                <span className="pending-notification-badge" style={{ marginLeft: '4px' }}>
                  {pendingUsers.length}
                </span>
              )}
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('all')}
            >
              <Users size={15} />
              <span>Tutti gli Utenti ({users.length})</span>
            </button>
          </div>

          {/* Bottone Crea Nuovo Utente (Solo Admin) */}
          {isAdmin && (
            <button
              className={`btn btn-sm ${activeTab === 'create' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => setActiveTab('create')}
            >
              <UserPlus size={15} />
              <span>+ Crea Nuovo Utente</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* TAB 1: IN ATTESA DI APPROVAZIONE */}
          {activeTab === 'pending' && (
            <div>
              {pendingUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={40} style={{ color: '#10b981', margin: '0 auto 12px auto' }} />
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Nessuna richiesta in attesa!
                  </p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Tutti gli utenti registrati sono stati valutati. Le nuove registrazioni appariranno qui per essere approvate.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <AlertTriangle size={18} />
                    <span>
                      Come moderatore o admin, puoi approvare queste persone per permettere loro di accedere al portale dell'oratorio.
                    </span>
                  </div>

                  {pendingUsers.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: 'var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          Username: <strong>@{u.username}</strong> • Email: <strong>{u.email}</strong>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Registrato il: {new Date(u.created_at).toLocaleString('it-IT')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(u.id, u.full_name)}
                        >
                          <UserCheck size={16} />
                          <span>Approva Iscrizione</span>
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(u.id, u.full_name)}
                        >
                          <UserX size={16} />
                          <span>Rifiuta</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TUTTI GLI UTENTI */}
          {activeTab === 'all' && (
            <div>
              {/* Barra Filtri Utenti */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cerca per nome, username o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: '220px' }}
                />

                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">Tutti i Ruoli</option>
                  <option value="admin">Solo Admin</option>
                  <option value="moderator">Solo Moderatori</option>
                  <option value="user">Solo Utenti</option>
                </select>
              </div>

              <div className="custom-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Utente</th>
                      <th>Ruolo</th>
                      <th>Stato</th>
                      {isAdmin && <th style={{ textAlign: 'center' }}>Azioni Amministratore</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            @{u.username} • {u.email}
                          </div>
                        </td>

                        <td>
                          {isAdmin ? (
                            <select
                              className="form-select"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, u.role, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                            >
                              <option value="user">Utente</option>
                              <option value="moderator">Moderatore</option>
                              <option value="admin">Amministratore</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${u.role}`}>{u.role}</span>
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              color:
                                u.status === 'approved'
                                  ? '#34d399'
                                  : u.status === 'pending'
                                  ? '#fbbf24'
                                  : '#fb7185',
                              background:
                                u.status === 'approved'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : u.status === 'pending'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(244, 63, 94, 0.15)'
                            }}
                          >
                            {u.status === 'approved' ? 'Approvato' : u.status === 'pending' ? 'In Attesa' : 'Rifiutato'}
                          </span>
                        </td>

                        {isAdmin && (
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              {u.status === 'pending' && (
                                <button
                                  className="btn btn-success btn-sm btn-icon-only"
                                  onClick={() => handleApprove(u.id, u.full_name)}
                                  title="Approva utente"
                                >
                                  <UserCheck size={14} />
                                </button>
                              )}

                              <button
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => {
                                  setResettingUserId(resettingUserId === u.id ? null : u.id);
                                  setResetNewPass('');
                                }}
                                title="Reimposta password"
                              >
                                <KeyRound size={14} />
                              </button>

                              <button
                                className="btn btn-danger btn-sm btn-icon-only"
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                title="Elimina account"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Mini box reset password inline */}
                            {resettingUserId === u.id && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  padding: '8px',
                                  background: 'rgba(0,0,0,0.3)',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  gap: '6px'
                                }}
                              >
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Nuova password..."
                                  value={resetNewPass}
                                  onChange={(e) => setResetNewPass(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                />
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleResetPassword(u.id)}
                                >
                                  Salva
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CREA NUOVO UTENTE (ADMIN) */}
          {activeTab === 'create' && isAdmin && (
            <form onSubmit={handleCreateUser} style={{ maxWidth: '580px', margin: '0 auto' }}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '0.85rem',
                  color: '#38bdf8'
                }}
              >
                👑 <strong>Creazione Diretta:</strong> Gli utenti creati dall'amministratore sono immediatamente approvati e attivi, senza necessità di verifiche aggiuntive.
              </div>

              <div className="form-group">
                <label className="form-label">Nome e Cognome *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="es. Paolo Rossi"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome Utente (Username) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="es. paolo.rossi"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Indirizzo Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="paolo@email.it"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password Iniziale (min. 6 caratteri) *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Password sicura"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ruolo Assegnato</label>
                  <select
                    className="form-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="user">Utente Semplice (può consultare)</option>
                    <option value="moderator">Moderatore (inserisce attività e voci)</option>
                    <option value="admin">Amministratore (accesso completo)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveTab('all')}
                >
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creatingUser}>
                  {creatingUser ? 'Creazione...' : '+ Crea Utente Subito'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
