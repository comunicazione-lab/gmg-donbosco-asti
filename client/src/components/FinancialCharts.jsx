import React from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { formatEuro } from './DashboardStats';

export default function FinancialCharts({ categoryBreakdown, metrics }) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) return null;

  const maxIncome = Math.max(...categoryBreakdown.map((c) => c.income), 100);
  const totalIncome = metrics?.total_income || 1;
  const totalExpense = metrics?.total_expense || 0;
  const netProfit = metrics?.net_profit || 0;

  const expenseRatio = Math.round((totalExpense / totalIncome) * 100) || 0;
  const profitRatio = Math.max(0, 100 - expenseRatio);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px', marginBottom: '32px' }}>
      {/* Grafico Ripartizione per Categorie */}
      <div className="stat-card">
        <div className="stat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="stat-icon blue" style={{ width: '32px', height: '32px' }}>
              <BarChart3 size={16} />
            </div>
            <span className="stat-label" style={{ fontSize: '0.85rem' }}>
              Rendimento per Categoria di Attività
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          {categoryBreakdown.map((cat) => {
            const widthPercent = Math.min(100, Math.round((cat.income / maxIncome) * 100));
            return (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{cat.category}</span>
                  <div>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>+{formatEuro(cat.profit)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginLeft: '6px' }}>
                      (inc. {formatEuro(cat.income)})
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(4, widthPercent)}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.8s ease'
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grafico Efficienza & Rapporto Entrate / Spese */}
      <div className="stat-card">
        <div className="stat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="stat-icon green" style={{ width: '32px', height: '32px' }}>
              <PieChart size={16} />
            </div>
            <span className="stat-label" style={{ fontSize: '0.85rem' }}>
              Efficienza Raccolta: Utile vs Spese
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '20px 0', flexWrap: 'wrap', gap: '16px' }}>
          {/* SVG Doughnut */}
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Sfondo */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(244, 63, 94, 0.4)"
                strokeWidth="3.8"
              />
              {/* Utile Netto Stroke */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={`${profitRatio}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                {profitRatio}%
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Utile Netto
              </span>
            </div>
          </div>

          {/* Dettagli leggenda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Utile Netto Trattenuto</div>
                <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                  {formatEuro(netProfit)} ({profitRatio}%)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f43f5e' }}></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Costi e Spese Sostenute</div>
                <div style={{ fontWeight: 700, color: '#fb7185', fontSize: '0.95rem' }}>
                  {formatEuro(totalExpense)} ({expenseRatio}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
          💡 Oltre l'<strong>{profitRatio}%</strong> di quanto donato e speso nelle attività dell'oratorio si trasforma direttamente in sconto per il viaggio dei ragazzi.
        </div>
      </div>
    </div>
  );
}
