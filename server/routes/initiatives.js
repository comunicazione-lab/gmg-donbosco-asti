const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, requireModerator } = require('../middleware/auth');

// Helper per calcolare statistiche di una iniziativa
async function getInitiativeWithTotals(initiativeId) {
  const init = await query.get(`
    SELECT i.*, u.full_name as author_name
    FROM initiatives i
    LEFT JOIN users u ON i.created_by = u.id
    WHERE i.id = ?
  `, [initiativeId]);

  if (!init) return null;

  const entries = await query.all(`
    SELECT e.*, u.full_name as created_by_name
    FROM initiative_entries e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.initiative_id = ?
    ORDER BY e.entry_date DESC, e.id DESC
  `, [initiativeId]);

  let total_income = 0;
  let total_expense = 0;

  for (const entry of entries) {
    if (entry.type === 'income') {
      total_income += Number(entry.amount);
    } else if (entry.type === 'expense') {
      total_expense += Number(entry.amount);
    }
  }

  const net_profit = total_income - total_expense;

  return {
    ...init,
    entries,
    total_income: Math.round(total_income * 100) / 100,
    total_expense: Math.round(total_expense * 100) / 100,
    net_profit: Math.round(net_profit * 100) / 100,
    entries_count: entries.length
  };
}

// Lista di tutte le iniziative con totali calcolati
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let sql = `
      SELECT
        i.*,
        u.full_name as author_name,
        COALESCE(SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) as total_expense,
        COUNT(e.id) as entries_count
      FROM initiatives i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN initiative_entries e ON i.id = e.initiative_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND i.category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (LOWER(i.title) LIKE ? OR LOWER(i.description) LIKE ? OR LOWER(i.location) LIKE ?)';
      const s = `%${search.toLowerCase().trim()}%`;
      params.push(s, s, s);
    }

    sql += ' GROUP BY i.id ORDER BY i.event_date DESC, i.id DESC';

    const rawInitiatives = await query.all(sql, params);

    const initiatives = rawInitiatives.map((item) => {
      const total_income = Math.round(Number(item.total_income) * 100) / 100;
      const total_expense = Math.round(Number(item.total_expense) * 100) / 100;
      const net_profit = Math.round((total_income - total_expense) * 100) / 100;
      return {
        ...item,
        total_income,
        total_expense,
        net_profit
      };
    });

    res.json({ initiatives });
  } catch (err) {
    console.error('Errore recupero iniziative:', err);
    res.status(500).json({ error: 'Errore nel recupero delle iniziative.' });
  }
});

// Dettaglio singola iniziativa con tutte le voci
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const initiativeId = parseInt(req.params.id, 10);
    const initiative = await getInitiativeWithTotals(initiativeId);

    if (!initiative) {
      return res.status(404).json({ error: 'Iniziativa non trovata.' });
    }

    res.json({ initiative });
  } catch (err) {
    console.error('Errore recupero dettaglio iniziativa:', err);
    res.status(500).json({ error: 'Errore nel recupero dell\'iniziativa.' });
  }
});

// Creazione iniziativa (Moderatori e Admin)
router.post('/', requireAuth, requireModerator, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status,
      event_date,
      location,
      initial_entries // Voci opzionali inserite contestualmente
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Il titolo dell\'iniziativa è obbligatorio.' });
    }

    const result = await query.run(`
      INSERT INTO initiatives (title, description, category, status, event_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description ? description.trim() : '',
      category || 'Cene & Ristoro',
      status || 'in_corso',
      event_date || new Date().toISOString().split('T')[0],
      location ? location.trim() : 'Oratorio Don Bosco Asti',
      req.user.id
    ]);

    const newId = result.lastID;

    // Se l'utente ha inserito subito voci di spesa o guadagno
    if (Array.isArray(initial_entries) && initial_entries.length > 0) {
      for (const entry of initial_entries) {
        if (entry.title && !isNaN(entry.amount) && Number(entry.amount) >= 0) {
          await query.run(`
            INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            newId,
            entry.type === 'expense' ? 'expense' : 'income',
            entry.title.trim(),
            entry.category || 'Generale',
            Math.round(Number(entry.amount) * 100) / 100,
            entry.entry_date || new Date().toISOString().split('T')[0],
            entry.notes ? entry.notes.trim() : '',
            req.user.id
          ]);
        }
      }
    }

    // Log azione
    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'CREAZIONE_INIZIATIVA', ?)
    `, [req.user.id, req.user.full_name, `Creata iniziativa "${title.trim()}"`]);

    const completeInitiative = await getInitiativeWithTotals(newId);
    res.status(201).json({
      success: true,
      message: 'Iniziativa creata con successo!',
      initiative: completeInitiative
    });
  } catch (err) {
    console.error('Errore creazione iniziativa:', err);
    res.status(500).json({ error: 'Errore durante la creazione dell\'iniziativa.' });
  }
});

// Modifica iniziativa (Moderatori e Admin)
router.put('/:id', requireAuth, requireModerator, async (req, res) => {
  try {
    const initiativeId = parseInt(req.params.id, 10);
    const { title, description, category, status, event_date, location } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Il titolo è obbligatorio.' });
    }

    const existing = await query.get('SELECT id FROM initiatives WHERE id = ?', [initiativeId]);
    if (!existing) {
      return res.status(404).json({ error: 'Iniziativa non trovata.' });
    }

    await query.run(`
      UPDATE initiatives
      SET title = ?, description = ?, category = ?, status = ?, event_date = ?, location = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title.trim(),
      description ? description.trim() : '',
      category || 'Cene & Ristoro',
      status || 'in_corso',
      event_date || null,
      location || '',
      initiativeId
    ]);

    const updated = await getInitiativeWithTotals(initiativeId);
    res.json({ success: true, message: 'Iniziativa aggiornata con successo!', initiative: updated });
  } catch (err) {
    console.error('Errore modifica iniziativa:', err);
    res.status(500).json({ error: 'Errore durante la modifica dell\'iniziativa.' });
  }
});

// Eliminazione iniziativa (Moderatori e Admin)
router.delete('/:id', requireAuth, requireModerator, async (req, res) => {
  try {
    const initiativeId = parseInt(req.params.id, 10);
    const existing = await query.get('SELECT title FROM initiatives WHERE id = ?', [initiativeId]);

    if (!existing) {
      return res.status(404).json({ error: 'Iniziativa non trovata.' });
    }

    // Le entries collegate verranno eliminate tramite CASCADE (o pulizia manuale)
    await query.run('DELETE FROM initiative_entries WHERE initiative_id = ?', [initiativeId]);
    await query.run('DELETE FROM initiatives WHERE id = ?', [initiativeId]);

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'ELIMINAZIONE_INIZIATIVA', ?)
    `, [req.user.id, req.user.full_name, `Eliminata iniziativa "${existing.title}"`]);

    res.json({ success: true, message: 'Iniziativa e relative voci eliminate.' });
  } catch (err) {
    console.error('Errore eliminazione iniziativa:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione.' });
  }
});

// --- GESTIONE VOCI SINGOLE (ENTRIES) ---

// Aggiungi voce di spesa o guadagno a un'iniziativa (Moderatori e Admin)
router.post('/:id/entries', requireAuth, requireModerator, async (req, res) => {
  try {
    const initiativeId = parseInt(req.params.id, 10);
    const { type, title, category, amount, entry_date, notes } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Il tipo di voce deve essere "income" (guadagno) o "expense" (spesa).' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'La descrizione/titolo della voce è obbligatoria.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'L\'importo deve essere un numero positivo maggiore di 0.' });
    }

    const initiative = await query.get('SELECT id, title FROM initiatives WHERE id = ?', [initiativeId]);
    if (!initiative) {
      return res.status(404).json({ error: 'Iniziativa non trovata.' });
    }

    const result = await query.run(`
      INSERT INTO initiative_entries (initiative_id, type, title, category, amount, entry_date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      initiativeId,
      type,
      title.trim(),
      category || 'Generale',
      Math.round(numAmount * 100) / 100,
      entry_date || new Date().toISOString().split('T')[0],
      notes ? notes.trim() : '',
      req.user.id
    ]);

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'AGGIUNTA_VOCE', ?)
    `, [
      req.user.id,
      req.user.full_name,
      `Aggiunta voce ${type === 'income' ? 'guadagno' : 'spesa'} di €${numAmount.toFixed(2)} ("${title}") per "${initiative.title}"`
    ]);

    const updatedInitiative = await getInitiativeWithTotals(initiativeId);
    res.status(201).json({
      success: true,
      message: `Voce di ${type === 'income' ? 'guadagno' : 'spesa'} aggiunta con successo!`,
      entryId: result.lastID,
      initiative: updatedInitiative
    });
  } catch (err) {
    console.error('Errore aggiunta voce:', err);
    res.status(500).json({ error: 'Errore durante l\'aggiunta della voce.' });
  }
});

// Modifica singola voce (Moderatori e Admin)
router.put('/:id/entries/:entryId', requireAuth, requireModerator, async (req, res) => {
  try {
    const initiativeId = parseInt(req.params.id, 10);
    const entryId = parseInt(req.params.entryId, 10);
    const { type, title, category, amount, entry_date, notes } = req.body;

    const existingEntry = await query.get(
      'SELECT * FROM initiative_entries WHERE id = ? AND initiative_id = ?',
      [entryId, initiativeId]
    );

    if (!existingEntry) {
      return res.status(404).json({ error: 'Voce non trovata.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'L\'importo deve essere maggiore di 0.' });
    }

    await query.run(`
      UPDATE initiative_entries
      SET type = ?, title = ?, category = ?, amount = ?, entry_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      type || existingEntry.type,
      title ? title.trim() : existingEntry.title,
      category || existingEntry.category,
      Math.round(numAmount * 100) / 100,
      entry_date || existingEntry.entry_date,
      notes !== undefined ? notes.trim() : existingEntry.notes,
      entryId
    ]);

    const updatedInitiative = await getInitiativeWithTotals(initiativeId);
    res.json({
      success: true,
      message: 'Voce aggiornata con successo!',
      initiative: updatedInitiative
    });
  } catch (err) {
    console.error('Errore modifica voce:', err);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento della voce.' });
  }
});

// Elimina singola voce (Moderatori e Admin)
router.delete('/:id/entries/:entryId', requireAuth, requireModerator, async (req, res) => {
  try {
    const initiativeId = parseInt(req.params.id, 10);
    const entryId = parseInt(req.params.entryId, 10);

    const existingEntry = await query.get(
      'SELECT * FROM initiative_entries WHERE id = ? AND initiative_id = ?',
      [entryId, initiativeId]
    );

    if (!existingEntry) {
      return res.status(404).json({ error: 'Voce non trovata.' });
    }

    await query.run('DELETE FROM initiative_entries WHERE id = ?', [entryId]);

    const updatedInitiative = await getInitiativeWithTotals(initiativeId);
    res.json({
      success: true,
      message: 'Voce eliminata con successo!',
      initiative: updatedInitiative
    });
  } catch (err) {
    console.error('Errore cancellazione voce:', err);
    res.status(500).json({ error: 'Errore durante la rimozione della voce.' });
  }
});

module.exports = router;
