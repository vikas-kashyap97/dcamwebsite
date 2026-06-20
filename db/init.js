'use strict';
// Initialise the SQLite database, apply schema, seed content,
// generate placeholder product images (local storage), create admin user.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { db, applySchema } = require('./database');
const { categories, products, testimonials } = require('./seed-data');
const config = require('../config/config');

const seedImgDir = path.join(config.paths.uploads, 'seed');
fs.mkdirSync(seedImgDir, { recursive: true });

const PALETTE = ['#0b6ea8', '#11577e', '#0e7c86', '#3f6fb0', '#0f6b5f', '#5a6b8c', '#246b9e'];

function placeholderSVG(label, color) {
  const lines = label.split(' ');
  // simple word-wrap into <=3 lines
  const wrapped = [];
  let cur = '';
  for (const w of lines) {
    if ((cur + ' ' + w).trim().length > 18) { wrapped.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) wrapped.push(cur.trim());
  const tspans = wrapped.slice(0, 3).map((l, i) =>
    `<tspan x="400" dy="${i === 0 ? 0 : 44}">${l.replace(/&/g, '&amp;')}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#08334f"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/></pattern></defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  <circle cx="640" cy="120" r="70" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <circle cx="640" cy="120" r="44" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <text x="400" y="280" fill="#ffffff" font-family="Arial, sans-serif" font-size="38" font-weight="700" text-anchor="middle">${tspans}</text>
  <text x="400" y="470" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" letter-spacing="3">D CAM ENGINEERING</text>
  <text x="400" y="500" fill="rgba(255,255,255,0.5)" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">Product photo placeholder — replace in admin</text>
</svg>`;
}

function run() {
  applySchema();

  // Wipe (idempotent re-seed)
  db.exec(`DELETE FROM product_images; DELETE FROM products; DELETE FROM categories;
           DELETE FROM testimonials; DELETE FROM settings;`);

  const insCat = db.prepare(`INSERT INTO categories (name, slug, description, sort_order) VALUES (?,?,?,?)`);
  const catId = {};
  for (const c of categories) {
    const info = insCat.run(c.name, c.slug, c.description, c.sort_order);
    catId[c.slug] = info.lastInsertRowid;
  }

  const insProd = db.prepare(`INSERT INTO products
    (category_id, name, slug, short_desc, long_desc, price_mode, price, moq, lead_time, status, seo_title, seo_meta, spec_json, form_fields_json, sort_order)
    VALUES (@category_id,@name,@slug,@short_desc,@long_desc,@price_mode,@price,@moq,@lead_time,'active',@seo_title,@seo_meta,@spec_json,@form_fields_json,@sort_order)`);
  const insImg = db.prepare(`INSERT INTO product_images (product_id, path, alt, sort_order, is_primary) VALUES (?,?,?,?,?)`);

  products.forEach((p, idx) => {
    const info = insProd.run({
      category_id: catId[p.category],
      name: p.name, slug: p.slug, short_desc: p.short_desc, long_desc: p.long_desc,
      price_mode: p.price_mode, price: p.price || null, moq: p.moq, lead_time: p.lead_time,
      seo_title: p.seo_title, seo_meta: p.seo_meta,
      spec_json: JSON.stringify(p.specs || []),
      form_fields_json: JSON.stringify(p.form_fields || []),
      sort_order: idx + 1,
    });
    const pid = info.lastInsertRowid;
    const color = PALETTE[idx % PALETTE.length];
    // Two placeholder images per product
    for (let i = 1; i <= 2; i++) {
      const file = `${p.slug}-${i}.svg`;
      fs.writeFileSync(path.join(seedImgDir, file), placeholderSVG(p.name.replace(/\(.*\)/, '').trim(), color));
      insImg.run(pid, `/uploads/seed/${file}`, `${p.name} — D Cam Engineering`, i, i === 1 ? 1 : 0);
    }
  });

  const insT = db.prepare(`INSERT INTO testimonials (reviewer, location, rating, date, product, body, visible, sort_order) VALUES (?,?,?,?,?,?,1,?)`);
  for (const t of testimonials) insT.run(t.reviewer, t.location, t.rating, t.date, t.product, t.body, t.sort_order);

  // Settings defaults
  const insS = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)`);
  insS.run('whatsapp_number', config.whatsappNumber);
  insS.run('founder_email', config.founderEmail);

  // Admin user
  const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(config.admin.email);
  if (!exists) {
    const hash = bcrypt.hashSync(config.admin.password, 10);
    db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,'owner')`)
      .run('Administrator', config.admin.email, hash);
    console.log(`✓ Admin user created: ${config.admin.email}`);
  } else {
    console.log(`• Admin user already exists: ${config.admin.email}`);
  }

  console.log(`✓ Seeded ${categories.length} categories, ${products.length} products, ${testimonials.length} testimonials.`);
  console.log(`✓ Database ready at ${config.paths.db}`);
}

run();
