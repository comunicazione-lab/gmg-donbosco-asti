import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import DashboardStats from './components/DashboardStats';
import DiscountSimulator from './components/DiscountSimulator';
import FinancialCharts from './components/FinancialCharts';
import InitiativeCard from './components/InitiativeCard';
import InitiativeModal from './components/InitiativeModal';
import EntriesManagerModal from './components/EntriesManagerModal';
import AdminUsersModal from './components/AdminUsersModal';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { Search, PlusCircle, Filter, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const { token, isAuthenticated, isModerator, isAdmin, showToast } = useAuth();

  // Dati Dashboard & Iniziative
  const [metrics, setMetrics] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtri iniziative
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modali
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);
  const [initiativeToEdit, setInitiativeToEdit] = useState(null);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Gestione Tema Dark/Light
  const [theme, setTheme] = useState(() => localStorage.getItem('gmg_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gmg_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Caricamento Dati
  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Carica metriche dashboard
      const dashRes = await fetch('/api/settings/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setMetrics(dashData.metrics);
        setCategoryBreakdown(dashData.category_breakdown || []);
      }

      // Carica iniziative
      const initRes = await fetch('/api/initiatives', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (initRes.ok) {
        const initData = await initRes.json();
        setInitiatives(initData.initiatives || []);
      }
    } catch (err) {
      console.error('Errore recupero dati:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Aggiornamento rapido partenti ufficiali dal simulatore (Admin)
  const handleUpdateOfficialParticipants = async (newCount) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          participants_count: newCount,
          estimated_cost_per_person: metrics?.estimated_cost_per_person || 1800,
          target_fundraising_total: metrics?.target_fundraising_total || 20000
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        fetchData();
      } else {
        showToast(data.error || 'Errore aggiornamento', 'error');
      }
    } catch (err) {
      showToast('Errore durante l\'aggiornamento', 'error');
    }
  };

  // Eliminazione Iniziativa
  const handleDeleteInitiative = async (id, title) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'iniziativa "${title}" e tutte le sue voci?`)) return;

    try {
      const res = await fetch(`/api/initiatives/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'info');
        fetchData();
      } else {
        showToast(data.error || 'Errore eliminazione', 'error');
      }
    } catch (err) {
      showToast('Errore durante la cancellazione', 'error');
    }
  };

  // Filtro client-side delle iniziative
  const filteredInitiatives = initiatives.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="app-layout">
      {/* Navbar Principale */}
      <Navbar
        onOpenNewInitiative={() => {
          setInitiativeToEdit(null);
          setIsInitiativeModalOpen(true);
        }}
        onOpenUsers={() => setIsUsersModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="app-container">
        {/* Banner GMG Seoul 2027 */}
        <HeroBanner />

        {!isAuthenticated ? (
          /* Vista per utenti non ancora loggati */
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              border: 'var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              margin: '30px auto',
              backdropFilter: 'var(--glass-backdrop)'
            }}
          >
            <div className="brand-logo-badge" style={{ width: '56px', height: '56px', fontSize: '1.4rem', margin: '0 auto 16px auto' }}>
              <span>27</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>
              Benvenuto nel Portale Don Bosco Asti
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Accedi per consultare in trasparenza l'andamento della raccolta fondi,
              il calcolo dello sconto a persona e il bilancio di tutte le attività.
            </p>
            <button className="btn btn-primary" onClick={() => setIsAuthModalOpen(true)}>
              <span>Accedi o Registrati Subito</span>
            </button>
          </div>
        ) : (
          /* Vista completa per utenti autenticati */
          <>
            {/* Statistiche Principali & Sconto Partecipante */}
            <DashboardStats
              metrics={metrics}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />

            {/* Simulatore & Calcolatore Dinamico Sconto */}
            <DiscountSimulator
              metrics={metrics}
              onUpdateOfficialParticipants={handleUpdateOfficialParticipants}
            />

            {/* Grafici Rendimento Categorie & Utile vs Spese */}
            <FinancialCharts
              categoryBreakdown={categoryBreakdown}
              metrics={metrics}
            />

            {/* SEZIONE INIZIATIVE & ATTIVITÀ */}
            <section style={{ marginTop: '20px' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <Layers size={22} style={{ color: '#e11d48' }} />
                    <span>Iniziative di Raccolta Fondi</span>
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Cene, tornei, bancarelle e vendite solidali organizzate dalla comunità.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-outline btn-sm btn-icon-only"
                    onClick={fetchData}
                    title="Ricarica dati"
                  >
                    <RefreshCw size={15} />
                  </button>

                  {isModerator && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setInitiativeToEdit(null);
                        setIsInitiativeModalOpen(true);
                      }}
                    >
                      <PlusCircle size={16} />
                      <span>Nuova Iniziativa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barra Filtri e Ricerca */}
              <div className="filters-bar">
                <div className="search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Cerca attività per nome, luogo o parole chiave..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="select-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="in_corso">In Corso</option>
                  <option value="completata">Completata</option>
                  <option value="pianificata">Pianificata</option>
                </select>

                <select
                  className="select-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Tutte le categorie</option>
                  <option value="Cene & Ristoro">Cene & Ristoro</option>
                  <option value="Bancarelle & Mercatini">Bancarelle & Mercatini</option>
                  <option value="Eventi & Tornei">Eventi & Tornei</option>
                  <option value="Lotterie">Lotterie</option>
                  <option value="Servizi Volontari">Servizi Volontari</option>
                  <option value="Donazioni & Sponsor">Donazioni & Sponsor</option>
                </select>
              </div>

              {/* Griglia Iniziative */}
              {loading && initiatives.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Caricamento iniziative...
                </div>
              ) : filteredInitiatives.length === 0 ? (
                <div
                  style={{
                    padding: '50px 20px',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    Nessuna iniziativa trovata con i filtri correnti.
                  </p>
                  {isModerator && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '14px' }}
                      onClick={() => {
                        setInitiativeToEdit(null);
                        setIsInitiativeModalOpen(true);
                      }}
                    >
                      <PlusCircle size={15} />
                      <span>Crea la prima iniziativa</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="initiatives-grid">
                  {filteredInitiatives.map((init) => (
                    <InitiativeCard
                      key={init.id}
                      initiative={init}
                      onOpenEntries={(item) => setSelectedInitiativeId(item.id)}
                      onEdit={(item) => {
                        setInitiativeToEdit(item);
                        setIsInitiativeModalOpen(true);
                      }}
                      onDelete={handleDeleteInitiative}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: 'var(--glass-border)',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          background: 'rgba(0,0,0,0.2)'
        }}
      >
        <p>
          <strong>Oratorio Salesiano Don Bosco • Asti</strong> — Portale Raccolta Fondi GMG Corea del Sud Seoul 2027
        </p>
        <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
          Realizzato con trasparenza per i giovani pellegrini, le famiglie e la comunità salesiana di Asti.
        </p>
      </footer>

      {/* Modali */}
      <InitiativeModal
        isOpen={isInitiativeModalOpen}
        onClose={() => {
          setIsInitiativeModalOpen(false);
          setInitiativeToEdit(null);
        }}
        initiativeToEdit={initiativeToEdit}
        onSuccess={() => fetchData()}
      />

      {selectedInitiativeId && (
        <EntriesManagerModal
          initiativeId={selectedInitiativeId}
          onClose={() => setSelectedInitiativeId(null)}
          onRefreshData={fetchData}
        />
      )}

      <AdminUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={metrics}
        onSettingsUpdated={() => fetchData()}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
