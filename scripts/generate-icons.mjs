#!/usr/bin/env node
/**
 * Generates the original site icons (favicon + PWA manifest) matching the
 * navbar logo: a rounded white tile with a dark "A" monogram, on the site
 * background color. Pure Node (no dependencies): hand-rolled PNG encoder
 * (zlib deflate + CRC32) and a small distance-field rasterizer.
 *
 * Outputs:
 *   public/icons/icon-192.png             (192x192)
 *   public/icons/icon-512.png             (512x512)
 *   public/icons/icon-192-maskable.png    (192x192, full-bleed bg)
 *   public/icons/icon-512-maskable.png    (512x512, full-bleed bg)
 *
 * Usage: node scripts/generate-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Brand palette (matches globals.css dark theme + navbar logo).
const BG = [9, 9, 11]; // #09090b site background
const TILE = [250, 250, 250]; // near-white tile
const INK = [9, 9, 11]; // letter color

// ---------------------------------------------------------------------------
// PNG encoder (RGBA, 8-bit)
// ---------------------------------------------------------------------------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Distance-field helpers (pixels in normalized units centered at origin)
// ---------------------------------------------------------------------------
function distSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)));
  const dx = px - (ax + t * abx);
  const dy = py - (ay + t * aby);
  return Math.hypot(dx, dy);
}

function distRoundedRect(px, py, half, radius) {
  const qx = Math.abs(px) - (half - radius);
  const qy = Math.abs(py) - (half - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
  return Math.min(Math.max(qx, qy), 0) + outside;
}

/** Returns coverage in [0,1] of the "A" monogram at (x, y) (normalized, centered). */
function letterACoverage(x, y, feather) {
  const w = 0.46; // overall letter width
  const h = 0.5; // overall letter height
  const t = 0.115; // stroke thickness
  const half = t / 2;
  const topY = -h / 2;
  const botY = h / 2;
  const topX = 0;
  const left = -w / 2;
  const right = w / 2;
  const crossY = topY + h * 0.34;
  const crossX1 = -w * 0.3;
  const crossX2 = w * 0.3;

  const d = Math.min(
    distSeg(x, y, topX, topY, left, botY),
    distSeg(x, y, topX, topY, right, botY),
    distSeg(x, y, crossX1, crossY, crossX2, crossY),
  );
  return clamp01(0.5 + (half - d) / feather);
}

function draw(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const tileHalf = size * 0.42; // tile fills 84% of the canvas
  const tileRadius = size * 0.11;
  const letterScale = 0.78; // 1 letter unit = 78% of the canvas
  const letterFeather = 1 / (letterScale * size); // ~1px anti-alias feather

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / size - 0.5;
      const py = (y + 0.5) / size - 0.5;
      const i = (y * size + x) * 4;

      const dist = distRoundedRect(px * size, py * size, tileHalf, tileRadius);
      const tileCover = clamp01(0.5 - dist); // 1px anti-alias feather

      let r = BG[0];
      let g = BG[1];
      let b = BG[2];
      let a = 255;

      if (maskable) {
        // Full-bleed background; the tile only tints the canvas.
        r = mix(BG[0], TILE[0], tileCover);
        g = mix(BG[1], TILE[1], tileCover);
        b = mix(BG[2], TILE[2], tileCover);
      } else {
        // Tile on transparent background (favicon-friendly).
        r = mix(BG[0], TILE[0], tileCover);
        g = mix(BG[1], TILE[1], tileCover);
        b = mix(BG[2], TILE[2], tileCover);
        a = Math.round(tileCover * 255);
      }

      // Letter "A" on the tile, faded at the tile edge (fades with it).
      const ink =
        letterACoverage(px / letterScale, py / letterScale, letterFeather) *
        (maskable ? 1 : tileCover);
      if (ink > 0.01) {
        r = mix(r, INK[0], ink);
        g = mix(g, INK[1], ink);
        b = mix(b, INK[2], ink);
      }

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
    }
  }
  return rgba;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function main() {
  const outDir = path.join(root, "public", "icons");
  fs.mkdirSync(outDir, { recursive: true });
  const jobs = [
    { size: 192, maskable: false, file: "icon-192.png" },
    { size: 512, maskable: false, file: "icon-512.png" },
    { size: 192, maskable: true, file: "icon-192-maskable.png" },
    { size: 512, maskable: true, file: "icon-512-maskable.png" },
  ];
  for (const job of jobs) {
    const png = encodePng(job.size, job.size, draw(job.size, job.maskable));
    fs.writeFileSync(path.join(outDir, job.file), png);
    console.log(`  + public/icons/${job.file} (${png.length} bytes)`);
  }
}

main();
