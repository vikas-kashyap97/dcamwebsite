'use strict';
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const mailer = require('../services/mailer');

function genRef() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DCE-${ymd}-${rand}`;
}

// Lead submission (product enquiry or general contact)
router.post('/leads', async (req, res) => {
  const b = req.body || {};

  // Honeypot — bots fill this hidden field
  if (b.company_website) return res.redirect('/thank-you');

  const name = (b.name || '').trim();
  const email = (b.email || '').trim();
  const phone = (b.phone || '').trim();
  if (!name || !email || !phone) {
    return res.status(400).render('contact', {
      title: 'Contact Us', metaDesc: '', product: null,
      error: 'Please fill in your name, email and phone.', old: b,
    });
  }

  // Collect product-specific fields: any field prefixed cfg_
  const config = {};
  for (const [k, v] of Object.entries(b)) {
    if (k.startsWith('cfg_') && v) {
      config[k.slice(4).replace(/_/g, ' ')] = Array.isArray(v) ? v.join(', ') : v;
    }
  }

  let product = null;
  if (b.product_id) product = store.productById(parseInt(b.product_id, 10));

  const clientId = store.findOrCreateClient({
    name, organisation: (b.organisation || '').trim(), email, phone,
    country: (b.country || '').trim(),
  });

  const ref = genRef();
  const leadId = store.createLead({
    ref, client_id: clientId,
    product_id: product ? product.id : null,
    product_name: product ? product.name : (b.product_name || null),
    category: b.category || (product ? '' : null),
    quantity: (b.quantity || '1').trim(),
    application: (b.application || '').trim(),
    message: (b.message || '').trim(),
    config_json: JSON.stringify(config),
    source_page: b.source_page || req.get('referer') || '',
    channel: 'form',
    email_status: 'pending',
  });

  const leadForEmail = {
    id: leadId, ref, name, organisation: b.organisation, email, phone,
    country: b.country, product_name: product ? product.name : (b.product_name || ''),
    category: b.category || '', quantity: b.quantity || '1',
    application: b.application, message: b.message, config,
    source_page: b.source_page || '', created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  // Send notifications (best-effort; lead already saved)
  try {
    const sent = await mailer.sendFounderNotification(leadForEmail);
    store.setLeadEmailStatus(leadId, sent ? 'sent' : 'failed');
    store.addActivity(leadId, 'email', sent ? 'Founder notified by email.' : 'SMTP not configured — email not sent.');
  } catch (e) {
    console.error('[api] founder email failed:', e.message);
    store.setLeadEmailStatus(leadId, 'failed');
    store.addActivity(leadId, 'email', 'Founder email failed: ' + e.message);
  }
  mailer.sendBuyerAck(leadForEmail).catch(() => {});

  return res.redirect('/thank-you?ref=' + encodeURIComponent(ref));
});

module.exports = router;
