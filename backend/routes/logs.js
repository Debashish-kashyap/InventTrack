const express = require('express');
const router = express.Router();
const { queryAll, execute } = require('../db');

// ─── GET /api/logs ── all activity logs (newest first) ──────────────
router.get('/', (_req, res) => {
  try {
    const logs = queryAll('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/logs/:id ── delete a single log entry ──────────────
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    execute('DELETE FROM activity_logs WHERE id = ?', [id]);
    res.json({ message: 'Log deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/logs ── clear all logs ─────────────────────────────
router.delete('/', (_req, res) => {
  try {
    execute('DELETE FROM activity_logs');
    res.json({ message: 'All logs cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
