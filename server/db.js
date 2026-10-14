const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_FILE || path.join(dataDir, 'gmg_fundraising.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Errore di connessione a SQLite:', err.message);
  } else {
    console.log(`Database SQLite connesso con successo in: ${dbPath}`);
  }
});

// Helper con Promises per un codice async/await pulito
const query = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

async function initDb() {
  // Attiva foreign keys
  await query.run('PRAGMA foreign_keys = ON;');

  // 1. Tabella Utenti
  await query.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'moderator', 'user')) DEFAULT 'user',
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Tabella Impostazioni Globali (Numero partenti, costo stimato per persona, ecc.)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      participants_count INTEGER DEFAULT 25,
      estimated_cost_per_person REAL DEFAULT 1800.00,
      target_fundraising_total REAL DEFAULT 20000.00,
      event_name TEXT DEFAULT 'GMG Seoul 2027 - Corea del Sud',
      oratory_name TEXT DEFAULT 'Oratorio Salesiano Don Bosco - Asti',
      currency TEXT DEFAULT '€',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Tabella Iniziative / Attività di raccolta
  await query.exec(`
    CREATE TABLE IF NOT EXISTS initiatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Cene & Ristoro',
      status TEXT DEFAULT 'in_corso' CHECK(status IN ('pianificata', 'in_corso', 'completata')),
      event_date TEXT,
      location TEXT DEFAULT 'Oratorio Don Bosco Asti',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 4. Tabella Voci di Spesa e Guadagno per ogni Iniziativa
  await query.exec(`
    CREATE TABLE IF NOT EXISTS initiative_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      initiative_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Generale',
      amount REAL NOT NULL CHECK(amount >= 0),
      entry_date TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 5. Tabella Log Attività
  await query.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed delle impostazioni
  const existingSettings = await query.get('SELECT * FROM settings WHERE id = 1');
  if (!existingSettings) {
    await query.run(`
      INSERT INTO settings (id, participants_count, estimated_cost_per_person, target_fundraising_total, event_name, oratory_name, currency)
      VALUES (1, 25, 1800.00, 20000.00, 'GMG Seoul 2027 - Corea del Sud', 'Oratorio Salesiano Don Bosco - Asti', '€')
    `);
    console.log('Impostazioni predefinite inizializzate.');
  }

  // Seed Utenti predefiniti
  const existingAdmin = await query.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('DonBosco2027!', salt);
    const modPass = await bcrypt.hash('DonBosco2027!', salt);
    const userPass = await bcrypt.hash('DonBosco2027!', salt);

    // Admin principale
    await query.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'approved')
    `, ['admin', 'admin@donboscoasti.it', adminPass, 'Don Marco (Parroco & Admin)']);

    // Moderatore di prova
    await query.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'moderator', 'approved')
    `, ['moderatore', 'moderatore@donboscoasti.it', modPass, 'Chiara Rossi (Animatore Staff)']);

    // Utente approvato di prova
    await query.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'user', 'approved')
    `, ['giovane', 'giovane@donboscoasti.it', userPass, 'Matteo Astesano (Partecipante GMG)']);

    // Utente in attesa di approvazione (per testare il flusso di approvazione dei moderatori)
    await query.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'user', 'pending')
    `, ['elena.b', 'elena.bianchi@email.it', userPass, 'Elena Bianchi (In attesa approvazione)']);

    console.log('Utenti di test creati con successo (admin, moderatore, giovane, elena.b). Password predefinita: DonBosco2027!');
  }

  // Seed Iniziative & Voci di spesa e guadagno (se la tabella è vuota)
  const countInit = await query.get('SELECT COUNT(*) as c FROM initiatives');
  if (countInit && countInit.c === 0) {
    const adminUser = await query.get('SELECT id FROM users WHERE username = "admin"');
    const adminId = adminUser ? adminUser.id : 1;

    // 1. Cena Solidale Coreana & Piemontese
    const r1 = await query.run(`
      INSERT INTO initiatives (title, description, category, status, event_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Cena Solidale Coreana & Piemontese',
      'Grande cena per famiglie e giovani nel salone oratorio: menu con piatti piemontesi e specialità coreane per scoprire Seoul!',
      'Cene & Ristoro',
      'completata',
      '2026-10-04',
      'Salone Don Bosco Asti',
      adminId
    ]);
    const init1Id = r1.lastID;

    // Spese cena
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Spesa macelleria carne piemontese', 'Cibo', 320.00, '2026-10-02', 'Scontrino Macelleria Centro Asti', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Ingredienti cucina coreana, riso e spezie', 'Cibo', 145.50, '2026-10-02', 'Market etnico Torino', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Acqua, bevande e vino Barbera d Asti', 'Bevande', 180.00, '2026-10-03', 'Cantina sociale & fornitore', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Tovagliato e stoviglie biodegradabili', 'Materiali', 45.00, '2026-10-03', 'Forniture oratorio', adminId]);

    // Guadagni cena
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Iscrizioni Cena - Turno Adulti (85 persone x 20€)', 'Biglietti', 1700.00, '2026-10-04', 'Incasso prevendite', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Iscrizioni Cena - Bambini e Ragazzi (40 quote x 12€)', 'Biglietti', 480.00, '2026-10-04', 'Incasso oratorio', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init1Id, 'Offerte libere e caffè / dolce a fine serata', 'Offerte', 265.00, '2026-10-04', 'Busta cassa banco bar', adminId]);

    // 2. Bancarella dei Dolci di Don Bosco
    const r2 = await query.run(`
      INSERT INTO initiatives (title, description, category, status, event_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Bancarella dei Dolci & Torte Artigianali',
      'Vendita dolci preparati da famiglie, mamme e ragazzi dopo le messe festive sul sagrato dell oratorio.',
      'Bancarelle & Mercatini',
      'completata',
      '2026-10-11',
      'Sagrato Don Bosco Asti',
      adminId
    ]);
    const init2Id = r2.lastID;

    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init2Id, 'Vassoi dorati, nastrini e sacchetti per confezionamento', 'Materiali', 55.00, '2026-10-09', 'Acquisto ingrosso cartoleria', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init2Id, 'Incasso bancarella Sabato sera (Messa prefestiva)', 'Vendita', 340.00, '2026-10-10', 'Contanti raccolti da animatori', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init2Id, 'Incasso bancarella Domenica mattina (Messe 9:00 e 11:00)', 'Vendita', 720.00, '2026-10-11', 'Tutto esaurito!', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init2Id, 'Offerte pomeridiane giochi oratorio', 'Offerte', 190.00, '2026-10-11', 'Bancone cortile', adminId]);

    // 3. Torneo di Calcetto & Pallavolo "Road to Seoul"
    const r3 = await query.run(`
      INSERT INTO initiatives (title, description, category, status, event_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Torneo Giovanile di Calcio a 5 & Green Volley',
      'Torneo di 2 giorni aperto a giovani e adulti con chiosco piadine e bibite.',
      'Eventi & Tornei',
      'in_corso',
      '2026-10-25',
      'Campi Sportivi Don Bosco Asti',
      adminId
    ]);
    const init3Id = r3.lastID;

    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init3Id, 'Coppe, targhe e medaglie ricordo per premiazione', 'Materiali', 140.00, '2026-10-12', 'Premiazioni Asti Sport', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init3Id, 'Fornitura pane, affettati e bibite per chiosco', 'Cibo', 160.00, '2026-10-13', 'Acquisto all ingrosso', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init3Id, 'Quota iscrizione 10 squadre calcio a 5 (70€ a squadra)', 'Iscrizioni', 700.00, '2026-10-13', 'Bonifici e quote capitani', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init3Id, 'Quota iscrizione 8 squadre pallavolo (50€ a squadra)', 'Iscrizioni', 400.00, '2026-10-13', 'Quote versate', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init3Id, 'Acconto sponsor locale "Banca & Commercianti Asti"', 'Sponsor', 350.00, '2026-10-14', 'Donazione a sostegno dei giovani', adminId]);

    // 4. Lavaggio Auto Volontario nel Piazzale dell'Oratorio
    const r4 = await query.run(`
      INSERT INTO initiatives (title, description, category, status, event_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Lavaggio Auto Volontario "I Giovani per la GMG"',
      'I giovani partenti lavano gli interni e gli esterni delle auto dei parrocchiani a offerta libera.',
      'Servizi Volontari',
      'completata',
      '2026-09-27',
      'Piazzale Oratorio Don Bosco Asti',
      adminId
    ]);
    const init4Id = r4.lastID;

    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init4Id, 'Shampoo auto biodegradabile, spugne e panni daino', 'Materiali', 48.00, '2026-09-25', 'Brico Asti', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init4Id, 'Offerte libere per 46 auto lavate con successo', 'Offerte', 620.00, '2026-09-27', 'Media circa 13.50€ a vettura', adminId]);

    // 5. Lotteria Natalizia GMG Korea
    const r5 = await query.run(`
      INSERT INTO initiatives (title, description, category, status, event_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Grande Lotteria Solidale GMG Seoul 2027',
      'Vendita biglietti con 10 ricchi premi donati dalle botteghe di Asti e grande cesto natalizio.',
      'Lotterie',
      'pianificata',
      '2026-12-20',
      'Oratorio Don Bosco Asti',
      adminId
    ]);
    const init5Id = r5.lastID;

    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'expense', ?, ?, ?, ?, ?, ?)`,
      [init5Id, 'Stampa 1000 biglietti numerati a matrice', 'Materiali', 75.00, '2026-10-10', 'Tipografia Asti', adminId]);
    await query.run(`INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by) VALUES (?, 'income', ?, ?, ?, ?, ?, ?)`,
      [init5Id, 'Primi 30 blocchetti venduti dagli animatori (300 biglietti x 2.50€)', 'Vendita', 750.00, '2026-10-14', 'Inizio prevendita', adminId]);

    console.log('Iniziative e voci di prova inserite con successo.');
  }
}

module.exports = {
  db,
  query,
  initDb
};
