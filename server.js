'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const expressLayouts = require('express-ejs-layouts');
const config = require('./config/config');
const store = require('./services/store');

// Ensure DB exists; if not, hint to run init
if (!fs.existsSync(config.paths.db)) {
  console.warn('\n[!] Database not found. Run "npm run init-db" first.\n');
}

const app = express();

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/public');

// Static + body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions (stored in SQLite — no external store)
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'data') }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 },
}));

// Globals available to all views
app.use((req, res, next) => {
  res.locals.company = config.company;
  res.locals.siteUrl = config.siteUrl;
  res.locals.whatsappNumber = store.setting('whatsapp_number', config.whatsappNumber);
  res.locals.categories = store.categories();
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  res.locals.year = new Date().getFullYear();
  res.locals.title = config.company.name;
  res.locals.metaDesc = '';
  res.locals.noindex = false;
  res.locals.error = null;
  res.locals.old = {};
  next();
});

// Admin uses its own layout
app.use('/admin', (req, res, next) => { app.set('layout', 'layouts/admin'); res.locals.layout = 'layouts/admin'; next(); });
app.use((req, res, next) => { if (!req.path.startsWith('/admin')) res.locals.layout = 'layouts/public'; next(); });

// Routes
app.use('/', require('./routes/public'));
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found', layout: 'layouts/public', metaDesc: '', noindex: true });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Server error');
});

// Export app for serverless
module.exports = app;

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`\n  D Cam Engineering website running:`);
    console.log(`   Public:  ${config.siteUrl}`);
    console.log(`   Admin:   ${config.siteUrl}/admin   (login: ${config.admin.email})`);
    console.log(`   SMTP:    ${config.smtp.host ? config.smtp.host + ' — configured' : 'NOT configured (leads still saved)'}\n`);
  });
}
