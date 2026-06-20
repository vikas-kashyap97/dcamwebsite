# D Cam Engineering — Website + Lead Capture + Admin/CRM Portal

A complete B2B catalog website with per-product lead forms, SMTP email-to-founder
notifications, WhatsApp click-to-chat, and a private admin/CRM portal for managing
leads, client history and the product catalog.

**Stack:** Node.js + Express · EJS templates · **SQLite** (no DB server) ·
**local file storage** for images (no S3) · Nodemailer SMTP · light-mode engineering theme.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
copy .env.example .env       # Windows
# cp .env.example .env        # macOS/Linux
#  → edit .env and fill in SMTP + email + WhatsApp + admin password

# 3. Initialise the SQLite database (creates tables, seeds 7 products + admin user)
npm run init-db

# 4. Start the server
npm start
```

Then open:

- **Public site:** http://localhost:3000
- **Admin portal:** http://localhost:3000/admin
  - Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`
  - (defaults: `admin@dcamengineering.com` / `ChangeMe123!` — change these)

> Re-running `npm run init-db` re-seeds the catalog (products/categories/testimonials)
> but keeps your existing admin user. Leads and clients are never wiped.

---

## What's included

### Public website
- **Home** — hero, stats, category grid, featured products, about band, CTA.
- **About** — company story, factsheet, "why us", machinery.
- **Products** — catalog grouped by 4 categories.
- **Category** + **Product detail** — gallery (multi-image), full spec table,
  description, related products, and a **product-specific enquiry form**.
- **Testimonials**, **Contact** (with embedded map + general form), **Thank-you**,
  **Privacy/Terms**, **404**.
- Floating **WhatsApp** button on every page.

### Per-product lead forms
Each of the 7 products has its own configuration fields (e.g. the Core Holder asks
holder type / core diameter / pressure; the Syringe Pump asks channels / max pressure /
syringe size) on top of shared contact fields. On submit the lead is:
1. saved to SQLite,
2. emailed to the founder (with the full requested configuration) via SMTP,
3. acknowledged to the buyer by email,
then the visitor lands on a thank-you page with a reference number.

If SMTP isn't configured yet, **leads are still saved** and appear in the admin —
only the email is skipped.

### Admin / CRM portal (`/admin`)
- **Dashboard** — KPIs, recent leads, leads-by-product chart.
- **Leads** — searchable/filterable pipeline (New → Contacted → Quoted → Negotiation →
  Won/Lost); lead detail shows the full configuration; add notes/calls/quotes to an
  activity timeline; reply by email or WhatsApp in one click.
- **Clients** — auto-created from enquiries; each client page shows their full
  **product & enquiry history** (the "client history" requirement).
- **Products (CMS)** — edit details, price, MOQ, lead time, SEO; **upload, set-primary
  and delete product images** (stored locally under `public/uploads/products/`).
- **Settings** — founder email + WhatsApp number; SMTP status.

---

## Project structure

```
dcam-website/
  server.js              Express app + middleware + routing
  config/config.js       Reads .env; company constants
  db/
    schema.sql           SQLite schema
    database.js          Connection (better-sqlite3)
    seed-data.js         4 categories + 7 products (+ specs & form fields) + reviews
    init.js              Creates DB, seeds, generates placeholder images, admin user
  services/
    store.js             All DB queries
    mailer.js            Nodemailer SMTP — founder + buyer emails
  routes/
    public.js            Public pages
    api.js               POST /api/leads (lead capture)
    admin.js             Admin portal + image upload (multer, local disk)
  middleware/auth.js     Session guard
  views/                 EJS templates (public + admin)
  public/
    css/                 styles.css (site) + admin.css
    js/main.js
    uploads/             Local image storage (seed placeholders + uploads)
  data/                  SQLite files (created at runtime, git-ignored)
```

## Replacing placeholder images
The catalog ships with generated SVG placeholders so the site looks complete out of the
box. Replace them per product in **Admin → Products → Edit → Images** (drag in your real
photos, set one as primary). Original photos from the marketplace listings can be
downloaded and uploaded here.

## Notes
- All secrets (SMTP, passwords) live in `.env` — never commit it.
- WhatsApp uses free click-to-chat. The optional Cloud API (auto-notify the founder on
  WhatsApp) is documented in Admin → Settings and `services/mailer.js`.
- For production, run behind HTTPS and set a strong `SESSION_SECRET`.
