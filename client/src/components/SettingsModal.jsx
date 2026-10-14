import React, { useState, useEffect } from 'react';
import { X, Sliders, Users, DollarSign, Target, Download, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatEuro } from './DashboardStats';

export default function SettingsModal({ isOpen, onClose, currentSettings, onSettingsUpdated }) {
  const { token, showToast } = useAuth();

  const [participantsCount, setParticipantsCount] = useState(25);
  const [estimatedCost, setEstimatedCost] = useState(1800);
  const [targetFund, setTargetFund] = useState(20000);
  const [eventName, setEventName] = useState('GMG Seoul 2027 - Corea del Sud');
  const [oratoryName, setOratoryName] = useState('Oratorio Salesiano Don Bosco - Asti');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      const p = currentSettings.participants_count || 25;
      const c = currentSettings.estimated_cost_per_person || 1800;
      setParticipantsCount(p);
      setEstimatedCost(c);
      setTargetFund(currentSettings.target_fundraising_total || (p * c));
      setEventName(currentSettings.event_name || 'GMG Seoul 2027 - Corea del Sud');
      setOratoryName(currentSettings.oratory_name || 'Oratorio Salesiano Don Bosco - Asti');
    }
  }, [currentSettings, isOpen]);

  const handleParticipantsChange = (val) => {
    const num = parseInt(val, 10);
    setParticipantsCount(val);
    if (!isNaN(num) && num > 0) {
      setTargetFund(num * (parseFloat(estimatedCost) || 1800));
    }
  };

  const handleEstimatedCostChange = (val) => {
    const cost = parseFloat(val);
    setEstimatedCost(val);
    if (!isNaN(cost) && cost > 0) {
      setTargetFund((parseInt(participantsCount, 10) || 25) * cost);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const count = parseInt(participantsCount, 10);
    if (isNaN(count) || count < 1) {
      showToast('Il numero di partenti deve essere almeno 1', 'error');
      return;
    }

    setSaving(true);
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
          target_fundraising_total: parseFloat(targetFund) || 20000,
          event_name: eventName.trim(),
          oratory_name: oratoryName.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        onSettingsUpdated(data.settings);
        onClose();
      } else {
        showToast(data.error || 'Errore durante il salvataggio', 'error');
      }
    } catch (err) {
      showToast('Errore di connessione', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/settings/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Errore download');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Sliders size={20} style={{ color: '#e11d48' }} />
            <span>Configurazione Partenti & Parametri GMG</span>
          </h2>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <div
            style={{
              background: 'rgba(225, 29, 72, 0.1)',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '18px',
              fontSize: '0.85rem',
              color: '#fb7185'
            }}
          >
            🎯 <strong>Calcolo Automatico Sconto:</strong> Il numero di partenti qui impostato viene utilizzato per calcolare automaticamente lo sconto a persona in tutta la dashboard: <code>Utile Netto / Numero Partenti</code>.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Numero di Ragazzi Partenti GMG *
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
                Attualmente impostato su <strong>{participantsCount} giovani</strong>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Costo Totale Stimato a Persona (€)
              </label>
              <input
                type="number"
                step="10"
                className="form-input"
                value={estimatedCost}
                onChange={(e) => handleEstimatedCostChange(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Stima volo + alloggio + kit pellegrino GMG
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
                style={{ fontSize: '0.72rem', padding: '2px 6px', color: '#38bdf8' }}
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
              Calcolato di default come <strong>{participantsCount} partenti × {formatEuro(estimatedCost)} = {formatEuro((parseInt(participantsCount, 10) || 25) * (parseFloat(estimatedCost) || 1800))}</strong>
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
              <label className="form-label">Nome Oratorio / Parrocchia</label>
              <input
                type="text"
                className="form-input"
                value={oratoryName}
                onChange={(e) => setOratoryName(e.target.value)}
              />
            </div>
          </div>

          {/* Backup Dati */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Esportazione Dati & Backup</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Scarica un file JSON con tutti gli utenti, iniziative e voci registrate.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportBackup}
            >
              <Download size={14} />
              <span>Scarica JSON</span>
            </button>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0 0', background: 'transparent' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
