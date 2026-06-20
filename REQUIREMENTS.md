# D Cam Engineering — Website Completion Requirements

**Purpose:** This document lists everything still needed to take the website from its
current "looks complete, runs locally" state to a **production-ready, fully-populated**
site. The code/features are built; what's mostly outstanding is **real content, real
assets, real business details, and production configuration.**

- **Project:** `dcam-engineering-website/` (the complete copy — `dcam-website/` is an older duplicate and can be removed)
- **Stack:** Node.js + Express · EJS templates · SQLite · local file storage · Nodemailer SMTP
- **Date assessed:** 2026-06-09

---

## 0. Current state at a glance

| Area | Status | What's missing |
|---|---|---|
| Codebase / features | ✅ Built | Nothing blocking |
| Brand logos & favicons | ✅ Present | Confirm they are final/approved |
| **Product photos** | ⚠️ Placeholders only | Real photos for all 7 products (SVG placeholders shipped) |
| Product specs / copy | ⚠️ Mostly seeded | Verify accuracy, fill price/MOQ/lead-time |
| Company / business info | ⚠️ Partly placeholder | Confirm emails, phones, GST/IEC, address, map pin |
| Testimonials | ⚠️ Thin | Most have no review text; need real, complete reviews |
| Legal pages | ⚠️ Stub text | Proper Privacy Policy & Terms required |
| Email (SMTP) | ❌ Not configured | Real transactional mailbox + credentials |
| Production config | ❌ Not set | Domain, HTTPS, session secret, admin password |

---

## 1. Assets needed

### 1.1 Product photography (HIGH PRIORITY — biggest gap)
The catalog currently ships with **generated SVG placeholders** in
`public/uploads/seed/`. Every product still needs **real photos**. Upload them via
**Admin → Products → Edit → Images** (drag in, set one as primary).

For **each of the 7 products**, provide:
- **2–4 real photographs** (primary + alternate angles / in-use / detail shots)
- Recommended: **≥ 1200 px** on the long edge, clean/neutral background, JPG or WebP
- A short **ALT text** and optional **caption** per image (entered in admin)

Products requiring photos:
1. Core Holder (Hassler / Hydrostatic / Triaxial)
2. Floating Piston Accumulator
3. High Pressure Syringe Pump
4. Core Flooding Apparatus
5. Liquid Permeameter
6. Gas Permeameter
7. High Pressure Stirrer Reactor

> Source option noted in README: original photos from the existing marketplace
> listings (dcamengineering.com / IndiaMART etc.) can be downloaded and re-uploaded
> if rights allow.

### 1.2 Brand & logo assets (present — confirm final)
Already in repo (`public/img/`): horizontal, vertical, mark — each in colour + white.
- [ ] Confirm these are the **final approved** logos (not drafts)
- [ ] Confirm logo files are the correct rendered size (header references 615×200)

### 1.3 Favicons / PWA icons (present — confirm)
Already in `public/`: `favicon.ico`, 16/32/48/96, `apple-touch-icon`,
`android-chrome-192/512`, `maskable-icon-512`, `site.webmanifest`.
- [ ] Confirm they match the final logo. Regenerate via `scripts/generate-favicons.js` if the logo changes.

### 1.4 Social share image (present — confirm)
`public/og-image.png` exists.
- [ ] Confirm it shows correct branding/messaging for link previews (1200×630).

### 1.5 Company / facility imagery (OPTIONAL but recommended)
Not currently used but would strengthen the **About** page:
- [ ] Photos of the Ahmedabad facility / VMC-CNC machinery
- [ ] Optional team / founder photo
- [ ] Optional certifications / registration scans (GST, IEC) if to be displayed

### 1.6 Documents (OPTIONAL)
- [ ] Product datasheets / brochures (PDF) for download links, if wanted
- [ ] Company profile PDF

---

## 2. Product information to verify / complete

The 7 products are seeded in `db/seed-data.js`. **Each field below should be reviewed
by the business owner for accuracy** before launch:

For every product, confirm:
- [ ] **Name** and **category** are correct
- [ ] **Short description** & **long description** are accurate and final
- [ ] **Specifications table** (label / value / "meaning" notes) — verify every number
- [ ] **Price mode** — `on_request` vs `fixed`; if fixed, the **price string** (currently only the Syringe Pump shows "From Rs 17,85,000")
- [ ] **MOQ** (min order qty) and **Lead time** — confirm realistic values
- [ ] **SEO title** and **SEO meta description** — review for accuracy/length
- [ ] **Enquiry form fields** (product-specific options) — confirm the dropdown options offered to buyers
- [ ] Whether any **additional products** should be added to the catalog (only 7 seeded across 4 categories)

**Categories (4):** Core Analysis Equipment · High-Pressure Pumps ·
Flooding & Permeability Systems · Reactors & Autoclaves — confirm names/descriptions.

> After editing seed data, re-run `npm run init-db` to re-seed (keeps admin user;
> never wipes leads/clients). Alternatively edit live via the Admin → Products CMS.

---

## 3. Company / business details to confirm

These live in `config/config.js` (and some in `.env`). Several look like
**placeholders / defaults** and MUST be confirmed:

| Field | Current value | Action |
|---|---|---|
| Company name | D Cam Engineering | confirm |
| Proprietor | Dharmendra Mistry | confirm |
| Established | 2011 | confirm |
| Address | 82, Sarjan Industrial Estate, Kathwada GIDC, Odhav, Ahmedabad – 382415 | confirm exact |
| Phone | 079 4264 3996 | confirm |
| Phone (alt) | 080 4581 2465 | confirm |
| Mobile | 9687930390 | confirm |
| Public email | info@dcamengineering.com | **confirm domain/mailbox is live** |
| Founder email (leads to) | dharmendra@dcamengineering.com (.env) | **confirm** |
| GST | 24AULPM8800F1ZN | confirm |
| IEC | AULPM8800F | confirm |
| Map pin (lat/lng) | 23.03344, 72.67202 | **verify it points to the real address** |
| WhatsApp number | 919687930390 | confirm (intl format, digits only) |
| Bank / payment / shipment | Bank of Baroda; Cash/Card/Cheque/DD/Online; Road/Air/Ship | confirm (shown on About) |
| Employees | "Up to 10" | confirm |

> **Important:** the email domain `@dcamengineering.com` must actually exist and be able
> to send/receive, otherwise lead emails will fail.

---

## 4. Testimonials / reviews

Seeded in `db/seed-data.js` (5 entries), but **4 of 5 have no review text** and some
look duplicated:
- [ ] Provide **real reviewer names, locations, ratings, dates, and review text**
- [ ] Remove placeholder/empty entries (e.g. duplicate "Qasem" rows with blank bodies)
- [ ] Confirm permission to publish each reviewer's name/location
- [ ] Optionally add more genuine reviews

---

## 5. Legal & policy content

Current Privacy/Terms pages (`views/legal.ejs`) contain **short stub text**.
- [ ] Provide a **proper Privacy Policy** (data collected, retention, contact for deletion, cookies if any)
- [ ] Provide proper **Terms & Conditions** (pricing, warranty, delivery, payment, jurisdiction)
- [ ] Confirm warranty terms shown on products (e.g. "1 year") are correct
- [ ] Decide if a cookie/consent notice is needed (currently none)

---

## 6. Production configuration & secrets (`.env`)

A real `.env` must be created from `.env.example` with production values:

- [ ] `SITE_URL` → the live domain (e.g. `https://www.dcamengineering.com`)
- [ ] `SESSION_SECRET` → long random string (do **not** use the dev default)
- [ ] **SMTP** — `SMTP_HOST/PORT/SECURE/USER/PASS`, `FROM_EMAIL` (use an authenticated
      transactional relay: domain mailbox, Zoho, Brevo, SES, etc.)
- [ ] `FOUNDER_EMAIL` — where new enquiries are emailed (comma-separate for multiple)
- [ ] `WHATSAPP_NUMBER` — confirm
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` — set a **strong** admin password (default is `ChangeMe123!`)
- [ ] Ensure `.env` is **never committed** (already git-ignored)

> Until SMTP is configured, leads are still saved and visible in admin — only the
> email notification/acknowledgement is skipped. Configuring SMTP is required for the
> founder + buyer email flow.

---

## 7. Functional / technical items to finish before launch

- [ ] **Domain & DNS** — register/point domain; configure email DNS (SPF/DKIM/DMARC) so lead emails don't land in spam
- [ ] **HTTPS** — serve behind TLS (reverse proxy / hosting platform)
- [ ] **Hosting** — choose host (VPS / Render / Railway / etc.); Node 18+; persistent disk for `data/` (SQLite) and `public/uploads/` (images)
- [ ] **Backups** — schedule backups of `data/dcam.db` and `public/uploads/` (these hold all leads, clients, and product images)
- [ ] **Initialise DB on server** — run `npm run init-db` once in production
- [ ] **Change default admin password** immediately after first login
- [ ] **Test the full lead flow** end-to-end (submit form → DB row → founder email → buyer ack → thank-you page with ref number)
- [ ] **Test WhatsApp** click-to-chat opens the right number with the prefilled message
- [ ] **Test the map** embed shows the correct location
- [ ] **Mobile / responsive** check across pages
- [ ] **Cross-browser** check
- [ ] Decide on **analytics** (Google Analytics / Plausible) — not currently included
- [ ] Decide on **WhatsApp Cloud API** auto-notify (optional; documented in Admin → Settings) vs. free click-to-chat (current)
- [ ] Remove the duplicate **`dcam-website/`** folder and stray files (`zif7BWkS`, the loose `.zip`, root PNGs/HTML/PDF blueprint) from the deployment

---

## 8. SEO & metadata

- [ ] Confirm per-product **SEO titles/meta** (in seed data) read well and are accurate
- [ ] Add a **sitemap.xml** and **robots.txt** (not present) for search indexing
- [ ] Verify Product structured-data (JSON-LD) on product pages is correct (present in `product.ejs`)
- [ ] Set up **Google Search Console** + **Google Business Profile** (helps local/manufacturer search)

---

## 9. Content pages — completeness checklist

| Page | Built | Content still needed |
|---|---|---|
| Home | ✅ | Real product photos; confirm hero/stats copy |
| About | ✅ | Confirm factsheet; optional facility photos |
| Products (catalog) | ✅ | Product photos; verify all 7 products |
| Category | ✅ | — (driven by product data) |
| Product detail | ✅ | Photos, verified specs, price/MOQ/lead-time |
| Testimonials | ✅ | Real review text |
| Contact | ✅ | Confirm address/phone/email/map |
| Thank-you | ✅ | — |
| Privacy / Terms | ⚠️ | Proper legal copy |
| 404 | ✅ | — |
| Admin / CRM | ✅ | Set admin password; confirm Settings (founder email + WhatsApp) |

---

## 10. Recommended order of work

1. **Confirm all business details** (Section 3) and create the production `.env` with real SMTP (Section 6).
2. **Gather & upload real product photos** (Section 1.1) — the most visible gap.
3. **Verify/finalise the 7 products'** specs, pricing, MOQ, lead time, copy (Section 2).
4. **Write real testimonials & legal pages** (Sections 4–5).
5. **Deploy** with domain + HTTPS + backups; **test the full lead flow** (Section 7).
6. **SEO setup** — sitemap/robots, Search Console, Business Profile (Section 8).

---

### Summary of "must-have to launch"
1. Real **product photos** (7 products).
2. **Confirmed company details** (emails, phones, address, GST/IEC, map).
3. **Working SMTP** + founder email so enquiries actually deliver.
4. **Strong admin password** + production `SESSION_SECRET` + HTTPS domain.
5. **Real legal pages** + reviewed product/pricing content.

Everything else (analytics, facility photos, brochures, WhatsApp Cloud API, extra
products) is a nice-to-have that can follow launch.
