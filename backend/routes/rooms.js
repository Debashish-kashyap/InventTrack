const express = require('express');
const router = express.Router();
const { queryAll, queryOne, execute } = require('../db');

function toFrontendRoom(row) {
  return {
    ...row,
    _id: row.id,
  };
}

// ─── GET /api/rooms ── all rooms with item_count ────────────────────
router.get('/', (_req, res) => {
  try {
    const rooms = queryAll(`
      SELECT r.*, COUNT(i.id) AS item_count
      FROM rooms r
      LEFT JOIN items i ON i.room_id = r.id
      GROUP BY r.id
      ORDER BY r.name
    `);

    res.json(rooms.map(toFrontendRoom));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/rooms ────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { lastId } = execute('INSERT INTO rooms (name, location) VALUES (?, ?)', [name, location || null]);
    const newRoom = queryOne('SELECT * FROM rooms WHERE id = ?', [lastId]);

    // Log the activity
    execute('INSERT INTO activity_logs (action, message) VALUES (?, ?)', [
      'ADD_ROOM',
      `Room ${name} was added`
    ]);

    res.status(201).json(toFrontendRoom(newRoom));
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: `Room with name "${req.body.name}" already exists` });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/rooms/:id/items ── items assigned to a room ──────────
router.get('/:id/items', (req, res) => {
  try {
    const id = Number(req.params.id);
    const room = queryOne('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const items = queryAll('SELECT * FROM items WHERE room_id = ? ORDER BY created_at DESC', [id]);
    // This endpoint is not currently used by the React pages, but we normalize it anyway
    // so the data contract is consistent.
    const frontendItems = items.map((item) => ({
      ...item,
      _id: item.id,
      createdAt: item.created_at,
      purchaseDate: item.purchase_date,
      room: { _id: room.id, name: room.name },
    }));
    res.json({ room: toFrontendRoom(room), items: frontendItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
