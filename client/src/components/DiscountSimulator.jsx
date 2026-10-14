import React, { useState, useEffect } from 'react';
import { Calculator, Sparkles, Check, ArrowRight } from 'lucide-react';
import { formatEuro } from './DashboardStats';
import { useAuth } from '../context/AuthContext';

export default function DiscountSimulator({ metrics, onUpdateOfficialParticipants }) {
  const { isAdmin } = useAuth();
  const currentParticipants = metrics?.participants_count || 25;
  const currentNetProfit = metrics?.net_profit || 0;
  const estimatedCost = metrics?.estimated_cost_per_person || 1800;

  const [simulatedParticipants, setSimulatedParticipants] = useState(currentParticipants);
  const [simulatedExtraIncome, setSimulatedExtraIncome] = useState(0);

  useEffect(() => {
    if (metrics?.participants_count) {
      setSimulatedParticipants(metrics.participants_count);
    }
  }, [metrics?.participants_count]);

  const simulatedTotalProfit = currentNetProfit + Number(simulatedExtraIncome);
  const simulatedDiscountPerPerson =
    simulatedParticipants > 0 ? simulatedTotalProfit / simulatedParticipants : 0;
  const simulatedRemainingCost = Math.max(0, estimatedCost - simulatedDiscountPerPerson);

  const diffFromCurrent = simulatedDiscountPerPerson - (metrics?.discount_per_participant || 0);

  return (
    <div className="simulator-panel">
      <div className="simulator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="stat-icon red" style={{ width: '36px', height: '36px' }}>
            <Calculator size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Calcolatore & Simulatore Sconto Partenti
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Verifica come varia lo sconto per ragazzo al variare del numero dei partenti o aggiungendo ipotetiche nuove entrate.
            </p>
          </div>
        </div>

        {isAdmin && simulatedParticipants !== currentParticipants && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onUpdateOfficialParticipants(simulatedParticipants)}
          >
            <Check size={16} />
            <span>Salva come Ufficiale ({simulatedParticipants} partenti)</span>
          </button>
        )}
      </div>

      <div className="simulator-grid">
        {/* Controls */}
        <div className="simulator-controls">
          <div className="slider-group">
            <label htmlFor="participants-slider">
              <span>Numero di Ragazzi Partenti GMG:</span>
              <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>
                {simulatedParticipants} partecipanti
              </strong>
            </label>
            <input
              id="participants-slider"
              type="range"
              min="5"
              max="60"
              step="1"
              value={simulatedParticipants}
              onChange={(e) => setSimulatedParticipants(parseInt(e.target.value, 10))}
              className="slider-input"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Min: 5</span>
              <span>Ufficiale attuale: {currentParticipants}</span>
              <span>Max: 60</span>
            </div>
          </div>

          <div className="slider-group">
            <label htmlFor="extra-income-slider">
              <span>Ipotizza Nuova Entrata Futura:</span>
              <strong style={{ color: '#34d399', fontSize: '1.1rem' }}>
                + {formatEuro(simulatedExtraIncome)}
              </strong>
            </label>
            <input
              id="extra-income-slider"
              type="range"
              min="0"
              max="10000"
              step="100"
              value={simulatedExtraIncome}
              onChange={(e) => setSimulatedExtraIncome(parseFloat(e.target.value))}
              className="slider-input"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>0 €</span>
              <span>+ 5.000 €</span>
              <span>+ 10.000 €</span>
            </div>
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="simulator-result-box">
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Sconto Simulato per Ciascun Giovane
          </span>
          <div className="simulator-result-amount">
            {formatEuro(simulatedDiscountPerPerson)}
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Quota residua stimata: <strong style={{ color: '#38bdf8' }}>{formatEuro(simulatedRemainingCost)}</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}> (su {formatEuro(estimatedCost)})</span>
          </p>

          {diffFromCurrent !== 0 && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: diffFromCurrent > 0 ? '#34d399' : '#fb7185'
              }}
            >
              {diffFromCurrent > 0
                ? `+ ${formatEuro(diffFromCurrent)} rispetto alla situazione attuale`
                : `- ${formatEuro(Math.abs(diffFromCurrent))} rispetto alla situazione attuale`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
