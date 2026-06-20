'use strict';
// Generates a "Remaining Requirements" PDF — only items NOT yet done.
// (Already available: categories, 7 products+specs, company info, logos,
//  favicons, OG image, all pages, admin/CRM portal — these are excluded.)
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', '..', 'DCam_Website_Requirements.pdf');

const sections = [
  {
    title: '1. Product Photos  (0 of 7 done — all are placeholders)',
    items: [
      'Real photos needed for all 7 products:',
      '  Core Holder (Hassler / Hydrostatic / Triaxial)',
      '  Floating Piston Accumulator',
      '  High Pressure Syringe Pump',
      '  Core Flooding Apparatus',
      '  Liquid Permeameter',
      '  Gas Permeameter',
      '  High Pressure Stirrer Reactor',
      '2 to 4 photos per product, clean background, min 1200px.',
    ],
  },
  {
    title: '2. Testimonials  (only 1 of 5 has review text)',
    items: [
      'Real review text for the remaining reviews.',
      'Remove empty / duplicate placeholder entries.',
      'Permission to publish each reviewer name.',
    ],
  },
  {
    title: '3. Legal Pages  (only short placeholder text now)',
    items: [
      'Proper Privacy Policy content.',
      'Proper Terms & Conditions content.',
    ],
  },
];

const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } });
doc.pipe(fs.createWriteStream(OUT));

const NAVY = '#08334f';
const BLUE = '#0b6ea8';
const GREY = '#444444';

doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(20)
  .text('D Cam Engineering Website');
doc.moveDown(0.2);
doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(14)
  .text('Remaining Requirements (What is still needed)');
doc.moveDown(0.2);
doc.fillColor(GREY).font('Helvetica').fontSize(9)
  .text('Items already done (products, specs, company info, logos, pages, admin portal) are not listed. Date: 9 June 2026');
doc.moveTo(56, doc.y + 6).lineTo(539, doc.y + 6).strokeColor('#cccccc').stroke();
doc.moveDown(1);

sections.forEach((sec) => {
  if (doc.y > 700) doc.addPage();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(sec.title);
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(10.5).fillColor('#222222');
  sec.items.forEach((it) => {
    if (doc.y > 770) doc.addPage();
    const indented = it.startsWith('  ');
    const text = indented ? it.trim() : it;
    const bullet = indented ? '–' : '•';
    const x = indented ? 86 : 66;
    doc.text(`${bullet}  ${text}`, x, doc.y, { width: 539 - x });
    doc.moveDown(0.25);
  });
  doc.moveDown(0.8);
});

doc.end();
console.log('PDF written to:', OUT);
