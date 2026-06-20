'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/config');

// Ensure data dir exists (skip or catch if read-only like Netlify)
const dataDir = path.dirname(config.paths.db);
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  // Ignore error if directory already exists or is read-only
}

// Enable read-only ONLY if running in the live Netlify Function (Lambda)
// This allow writes during the Netlify Build phase.
const isFunction = !!process.env.LAMBDA_TASK_ROOT;
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
