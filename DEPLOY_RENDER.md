# 🚀 Guida al Caricamento su GitHub e Pubblicazione su Render

Questa guida ti accompagna passo dopo passo nella pubblicazione del portale di raccolta fondi **GMG Seoul 2027 • Oratorio Don Bosco Asti**.

---

## 📦 PARTE 1: Caricamento del Progetto su GitHub

Se non hai ancora un repository GitHub per questo progetto, segui questi passaggi dal tuo terminale:

### 1. Crea un nuovo repository su GitHub
1. Vai su [github.com/new](https://github.com/new).
2. Assegna un nome al repository (es. `gmg-donbosco-asti`).
3. Scegli se renderlo **Pubblico** o **Privato**.
4. **Non** selezionare "Initialize with a README" (è già presente nel progetto).
5. Clicca su **Create repository**.

### 2. Inizializza Git e invia il codice
Apri il terminale nella cartella del progetto (`/Users/Leonardo/Downloads/gmg-db`) ed esegui:

```bash
# Inizializza il repository locale (se non già fatto)
git init

# Aggiungi tutti i file al commit
git add .

# Registra il commit iniziale
git commit -m "feat: rilascio iniziale portale raccolta fondi GMG Seoul 2027 Don Bosco Asti"

# Imposta il branch principale su main
git branch -M main

# Collega il tuo repository GitHub (sostituisci USERNAME e REPO con i tuoi dati)
git remote add origin https://github.com/TUO_USERNAME/gmg-donbosco-asti.git

# Invia il codice su GitHub
git push -u origin main
```

---

## 🌐 PARTE 2: Pubblicazione Gratuita su Render

Render ([render.com](https://render.com)) offre un piano gratuito ideale per ospitare applicazioni Node.js.

### Metodo Rapido (Consigliato): Render Blueprint
Il progetto include già il file `render.yaml` preconfigurato.

1. Accedi alla tua dashboard su [dashboard.render.com](https://dashboard.render.com).
2. Clicca sul pulsante **New +** in alto a destra e seleziona **Blueprint**.
3. Collega il tuo account GitHub e seleziona il repository appena creato (`gmg-donbosco-asti`).
4. Render leggerà automaticamente il file `render.yaml`:
   - **Name**: `gmg-donbosco-asti`
   - **Runtime**: `Node`
   - **Region**: `Frankfurt (EU)` (ottima velocità per l'Italia)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Clicca su **Apply**. In circa 2-3 minuti il tuo portale sarà online con un URL pubblico HTTPS tipo:
   `https://gmg-donbosco-asti.onrender.com`.

---

### Metodo Alternativo: Creazione Manuale "Web Service"
Se preferisci configurare manualmente il servizio:

1. Dalla dashboard di Render, clicca su **New +** > **Web Service**.
2. Connetti il tuo repository GitHub.
3. Compila i campi come segue:
   - **Name**: `gmg-donbosco-asti`
   - **Region**: `Frankfurt (EU)`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Nella sezione **Advanced** > **Environment Variables**, aggiungi:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = una stringa casuale lunga e sicura (es. `mia_chiave_segreta_gmg_donbosco_asti_2027`)
5. Clicca su **Create Web Service**.

---

## 🔑 Account e Credenziali Predefinite

Al primo avvio, il portale crea automaticamente un database SQLite già popolato con attività realistiche e tre account di test:

| Ruolo | Username | Password | Nome Utente | Permessi |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `DonBosco2027!` | Don Marco (Parroco) | Accesso completo, creazione utenti, modifica partenti e quote |
| **Moderatore** | `moderatore` | `DonBosco2027!` | Chiara Rossi (Animatore) | Creazione iniziative, aggiunta/modifica voci di spesa e guadagno, approvazione nuovi utenti |
| **Utente GMG** | `giovane` | `DonBosco2027!` | Matteo Astesano (Pellegrino) | Consultazione trasparente dashboard, iniziative e calcolo sconto |

> [!TIP]
> **Sicurezza per la Produzione:** Una volta pubblicato online, accedi come `admin` e modifica la password predefinita dal pannello profilo oppure crea il tuo account personale promuovendolo ad Admin.

---

## 💾 Persistenza Dati su Render
- Sul piano Free di Render, i file locali possono essere ripristinati durante i redeploy.
- Dal portale, come **Admin**, hai a disposizione il pulsante **"Scarica JSON"** nelle Impostazioni per scaricare con 1 click l'intero backup di utenti, attività e voci registrate.
- Se desideri una persistenza permanente sul cloud, Render permette di aggiungere un **Persistent Disk** (nella cartella `/data`) con 1 click dal pannello di configurazione del servizio.
