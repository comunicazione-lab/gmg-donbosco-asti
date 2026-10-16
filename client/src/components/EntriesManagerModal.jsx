import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  CheckCircle,
  FileText,
  User,
  Clock,
  Check
} from 'lucide-react';
import { formatEuro } from './DashboardStats';
import { useAuth } from '../context/AuthContext';

export default function EntriesManagerModal({ initiativeId, onClose, onRefreshData }) {
  const { token, isModerator, showToast } = useAuth();
  const [initiative, setInitiative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'income', 'expense', 'to_reimburse'
  const [usersList, setUsersList] = useState([]);

  // Form stato per nuova voce
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState('income');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Vendita / Biglietti');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [newSustainedById, setNewSustainedById] = useState('');
  const [newReimbursementStatus, setNewReimbursementStatus] = useState('da_rimborsare');
  const [submitting, setSubmitting] = useState(false);

  // Carica i dati dell'iniziativa e le sue voci
  const loadInitiative = async () => {
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInitiative(data.initiative);
      } else {
        showToast('Impossibile caricare i dettagli dell\'iniziativa', 'error');
        onClose();
      }
    } catch (err) {
      console.error(err);
      showToast('Errore di connessione', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Carica lista utenti registrati per assegnare chi ha sostenuto la spesa
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users/registered-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Errore caricamento lista utenti registrati:', err);
    }
  };

  useEffect(() => {
    if (initiativeId) {
      loadInitiative();
      loadUsers();
    }
  }, [initiativeId]);

  // Aggiunta nuova voce di spesa o guadagno
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Inserisci una descrizione per la voce', 'error');
      return;
    }
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Inserisci un importo valido maggiore di zero', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: newType,
        title: newTitle.trim(),
        category: newCategory,
        amount: amountVal,
        entry_date: newDate,
        notes: newNotes.trim()
      };

      if (newType === 'expense' && newSustainedById) {
        payload.sustained_by_id = parseInt(newSustainedById, 10);
        payload.reimbursement_status = newReimbursementStatus;
      }

      const res = await fetch(`/api/initiatives/${initiativeId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setInitiative(data.initiative);
        // Reset form
        setNewTitle('');
        setNewAmount('');
        setNewNotes('');
        setNewSustainedById('');
        setNewReimbursementStatus('da_rimborsare');
        setShowAddForm(false);
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Errore durante l\'aggiunta della voce', 'error');
      }
    } catch (err) {
      showToast('Errore di connessione', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Cambio rapido stato rimborso per una spesa sostenuta da un utente
  const handleUpdateReimbursement = async (entryId, status) => {
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/entries/${entryId}/reimbursement`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reimbursement_status: status })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setInitiative(data.initiative);
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Errore aggiornamento stato rimborso', 'error');
      }
    } catch (err) {
      showToast('Errore durante l\'aggiornamento del rimborso', 'error');
    }
  };

  // Eliminazione voce
  const handleDeleteEntry = async (entryId, entryTitle) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la voce "${entryTitle}"?`)) return;

    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/entries/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'info');
        setInitiative(data.initiative);
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Errore durante la cancellazione', 'error');
      }
    } catch (err) {
      showToast('Errore durante la cancellazione della voce', 'error');
    }
  };

  if (!initiative && loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Caricamento dettagli e voci contabili...</p>
        </div>
      </div>
    );
  }

  const entries = initiative?.entries || [];
  const toReimburseEntries = entries.filter(
    (e) => e.type === 'expense' && e.sustained_by_id && (e.reimbursement_status === 'da_rimborsare' || !e.reimbursement_status)
  );

  const filteredEntries = entries.filter((entry) => {
    if (activeTab === 'income') return entry.type === 'income';
    if (activeTab === 'expense') return entry.type === 'expense';
    if (activeTab === 'to_reimburse') {
      return entry.type === 'expense' && entry.sustained_by_id && (entry.reimbursement_status === 'da_rimborsare' || !entry.reimbursement_status);
    }
    return true;
  });

  const totalIncome = initiative?.total_income || 0;
  const totalExpense = initiative?.total_expense || 0;
  const netProfit = initiative?.net_profit || 0;
  const totalToReimburse = initiative?.total_to_reimburse || 0;
  const totalReimbursed = initiative?.total_reimbursed || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="initiative-category-badge">{initiative.category}</span>
              <span className={`initiative-status-badge ${initiative.status}`}>{initiative.status}</span>
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.4rem' }}>{initiative.title}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              📅 {initiative.event_date || 'Data n/d'} • 📍 {initiative.location || 'Oratorio Don Bosco Asti'}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Summary Box Bilancio Iniziativa */}
          <div className="modal-finance-summary">
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Totale Entrate
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                +{formatEuro(totalIncome)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Totale Spese
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fb7185' }}>
                -{formatEuro(totalExpense)}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '14px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Utile Netto
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: netProfit >= 0 ? '#10b981' : '#f43f5e'
                }}
              >
                {netProfit >= 0 ? '+' : ''}{formatEuro(netProfit)}
              </div>
            </div>

            {totalToReimburse > 0 && (
              <div style={{ borderLeft: '1px solid rgba(245, 158, 11, 0.25)', paddingLeft: '14px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700 }}>
                  ⏳ Da Rimborsare
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>
                  {formatEuro(totalToReimburse)}
                </div>
              </div>
            )}

            {totalReimbursed > 0 && (
              <div style={{ borderLeft: '1px solid rgba(16, 185, 129, 0.25)', paddingLeft: '14px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700 }}>
                  ✅ Già Rimborsato
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                  {formatEuro(totalReimbursed)}
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            {/* Tabs Filter */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('all')}
              >
                Tutte ({entries.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'income' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => setActiveTab('income')}
              >
                <TrendingUp size={14} />
                <span>Entrate ({entries.filter((e) => e.type === 'income').length})</span>
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'expense' ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => setActiveTab('expense')}
              >
                <TrendingDown size={14} />
                <span>Spese ({entries.filter((e) => e.type === 'expense').length})</span>
              </button>
              {toReimburseEntries.length > 0 && (
                <button
                  className={`btn btn-sm ${activeTab === 'to_reimburse' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    color: activeTab === 'to_reimburse' ? '#fff' : '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                    background: activeTab === 'to_reimburse' ? '#d97706' : 'rgba(245, 158, 11, 0.08)'
                  }}
                  onClick={() => setActiveTab('to_reimburse')}
                >
                  <Clock size={14} />
                  <span>Da Rimborsare ({toReimburseEntries.length})</span>
                </button>
              )}
            </div>

            {/* Pulsante Aggiungi Voce (Moderatori & Admin) */}
            {isModerator && (
              <button
                className={`btn btn-sm ${showAddForm ? 'btn-outline' : 'btn-blue'}`}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <PlusCircle size={15} />
                <span>{showAddForm ? 'Annulla' : '+ Nuova Voce (Entrata o Spesa)'}</span>
              </button>
            )}
          </div>

          {/* Form Inserimento Nuova Voce */}
          {showAddForm && isModerator && (
            <form
              onSubmit={handleAddEntry}
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ fontSize: '1rem', marginBottom: '14px', color: '#38bdf8' }}>
                Registra nuova voce per questa iniziativa
              </h4>

              {/* Selettore Tipo: Guadagno o Spesa */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${newType === 'income' ? 'btn-success' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setNewType('income');
                    setNewCategory('Vendita / Biglietti');
                  }}
                >
                  <TrendingUp size={15} />
                  <span>Guadagno / Entrata (+)</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${newType === 'expense' ? 'btn-danger' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setNewType('expense');
                    setNewCategory('Cibo & Bevande');
                  }}
                >
                  <TrendingDown size={15} />
                  <span>Spesa / Uscita (-)</span>
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Descrizione / Voce *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={newType === 'income' ? 'es. Incasso turno 2 biglietti cena' : 'es. Acquisto carne e verdure'}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Importo (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Chi ha sostenuto la spesa (se spesa) */}
              {newType === 'expense' && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <User size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f59e0b' }}>
                      Chi ha sostenuto / anticipato questa spesa?
                    </span>
                  </div>

                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Seleziona utente registrato o cassa</label>
                      <select
                        className="form-select"
                        value={newSustainedById}
                        onChange={(e) => setNewSustainedById(e.target.value)}
                      >
                        <option value="">🏛️ Cassa Oratorio Don Bosco (Nessun rimborso personale)</option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>
                            👤 {u.full_name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {newSustainedById && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Stato Rimborso Spesa</label>
                        <select
                          className="form-select"
                          value={newReimbursementStatus}
                          onChange={(e) => setNewReimbursementStatus(e.target.value)}
                        >
                          <option value="da_rimborsare">🟠 Da rimborsare (in attesa di restituzione)</option>
                          <option value="rimborsato">🟢 Già rimborsato dall'oratorio</option>
                          <option value="donato">🔵 Donato (anticipato e offerto volontariamente)</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {newSustainedById && (
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                      ℹ️ La voce verrà associata all'utente per facilitare la rendicontazione e la restituzione della somma anticipata.
                    </p>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria Voce</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {newType === 'income' ? (
                      <>
                        <option value="Vendita / Biglietti">Vendita / Biglietti</option>
                        <option value="Offerte Libere">Offerte Libere</option>
                        <option value="Iscrizioni">Iscrizioni</option>
                        <option value="Sponsor & Donazioni">Sponsor & Donazioni</option>
                        <option value="Bar & Chiosco">Bar & Chiosco</option>
                        <option value="Altro Guadagno">Altro Guadagno</option>
                      </>
                    ) : (
                      <>
                        <option value="Cibo & Ingredienti">Cibo & Ingredienti</option>
                        <option value="Bevande & Bar">Bevande & Bar</option>
                        <option value="Materiali & Stoviglie">Materiali & Stoviglie</option>
                        <option value="Premi & Coppe">Premi & Coppe</option>
                        <option value="Stampe & Tipografia">Stampe & Tipografia</option>
                        <option value="Noleggi & Logistica">Noleggi & Logistica</option>
                        <option value="Altra Spesa">Altra Spesa</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Data Registrazione</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note / Riferimento Scontrino (opzionale)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="es. Scontrino n. 23 Macelleria / Contati con Don Marco"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`btn btn-sm ${newType === 'income' ? 'btn-success' : 'btn-danger'}`}
                  disabled={submitting}
                >
                  {submitting ? 'Salvataggio...' : '+ Conferma e Aggiungi Voce'}
                </button>
              </div>
            </form>
          )}

          {/* Elenco Tabellare Voci */}
          {filteredEntries.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Nessuna voce trovata per questa selezione.</p>
              {isModerator && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => setShowAddForm(true)}
                >
                  + Inserisci la prima voce
                </button>
              )}
            </div>
          ) : (
            <div className="custom-table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descrizione & Categoria</th>
                    <th>Chi ha sostenuto / Rimborso</th>
                    <th>Data</th>
                    <th>Note / Dettaglio</th>
                    <th style={{ textAlign: 'right' }}>Importo</th>
                    {isModerator && <th style={{ textAlign: 'center' }}>Azioni</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      {/* Tipo */}
                      <td>
                        {entry.type === 'income' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#34d399',
                              background: 'rgba(16, 185, 129, 0.12)',
                              padding: '2px 8px',
                              borderRadius: '999px'
                            }}
                          >
                            <TrendingUp size={12} />
                            Entrata
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#fb7185',
                              background: 'rgba(244, 63, 94, 0.12)',
                              padding: '2px 8px',
                              borderRadius: '999px'
                            }}
                          >
                            <TrendingDown size={12} />
                            Spesa
                          </span>
                        )}
                      </td>

                      {/* Descrizione & Categoria */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{entry.title}</div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {entry.category}
                        </span>
                      </td>

                      {/* Chi ha sostenuto / Rimborso */}
                      <td>
                        {entry.type === 'expense' ? (
                          entry.sustained_by_id && entry.sustained_by_name ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 600 }}>
                                <User size={13} style={{ color: '#38bdf8' }} />
                                <span>{entry.sustained_by_name}</span>
                              </div>
                              <div style={{ marginTop: '4px' }}>
                                {isModerator ? (
                                  <select
                                    className="form-select"
                                    style={{
                                      padding: '2px 8px',
                                      fontSize: '0.72rem',
                                      height: 'auto',
                                      width: 'auto',
                                      display: 'inline-block',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                      background:
                                        entry.reimbursement_status === 'rimborsato'
                                          ? 'rgba(16, 185, 129, 0.2)'
                                          : entry.reimbursement_status === 'donato'
                                          ? 'rgba(59, 130, 246, 0.2)'
                                          : 'rgba(245, 158, 11, 0.2)',
                                      color:
                                        entry.reimbursement_status === 'rimborsato'
                                          ? '#34d399'
                                          : entry.reimbursement_status === 'donato'
                                          ? '#60a5fa'
                                          : '#fbbf24',
                                      borderColor: 'rgba(255, 255, 255, 0.1)',
                                      cursor: 'pointer'
                                    }}
                                    value={entry.reimbursement_status || 'da_rimborsare'}
                                    onChange={(e) => handleUpdateReimbursement(entry.id, e.target.value)}
                                    title="Modifica stato rimborso"
                                  >
                                    <option value="da_rimborsare">🟠 Da rimborsare</option>
                                    <option value="rimborsato">🟢 Rimborsato</option>
                                    <option value="donato">🔵 Donato</option>
                                  </select>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontWeight: 600,
                                      background:
                                        entry.reimbursement_status === 'rimborsato'
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : entry.reimbursement_status === 'donato'
                                          ? 'rgba(59, 130, 246, 0.15)'
                                          : 'rgba(245, 158, 11, 0.15)',
                                      color:
                                        entry.reimbursement_status === 'rimborsato'
                                          ? '#34d399'
                                          : entry.reimbursement_status === 'donato'
                                          ? '#60a5fa'
                                          : '#fbbf24'
                                    }}
                                  >
                                    {entry.reimbursement_status === 'rimborsato'
                                      ? '🟢 Rimborsato'
                                      : entry.reimbursement_status === 'donato'
                                      ? '🔵 Donato'
                                      : '🟠 Da rimborsare'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              🏛️ Cassa Oratorio
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Data */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {entry.entry_date || '-'}
                      </td>

                      {/* Note */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {entry.notes || '-'}
                      </td>

                      {/* Importo */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          color: entry.type === 'income' ? '#10b981' : '#f43f5e'
                        }}
                      >
                        {entry.type === 'income' ? '+' : '-'}{formatEuro(entry.amount)}
                      </td>

                      {/* Azioni */}
                      {isModerator && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-ghost btn-sm btn-icon-only"
                            style={{ color: '#fb7185' }}
                            onClick={() => handleDeleteEntry(entry.id, entry.title)}
                            title="Elimina voce"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
