#!/usr/bin/env node
/**
 * Generate all app icons from the Taiwan coastline polygon.
 *
 * Produces:
 *  - assets/images/icon.png (1024x1024)               — Expo app icon
 *  - assets/images/splash-icon.png (1024x1024)        — splash centerpiece
 *  - assets/images/favicon.png (48x48)                — Expo web favicon
 *  - assets/images/android-icon-foreground.png (1024) — Android adaptive foreground
 *  - assets/images/android-icon-background.png (1024) — Android adaptive background (solid color)
 *  - assets/images/android-icon-monochrome.png (1024) — Android adaptive monochrome
 *  - public/favicon.png (48x48)
 *  - public/favicon.ico (16+32+48 multi-res)
 *  - public/icons/icon-192.png
 *  - public/icons/icon-512.png
 *  - public/icons/icon-maskable.png (1024)
 *  - public/icons/apple-touch-icon.png (180x180)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

// ── Theme ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1B7A3D',       // Taiwan green
  primaryDark: '#145C2E',
  primaryLight: '#D4EDDA',
  accent: '#C8402A',        // accent red (route line, south-tip pin)
  cream: '#FAF8F5',
  white: '#FFFFFF',
  monoSafe: '#000000',
};

// ── Data load ─────────────────────────────────────────────────────────
const outline = JSON.parse(
  readFileSync(resolve(root, 'assets/data/taiwan-outline.json'), 'utf8'),
);

// Normalize outline coordinates [lng, lat] into SVG path fit to a box.
function buildTaiwanPath({
  width,
  height,
  padding = 0.12,   // fraction of smaller side
  fill = COLORS.primary,
  stroke = 'none',
  strokeWidth = 0,
}) {
  const minLat = Math.min(...outline.map(([, lat]) => lat));
  const maxLat = Math.max(...outline.map(([, lat]) => lat));
  const minLng = Math.min(...outline.map(([lng]) => lng));
  const maxLng = Math.max(...outline.map(([lng]) => lng));

  const centerLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lngSpan = (maxLng - minLng) * cosLat;
  const latSpan = maxLat - minLat;

  const innerW = width * (1 - padding * 2);
  const innerH = height * (1 - padding * 2);
  const scale = Math.min(innerW / lngSpan, innerH / latSpan);

  const drawW = lngSpan * scale;
  const drawH = latSpan * scale;
  const offsetX = (width - drawW) / 2;
  const offsetY = (height - drawH) / 2;

  const project = (lng, lat) => {
    const x = offsetX + (lng - minLng) * cosLat * scale;
    const y = offsetY + drawH - (lat - minLat) * scale;
    return [x, y];
  };

  let d = '';
  outline.forEach((pt, i) => {
    const [x, y] = project(pt[0], pt[1]);
    d += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)},${y.toFixed(2)} `;
  });
  d += 'Z';

  return { d, project, scale };
}

// Compose an SVG with the island silhouette. Includes optional accent dot.
function makeSvg({
  width,
  height,
  background = COLORS.cream,
  islandFill = COLORS.primary,
  islandStroke = 'none',
  islandStrokeWidth = 0,
  padding = 0.12,
  cornerRadius = 0,
  showAccent = true,
}) {
  const path = buildTaiwanPath({
    width,
    height,
    padding,
    fill: islandFill,
  });

  // Accent: a small dot at the southern tip (around KP 470, Eluanbi-ish).
  // Pick a low-lat point from the outline as anchor.
  const south = outline.reduce((min, p) => (p[1] < min[1] ? p : min), outline[0]);
  const [sx, sy] = path.project(south[0], south[1]);

  const bg = cornerRadius > 0
    ? `<rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${background}"/>`
    : `<rect x="0" y="0" width="${width}" height="${height}" fill="${background}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bg}
  <path d="${path.d}" fill="${islandFill}" ${
    islandStroke !== 'none'
      ? `stroke="${islandStroke}" stroke-width="${islandStrokeWidth}" stroke-linejoin="round"`
      : ''
  }/>
  ${showAccent ? `<circle cx="${sx.toFixed(2)}" cy="${sy.toFixed(2)}" r="${Math.max(4, width * 0.022)}" fill="${COLORS.accent}" stroke="${background}" stroke-width="${Math.max(2, width * 0.008)}"/>` : ''}
</svg>`;
}

async function writePng(svg, outPath, size) {
  mkdirSync(dirname(outPath), { recursive: true });
  const png = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(outPath, png);
  const stat = png.length;
  console.log(`  wrote ${outPath.replace(root + '/', '')} (${stat.toLocaleString()} bytes)`);
}

async function writePngFromSharp(pipeline, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const png = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(outPath, png);
  console.log(`  wrote ${outPath.replace(root + '/', '')} (${png.length.toLocaleString()} bytes)`);
}

// ── ICO builder (minimal, containing 16/32/48 PNG-encoded images) ─────
async function buildIco(svg, outPath) {
  const sizes = [16, 32, 48];
  const images = await Promise.all(
    sizes.map((s) =>
      sharp(Buffer.from(svg), { density: 384 })
        .resize(s, s)
        .png({ compressionLevel: 9 })
        .toBuffer(),
    ),
  );

  // ICONDIR header (6 bytes) + ICONDIRENTRY * N (16 bytes each) + image data
  const headerSize = 6 + 16 * sizes.length;
  let offset = headerSize;
  const entries = sizes.map((s, i) => ({
    size: s,
    imgLen: images[i].length,
    offset: (offset += i === 0 ? 0 : images[i - 1].length) || offset,
  }));
  // Recompute offsets cleanly
  let cur = headerSize;
  for (let i = 0; i < entries.length; i++) {
    entries[i].offset = cur;
    cur += entries[i].imgLen;
  }

  const totalSize = cur;
  const buf = Buffer.alloc(totalSize);

  // ICONDIR
  buf.writeUInt16LE(0, 0);             // reserved
  buf.writeUInt16LE(1, 2);             // type = ICO
  buf.writeUInt16LE(sizes.length, 4);  // count

  // ICONDIRENTRY
  let pos = 6;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    buf.writeUInt8(e.size >= 256 ? 0 : e.size, pos);      // width
    buf.writeUInt8(e.size >= 256 ? 0 : e.size, pos + 1);  // height
    buf.writeUInt8(0, pos + 2);                            // palette
    buf.writeUInt8(0, pos + 3);                            // reserved
    buf.writeUInt16LE(1, pos + 4);                         // color planes
    buf.writeUInt16LE(32, pos + 6);                        // bit depth
    buf.writeUInt32LE(e.imgLen, pos + 8);                  // image size
    buf.writeUInt32LE(e.offset, pos + 12);                 // image offset
    pos += 16;
  }

  // Image data
  for (let i = 0; i < images.length; i++) {
    images[i].copy(buf, entries[i].offset);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  console.log(`  wrote ${outPath.replace(root + '/', '')} (${buf.length.toLocaleString()} bytes, ${sizes.join('+')})`);
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('Generating Taiwan-shaped icons...\n');

  // Primary icon: cream bg + green silhouette + red south-tip dot
  const iconSvg = makeSvg({
    width: 1024,
    height: 1024,
    background: COLORS.cream,
    islandFill: COLORS.primary,
    islandStroke: COLORS.primaryDark,
    islandStrokeWidth: 4,
    padding: 0.12,
    showAccent: true,
  });

  // Variants
  const maskableSvg = makeSvg({
    // Android maskable: 40% safe zone. Shrink silhouette into inner circle.
    width: 1024,
    height: 1024,
    background: COLORS.primary,
    islandFill: COLORS.cream,
    islandStrokeWidth: 0,
    padding: 0.28,  // larger safe area
    showAccent: true,
  });

  const monochromeSvg = makeSvg({
    width: 1024,
    height: 1024,
    background: '#00000000',
    islandFill: COLORS.monoSafe,
    padding: 0.12,
    showAccent: false,
  });

  const androidFgSvg = makeSvg({
    width: 1024,
    height: 1024,
    background: '#00000000',
    islandFill: COLORS.cream,
    islandStrokeWidth: 0,
    padding: 0.24,
    showAccent: true,
  });

  const splashSvg = makeSvg({
    width: 1024,
    height: 1024,
    background: '#00000000',
    islandFill: COLORS.primary,
    islandStrokeWidth: 0,
    padding: 0.20,
    showAccent: true,
  });

  // Generate expo asset pngs
  console.log('Expo assets (assets/images/):');
  await writePng(iconSvg, resolve(root, 'assets/images/icon.png'), 1024);
  await writePng(splashSvg, resolve(root, 'assets/images/splash-icon.png'), 1024);
  await writePng(iconSvg, resolve(root, 'assets/images/favicon.png'), 48);
  await writePng(androidFgSvg, resolve(root, 'assets/images/android-icon-foreground.png'), 1024);
  await writePng(monochromeSvg, resolve(root, 'assets/images/android-icon-monochrome.png'), 1024);

  // Android adaptive background: solid primaryDark (matches app.json)
  await writePngFromSharp(
    sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 3,
        background: COLORS.primaryDark,
      },
    }),
    resolve(root, 'assets/images/android-icon-background.png'),
  );

  // PWA public icons
  console.log('\nPWA icons (public/):');
  await writePng(iconSvg, resolve(root, 'public/icons/icon-192.png'), 192);
  await writePng(iconSvg, resolve(root, 'public/icons/icon-512.png'), 512);
  await writePng(iconSvg, resolve(root, 'public/icons/apple-touch-icon.png'), 180);
  await writePng(maskableSvg, resolve(root, 'public/icons/icon-maskable.png'), 1024);
  await writePng(iconSvg, resolve(root, 'public/favicon.png'), 48);

  // Favicon.ico (multi-size)
  console.log('\nFavicon:');
  await buildIco(iconSvg, resolve(root, 'public/favicon.ico'));

  console.log('\n✓ Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
