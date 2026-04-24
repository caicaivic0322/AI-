import { createRequire } from 'module';
import path from 'path';
import { formatDatabaseDriverError } from './runtime-utils.mjs';

const require = createRequire(import.meta.url);

let db;
let Database;

function ensureColumn(database, tableName, columnName, columnDefinition) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

function getDatabaseConstructor() {
  if (!Database) {
    try {
      Database = require('better-sqlite3');
    } catch (error) {
      throw formatDatabaseDriverError(error);
    }
  }

  return Database;
}

function getDb() {
  if (!db) {
    const DatabaseConstructor = getDatabaseConstructor();
    const dbPath = path.join(process.cwd(), 'data', 'gaokao.db');
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new DatabaseConstructor(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        form_data TEXT NOT NULL,
        report_content TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        paid INTEGER DEFAULT 0,
        order_no TEXT,
        amount INTEGER DEFAULT 999,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        paid_at TEXT
      );
    `);

    ensureColumn(db, 'reports', 'status', "TEXT DEFAULT 'pending'");
    ensureColumn(db, 'reports', 'error_message', 'TEXT');
  }
  return db;
}

export function createReport(id, formData) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO reports (id, form_data, status, error_message) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, JSON.stringify(formData), 'pending', null);
  return id;
}

export function updateReportContent(id, content) {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE reports SET report_content = ?, error_message = NULL WHERE id = ?'
  );
  stmt.run(JSON.stringify(content), id);
}

export function updateReportStatus(id, status, errorMessage = null) {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE reports SET status = ?, error_message = ? WHERE id = ?'
  );
  stmt.run(status, errorMessage, id);
}

export function getReport(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
  const row = stmt.get(id);
  if (row) {
    row.form_data = JSON.parse(row.form_data);
    if (row.report_content) {
      row.report_content = JSON.parse(row.report_content);
    }
  }
  return row;
}

export function listReports(limit = 20) {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT id, form_data, status, paid, amount, created_at, paid_at FROM reports ORDER BY datetime(created_at) DESC LIMIT ?'
  );

  return stmt.all(limit).map((row) => ({
    ...row,
    form_data: JSON.parse(row.form_data),
  }));
}

export function markReportPaid(id, orderNo) {
  const db = getDb();
  const stmt = db.prepare(
    "UPDATE reports SET paid = 1, order_no = ?, paid_at = datetime('now', 'localtime') WHERE id = ?"
  );
  stmt.run(orderNo, id);
}
