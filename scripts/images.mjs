// Smaller copies of the documentation screenshots (pnpm run images; pnpm run screenshots runs it too): for each
// docs/screenshots/<name>.jpg, <name>.avif and <name>.webp beside it. docs/build.mjs serves them in a <picture>, so a
// browser takes AVIF, else WebP, else the JPEG. Only missing or out-of-date copies are made; commit them with the JPEG.
// Uses sharp (a dev dependency).
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));

// Screenshots of flat interfaces: these keep text sharp at about half the JPEG's size.
const FORMATS = { avif: { quality: 55, effort: 6 }, webp: { quality: 78, effort: 6 } };

export async function optimise({ force = false } = {}) {
  const jpgs = readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
  let made = 0;
  let before = 0;
  let after = 0;
  for (const jpg of jpgs) {
    const src = join(dir, jpg);
    const srcTime = statSync(src).mtimeMs;
    before += statSync(src).size;
    for (const [ext, options] of Object.entries(FORMATS)) {
      const out = join(dir, jpg.replace(/\.jpg$/, `.${ext}`));
      let stale = force;
      try { stale ||= statSync(out).mtimeMs < srcTime; } catch { stale = true; }
      if (stale) { await sharp(src)[ext](options).toFile(out); made++; }
      if (ext === 'avif') after += statSync(out).size;
    }
  }
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`images: ${jpgs.length} screenshots, ${made} copies made (JPEG ${kb(before)} → AVIF ${kb(after)})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await optimise({ force: process.argv.includes('--force') });
