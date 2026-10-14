import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import DashboardStats, { HeroDiscountCard, FundraisingTotalsCards } from './components/DashboardStats';
import DiscountSimulator from './components/DiscountSimulator';
import FinancialCharts from './components/FinancialCharts';
import InitiativeCard from './components/InitiativeCard';
import InitiativeModal from './components/InitiativeModal';
import EntriesManagerModal from './components/EntriesManagerModal';
import SettingsSection from './components/SettingsSection';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { Search, PlusCircle, RefreshCw, Layers, LayoutDashboard, Coins, Settings } from 'lucide-react';

export default function App() {
  const { token, isAuthenticated, isModerator, isAdmin, showToast } = useAuth();

  // Sezione Attiva: 'dashboard' | 'fundraising' | 'settings'
  const [activeSection, setActiveSection] = useState('dashboard');

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Gestione Tema (Default: Light / Solare)
  const [theme, setTheme] = useState(() => localStorage.getItem('gmg_theme') || 'light');

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
      const estimated = metrics?.estimated_cost_per_person || 1800;
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          participants_count: newCount,
          estimated_cost_per_person: estimated,
          target_fundraising_total: newCount * estimated // default persone * costo
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

  // Filtro iniziative
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
      {/* Navbar con Sezioni e Controlli */}
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenNewInitiative={() => {
          setInitiativeToEdit(null);
          setIsInitiativeModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="app-container">
        {/* Banner GMG Seoul 2027: visibile solo in homepage (non autenticato) e nella dashboard */}
        {(!isAuthenticated || activeSection === 'dashboard') && <HeroBanner />}

        {!isAuthenticated ? (
          /* Vista Utenti non autenticati */
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              border: 'var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '640px',
              margin: '30px auto',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="brand-logo-badge" style={{ width: '56px', height: '56px', fontSize: '1.4rem', margin: '0 auto 16px auto' }}>
              <span>27</span>
            </div>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '10px' }}>
              Portale GMG Seoul 2027 • Don Bosco Asti
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px', fontSize: '0.98rem' }}>
              Accedi al portale della comunità salesiana per verificare in trasparenza tutte le attività di raccolta fondi,
              il fondo raccolto e lo sconto attuale accumulato per ciascun giovane partente!
            </p>
            <button className="btn btn-primary" onClick={() => setIsAuthModalOpen(true)}>
              <span>Accedi o Richiedi Iscrizione</span>
            </button>
          </div>
        ) : (
          /* Vista Multi-Sezione per utenti autenticati */
          <>
            {/* 1. SEZIONE DASHBOARD */}
            {activeSection === 'dashboard' && (
              <div>
                <DashboardStats
                  metrics={metrics}
                  onOpenSettings={() => setActiveSection('settings')}
                />

                <DiscountSimulator
                  metrics={metrics}
                  onUpdateOfficialParticipants={handleUpdateOfficialParticipants}
                />

                <FinancialCharts
                  categoryBreakdown={categoryBreakdown}
                  metrics={metrics}
                />
              </div>
            )}

            {/* 2. SEZIONE RACCOLTA FONDI */}
            {activeSection === 'fundraising' && (
              <div>
                {/* 4 Card Totali in Cima alla Scheda Raccolta Fondi:
                    Fondo Netto Raccolto, Totale Entrate Lorde, Totale Spese Sostenute, Iniziative Totali */}
                <FundraisingTotalsCards metrics={metrics} />

                <div className="section-header">
                  <div>
                    <h2 className="section-title">
                      <Coins size={24} style={{ color: '#2563eb' }} />
                      <span>Iniziative di Raccolta Fondi</span>
                    </h2>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      Tutte le attività (cene, bancarelle, spettacoli, tornei) con dettaglio delle spese e degli incassi.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-outline btn-sm btn-icon-only"
                      onClick={fetchData}
                      title="Ricarica iniziative"
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
                        <span>+ Nuova Attività</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtri */}
                <div className="filters-bar">
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Cerca attività per nome, luogo..."
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
                    Caricamento attività...
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
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Nessuna attività trovata con i filtri selezionati.
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
                        <span>Crea una nuova attività</span>
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
              </div>
            )}

            {/* 3. SEZIONE IMPOSTAZIONI & QUOTE */}
            {activeSection === 'settings' && (
              <SettingsSection
                currentSettings={metrics}
                onSettingsUpdated={() => fetchData()}
              />
            )}
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
          background: 'rgba(0,0,0,0.02)'
        }}
      >
        <p>
          <strong>Oratorio Salesiano Don Bosco • Asti</strong> — Verso Seoul 2027
        </p>
      </footer>

      {/* Modale Creazione / Modifica Iniziativa */}
      <InitiativeModal
        isOpen={isInitiativeModalOpen}
        onClose={() => {
          setIsInitiativeModalOpen(false);
          setInitiativeToEdit(null);
        }}
        initiativeToEdit={initiativeToEdit}
        onSuccess={() => fetchData()}
      />

      {/* Modale Dettaglio Voci (Spese & Incassi) per singola Iniziativa */}
      {selectedInitiativeId && (
        <EntriesManagerModal
          initiativeId={selectedInitiativeId}
          onClose={() => setSelectedInitiativeId(null)}
          onRefreshData={fetchData}
        />
      )}

      {/* Modale Autenticazione (Senza profili demo) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
