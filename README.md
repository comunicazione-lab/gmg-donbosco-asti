# 🇰🇷 Portale Raccolta Fondi GMG Seoul 2027 • Oratorio Don Bosco Asti

Applicazione web full-stack moderna e responsive per il controllo trasparente e la gestione della raccolta fondi della **Giornata Mondiale della Gioventù (GMG) Seoul 2027 (Corea del Sud)** per la comunità dell'**Oratorio Salesiano Don Bosco di Asti**.

---

## ✨ Funzionalità Principali

### 👥 1. Gestione Accessi & Ruoli (RBAC)
- **Utenti (Pellegrini & Famiglie)**: Possono registrarsi in autonomia. Le nuove registrazioni rimangono nello stato *"In attesa di approvazione"* finché non vengono convalidate da un moderatore o dall'amministratore. Possono consultare la dashboard, tutte le iniziative e lo sconto attuale.
- **Moderatori (Animatori & Educatori)**:
  - Possono approvare o rifiutare le richieste di iscrizione degli utenti.
  - Possono inserire nuove iniziative di raccolta fondi.
  - Possono registrare e modificare **voci multiple di spesa (uscite)** e **voci di guadagno (entrate)** per ciascuna attività.
- **Amministratore (Don Bosco Staff / Don Marco)**:
  - Tutti i permessi completi.
  - Può creare direttamente nuovi utenti assegnando ruoli specifici (già attivi).
  - Può cambiare i ruoli degli utenti, reimpostare password ed eliminare account.
  - Può **configurare il numero ufficiale dei ragazzi partenti** (es. 20 o 25 ragazzi) e il costo stimato del viaggio: la dashboard ricalcola all'istante lo **sconto attuale per persona**!
  - Esportazione e backup completo dei dati in formato JSON.

---

### 💰 2. Gestione Analitica Iniziative & Voci Multiple
Ogni attività di raccolta fondi (es. *Cena Solidale Coreana & Piemontese*, *Bancarella dei Dolci di Natale*, *Torneo di Calcetto & Volley*, *Lotteria Pasquale*, *Lavaggio Auto*) supporta una suddivisione analitica:
- **Voci di Spesa (-)**: macelleria, ingredienti etnici, bevande, noleggio fari e microfoni, stoviglie biodegradabili, materiale promozionale, ecc.
- **Voci di Guadagno (+)**: prevendite adulti, quote ragazzi, offerte libere bar, vendita bancarella giorno 1, vendita giorno 2, iscrizioni squadre, acconto sponsor locali, ecc.
- **Calcolo Automatico**: Il portale calcola all'istante il totale entrate, il totale spese, il **profitto netto** e la percentuale di margine per ogni singola attività.

---

### 🎯 3. Dashboard con Calcolo Sconto per Partecipante
- **Sconto Attuale per Persona**: Evidenziato al centro della dashboard con grafica d'impatto (`Fondo Netto Raccolto / Numero Partenti`).
- **Quota Residua Stimata**: Calcola quanto rimane da pagare per ciascun ragazzo rispetto al costo stimato del viaggio.
- **Simulatore Interattivo Sconto**: Permette a chiunque di variare il numero dei ragazzi partenti o simulare future entrate per vedere in tempo reale come cambierà lo sconto individuale.
- **Grafici Finanziari**:
  - Ripartizione dell'utile e delle entrate per categoria (Cene, Tornei, Bancarelle, Lotterie, Servizi).
  - Grafico circolare di efficienza: rapporto percentuale tra utile netto trattenuto e spese vive sostenute.

---

### 🎨 4. Design & Grafica
- Realizzato interamente con **Vanilla CSS moderno** (zero dipendenze CSS pesanti), con tema ispirato ai colori salesiani e alla Corea del Sud (rosso coraggio, blu Don Bosco, verde profitto, accenti oro e cielo).
- Supporto completo per **Dark Mode** e **Light Mode** con toggle in tempo reale nella barra di navigazione.
- Micro-animazioni, badge di stato, pillole di notifica per gli utenti in attesa, finestre modali fluide.

---

## 🛠️ Stack Tecnologico

- **Frontend**: React 18, Vite 4, Vanilla CSS Design System, Lucide Icons.
- **Backend**: Node.js, Express, SQLite3 (database relazionale compatto e portabile).
- **Autenticazione**: JSON Web Token (JWT), password hashing con Bcrypt.js.
- **Deploy**: Predisposto per GitHub e pubblicazione istantanea su **Render** (`render.yaml`).

---

## 🚀 Avvio Rapido Locale

### Prerequisiti
- Node.js (v16 o superiore)
- npm

### 1. Installazione Dipendenze
```bash
# Dipendenze backend
npm install

# Dipendenze frontend
npm --prefix client install
```

### 2. Compilazione e Avvio
```bash
# Compila il frontend
npm run build

# Avvia l'applicazione fullstack (porta predefinita: 3001)
npm start
```

Apri il browser su [http://localhost:3001](http://localhost:3001).

---

## 🔑 Credenziali di Test Predefinite

| Username | Password | Ruolo | Note |
| :--- | :--- | :--- | :--- |
| `admin` | `DonBosco2027!` | Amministratore | Don Marco (Parroco & Admin) |
| `moderatore` | `DonBosco2027!` | Moderatore | Chiara Rossi (Animatore Staff) |
| `giovane` | `DonBosco2027!` | Utente | Matteo Astesano (Pellegrino GMG) |

Per una prova immediata, la finestra di login include anche i pulsanti di **Accesso Rapido con 1 click**!

---

## 🌐 Pubblicazione su Render e GitHub
Per la procedura dettagliata di caricamento su GitHub e rilascio su Render, consulta la guida:
👉 [**DEPLOY_RENDER.md**](file:///Users/Leonardo/Downloads/gmg-db/DEPLOY_RENDER.md)
