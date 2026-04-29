const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

let db = null;

/**
 * Initialise (or reload) the SQLite database.
 * Returns the db instance.
 */
async function initDb() {
  const SQL = await initSqlJs();

  // Load existing file if present, otherwise start fresh
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // ── Create tables ──
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL UNIQUE,
      location  TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id             INTEGER  PRIMARY KEY AUTOINCREMENT,
      category       TEXT     CHECK(category IN ('Keyboard','Mouse','Monitor','CPU')),
      brand          TEXT     NOT NULL,
      model          TEXT     NOT NULL,
      specifications TEXT,
      quantity       INTEGER  NOT NULL DEFAULT 0,
      purchase_date  TEXT,
      condition      TEXT     CHECK(condition IN ('Working','Faulty','Repair')),
      room_id        INTEGER,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      action     TEXT     NOT NULL,
      message    TEXT     NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Seed data (only when tables are empty) ──
  const [{ values: [[roomCount]] }] = db.exec('SELECT COUNT(*) FROM rooms');
  if (roomCount === 0) {
    db.run("INSERT INTO rooms (name, location) VALUES ('Lab A', 'Ground Floor, Block 1')");
    db.run("INSERT INTO rooms (name, location) VALUES ('Lab B', 'First Floor, Block 2')");
    db.run("INSERT INTO rooms (name, location) VALUES ('Server Room', 'Basement, Block 1')");

    db.run(`INSERT INTO items (category, brand, model, specifications, quantity, purchase_date, condition, room_id)
            VALUES ('Keyboard','Logitech','MX Keys S','Wireless, Backlit, USB-C',12,'2025-06-15','Working',1)`);
    db.run(`INSERT INTO items (category, brand, model, specifications, quantity, purchase_date, condition, room_id)
            VALUES ('Mouse','Razer','DeathAdder V3','30K DPI, Ergonomic',8,'2025-07-01','Working',1)`);
    db.run(`INSERT INTO items (category, brand, model, specifications, quantity, purchase_date, condition, room_id)
            VALUES ('Monitor','Dell','U2723QE','27" 4K IPS, USB-C Hub',5,'2025-03-20','Working',2)`);
    db.run(`INSERT INTO items (category, brand, model, specifications, quantity, purchase_date, condition, room_id)
            VALUES ('CPU','Intel','Core i7-14700K','20 cores, 5.6 GHz boost',3,'2025-09-10','Working',3)`);
    db.run(`INSERT INTO items (category, brand, model, specifications, quantity, purchase_date, condition, room_id)
            VALUES ('Monitor','Samsung','Odyssey G7 32"','32" QHD 240 Hz, 1ms, Curved',2,'2024-11-05','Faulty',2)`);

    console.log('✅  Seed data inserted');
  }

  persist();
  return db;
}

/**
 * Write in-memory DB to disk.
 */
function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Helper: run a query that returns rows as an array of objects.
 */
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Helper: run a query that returns a single row as an object, or null.
 */
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Helper: run an INSERT/UPDATE/DELETE and return { changes, lastId }.
 */
function execute(sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  const [{ values: [[lastId]] }] = db.exec('SELECT last_insert_rowid()');
  persist();
  return { changes, lastId };
}

module.exports = { initDb, queryAll, queryOne, execute, persist };
