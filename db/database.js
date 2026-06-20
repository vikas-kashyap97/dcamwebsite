'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/config');

// Ensure data dir exists (Allowed during Build phase, fails in Function phase)
const isFunction = !!process.env.LAMBDA_TASK_ROOT;
const dataDir = path.dirname(config.paths.db);
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  // Catch error in case of read-only environment
}

// Enable read-only ONLY if running in the live Netlify Function (Lambda)
// This allow writes during the Netlify Build phase.
const db = new Database(config.paths.db, { readonly: isFunction });

if (!isFunction) {
  db.pragma('journal_mode = WAL');
}
db.pragma('foreign_keys = ON');

function applySchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

module.exports = { db, applySchema };
