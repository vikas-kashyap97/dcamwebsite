-- D Cam Engineering — SQLite schema
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  short_desc      TEXT,
  long_desc       TEXT,
  price_mode      TEXT DEFAULT 'on_request',   -- on_request | fixed
  price           TEXT,                          -- display string e.g. "Rs 17,85,000"
  moq             TEXT,
  lead_time       TEXT,
  status          TEXT DEFAULT 'active',         -- active | hidden
  seo_title       TEXT,
  seo_meta        TEXT,
  spec_json       TEXT,                          -- [{label,value,meaning}]
  form_fields_json TEXT,                         -- [{name,label,type,options[],required}]
  sort_order      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,                     -- relative URL under /uploads
  alt         TEXT,
  caption     TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_primary  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clients (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT,
  organisation TEXT,
  email        TEXT,
  phone        TEXT,
  country      TEXT,
  notes        TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ref          TEXT UNIQUE,
  client_id    INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  category     TEXT,
  quantity     TEXT,
  application  TEXT,
  message      TEXT,
  config_json  TEXT,                             -- product-specific answers
  status       TEXT DEFAULT 'New',               -- New|Contacted|Quoted|Negotiation|Won|Lost
  source_page  TEXT,
  channel      TEXT DEFAULT 'form',              -- form|whatsapp
  email_status TEXT DEFAULT 'pending',           -- sent|failed|pending
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lead_activity (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type       TEXT,                               -- note|call|email|quote|status_change
  body       TEXT,
  user_id    INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewer   TEXT,
  location   TEXT,
  rating     INTEGER,
  date       TEXT,
  product    TEXT,
  body       TEXT,
  visible    INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT DEFAULT 'owner',            -- owner | staff
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_status   ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_client   ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_products_cat   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
