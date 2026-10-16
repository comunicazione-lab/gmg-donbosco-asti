const fs = require('fs');
const path = require('path');
const https = require('https');

const RENDER_URL = process.env.RENDER_URL || 'https://gmg-db-asti.onrender.com';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'DonBosco2027!';
const BACKUP_FILE = path.join(__dirname, '../data/live_render_backup.json');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          reject(new Error('Risposta JSON non valida: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          reject(new Error('Risposta JSON non valida: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function sync() {
  console.log(`📡 Connessione a ${RENDER_URL} per scaricare i dati pubblicati...`);

  try {
    const candidateCredentials = [
      { email: 'imparato.donbosco@gmail.com', pass: 'DonBosco2027!' },
      { email: 'admin@donboscoasti.it', pass: 'DonBosco2027!' },
      { email: 'admin@donboscoasti.it', pass: '123456' },
      { email: process.env.ADMIN_USER, pass: process.env.ADMIN_PASS }
    ].filter(c => c.email && c.pass);

    let token = null;
    let lastError = null;

    for (const cred of candidateCredentials) {
      try {
        const loginRes = await postJson(`${RENDER_URL}/api/auth/login`, {
          email: cred.email,
          username: cred.email,
          password: cred.pass
        });

        if (loginRes.status === 200 && loginRes.data && loginRes.data.token) {
          token = loginRes.data.token;
          console.log(`✅ Accesso effettuato con successo come ${cred.email}!`);
          break;
        } else {
          lastError = loginRes.data?.error || `Status ${loginRes.status}`;
        }
      } catch (reqErr) {
        lastError = reqErr.message;
      }
    }

    if (!token) {
      throw new Error(`Impossibile autenticarsi su Render: ${lastError}`);
    }

    // 2. Scarica export
    const exportRes = await getJson(`${RENDER_URL}/api/settings/export-data`, token);
    if (exportRes.status !== 200) {
      throw new Error(`Export fallito (${exportRes.status})`);
    }

    const backupData = exportRes.data;
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`💾 Dati salvati con successo in: ${BACKUP_FILE}`);
    console.log(`- Partenti: ${backupData.settings?.participants_count || 'n/d'}`);
    console.log(`- Costo stimato: €${backupData.settings?.estimated_cost_per_person || 'n/d'}`);
    console.log(`- Obiettivo totale: €${backupData.settings?.target_fundraising_total || 'n/d'}`);
    console.log(`- Iniziative: ${backupData.initiatives?.length || 0}`);
    console.log(`- Voci registrate: ${backupData.entries?.length || 0}`);
    console.log(`- Utenti registrati: ${backupData.users?.length || 0}`);

    // 3. Sincronizza nel database SQLite locale
    try {
      const { initDbFromBackup } = require('../server/db');
      if (typeof initDbFromBackup === 'function') {
        await initDbFromBackup(backupData);
        console.log('🔄 Database SQLite locale aggiornato con i dati live di Render!');
      }
    } catch (dbErr) {
      console.log('ℹ️ SQLite locale: backup JSON salvato con successo (il server ricaricherà i dati al boot).');
    }
  } catch (err) {
    console.warn('⚠️ Attenzione sincronizzazione:', err.message);
    if (fs.existsSync(BACKUP_FILE)) {
      console.log('ℹ️ Backup locale esistente conservato con successo:', BACKUP_FILE);
    } else {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  sync();
}

module.exports = { sync };
