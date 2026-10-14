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

### 🎯 3. Organizzazione in Sezioni
- **Dashboard**:
  - Banner di benvenuto salesiano *"In Cammino verso Seoul 2027"*.
  - **Sconto Attuale per Persona**: Evidenziato al centro con grafica d'impatto (`Fondo Netto Raccolto / Numero Partenti`).
  - **Quota Residua Stimata**: Calcola quanto rimane da pagare per ciascun ragazzo rispetto al costo stimato del viaggio.
  - **Simulatore Interattivo Sconto**: Permette di variare il numero dei ragazzi partenti o simulare future entrate per vedere in tempo reale come cambierà lo sconto individuale.
  - **Grafici Finanziari**: Ripartizione dell'utile e delle entrate per categoria ed efficienza entrate/spese.
- **Raccolta Fondi**:
  - In cima alla scheda sono posizionate le 4 card di riepilogo complessivo: **Fondo Netto Raccolto**, **Totale Entrate Lorde**, **Totale Spese Sostenute** e **Iniziative Totali**.
  - Filtri per stato, categoria e ricerca rapida con lista analitica di tutte le attività.
- **Impostazioni & Approvazioni**:
  - **Parametri Ufficiali & Calcolo Quote GMG**: Visibili e modificabili **esclusivamente dall'Amministratore**. Utenti e moderatori non possono visualizzare né modificare questi parametri.
  - **Gestione Utenti & Approvazione Iscrizioni**: Accessibile a moderatori e amministratori per convalidare le nuove richieste di iscrizione.

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
- **Deploy**: Predisposto per GitHub e pubblicazione istantanea su **Render** (`Dockerfile`).

---

## 🔄 Sincronizzazione Dati Live Render (Protezione Dati)
Per garantire che nessun dato registrato o modificato online su Render vada perso durante un nuovo rilascio:
1. Prima di ogni `git push`, lo script scarica automaticamente l'ultimo backup JSON da `https://gmg-db-asti.onrender.com/api/settings/export-data` e lo salva in `data/live_render_backup.json`.
2. È attivo un **Git Pre-Push Hook** automatico in `.git/hooks/pre-push` che esegue la sincronizzazione preventiva.
3. È disponibile il comando rapido unificato:
```bash
npm run deploy
```
che esegue in sequenza: sincronizzazione dati live Render -> build frontend -> commit con backup aggiornato -> push su GitHub.

---

## 🔑 Credenziali di Test Predefinite

| Username | Password | Ruolo | Note |
| :--- | :--- | :--- | :--- |
| `admin` | `DonBosco2027!` | Amministratore | Don Marco (Parroco & Admin) |
| `moderatore` | `DonBosco2027!` | Moderatore | Chiara Rossi (Animatore Staff) |
| `giovane` | `DonBosco2027!` | Utente | Matteo Astesano (Pellegrino GMG) |
