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

// Card in evidenza con lo Sconto per Persona (mostrata nella Dashboard)
export function HeroDiscountCard({ metrics, onOpenSettings }) {
  const { isAdmin } = useAuth();
  if (!metrics) return null;

  const {
    participants_count = 25,
    estimated_cost_per_person = 1800,
    discount_per_participant = 0,
    remaining_cost_per_participant = 1800,
    discount_percent = 0
  } = metrics;

  return (
    <div className="stat-card hero-discount-card" style={{ marginBottom: '24px' }}>
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

        <div className="stat-subtext" style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
          🎉 Risparmio accumulato per ciascuno degli <strong>{participants_count} ragazzi partenti</strong>
        </div>

        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            <span>Quota stimata viaggio: </span>
            <strong style={{ color: 'var(--text-main)' }}>{formatEuro(estimated_cost_per_person)}</strong>
          </div>
          <div>
            <span>Quota netta residua: </span>
            <strong style={{ color: '#2563eb' }}>{formatEuro(remaining_cost_per_participant)}</strong>
          </div>
          <div>
            <span>Abbattimento costo: </span>
            <strong style={{ color: '#059669' }}>{discount_percent}%</strong>
          </div>
        </div>
      </div>

      <div>
        <div className="stat-progress-bar">
          <div
            className="stat-progress-fill blue"
            style={{ width: `${Math.min(100, Math.max(3, discount_percent))}%` }}
            title={`${discount_percent}% della quota coperto dalla raccolta`}
          ></div>
        </div>

        {isAdmin && (
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenSettings}
              style={{ fontSize: '0.8rem', padding: '5px 12px' }}
            >
              <span>Configura n° partenti ({participants_count})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 4 Card Totali (Fondo Netto, Entrate, Spese, Iniziative) posizionate in cima a Raccolta Fondi
export function FundraisingTotalsCards({ metrics }) {
  if (!metrics) return null;

  const {
    total_income = 0,
    total_expense = 0,
    net_profit = 0,
    target_fundraising_total = 45000,
    target_percent = 0,
    initiatives_count = 0,
    completed_count = 0,
    total_entries_count = 0
  } = metrics;

  return (
    <div className="stats-grid" style={{ marginBottom: '28px' }}>
      {/* 1. FONDO NETTO RACCOLTO */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Fondo Netto Raccolto</span>
            <div className="stat-icon green">
              <Award size={20} />
            </div>
          </div>

          <div className="stat-value" style={{ color: '#059669' }}>
            {formatEuro(net_profit)}
          </div>

          <div className="stat-subtext">
            Incassi lordi ({formatEuro(total_income)}) - Spese ({formatEuro(total_expense)})
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Obiettivo: {formatEuro(target_fundraising_total)}</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>{target_percent}%</span>
          </div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill green"
              style={{ width: `${Math.min(100, Math.max(3, target_percent))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. TOTALE ENTRATE LORDE */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Totale Entrate Lorde</span>
            <div className="stat-icon blue">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="stat-value" style={{ color: '#2563eb' }}>
            {formatEuro(total_income)}
          </div>

          <div className="stat-subtext">
            Incassi complessivi generati da cene, bancarelle, offerte e tornei.
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
          📈 Voci di incasso registrate: <strong>{total_entries_count}</strong>
        </div>
      </div>

      {/* 3. TOTALE SPESE SOSTENUTE */}
      <div className="stat-card">
        <div>
          <div className="stat-header">
            <span className="stat-label">Totale Spese Sostenute</span>
            <div className="stat-icon red">
              <TrendingDown size={20} />
            </div>
          </div>

          <div className="stat-value" style={{ color: '#e11d48' }}>
            {formatEuro(total_expense)}
          </div>

          <div className="stat-subtext">
            Costi vivi (ingredienti, materiali, premi e tipografia).
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
          🏷️ Tracciamento analitico delle uscite
        </div>
      </div>

      {/* 4. INIZIATIVE TOTALI */}
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

export default function DashboardStats({ metrics, onOpenSettings }) {
  return (
    <>
      <HeroDiscountCard metrics={metrics} onOpenSettings={onOpenSettings} />
    </>
  );
}
