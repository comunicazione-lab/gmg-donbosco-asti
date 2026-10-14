require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware globali
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging sintetico richieste
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint (utile per Render health check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'GMG Seoul 2027 - Oratorio Don Bosco Asti',
    timestamp: new Date().toISOString()
  });
});

// Registrazione Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/initiatives', require('./routes/initiatives'));
app.use('/api/settings', require('./routes/settings'));

// Servizio frontend in produzione o se client/dist esiste
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  console.log('Serving frontend static assets from client/dist');
  app.use(express.static(clientDist));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint API non trovato' });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // In development, se client/dist non è ancora buildato
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>GMG 2027 Oratorio Don Bosco Asti - Server API</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0b1120; color: #f8fafc; padding: 40px; text-align: center; }
          .card { max-width: 600px; margin: 40px auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; }
          h1 { color: #38bdf8; }
          p { color: #94a3b8; line-height: 1.6; }
          code { background: #0f172a; padding: 4px 8px; border-radius: 6px; color: #f43f5e; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>GMG Seoul 2027 - Don Bosco Asti</h1>
          <p>Il server backend è attivo su porta <b>${PORT}</b>!</p>
          <p>Per avviare la visualizzazione grafica, esegui il frontend con: <code>cd client && npm run dev</code> oppure esegui <code>npm run build</code> per compilare il bundle per la produzione.</p>
        </div>
      </body>
      </html>
    `);
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Errore non gestito:', err);
  res.status(500).json({ error: 'Errore interno del server', message: err.message });
});

// Inizializza il database e avvia il server
initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 Portale GMG Seoul 2027 - Oratorio Don Bosco Asti`);
      console.log(`📡 Server avviato con successo su http://localhost:${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('Impossibile inizializzare il database SQLite:', err);
    process.exit(1);
  });
