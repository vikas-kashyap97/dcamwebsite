'use strict';
require('dotenv').config();

const path = require('path');

const config = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',

  company: {
    name: 'D Cam Engineering',
    proprietor: 'Dharmendra Mistry',
    established: 2011,
    address: '82, Sarjan Industrial Estate, S.P. Ring Road, Kathwada GIDC, Odhav, Ahmedabad – 382415, Gujarat, India',
    phone: '079 4264 3996',
    phoneAlt: '080 4581 2465',
    mobile: '9687930390',
    email: process.env.FOUNDER_EMAIL || 'info@dcamengineering.com',
    gst: '24AULPM8800F1ZN',
    iec: 'AULPM8800F',
    mapLat: 23.03344,
    mapLng: 72.67202,
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.FROM_EMAIL || 'D Cam Engineering <no-reply@dcamengineering.com>',
  },

  founderEmail: process.env.FOUNDER_EMAIL || 'info@dcamengineering.com',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '919687930390',

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@dcamengineering.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  },

  paths: {
    root: path.join(__dirname, '..'),
    db: path.join(__dirname, '..', 'data', 'dcam.db'),
    uploads: path.join(__dirname, '..', 'public', 'uploads'),
  },
};

module.exports = config;
