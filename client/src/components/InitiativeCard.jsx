import React from 'react';
import { Calendar, MapPin, ListFilter, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import { formatEuro } from './DashboardStats';
import { useAuth } from '../context/AuthContext';

export default function InitiativeCard({ initiative, onOpenEntries, onEdit, onDelete }) {
  const { isModerator } = useAuth();

  const {
    id,
    title,
    description,
    category = 'Cene & Ristoro',
    status = 'in_corso',
    event_date,
    location,
    total_income = 0,
    total_expense = 0,
    net_profit = 0,
    entries_count = 0
  } = initiative;

  const statusLabels = {
    in_corso: 'In Corso',
    completata: 'Completata',
    pianificata: 'Pianificata'
  };

  const formattedDate = event_date
    ? new Date(event_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Data da definire';

  return (
    <div className="initiative-card">
      <div>
        <div className="initiative-top">
          <span className="initiative-category-badge">{category}</span>
          <span className={`initiative-status-badge ${status}`}>
            {statusLabels[status] || status}
          </span>
        </div>

        <h3 className="initiative-card-title">{title}</h3>
        {description && <p className="initiative-card-desc">{description}</p>}

        <div className="initiative-meta-row">
          <div className="initiative-meta-item">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
          {location && (
            <div className="initiative-meta-item">
              <MapPin size={14} />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Bilancio Mini Box */}
        <div className="initiative-finance-box">
          <div className="finance-rows-grid">
            <div className="finance-item">
              <span className="label">Totale Entrate</span>
              <span className="val income">{formatEuro(total_income)}</span>
            </div>
            <div className="finance-item">
              <span className="label">Totale Spese</span>
              <span className="val expense">{formatEuro(total_expense)}</span>
            </div>
          </div>

          <div className="net-profit-row">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Utile Netto Generato:
            </span>
            <span className={`net-profit-val ${net_profit >= 0 ? 'positive' : 'negative'}`}>
              {net_profit >= 0 ? '+' : ''}{formatEuro(net_profit)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            📝 {entries_count} {entries_count === 1 ? 'voce registrata' : 'voci registrate'}
          </span>
        </div>

        <div className="card-actions-row">
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={() => onOpenEntries(initiative)}
            title="Gestisci o visualizza le singole voci di spesa e di incasso"
          >
            <ListFilter size={15} />
            <span>Voci & Bilancio</span>
            <ArrowUpRight size={14} />
          </button>

          {isModerator && (
            <>
              <button
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={() => onEdit(initiative)}
                title="Modifica dettagli iniziativa"
              >
                <Edit2 size={15} />
              </button>

              <button
                className="btn btn-danger btn-sm btn-icon-only"
                onClick={() => onDelete(id, title)}
                title="Elimina iniziativa"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
