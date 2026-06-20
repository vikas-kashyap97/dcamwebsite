'use strict';
// Data-access helpers over SQLite.
const { db } = require('../db/database');

const j = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

function hydrateProduct(p) {
  if (!p) return p;
  p.specs = j(p.spec_json, []);
  p.form_fields = j(p.form_fields_json, []);
  const cat = db.prepare(`SELECT slug, name FROM categories WHERE id = ?`).get(p.category_id);
  p._catSlug = cat ? cat.slug : '';
  p._catName = cat ? cat.name : '';
  p.images = db.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC`).all(p.id);
  p.primary_image = p.images.find(i => i.is_primary) || p.images[0] || null;
  return p;
}

const store = {
  categories() {
    return db.prepare(`SELECT * FROM categories ORDER BY sort_order, name`).all();
  },
  categoryBySlug(slug) {
    return db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(slug);
  },
  productsByCategory(categoryId) {
    return db.prepare(`SELECT * FROM products WHERE category_id = ? AND status='active' ORDER BY sort_order`).all(categoryId).map(hydrateProduct);
  },
  allActiveProducts() {
    return db.prepare(`SELECT * FROM products WHERE status='active' ORDER BY sort_order`).all().map(hydrateProduct);
  },
  allProducts() {
    return db.prepare(`SELECT * FROM products ORDER BY sort_order`).all().map(hydrateProduct);
  },
  productBySlug(slug) {
    return hydrateProduct(db.prepare(`SELECT * FROM products WHERE slug = ?`).get(slug));
  },
  productById(id) {
    return hydrateProduct(db.prepare(`SELECT * FROM products WHERE id = ?`).get(id));
  },
  testimonials() {
    return db.prepare(`SELECT * FROM testimonials WHERE visible=1 ORDER BY sort_order`).all();
  },
  setting(key, fallback) {
    const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
    return row ? row.value : fallback;
  },
  setSetting(key, value) {
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)`).run(key, value);
  },

  // ── Leads / clients ──
  findOrCreateClient({ name, organisation, email, phone, country }) {
    let client = email ? db.prepare(`SELECT * FROM clients WHERE email = ?`).get(email) : null;
    if (client) {
      db.prepare(`UPDATE clients SET name=COALESCE(?,name), organisation=COALESCE(?,organisation),
                  phone=COALESCE(?,phone), country=COALESCE(?,country) WHERE id=?`)
        .run(name, organisation, phone, country, client.id);
      return client.id;
    }
    const info = db.prepare(`INSERT INTO clients (name, organisation, email, phone, country) VALUES (?,?,?,?,?)`)
      .run(name, organisation, email, phone, country);
    return info.lastInsertRowid;
  },
  createLead(lead) {
    const info = db.prepare(`INSERT INTO leads
      (ref, client_id, product_id, product_name, category, quantity, application, message, config_json, status, source_page, channel, email_status)
      VALUES (@ref,@client_id,@product_id,@product_name,@category,@quantity,@application,@message,@config_json,'New',@source_page,@channel,@email_status)`)
      .run(lead);
    return info.lastInsertRowid;
  },
  setLeadEmailStatus(id, status) {
    db.prepare(`UPDATE leads SET email_status=? WHERE id=?`).run(status, id);
  },
  leads(filter = {}) {
    let sql = `SELECT l.*, c.name as client_name, c.organisation, c.email, c.phone, c.country
               FROM leads l LEFT JOIN clients c ON c.id = l.client_id WHERE 1=1`;
    const args = [];
    if (filter.status) { sql += ` AND l.status = ?`; args.push(filter.status); }
    if (filter.q) { sql += ` AND (c.name LIKE ? OR c.organisation LIKE ? OR l.product_name LIKE ?)`;
      const like = `%${filter.q}%`; args.push(like, like, like); }
    sql += ` ORDER BY l.created_at DESC`;
    return db.prepare(sql).all(...args);
  },
  leadById(id) {
    return db.prepare(`SELECT l.*, c.name as client_name, c.organisation, c.email, c.phone, c.country, c.id as client_id
                       FROM leads l LEFT JOIN clients c ON c.id = l.client_id WHERE l.id = ?`).get(id);
  },
  updateLeadStatus(id, status) { db.prepare(`UPDATE leads SET status=? WHERE id=?`).run(status, id); },
  leadActivity(leadId) { return db.prepare(`SELECT * FROM lead_activity WHERE lead_id=? ORDER BY created_at DESC`).all(leadId); },
  addActivity(leadId, type, body, userId) {
    db.prepare(`INSERT INTO lead_activity (lead_id, type, body, user_id) VALUES (?,?,?,?)`).run(leadId, type, body, userId || null);
  },

  clients(q) {
    let sql = `SELECT c.*, COUNT(l.id) as lead_count, MAX(l.created_at) as last_activity
               FROM clients c LEFT JOIN leads l ON l.client_id = c.id`;
    const args = [];
    if (q) { sql += ` WHERE c.name LIKE ? OR c.organisation LIKE ? OR c.email LIKE ?`; const like = `%${q}%`; args.push(like, like, like); }
    sql += ` GROUP BY c.id ORDER BY last_activity DESC NULLS LAST, c.created_at DESC`;
    return db.prepare(sql).all(...args);
  },
  clientById(id) { return db.prepare(`SELECT * FROM clients WHERE id=?`).get(id); },
  clientLeads(clientId) { return db.prepare(`SELECT * FROM leads WHERE client_id=? ORDER BY created_at DESC`).all(clientId); },

  // ── Dashboard stats ──
  stats() {
    const total = db.prepare(`SELECT COUNT(*) n FROM leads`).get().n;
    const month = db.prepare(`SELECT COUNT(*) n FROM leads WHERE created_at >= datetime('now','start of month')`).get().n;
    const won = db.prepare(`SELECT COUNT(*) n FROM leads WHERE status='Won'`).get().n;
    const open = db.prepare(`SELECT COUNT(*) n FROM leads WHERE status NOT IN ('Won','Lost')`).get().n;
    const byProduct = db.prepare(`SELECT product_name, COUNT(*) n FROM leads GROUP BY product_name ORDER BY n DESC LIMIT 8`).all();
    const byStatus = db.prepare(`SELECT status, COUNT(*) n FROM leads GROUP BY status`).all();
    return { total, month, won, open, byProduct, byStatus };
  },

  // ── Product CMS ──
  updateProduct(id, fields) {
    db.prepare(`UPDATE products SET name=@name, short_desc=@short_desc, long_desc=@long_desc,
      price_mode=@price_mode, price=@price, moq=@moq, lead_time=@lead_time, status=@status,
      seo_title=@seo_title, seo_meta=@seo_meta WHERE id=@id`).run({ id, ...fields });
  },
  addImage(productId, relPath, alt) {
    const isFirst = db.prepare(`SELECT COUNT(*) n FROM product_images WHERE product_id=?`).get(productId).n === 0;
    const maxOrder = db.prepare(`SELECT COALESCE(MAX(sort_order),0) m FROM product_images WHERE product_id=?`).get(productId).m;
    db.prepare(`INSERT INTO product_images (product_id, path, alt, sort_order, is_primary) VALUES (?,?,?,?,?)`)
      .run(productId, relPath, alt || '', maxOrder + 1, isFirst ? 1 : 0);
  },
  deleteImage(imageId) {
    const img = db.prepare(`SELECT * FROM product_images WHERE id=?`).get(imageId);
    db.prepare(`DELETE FROM product_images WHERE id=?`).run(imageId);
    return img;
  },
  setPrimaryImage(productId, imageId) {
    db.prepare(`UPDATE product_images SET is_primary=0 WHERE product_id=?`).run(productId);
    db.prepare(`UPDATE product_images SET is_primary=1 WHERE id=?`).run(imageId);
  },

  // ── Users ──
  userByEmail(email) { return db.prepare(`SELECT * FROM users WHERE email=?`).get(email); },
};

module.exports = store;
