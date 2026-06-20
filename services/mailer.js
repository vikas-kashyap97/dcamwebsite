'use strict';
const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host) return null; // not configured
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function configTable(configObj) {
  const entries = Object.entries(configObj || {}).filter(([, v]) => v !== '' && v != null);
  if (!entries.length) return '<p><em>No product-specific options submitted.</em></p>';
  const rows = entries.map(([k, v]) =>
    `<tr><td style="padding:4px 8px;border:1px solid #d4dde4;background:#f5f9fc;font-weight:600">${esc(k)}</td>
         <td style="padding:4px 8px;border:1px solid #d4dde4">${esc(v)}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;font-size:13px;margin:6px 0">${rows}</table>`;
}

function waLink(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

/** Notify founder of a new lead. Returns true if sent. */
async function sendFounderNotification(lead) {
  const t = getTransporter();
  const subject = `New enquiry — ${lead.product_name || 'General'} — ${lead.name} (${lead.country || '—'})`;
  const adminUrl = `${config.siteUrl}/admin/leads/${lead.id}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2933;max-width:640px">
      <h2 style="color:#0b3d61;border-bottom:3px solid #0b6ea8;padding-bottom:6px">New website enquiry</h2>
      <p><strong>Ref:</strong> ${esc(lead.ref)} &nbsp;·&nbsp; <strong>Received:</strong> ${esc(lead.created_at)}</p>
      <p><strong>Buyer:</strong> ${esc(lead.name)}, ${esc(lead.organisation || '—')} — ${esc(lead.country || '—')}<br>
         <strong>Contact:</strong> ${esc(lead.email)} · ${esc(lead.phone)}
         ${waLink(lead.phone) ? `(<a href="${waLink(lead.phone)}">WhatsApp</a>)` : ''}</p>
      <p><strong>Product:</strong> ${esc(lead.product_name || 'General enquiry')} ${lead.category ? '(' + esc(lead.category) + ')' : ''}
         &nbsp;·&nbsp; <strong>Qty:</strong> ${esc(lead.quantity || '1')}</p>
      <p><strong>Requested configuration:</strong></p>
      ${configTable(lead.config)}
      <p><strong>Application:</strong> ${esc(lead.application || '—')}<br>
         <strong>Message:</strong> ${esc(lead.message || '—')}</p>
      <p style="color:#5a6672;font-size:12px">Source page: ${esc(lead.source_page || '—')}</p>
      <p>
        <a href="mailto:${esc(lead.email)}" style="background:#0b6ea8;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:8px">Reply by email</a>
        ${waLink(lead.phone) ? `<a href="${waLink(lead.phone)}" style="background:#25D366;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:8px">Reply on WhatsApp</a>` : ''}
        <a href="${adminUrl}" style="background:#11486e;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Open in admin</a>
      </p>
    </div>`;
  if (!t) { console.warn('[mailer] SMTP not configured — founder email skipped (lead still saved).'); return false; }
  await t.sendMail({
    from: config.smtp.from,
    to: config.founderEmail,
    replyTo: lead.email,
    subject,
    html,
  });
  return true;
}

/** Acknowledge the buyer. Best-effort. */
async function sendBuyerAck(lead) {
  const t = getTransporter();
  if (!t || !lead.email) return false;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2933;max-width:600px">
      <h2 style="color:#0b3d61">Thank you for your enquiry</h2>
      <p>Dear ${esc(lead.name)},</p>
      <p>We've received your enquiry${lead.product_name ? ` about the <strong>${esc(lead.product_name)}</strong>` : ''}
         (reference <strong>${esc(lead.ref)}</strong>). Our team at D Cam Engineering will get back to you shortly with a quote.</p>
      <p>For anything urgent you can reach us on WhatsApp or call ${esc(config.company.phone)}.</p>
      <p style="margin-top:18px">Regards,<br><strong>D Cam Engineering</strong><br>${esc(config.company.address)}<br>GST ${esc(config.company.gst)}</p>
    </div>`;
  try {
    await t.sendMail({ from: config.smtp.from, to: lead.email, subject: `We received your enquiry — Ref ${lead.ref}`, html });
    return true;
  } catch (e) { console.warn('[mailer] buyer ack failed:', e.message); return false; }
}

module.exports = { sendFounderNotification, sendBuyerAck, getTransporter };
