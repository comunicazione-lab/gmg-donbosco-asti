const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Recupera metriche globali per la Dashboard (Accessibile a tutti gli utenti loggati)
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const settings = await query.get('SELECT * FROM settings WHERE id = 1');
    const participantsCount = settings ? (settings.participants_count || 1) : 25;
    const estimatedCost = settings ? (settings.estimated_cost_per_person || 1800) : 1800;
    const targetTotal = settings ? (settings.target_fundraising_total || 20000) : 20000;

    // Totali complessivi da tutte le voci
    const totals = await query.get(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(id) as total_entries_count
      FROM initiative_entries
    `);

    const totalIncome = Math.round(Number(totals.total_income) * 100) / 100;
    const totalExpense = Math.round(Number(totals.total_expense) * 100) / 100;
    const netProfit = Math.round((totalIncome - totalExpense) * 100) / 100;

    // Calcolo dello sconto / quota per partecipante
    // Richiesta: "admin può selezionare il numero dei partenti e quindi nella dashboard fa vedere il guadagno (ovvero lo sconto) che ogni persona avrà"
    const discountPerParticipant = participantsCount > 0 ? Math.round((netProfit / participantsCount) * 100) / 100 : 0;
    const remainingCostPerParticipant = Math.max(0, Math.round((estimatedCost - discountPerParticipant) * 100) / 100);
    const discountPercent = estimatedCost > 0 ? Math.min(100, Math.round((discountPerParticipant / estimatedCost) * 1000) / 10) : 0;
    const targetPercent = targetTotal > 0 ? Math.min(100, Math.round((netProfit / targetTotal) * 1000) / 10) : 0;

    // Conteggio iniziative per stato
    const countStats = await query.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completata' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_corso' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'pianificata' THEN 1 ELSE 0 END) as planned
      FROM initiatives
    `);

    // Ripartizione per categoria di iniziativa
    const categoryStats = await query.all(`
      SELECT
        i.category,
        COALESCE(SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) as expense
      FROM initiatives i
      LEFT JOIN initiative_entries e ON i.id = e.initiative_id
      GROUP BY i.category
      ORDER BY income DESC
    `);

    // Ultime 5 voci registrate
    const recentEntries = await query.all(`
      SELECT
        e.id, e.title, e.amount, e.type, e.category, e.entry_date,
        i.title as initiative_title, i.id as initiative_id,
        u.full_name as author_name
      FROM initiative_entries e
      JOIN initiatives i ON e.initiative_id = i.id
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.entry_date DESC, e.id DESC
      LIMIT 8
    `);

    // Ultime attività di log
    const recentActivities = await query.all(`
      SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 6
    `);

    res.json({
      settings,
      metrics: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: netProfit,
        participants_count: participantsCount,
        estimated_cost_per_person: estimatedCost,
        target_fundraising_total: targetTotal,
        discount_per_participant: discountPerParticipant,
        remaining_cost_per_participant: remainingCostPerParticipant,
        discount_percent: discountPercent,
        target_percent: targetPercent,
        initiatives_count: countStats.total || 0,
        completed_count: countStats.completed || 0,
        in_progress_count: countStats.in_progress || 0,
        planned_count: countStats.planned || 0,
        total_entries_count: totals.total_entries_count || 0
      },
      category_breakdown: categoryStats.map((c) => ({
        category: c.category,
        income: Math.round(Number(c.income) * 100) / 100,
        expense: Math.round(Number(c.expense) * 100) / 100,
        profit: Math.round((Number(c.income) - Number(c.expense)) * 100) / 100
      })),
      recent_entries: recentEntries,
      recent_activities: recentActivities
    });
  } catch (err) {
    console.error('Errore recupero dashboard:', err);
    res.status(500).json({ error: 'Errore durante il calcolo dei dati della dashboard.' });
  }
});

// Modifica impostazioni globali (Numero partenti, costi stimati) - SOLO ADMIN
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      participants_count,
      estimated_cost_per_person,
      target_fundraising_total,
      event_name,
      oratory_name,
      currency
    } = req.body;

    const participants = parseInt(participants_count, 10);
    if (isNaN(participants) || participants < 1) {
      return res.status(400).json({ error: 'Il numero di partenti deve essere almeno 1.' });
    }

    const costPerPerson = parseFloat(estimated_cost_per_person);
    const targetFund = parseFloat(target_fundraising_total);

    await query.run(`
      UPDATE settings
      SET participants_count = ?,
          estimated_cost_per_person = ?,
          target_fundraising_total = ?,
          event_name = ?,
          oratory_name = ?,
          currency = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [
      participants,
      isNaN(costPerPerson) ? 1800 : costPerPerson,
      isNaN(targetFund) ? 20000 : targetFund,
      event_name ? event_name.trim() : 'GMG Seoul 2027 - Corea del Sud',
      oratory_name ? oratory_name.trim() : 'Oratorio Salesiano Don Bosco - Asti',
      currency || '€'
    ]);

    await query.run(`
      INSERT INTO activity_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'MODIFICA_IMPOSTAZIONI', ?)
    `, [
      req.user.id,
      req.user.full_name,
      `Numero partenti aggiornato a ${participants} (Costo stimato: €${costPerPerson || 1800})`
    ]);

    const updatedSettings = await query.get('SELECT * FROM settings WHERE id = 1');
    res.json({
      success: true,
      message: 'Impostazioni aggiornate con successo! La quota sconto per persona è stata ricalcolata.',
      settings: updatedSettings
    });
  } catch (err) {
    console.error('Errore salvataggio impostazioni:', err);
    res.status(500).json({ error: 'Errore durante il salvataggio delle impostazioni.' });
  }
});

// Esportazione dati in formato JSON per backup
router.get('/export-data', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settings = await query.get('SELECT * FROM settings WHERE id = 1');
    const initiatives = await query.all('SELECT * FROM initiatives ORDER BY id');
    const entries = await query.all('SELECT * FROM initiative_entries ORDER BY id');
    const users = await query.all('SELECT id, username, email, full_name, role, status, created_at FROM users');

    const exportPayload = {
      export_date: new Date().toISOString(),
      oratory: settings ? settings.oratory_name : 'Oratorio Don Bosco Asti',
      event: settings ? settings.event_name : 'GMG Korea 2027',
      settings,
      initiatives,
      entries,
      users
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="backup-gmg-asti.json"');
    res.json(exportPayload);
  } catch (err) {
    res.status(500).json({ error: 'Errore esportazione dati.' });
  }
});

module.exports = router;
