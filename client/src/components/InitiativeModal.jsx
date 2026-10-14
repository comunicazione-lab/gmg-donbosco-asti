import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Tag, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InitiativeModal({ isOpen, onClose, initiativeToEdit, onSuccess }) {
  const { token, showToast } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cene & Ristoro');
  const [status, setStatus] = useState('in_corso');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Oratorio Don Bosco Asti');

  // Voci iniziali opzionali in fase di creazione
  const [hasInitialExpense, setHasInitialExpense] = useState(false);
  const [initialExpenseTitle, setInitialExpenseTitle] = useState('Spesa iniziale preparativi');
  const [initialExpenseAmount, setInitialExpenseAmount] = useState('');

  const [hasInitialIncome, setHasInitialIncome] = useState(false);
  const [initialIncomeTitle, setInitialIncomeTitle] = useState('Incasso iniziale / Prevendite');
  const [initialIncomeAmount, setInitialIncomeAmount] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initiativeToEdit) {
      setTitle(initiativeToEdit.title || '');
      setDescription(initiativeToEdit.description || '');
      setCategory(initiativeToEdit.category || 'Cene & Ristoro');
      setStatus(initiativeToEdit.status || 'in_corso');
      setEventDate(initiativeToEdit.event_date || new Date().toISOString().split('T')[0]);
      setLocation(initiativeToEdit.location || 'Oratorio Don Bosco Asti');
      setHasInitialExpense(false);
      setHasInitialIncome(false);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Cene & Ristoro');
      setStatus('in_corso');
      setEventDate(new Date().toISOString().split('T')[0]);
      setLocation('Oratorio Don Bosco Asti');
      setHasInitialExpense(false);
      setHasInitialIncome(false);
      setInitialExpenseAmount('');
      setInitialIncomeAmount('');
    }
  }, [initiativeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Il titolo dell\'iniziativa è obbligatorio', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const url = initiativeToEdit
        ? `/api/initiatives/${initiativeToEdit.id}`
        : '/api/initiatives';
      const method = initiativeToEdit ? 'PUT' : 'POST';

      const initialEntries = [];
      if (!initiativeToEdit) {
        if (hasInitialExpense && Number(initialExpenseAmount) > 0) {
          initialEntries.push({
            type: 'expense',
            title: initialExpenseTitle || 'Spesa iniziale',
            category: 'Materiali & Preparativi',
            amount: parseFloat(initialExpenseAmount),
            entry_date: eventDate,
            notes: 'Spesa iniziale inserita all\'apertura dell\'attività'
          });
        }
        if (hasInitialIncome && Number(initialIncomeAmount) > 0) {
          initialEntries.push({
            type: 'income',
            title: initialIncomeTitle || 'Guadagno iniziale',
            category: 'Prevendite',
            amount: parseFloat(initialIncomeAmount),
            entry_date: eventDate,
            notes: 'Incasso iniziale registrato all\'apertura dell\'attività'
          });
        }
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          status,
          event_date: eventDate,
          location: location.trim(),
          initial_entries: initialEntries
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        onSuccess(data.initiative);
        onClose();
      } else {
        showToast(data.error || 'Errore durante il salvataggio', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore di connessione', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Tag size={20} style={{ color: '#e11d48' }} />
            <span>{initiativeToEdit ? 'Modifica Iniziativa' : 'Nuova Iniziativa di Raccolta Fondi'}</span>
          </h2>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Titolo Iniziativa *</label>
            <input
              type="text"
              className="form-input"
              placeholder="es. Cena Piemontese & Coreana, Bancarella Torte, Torneo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Cene & Ristoro">Cene & Ristoro</option>
                <option value="Bancarelle & Mercatini">Bancarelle & Mercatini</option>
                <option value="Eventi & Tornei">Eventi & Tornei</option>
                <option value="Lotterie">Lotterie</option>
                <option value="Servizi Volontari">Servizi Volontari (es. lavaggio auto)</option>
                <option value="Donazioni & Sponsor">Donazioni & Sponsor</option>
                <option value="Altro">Altro</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Stato Attività</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="in_corso">In Corso</option>
                <option value="completata">Completata</option>
                <option value="pianificata">Pianificata (Futura)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data Evento</label>
              <input
                type="date"
                className="form-input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Luogo</label>
              <input
                type="text"
                className="form-input"
                placeholder="es. Salone Don Bosco, Cortile, Sagrato..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrizione e Obiettivi</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Descrivi l'iniziativa, come verranno coinvolti i giovani e le famiglie dell'oratorio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Voci iniziali opzionali (solo se creazione nuova iniziativa) */}
          {!initiativeToEdit && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Voci iniziali immediate (opzionali):
              </span>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Puoi inserire subito la prima spesa o il primo incasso, oppure aggiungerli dopo nella gestione voci dettagliata.
              </p>

              {/* Checkbox Spesa iniziale */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={hasInitialExpense}
                    onChange={(e) => setHasInitialExpense(e.target.checked)}
                  />
                  <span>Inserisci subito una spesa iniziale (costo previsto)</span>
                </label>
                {hasInitialExpense && (
                  <div className="form-row" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Descrizione spesa (es. Spesa ingredienti)"
                      value={initialExpenseTitle}
                      onChange={(e) => setInitialExpenseTitle(e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Importo spesa (€)"
                      value={initialExpenseAmount}
                      onChange={(e) => setInitialExpenseAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Checkbox Guadagno iniziale */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={hasInitialIncome}
                    onChange={(e) => setHasInitialIncome(e.target.checked)}
                  />
                  <span>Inserisci subito un primo guadagno / incasso</span>
                </label>
                {hasInitialIncome && (
                  <div className="form-row" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Descrizione incasso (es. Prevendite)"
                      value={initialIncomeTitle}
                      onChange={(e) => setInitialIncomeTitle(e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Importo incasso (€)"
                      value={initialIncomeAmount}
                      onChange={(e) => setInitialIncomeAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ padding: '16px 0 0 0', background: 'transparent' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Salvataggio...' : initiativeToEdit ? 'Aggiorna Iniziativa' : 'Crea Iniziativa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
