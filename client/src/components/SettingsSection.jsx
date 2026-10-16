import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Users,
  Target,
  DollarSign,
  Download,
  Check,
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  Trash2,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatEuro } from './DashboardStats';

export default function SettingsSection({ currentSettings, onSettingsUpdated }) {
  const { token, isAdmin, isModerator, showToast, refreshPendingCount } = useAuth();

  // Impostazioni Quote
  const [participantsCount, setParticipantsCount] = useState(25);
  const [estimatedCost, setEstimatedCost] = useState(1800);
  const [targetFund, setTargetFund] = useState(45000);
  const [eventName, setEventName] = useState('GMG Seoul 2027 - Corea del Sud');
  const [oratoryName, setOratoryName] = useState('Oratorio Salesiano Don Bosco - Asti');
  const [savingSettings, setSavingSettings] = useState(false);

  // Gestione Utenti
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userTab, setUserTab] = useState('pending'); // 'pending', 'all', 'create'
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form nuovo utente da admin
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creatingUser, setCreatingUser] = useState(false);

  // Reset password
  const [resettingUserId, setResettingUserId] = useState(null);
  const [resetPassVal, setResetPassVal] = useState('');

  useEffect(() => {
    if (currentSettings) {
      const p = currentSettings.participants_count || 25;
      const c = currentSettings.estimated_cost_per_person || 1800;
      setParticipantsCount(p);
      setEstimatedCost(c);
      // Di default persone * costo a persona
      setTargetFund(currentSettings.target_fundraising_total || (p * c));
      setEventName(currentSettings.event_name || 'GMG Seoul 2027 - Corea del Sud');
      setOratoryName(currentSettings.oratory_name || 'Oratorio Salesiano Don Bosco - Asti');
    }
  }, [currentSettings]);

  const fetchUsers = async () => {
    if (!token || !isModerator) return;
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, isModerator]);

  const handleParticipantsChange = (val) => {
    const num = parseInt(val, 10);
    setParticipantsCount(val);
    if (!isNaN(num) && num > 0) {
      setTargetFund(num * (parseFloat(estimatedCost) || 1800));
    }
  };

  const handleCostChange = (val) => {
    const cost = parseFloat(val);
    setEstimatedCost(val);
    if (!isNaN(cost) && cost > 0) {
      setTargetFund((parseInt(participantsCount, 10) || 25) * cost);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const count = parseInt(participantsCount, 10);
    if (isNaN(count) || count < 1) {
      showToast('Il numero di partenti deve essere almeno 1', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          participants_count: count,
          estimated_cost_per_person: parseFloat(estimatedCost) || 1800,
          target_fundraising_total: parseFloat(targetFund) || (count * (parseFloat(estimatedCost) || 1800)),
          event_name: eventName.trim(),
          oratory_name: oratoryName.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        onSettingsUpdated(data.settings);
      } else {
        showToast(data.error || 'Errore salvataggio', 'error');
      }
    } catch (err) {
      showToast('Errore di connessione', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/settings/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-gmg-asti-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Backup JSON scaricato con successo!', 'success');
    } catch (err) {
      showToast('Impossibile scaricare il backup', 'error');
    }
  };

  const handleApprove = async (userId, name) => {
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
      }
    } catch (err) {
      showToast('Errore approvazione', 'error');
    }
  };

  const handleReject = async (userId, name) => {
    if (!window.confirm(`Rifiutare l'iscrizione di ${name}?`)) return;
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
      }
    } catch (err) {
      showToast('Errore rifiuto', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
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
        setUserTab('all');
        fetchUsers();
      } else {
        showToast(data.error || 'Errore creazione utente', 'error');
      }
    } catch (err) {
      showToast('Errore creazione utente', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId, oldRole, newRole) => {
    if (oldRole === newRole || !isAdmin) return;
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
      }
    } catch (err) {
      showToast('Errore cambio ruolo', 'error');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPassVal || resetPassVal.length < 6) {
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
        body: JSON.stringify({ newPassword: resetPassVal })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setResettingUserId(null);
        setResetPassVal('');
      }
    } catch (err) {
      showToast('Errore reset password', 'error');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Eliminare l'account di ${name}?`)) return;
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
      }
    } catch (err) {
      showToast('Errore eliminazione utente', 'error');
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchUser) {
      const s = searchUser.toLowerCase();
      return (
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.full_name.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* 1. SEZIONE PARAMETRI & QUOTE GMG (SOLO ADMIN) */}
      {isAdmin && (
        <div className="stat-card" style={{ padding: '28px' }}>
          <div className="stat-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={22} style={{ color: '#2563eb' }} />
                <span>Parametri Ufficiali & Calcolo Quote GMG</span>
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Imposta il numero dei partenti e la stima dei costi. L'obiettivo totale è impostato di default su <strong>persone × costo per persona</strong>.
              </p>
            </div>

            <button className="btn btn-outline btn-sm" onClick={handleExportBackup} title="Scarica backup JSON">
              <Download size={15} />
              <span>Esporta Backup</span>
            </button>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Numero Ufficiale Ragazzi Partenti *
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  className="form-input"
                  value={participantsCount}
                  onChange={(e) => handleParticipantsChange(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Utilizzato per il calcolo: <strong>Utile Totale / {participantsCount} = Sconto a Persona</strong>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Costo Stimato a Partecipante (€)
                </label>
                <input
                  type="number"
                  step="10"
                  className="form-input"
                  value={estimatedCost}
                  onChange={(e) => handleCostChange(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Volo aereo, alloggio, kit GMG e assicurazione
                </span>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <Target size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Obiettivo Totale Raccolta Fondi Oratorio (€)
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.74rem', color: '#2563eb' }}
                  onClick={() => setTargetFund((parseInt(participantsCount, 10) || 25) * (parseFloat(estimatedCost) || 1800))}
                >
                  Ricalcola: {participantsCount || 25} × {formatEuro(estimatedCost || 1800)}
                </button>
              </div>
              <input
                type="number"
                step="100"
                className="form-input"
                value={targetFund}
                onChange={(e) => setTargetFund(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                🎯 Di default calcolato come <strong>{participantsCount} partenti × {formatEuro(estimatedCost)} = {formatEuro((parseInt(participantsCount, 10) || 25) * (parseFloat(estimatedCost) || 1800))}</strong>
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome Evento</label>
                <input
                  type="text"
                  className="form-input"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Oratorio / Comunità</label>
                <input
                  type="text"
                  className="form-input"
                  value={oratoryName}
                  onChange={(e) => setOratoryName(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                {savingSettings ? 'Salvataggio...' : 'Salva Parametri GMG'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profilo per utenti semplici non moderatori */}
      {!isModerator && (
        <div className="stat-card" style={{ padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            Profilo Pellegrino GMG
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '580px', margin: '0 auto' }}>
            La gestione dei parametri ufficiali e l'approvazione delle iscrizioni sono riservate allo staff dell'Oratorio Don Bosco.
            Puoi verificare lo sconto accumulato per la tua quota nella scheda <strong>Dashboard</strong> e i dettagli di tutte le attività in <strong>Raccolta Fondi</strong>!
          </p>
        </div>
      )}

      {/* 2. SEZIONE GESTIONE UTENTI & APPROVAZIONI (Moderatori & Admin) */}
      {isModerator && (
        <div className="stat-card" style={{ padding: '28px' }}>
          <div className="stat-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={22} style={{ color: '#059669' }} />
                <span>Gestione Utenti & Approvazione Iscrizioni</span>
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Approva le nuove iscrizioni degli utenti dell'oratorio e gestisci i permessi.
              </p>
            </div>

            <div className="user-tab-buttons-row">
              <button
                className={`btn btn-sm ${userTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUserTab('pending')}
              >
                <Clock size={15} />
                <span>In Attesa</span>
                {pendingUsers.length > 0 && (
                  <span className="section-tab-badge">{pendingUsers.length}</span>
                )}
              </button>

              <button
                className={`btn btn-sm ${userTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUserTab('all')}
              >
                <Users size={15} />
                <span>Tutti gli Utenti ({users.length})</span>
              </button>

              {isAdmin && (
                <button
                  className={`btn btn-sm ${userTab === 'create' ? 'btn-success' : 'btn-outline'}`}
                  onClick={() => setUserTab('create')}
                >
                  <UserPlus size={15} />
                  <span>+ Nuovo Utente</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: IN ATTESA */}
          {userTab === 'pending' && (
            <div>
              {pendingUsers.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 10px auto' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Nessun utente in attesa di approvazione</p>
                  <p style={{ fontSize: '0.82rem' }}>Tutte le richieste registrate sono state approvate!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingUsers.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Username: <strong>@{u.username}</strong> • Email: <strong>{u.email}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(u.id, u.full_name)}
                        >
                          <UserCheck size={15} />
                          <span>Approva Iscrizione</span>
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(u.id, u.full_name)}
                        >
                          <UserX size={15} />
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
          {userTab === 'all' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cerca utente per nome o username..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  style={{ flex: 1, minWidth: '200px' }}
                />
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">Tutti i ruoli</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderatori</option>
                  <option value="user">Utenti</option>
                </select>
              </div>

              <div className="custom-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Nome e Contatti</th>
                      <th>Ruolo</th>
                      <th>Stato</th>
                      {isAdmin && <th style={{ textAlign: 'center' }}>Azioni</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${u.role}`}>{u.role}</span>
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              color: u.status === 'approved' ? '#059669' : u.status === 'pending' ? '#d97706' : '#e11d48',
                              background: u.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'
                            }}
                          >
                            {u.status === 'approved' ? 'Approvato' : u.status === 'pending' ? 'In Attesa' : 'Rifiutato'}
                          </span>
                        </td>

                        {isAdmin && (
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {u.status === 'pending' && (
                                <button
                                  className="btn btn-success btn-sm btn-icon-only"
                                  onClick={() => handleApprove(u.id, u.full_name)}
                                  title="Approva"
                                >
                                  <UserCheck size={14} />
                                </button>
                              )}

                              <button
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => {
                                  setResettingUserId(resettingUserId === u.id ? null : u.id);
                                  setResetPassVal('');
                                }}
                                title="Reimposta password"
                              >
                                <KeyRound size={14} />
                              </button>

                              <button
                                className="btn btn-danger btn-sm btn-icon-only"
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                title="Elimina utente"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {resettingUserId === u.id && (
                              <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Nuova pass..."
                                  value={resetPassVal}
                                  onChange={(e) => setResetPassVal(e.target.value)}
                                  style={{ padding: '2px 6px', fontSize: '0.76rem' }}
                                />
                                <button className="btn btn-primary btn-sm" onClick={() => handleResetPassword(u.id)}>
                                  OK
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

          {/* TAB 3: CREA UTENTE DA ADMIN */}
          {userTab === 'create' && isAdmin && (
            <form onSubmit={handleCreateUser} style={{ maxWidth: '580px', margin: '0 auto' }}>
              <div className="form-group">
                <label className="form-label">Nome e Cognome *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="es. Simone Asti"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome Utente *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="es. simone.asti"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="simone@email.it"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password Iniziale *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Almeno 6 caratteri"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ruolo</label>
                  <select
                    className="form-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="user">Utente Semplice</option>
                    <option value="moderator">Moderatore</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUserTab('all')}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-success btn-sm" disabled={creatingUser}>
                  {creatingUser ? 'Creazione...' : '+ Crea Utente Attivo Subito'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
