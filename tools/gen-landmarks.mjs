// Generates assets/tilesets/landmarks.png — a 3-frame spritesheet of
// Barcelona landmark doodads (128x192 per frame, bottom-aligned).
// Frames: 0 Sagrada Família silhouette · 1 Torre Glòries · 2 Arc de Triomf.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PixelCanvas } from './lib/png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'tilesets', 'landmarks.png');

const FRAME_W = 128;
const FRAME_H = 192;
const OUTLINE = [0x21, 0x23, 0x2b];

const can = new PixelCanvas(FRAME_W * 3, FRAME_H);

/* --- frame 0: Sagrada Família (three sandstone spires + plaza base) --- */
{
  const fx = FRAME_W * 0;
  const baseY = FRAME_H - 4;

  can.panel(fx + 24, baseY - 12, 80, 12, 0xbdb090, 0x6f624a); // stepped base
  can.panel(fx + 32, baseY - 18, 64, 8, 0xa89c7c, 0x6f624a);

  // Linear taper spire: wide at the base, 2px at the tip.
  const spire = (cx, topY) => {
    for (let y = topY + 2; y <= baseY - 18; y++) {
      const width = Math.max(2, Math.min(16, 2 + Math.floor((y - topY) / 18)));
      can.hline(fx + cx - (width >> 1), fx + cx + (width >> 1), y, 0xc2b28a);
      can.set(fx + cx - (width >> 1), y, 0xa89c7c); // western shade
    }
    can.disc(fx + cx, topY, 2, 0xe8ddbd); // pinnacle tip
  };

  spire(44, 68);
  spire(64, 12); // tallest, central tower
  spire(84, 68);

  // Window speckles, kept tight to the central tower column
  for (let y = baseY - 150; y < baseY - 24; y += 6) {
    can.set(fx + 61 + ((y * 7) % 3), y, 0x6f624a);
    can.set(fx + 66 - ((y * 5) % 3), y + 2, 0x6f624a);
  }
}

/* --- frame 1: Torre Glòries (rounded teal bullet tower) --- */
{
  const fx = FRAME_W * 1;
  const baseY = FRAME_H - 4;

  can.panel(fx + 54, baseY - 6, 20, 6, 0x3b414a, OUTLINE); // plaza deck
  can.panel(fx + 42, baseY - 110, 44, 104, 0x38a49b, OUTLINE); // shaft
  can.tri(fx + 42, baseY - 110, fx + 86, baseY - 110, fx + 64, baseY - 146, 0x38a49b);
  can.line(fx + 42, baseY - 110, fx + 64, baseY - 146, 0x262429);
  can.line(fx + 86, baseY - 110, fx + 64, baseY - 146, 0x262429);

  for (let y = baseY - 106; y <= baseY - 10; y += 7) {
    can.hline(fx + 45, fx + 83, y, 0x2c857e);
  }
  for (let x = fx + 50; x <= fx + 78; x += 7) {
    can.vline(x, baseY - 106, baseY - 12, 0x2c857e);
  }
  can.set(fx + 64, baseY - 150, 0x7fd8ce); // glint
}

/* --- frame 2: Arc de Triomf (red brick arch) --- */
{
  const fx = FRAME_W * 2;
  const baseY = FRAME_H - 4;

  can.panel(fx + 24, baseY - 46, 10, 46, 0xc9543f, OUTLINE);   // left column
  can.panel(fx + 94, baseY - 46, 10, 46, 0xc9543f, OUTLINE);   // right column
  can.panel(fx + 20, baseY - 60, 88, 18, 0xd9cfbf, OUTLINE);   // top beam
  can.rect(fx + 18, baseY - 62, 92, 4, 0xe8dfcd);              // cornice
  can.panel(fx + 44, baseY - 42, 40, 42, 0x241f1d, OUTLINE);   // opening
  can.tri(fx + 44, baseY - 42, fx + 84, baseY - 42, fx + 64, baseY - 54, 0x241f1d);
  can.panel(fx + 60, baseY - 56, 6, 10, 0xe8dfcd, OUTLINE);    // keystone
}

mkdirSync(dirname(OUT), { recursive: true });
can.save(OUT);
console.log('landmarks done: 3 frames of', FRAME_W + 'x' + FRAME_H);
