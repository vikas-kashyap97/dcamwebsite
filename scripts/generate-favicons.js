'use strict';
/**
 * Generate a professional favicon / SEO icon set from the brand mark.
 *
 *   Source : public/uploads/logo/favicon.png   (square brand mark, transparent)
 *            public/uploads/logo/horizontal_logo.png  (wordmark, for OG image)
 *   Output : public/  (icons, manifest, Open Graph image)
 *
 * Run with:  node scripts/generate-favicons.js
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const LOGO_DIR = path.join(ROOT, 'public', 'uploads', 'logo');
const OUT = path.join(ROOT, 'public');

const SRC_MARK = path.join(LOGO_DIR, 'favicon.png');
const SRC_HORIZONTAL = path.join(LOGO_DIR, 'horizontal_logo.png');

const NAVY = { r: 6, g: 42, b: 70, alpha: 1 };   // brand --navy #062a46
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// The supplied logos are flat PNGs with a light-grey/checkerboard background baked
// in (no real alpha). The mark is dark/saturated and the background is near-white, so
// we key on luminance — every light pixel becomes transparent, the logo is preserved
// regardless of its colour. (Works for the navy/teal mark and any future recolour.)
const LUMA_OPAQUE = 200;  // luminance <= this → fully logo
const LUMA_CLEAR = 232;   // luminance >= this → fully background
function luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

async function keyOutBackground(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let p = 0; p < data.length; p += channels) {
    const L = luma(data[p], data[p + 1], data[p + 2]);
    let a;
    if (L <= LUMA_OPAQUE) a = 255;
    else if (L >= LUMA_CLEAR) a = 0;
    else a = Math.round((1 - (L - LUMA_OPAQUE) / (LUMA_CLEAR - LUMA_OPAQUE)) * 255);
    data[p + 3] = a;
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

// Recolour a keyed (transparent) logo to a flat colour, keeping its alpha shape.
// Used to produce a white logo for placement on dark surfaces.
async function recolor(keyedBuffer, color) {
  const meta = await sharp(keyedBuffer).metadata();
  const alpha = await sharp(keyedBuffer).extractChannel('alpha').toBuffer();
  return sharp({ create: { width: meta.width, height: meta.height, channels: 3, background: color } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

let MARK;        // transparent square brand mark (buffer)
let HORIZONTAL;  // transparent horizontal wordmark (buffer)

// Square PNG, transparent background, mark contained with a little breathing room.
function squareIcon(size, background) {
  const pad = Math.round(size * 0.08);
  return sharp(MARK)
    .trim()
    .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten(background ? { background } : false)
    .png()
    .toBuffer();
}

// Minimal ICO encoder that embeds PNG images (supported by all modern browsers + Windows).
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: icon
  header.writeUInt16LE(count, 4);  // image count

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 0);     // width
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);     // height
    dir.writeUInt8(0, o + 2);                              // palette
    dir.writeUInt8(0, o + 3);                              // reserved
    dir.writeUInt16LE(1, o + 4);                           // color planes
    dir.writeUInt16LE(32, o + 6);                          // bits per pixel
    dir.writeUInt32LE(e.data.length, o + 8);              // size of image data
    dir.writeUInt32LE(offset, o + 12);                    // offset of image data
    offset += e.data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

async function generateOgImage() {
  const W = 1200;
  const H = 630;
  // Horizontal wordmark centred on white — the navy/teal logo reads cleanly on it,
  // with a slim brand bar at the bottom for a finished, professional share card.
  const logo = await sharp(HORIZONTAL)
    .trim()
    .resize(Math.round(W * 0.6), Math.round(H * 0.4), {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const barH = 12;
  const bar = await sharp({ create: { width: W, height: barH, channels: 4, background: NAVY } })
    .png().toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: WHITE },
  })
    .composite([
      { input: logo, gravity: 'center' },
      { input: bar, left: 0, top: H - barH },
    ])
    .png()
    .toFile(path.join(OUT, 'og-image.png'));
}

async function main() {
  if (!fs.existsSync(SRC_MARK)) throw new Error('Missing source: ' + SRC_MARK);

  // Recover clean transparent cut-outs from the flat source PNGs.
  MARK = await keyOutBackground(SRC_MARK);
  HORIZONTAL = await keyOutBackground(SRC_HORIZONTAL);

  // PNG favicons (transparent — render cleanly on light & dark browser chrome).
  for (const size of [16, 32, 48, 96]) {
    fs.writeFileSync(path.join(OUT, `favicon-${size}x${size}.png`), await squareIcon(size));
  }

  // Apple touch icon — solid white background (iOS does not like transparency).
  fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), await squareIcon(180, WHITE));

  // PWA / Android icons.
  fs.writeFileSync(path.join(OUT, 'android-chrome-192x192.png'), await squareIcon(192, WHITE));
  fs.writeFileSync(path.join(OUT, 'android-chrome-512x512.png'), await squareIcon(512, WHITE));
  // Maskable variant carries extra padding so the safe-zone crop never clips the mark.
  const maskable = await sharp(MARK)
    .trim()
    .resize(Math.round(512 * 0.62), Math.round(512 * 0.62), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 97, bottom: 97, left: 97, right: 97, background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'maskable-icon-512x512.png'), maskable);

  // Multi-resolution favicon.ico at the web root (legacy + default browser request).
  const ico = buildIco([
    { size: 16, data: await squareIcon(16) },
    { size: 32, data: await squareIcon(32) },
    { size: 48, data: await squareIcon(48) },
  ]);
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);

  // Open Graph / Twitter share image.
  await generateOgImage();

  // Clean, transparent logos for use in the page chrome (header / footer / admin).
  const IMG = path.join(OUT, 'img');
  fs.mkdirSync(IMG, { recursive: true });
  // Sized for retina display in the page chrome (~2x the rendered height) to keep
  // the payload small — the full-res sources are ~1 MB each.
  const VERTICAL = await keyOutBackground(path.join(LOGO_DIR, 'vertical_logo.png'));

  // Colour logos — for light surfaces (header, light cards).
  fs.writeFileSync(path.join(IMG, 'logo-horizontal.png'),
    await sharp(HORIZONTAL).trim().resize({ height: 200 }).png({ compressionLevel: 9 }).toBuffer());
  fs.writeFileSync(path.join(IMG, 'logo-vertical.png'),
    await sharp(VERTICAL).trim().resize({ height: 320 }).png({ compressionLevel: 9 }).toBuffer());
  fs.writeFileSync(path.join(IMG, 'logo-mark.png'),
    await sharp(MARK).trim().resize({ height: 96 }).png({ compressionLevel: 9 }).toBuffer());

  // White logos — for dark surfaces (navy footer, admin sidebar, login backdrop).
  fs.writeFileSync(path.join(IMG, 'logo-horizontal-white.png'),
    await sharp(await recolor(HORIZONTAL, WHITE)).trim().resize({ height: 200 }).png({ compressionLevel: 9 }).toBuffer());
  fs.writeFileSync(path.join(IMG, 'logo-vertical-white.png'),
    await sharp(await recolor(VERTICAL, WHITE)).trim().resize({ height: 320 }).png({ compressionLevel: 9 }).toBuffer());
  fs.writeFileSync(path.join(IMG, 'logo-mark-white.png'),
    await sharp(await recolor(MARK, WHITE)).trim().resize({ height: 96 }).png({ compressionLevel: 9 }).toBuffer());

  // PWA web manifest.
  const manifest = {
    name: 'D Cam Engineering',
    short_name: 'D Cam',
    description: 'In-house manufacturer of high-pressure & laboratory equipment for oil & gas, EOR and geotechnical research.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#062a46',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

  console.log('Generated favicon + SEO icon set in public/:');
  console.log('  favicon.ico, favicon-16/32/48/96.png, apple-touch-icon.png,');
  console.log('  android-chrome-192/512.png, maskable-icon-512x512.png, og-image.png,');
  console.log('  site.webmanifest, img/logo-{horizontal,vertical,mark}.png (+ -white variants)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
