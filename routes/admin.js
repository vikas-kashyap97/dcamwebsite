'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const router = express.Router();
const store = require('../services/store');
const config = require('../config/config');
const { requireAuth } = require('../middleware/auth');

// ── Local image storage (no S3) ──
const productUploadDir = path.join(config.paths.uploads, 'products');
try {
  if (!fs.existsSync(productUploadDir)) fs.mkdirSync(productUploadDir, { recursive: true });
} catch (e) {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productUploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /image\/(jpe?g|png|webp|gif|svg\+xml)/.test(file.mimetype)),
});

const STATUSES = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];

// ── Auth ──
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { layout: false, error: null });
});
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = store.userByEmail((email || '').trim());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).render('admin/login', { layout: false, error: 'Invalid email or password.' });
  }
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect('/admin');
});
router.post('/logout', (req, res) => { req.session.destroy(() => res.redirect('/admin/login')); });

router.use(requireAuth);

// ── Dashboard ──
router.get('/', (req, res) => {
  res.render('admin/dashboard', { adminPage: 'dashboard', stats: store.stats(), recent: store.leads().slice(0, 8) });
});

// ── Leads ──
router.get('/leads', (req, res) => {
  const filter = { status: req.query.status || '', q: req.query.q || '' };
  res.render('admin/leads', { adminPage: 'leads', leads: store.leads(filter), statuses: STATUSES, filter });
});
router.get('/leads/:id', (req, res, next) => {
  const lead = store.leadById(parseInt(req.params.id, 10));
  if (!lead) return next();
  let cfg = {}; try { cfg = JSON.parse(lead.config_json || '{}'); } catch {}
  res.render('admin/lead-detail', {
    adminPage: 'leads', lead, cfg, statuses: STATUSES,
    activity: store.leadActivity(lead.id), waNumber: lead.phone,
  });
});
router.post('/leads/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  store.updateLeadStatus(id, req.body.status);
  store.addActivity(id, 'status_change', 'Status changed to ' + req.body.status, req.session.user.id);
  res.redirect('/admin/leads/' + id);
});
router.post('/leads/:id/note', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if ((req.body.body || '').trim()) store.addActivity(id, req.body.type || 'note', req.body.body.trim(), req.session.user.id);
  res.redirect('/admin/leads/' + id);
});

// ── Clients ──
router.get('/clients', (req, res) => {
  res.render('admin/clients', { adminPage: 'clients', clients: store.clients(req.query.q || ''), q: req.query.q || '' });
});
router.get('/clients/:id', (req, res, next) => {
  const client = store.clientById(parseInt(req.params.id, 10));
  if (!client) return next();
  res.render('admin/client-detail', { adminPage: 'clients', client, leads: store.clientLeads(client.id) });
});

// ── Products CMS ──
router.get('/products', (req, res) => {
  res.render('admin/products', { adminPage: 'products', products: store.allProducts(), categories: store.categories() });
});
router.get('/products/:id', (req, res, next) => {
  const product = store.productById(parseInt(req.params.id, 10));
  if (!product) return next();
  res.render('admin/product-edit', { adminPage: 'products', product, saved: req.query.saved });
});
router.post('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const b = req.body;
  store.updateProduct(id, {
    name: b.name, short_desc: b.short_desc, long_desc: b.long_desc,
    price_mode: b.price_mode, price: b.price || null, moq: b.moq, lead_time: b.lead_time,
    status: b.status, seo_title: b.seo_title, seo_meta: b.seo_meta,
  });
  res.redirect('/admin/products/' + id + '?saved=1');
});
router.post('/products/:id/images', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.file) store.addImage(id, '/uploads/products/' + req.file.filename, req.body.alt || '');
  res.redirect('/admin/products/' + id);
});
router.post('/products/:id/images/:imageId/primary', (req, res) => {
  store.setPrimaryImage(parseInt(req.params.id, 10), parseInt(req.params.imageId, 10));
  res.redirect('/admin/products/' + req.params.id);
});
router.post('/products/:id/images/:imageId/delete', (req, res) => {
  const img = store.deleteImage(parseInt(req.params.imageId, 10));
  if (img && img.path.startsWith('/uploads/products/')) {
    const f = path.join(config.paths.root, 'public', img.path);
    fs.existsSync(f) && fs.unlink(f, () => {});
  }
  res.redirect('/admin/products/' + req.params.id);
});

// ── Settings ──
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    adminPage: 'settings',
    whatsapp: store.setting('whatsapp_number', config.whatsappNumber),
    founderEmail: store.setting('founder_email', config.founderEmail),
    smtpConfigured: !!config.smtp.host,
    config, saved: req.query.saved,
  });
});
router.post('/settings', (req, res) => {
  store.setSetting('whatsapp_number', (req.body.whatsapp_number || '').replace(/[^\d]/g, ''));
  store.setSetting('founder_email', (req.body.founder_email || '').trim());
  res.redirect('/admin/settings?saved=1');
});

module.exports = router;
