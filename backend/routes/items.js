const express = require('express');
const router = express.Router();
const { queryAll, queryOne, execute } = require('../db');

function toFrontendItem(row) {
  // Normalize backend SQL.js/SQLite column names to frontend expectations.
  // Frontend expects:
  // - `_id` instead of `id`
  // - `createdAt` instead of `created_at`
  // - `purchaseDate` instead of `purchase_date`
  // - `room: {_id, name}` instead of `room_id` / `room_name`
  const roomId = row.room_id ?? null;
  return {
    ...row,
    _id: row.id,
    createdAt: row.created_at,
    purchaseDate: row.purchase_date,
    room: roomId ? { _id: roomId, name: row.room_name || null } : null,
  };
}

// ─── GET /api/items ── list all (with optional filters) ─────────────
router.get('/', (req, res) => {
  try {
    let sql = `
      SELECT i.*, r.name AS room_name
      FROM items i
      LEFT JOIN rooms r ON i.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.category) {
      sql += ' AND i.category = ?';
      params.push(req.query.category);
    }

    if (req.query.room_id) {
      sql += ' AND i.room_id = ?';
      params.push(Number(req.query.room_id));
    }

    sql += ' ORDER BY i.created_at DESC';

    const items = queryAll(sql, params);
    res.json(items.map(toFrontendItem));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/items/:id ─────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const item = queryOne(`
      SELECT i.*, r.name AS room_name
      FROM items i
      LEFT JOIN rooms r ON i.room_id = r.id
      WHERE i.id = ?
    `, [Number(req.params.id)]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(toFrontendItem(item));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/items ────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    // Accept both snake_case (backend) and camelCase (frontend) payloads.
    const {
      category,
      brand,
      model,
      specifications,
      quantity,
      condition,
      room_id: bodyRoomId,
      room: bodyRoom,
      purchase_date: bodyPurchaseDate,
      purchaseDate: bodyPurchaseDateCamel,
    } = req.body;

    const purchase_date = bodyPurchaseDate ?? bodyPurchaseDateCamel ?? null;
    const room_id = bodyRoomId ?? bodyRoom ?? null;

    const normalizedRoomId = room_id === '' ? null : room_id;
    const addQty = quantity ?? 0;

    if (!brand || !model) {
      return res.status(400).json({ error: 'brand and model are required' });
    }

    const validCategories = ['Keyboard', 'Mouse', 'Monitor', 'CPU'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
    }

    const validConditions = ['Working', 'Faulty', 'Repair'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({ error: `condition must be one of: ${validConditions.join(', ')}` });
    }

    if (normalizedRoomId) {
      const room = queryOne('SELECT id FROM rooms WHERE id = ?', [Number(normalizedRoomId)]);
      if (!room) return res.status(400).json({ error: `Room with id ${room_id} does not exist` });
    }

    // ── Atomic upsert: merge quantity if duplicate exists ──────────
    // A "duplicate" = same category + brand + model + room_id.
    const duplicateSQL = normalizedRoomId
      ? 'SELECT id FROM items WHERE category IS ? AND brand = ? AND model = ? AND room_id = ?'
      : 'SELECT id FROM items WHERE category IS ? AND brand = ? AND model = ? AND room_id IS NULL';

    const duplicateParams = normalizedRoomId
      ? [category || null, brand, model, Number(normalizedRoomId)]
      : [category || null, brand, model];

    const existing = queryOne(duplicateSQL, duplicateParams);

    let itemId;

    if (existing) {
      // Atomic increment — single SQL statement, no read-modify-write race
      execute(
        'UPDATE items SET quantity = quantity + ? WHERE id = ?',
        [addQty, existing.id]
      );
      itemId = existing.id;
    } else {
      const { lastId } = execute(
        `INSERT INTO items (category, brand, model, specifications, quantity, purchase_date, condition, room_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category || null,
          brand,
          model,
          specifications || null,
          addQty,
          purchase_date ?? null,
          condition || null,
          normalizedRoomId ?? null,
        ]
      );
      itemId = lastId;
    }

    const newItem = queryOne(`
      SELECT i.*, r.name AS room_name
      FROM items i
      LEFT JOIN rooms r ON i.room_id = r.id
      WHERE i.id = ?
    `, [itemId]);
    if (!newItem) return res.status(500).json({ error: 'Failed to load created item' });

    // Log the activity
    const roomNameStr = newItem.room_name ? ` to ${newItem.room_name}` : '';
    const actionVerb = existing ? `merged (+${addQty})` : 'added';
    execute('INSERT INTO activity_logs (action, message) VALUES (?, ?)', [
      'ADD_ITEM',
      `${brand} ${model} ${actionVerb}${roomNameStr}`
    ]);

    res.status(201).json(toFrontendItem(newItem));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/items/:id ─────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne('SELECT * FROM items WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    // Accept both snake_case (backend) and camelCase (frontend) payloads.
    const {
      category,
      brand,
      model,
      specifications,
      quantity,
      condition,
      room_id: bodyRoomId,
      room: bodyRoom,
      purchase_date: bodyPurchaseDate,
      purchaseDate: bodyPurchaseDateCamel,
    } = req.body;

    const purchase_date = bodyPurchaseDate ?? bodyPurchaseDateCamel ?? null;
    const room_id = bodyRoomId ?? bodyRoom ?? null;
    const normalizedRoomId = room_id === '' ? null : room_id;

    const validCategories = ['Keyboard', 'Mouse', 'Monitor', 'CPU'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
    }

    const validConditions = ['Working', 'Faulty', 'Repair'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({ error: `condition must be one of: ${validConditions.join(', ')}` });
    }

    if (normalizedRoomId) {
      const room = queryOne('SELECT id FROM rooms WHERE id = ?', [Number(normalizedRoomId)]);
      if (!room) return res.status(400).json({ error: `Room with id ${room_id} does not exist` });
    }

    execute(
      `UPDATE items
       SET category       = COALESCE(?, category),
           brand          = COALESCE(?, brand),
           model          = COALESCE(?, model),
           specifications = COALESCE(?, specifications),
           quantity       = COALESCE(?, quantity),
           purchase_date  = COALESCE(?, purchase_date),
           condition      = COALESCE(?, condition),
           room_id        = COALESCE(?, room_id)
       WHERE id = ?`,
      [
        category  ?? null,
        brand     ?? null,
        model     ?? null,
        specifications ?? null,
        quantity  ?? null,
        purchase_date ?? null,
        condition ?? null,
        normalizedRoomId ?? null,
        id,
      ]
    );

    const updated = queryOne(`
      SELECT i.*, r.name AS room_name
      FROM items i
      LEFT JOIN rooms r ON i.room_id = r.id
      WHERE i.id = ?
    `, [id]);
    if (!updated) return res.status(500).json({ error: 'Failed to load updated item' });

    // Log the activity
    execute('INSERT INTO activity_logs (action, message) VALUES (?, ?)', [
      'EDIT_ITEM',
      `${updated.brand} ${updated.model} was updated`
    ]);

    res.json(toFrontendItem(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/items/:id ──────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne('SELECT * FROM items WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    execute('DELETE FROM items WHERE id = ?', [id]);

    // Log the activity
    execute('INSERT INTO activity_logs (action, message) VALUES (?, ?)', [
      'DELETE_ITEM',
      `${existing.brand} ${existing.model} was deleted`
    ]);

    res.json({ message: 'Item deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/items/:id/transfer ── move item to another room ───────
router.put('/:id/transfer', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne(`
      SELECT i.*, r.name AS room_name
      FROM items i
      LEFT JOIN rooms r ON i.room_id = r.id
      WHERE i.id = ?
    `, [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const { room_id: bodyRoomId, room: bodyRoom } = req.body;
    const newRoomId = bodyRoomId ?? bodyRoom ?? null;

    if (!newRoomId) {
      return res.status(400).json({ error: 'Target room is required' });
    }

    const targetRoom = queryOne('SELECT * FROM rooms WHERE id = ?', [Number(newRoomId)]);
    if (!targetRoom) return res.status(400).json({ error: 'Target room not found' });

    execute('UPDATE items SET room_id = ? WHERE id = ?', [Number(newRoomId), id]);

    const fromRoom = existing.room_name || 'Unassigned';
    execute('INSERT INTO activity_logs (action, message) VALUES (?, ?)', [
      'TRANSFER_ITEM',
      `${existing.brand} ${existing.model} transferred from ${fromRoom} to ${targetRoom.name}`
    ]);

    const updated = queryOne(`
      SELECT i.*, r.name AS room_name
      FROM items i
      LEFT JOIN rooms r ON i.room_id = r.id
      WHERE i.id = ?
    `, [id]);
    res.json(toFrontendItem(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
