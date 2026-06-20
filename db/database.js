'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/config');

// Ensure data dir exists (local) or copy to /tmp (Netlify)
const isFunction = !!process.env.LAMBDA_TASK_ROOT;
if (isFunction) {
  // On Netlify, copy the read-only DB from the bundle to the writable /tmp folder
  // This allows SQLite to create journal files and prevents SQLITE_CANTOPEN errors.
  try {
    if (!fs.existsSync(config.paths.db)) {
      console.log(`[Database] Copying ${config.paths.dbSource} to ${config.paths.db}...`);
      fs.copyFileSync(config.paths.dbSource, config.paths.db);
    }
  } catch (err) {
    console.error('[Database] Failed to setup database in /tmp:', err);
  }
} else {
  const dataDir = path.dirname(config.paths.db);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`[Database] Attempting to open: ${config.paths.db} (isFunction: ${isFunction})`);
const db = new Database(config.paths.db);

if (!isFunction) {
  db.pragma('journal_mode = WAL');
}
db.pragma('foreign_keys = ON');

function applySchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

module.exports = { db, applySchema };
