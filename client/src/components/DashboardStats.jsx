import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Award,
  CalendarCheck,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function formatEuro(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export default function DashboardStats({ metrics, onOpenSettings }) {
  const { isAdmin } = useAuth();

  if (!metrics) return null;

  const {
    total_income = 0,
    total_expense = 0,
    net_profit = 0,
    participants_count = 25,
    estimated_cost_per_person = 1800,
    target_fundraising_total = 20000,
    discount_per_participant = 0,
    remaining_cost_per_participant = 1800,
    discount_percent = 0,
    target_percent = 0,
    initiatives_count = 0,
    completed_count = 0,
    total_entries_count = 0
  } = metrics;

  return (
    <div className="stats-grid">
      {/* CARD EROE: SCONTO ATTUALE PER PARTECIPANTE */}
      <div className="stat-card hero-discount-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Sconto Attuale per Partecipante</span>
            <div className="stat-icon red">
              <Tag size={20} />
            </div>
          </div>

          <div className="stat-value highlight">
            {formatEuro(discount_per_participant)}
          </div>

          <div className="stat-subtext" style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 500 }}>
            🎉 Risparmio diretto per ciascuno dei <strong>{participants_count} ragazzi partenti</strong>
          </div>

          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              fontSize: '0.85rem',
              color: '#cbd5e1'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Quota stimata: </span>
              <strong>{formatEuro(estimated_cost_per_person)}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Quota netta residua: </span>
              <strong style={{ color: '#38bdf8' }}>{formatEuro(remaining_cost_per_participant)}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Abbattimento costo: </span>
              <strong style={{ color: '#34d399' }}>{discount_percent}%</strong>
            </div>
          </div>
        </div>

        <div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill red"
              style={{ width: `${Math.min(100, Math.max(2, discount_percent))}%` }}
              title={`${discount_percent}% della quota coperto dalla raccolta`}
            ></div>
          </div>

          {isAdmin && (
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={onOpenSettings}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                <span>Cambia n° partenti ({participants_count})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: UTILE NETTO RACCOLTO */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Fondo Netto Raccolto</span>
            <div className="stat-icon green">
              <Award size={20} />
            </div>
          </div>

          <div className="stat-value" style={{ color: '#10b981' }}>
            {formatEuro(net_profit)}
          </div>

          <div className="stat-subtext">
            Entrate totali ({formatEuro(total_income)}) - Spese ({formatEuro(total_expense)})
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Obiettivo: {formatEuro(target_fundraising_total)}</span>
            <span style={{ fontWeight: 600, color: '#34d399' }}>{target_percent}%</span>
          </div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill green"
              style={{ width: `${Math.min(100, Math.max(3, target_percent))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CARD 3: TOTALE ENTRATE */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Totale Entrate Lorde</span>
            <div className="stat-icon blue">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {formatEuro(total_income)}
          </div>

          <div className="stat-subtext">
            Incassi complessivi generati da cene, bancarelle, donazioni e tornei.
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
          📈 Voci di incasso contabilizzate: <strong>{total_entries_count} transazioni</strong>
        </div>
      </div>

      {/* CARD 4: TOTALE SPESE */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Totale Spese Sostenute</span>
            <div className="stat-icon red">
              <TrendingDown size={20} />
            </div>
          </div>

          <div className="stat-value" style={{ color: '#fb7185' }}>
            {formatEuro(total_expense)}
          </div>

          <div className="stat-subtext">
            Costi vivi (ingredienti, materiale, stampe, premi e noleggi).
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
          🏷️ Tracciamento analitico delle uscite
        </div>
      </div>

      {/* CARD 5: INIZIATIVE ATTIVE */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Iniziative Totali</span>
            <div className="stat-icon gold">
              <CalendarCheck size={20} />
            </div>
          </div>

          <div className="stat-value">
            {initiatives_count}
          </div>

          <div className="stat-subtext">
            {completed_count} completate con successo
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
          ⛪ Oratorio Salesiano Don Bosco Asti
        </div>
      </div>
    </div>
  );
}
