const express = require('express');
const cors = require('cors');
const { initDb, queryAll } = require('./db');

const itemsRouter = require('./routes/items');
const roomsRouter = require('./routes/rooms');
const logsRouter = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ──────────────────────────────────────────────
// Dashboard (before items router to avoid /:id clash)
// ──────────────────────────────────────────────
app.get('/api/dashboard', (_req, res) => {
  try {
    const allItems = queryAll('SELECT category, condition, quantity FROM items');

    const totalItems = allItems.length;
    const totalQuantity = allItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

    const by_category = {};
    for (const cat of ['Keyboard', 'Mouse', 'Monitor', 'CPU']) {
      const matching = allItems.filter(i => i.category === cat);
      by_category[cat] = {
        count: matching.length,
        total_quantity: matching.reduce((s, i) => s + (i.quantity || 0), 0),
      };
    }

    const by_condition = {};
    for (const cond of ['Working', 'Faulty', 'Repair']) {
      const matching = allItems.filter(i => i.condition === cond);
      by_condition[cond] = {
        count: matching.length,
        total_quantity: matching.reduce((s, i) => s + (i.quantity || 0), 0),
      };
    }

    res.json({ total_items: totalItems, total_quantity: totalQuantity, by_category, by_condition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
app.use('/api/items', itemsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/logs', logsRouter);

// ──────────────────────────────────────────────
// 404 catch-all
// ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ──────────────────────────────────────────────
// Bootstrap: init DB then start server
// ──────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Inventory API running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
