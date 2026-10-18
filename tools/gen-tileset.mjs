// Generates assets/tilesets/city.png: the M1 Barcelona city tileset.
// 16x2 grid of 32x32 tiles. Row 0 = ground, row 1 = walls & props
// (transparent background so the ground layer shows through).
// Tile order MUST match tools/tiles.mjs.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PixelCanvas, mulberry32 } from './lib/png.mjs';
import { TILE, SHEET_COLS, T } from './tiles.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'tilesets', 'city.png');

const OUTLINE = [0x21, 0x23, 0x2b]; // near-black readable edge

let col = 0;
let row = 0;
const can = new PixelCanvas(SHEET_COLS * TILE, 2 * TILE);

function tile(fn) {
  const ox = col * TILE;
  const oy = row * TILE;
  fn(ox, oy);
  col++;
  if (col === SHEET_COLS) { col = 0; row++; }
}

/* ================= ground tiles (opaque, seamless) ================= */

function asphaltBase(ox, oy, seed, dark, light) {
  can.rect(ox, oy, TILE, TILE, dark);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 24; i++) {
    const sx = ox + Math.floor(rnd() * TILE);
    const sy = oy + Math.floor(rnd() * TILE);
    can.set(sx, sy, rnd() < 0.5 ? light : dark);
  }
}

tile((ox, oy) => asphaltBase(ox, oy, 1, 0x3d4048, 0x45484f));            // ASPHALT0
tile((ox, oy) => asphaltBase(ox, oy, 2, 0x3d4048, 0x45484f));            // ASPHALT1
tile((ox, oy) => asphaltBase(ox, oy, 3, 0x3a3d45, 0x42454d));            // ASPHALT2
tile((ox, oy) => {                                                      // MANHOLE
  asphaltBase(ox, oy, 4, 0x3d4048, 0x45484f);
  can.disc(ox + 16, oy + 16, 7, 0x2b2d33);
  can.ring(ox + 16, oy + 16, 7, 0x5c6067);
  can.ring(ox + 16, oy + 16, 4, 0x43464d);
});

function panot(ox, oy, seed, variant) {
  can.rect(ox, oy, TILE, TILE, 0xd3cebf);
  for (let g = 0; g <= TILE; g += 8) {
    can.vline(ox + g, oy, oy + TILE - 1, 0xbab1a1);
    can.hline(ox, ox + TILE - 1, oy + g, 0xbab1a1);
  }
  const rnd = mulberry32(seed);
  for (let i = 0; i < (variant ? 10 : 5); i++) {
    can.set(ox + Math.floor(rnd() * TILE), oy + Math.floor(rnd() * TILE), 0xc5bcae);
  }
}

tile((ox, oy) => panot(ox, oy, 11, 0));        // SIDEWALK0
tile((ox, oy) => panot(ox, oy, 12, 1));        // SIDEWALK1
tile((ox, oy) => {                             // PLAZA0 (terrazzo)
  can.rect(ox, oy, TILE, TILE, 0xd9d2c1);
  for (let y = 4; y < TILE; y += 8)
    for (let x = 4; x < TILE; x += 8)
      can.rect(ox + x, oy + y, 2, 2, 0xc6bba8);
});
tile((ox, oy) => {                             // PLAZA1
  can.rect(ox, oy, TILE, TILE, 0xd9d2c1);
  let k = 0;
  for (let y = 0; y < TILE; y += 8)
    for (let x = 0; x < TILE; x += 8)
      k++ % 2 ? can.rect(ox + x + 4, oy + y + 2, 2, 2, 0xc6bba8) : can.rect(ox + x + 2, oy + y + 3, 2, 2, 0xbfb4a0);
});

tile((ox, oy) => {                             // CROSS_X: white bars along X
  asphaltBase(ox, oy, 13, 0x3d4048, 0x45484f);
  for (const y of [4, 12, 20, 28]) can.rect(ox + 2, oy + y, 28, 3, 0xece6d2);
});
tile((ox, oy) => {                             // CROSS_Y: white bars along Y
  asphaltBase(ox, oy, 14, 0x3d4048, 0x45484f);
  for (const x of [4, 12, 20, 28]) can.rect(ox + x, oy + 2, 3, 28, 0xece6d2);
});

function sand(ox, oy, seed, extra) {
  can.rect(ox, oy, TILE, TILE, 0xe6d298);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 14; i++) {
    can.set(ox + Math.floor(rnd() * TILE), oy + Math.floor(rnd() * TILE), 0xd8c283);
  }
  if (extra) {
    can.disc(ox + 9, oy + 22, 2, 0xcdb078);
    can.disc(ox + 24, oy + 9, 2, 0xcdb078);
  } else {
    can.set(ox + 22, oy + 18, 0xf7f2df); // little shell
  }
}

tile((ox, oy) => sand(ox, oy, 15, 0));   // SAND0
tile((ox, oy) => sand(ox, oy, 16, 1));   // SAND1

tile((ox, oy) => {   // WATER0
  can.rect(ox, oy, TILE, TILE, 0x3fa9c9);
  for (const y of [8, 18, 28]) can.hline(ox + 3, ox + 12, oy + y, 0x62c4de);
});
tile((ox, oy) => {   // WATER1 (deep)
  can.rect(ox, oy, TILE, TILE, 0x2f93b4);
  for (const y of [6, 16, 26]) can.hline(ox + 12, ox + 24, oy + y, 0x246f8c);
});

tile((ox, oy) => {   // GRASS0
  can.rect(ox, oy, TILE, TILE, 0x7ab35b);
  const rnd = mulberry32(17);
  for (let i = 0; i < 16; i++)
    can.set(ox + Math.floor(rnd() * TILE), oy + Math.floor(rnd() * TILE), 0x68a24a);
});
tile((ox, oy) => {   // GRASS1
  can.rect(ox, oy, TILE, TILE, 0x7ab35b);
  const rnd = mulberry32(18);
  for (let i = 0; i < 12; i++)
    can.set(ox + Math.floor(rnd() * TILE), oy + Math.floor(rnd() * TILE), 0x68a24a);
  can.set(ox + 8, oy + 12, 0xf2f0c8);
  can.set(ox + 22, oy + 24, 0xf2f0c8);
});

/* ================= walls & props (transparent bg) ================= */

function roof(ox, oy, base, ridge, extra) {
  can.rect(ox, oy, TILE, TILE, base);
  for (const y of [8, 16, 24]) can.hline(ox, ox + TILE - 1, oy + y, ridge);
  can.frame(ox, oy, TILE, TILE, OUTLINE);
  if (extra) extra(ox, oy);
}

tile((ox, oy) => roof(ox, oy, 0xc9744f, 0xb2603f, (x, y) =>   // BUILDING_A terracotta
  can.panel(x + 20, y + 18, 7, 7, 0x9db1c4, OUTLINE)));
tile((ox, oy) => roof(ox, oy, 0x6b7484, 0x5b6474, (x, y) =>   // BUILDING_B slate
  can.panel(x + 6, y + 19, 9, 6, 0x8f9aac, OUTLINE)));
tile((ox, oy) => roof(ox, oy, 0xd5a75c, 0xb98f4a, (x, y) => { // BUILDING_C ochre
  can.disc(x + 10, y + 20, 2, 0x9aa4ab);
  can.disc(x + 22, y + 10, 2, 0x9aa4ab);
}));
tile((ox, oy) => roof(ox, oy, 0x7fa15a, 0x6b8b4a, (x, y) =>   // BUILDING_D green roof
  can.panel(x + 17, y + 7, 10, 8, 0x2f4068, OUTLINE)));

tile((ox, oy) => {   // FOUNTAIN
  can.disc(ox + 16, oy + 16, 13, 0x98a0a8);
  can.ring(ox + 16, oy + 16, 12, 0x797f86);
  can.disc(ox + 16, oy + 16, 8, 0x58c3dc);
  can.set(ox + 13, oy + 14, 0xe8fbff);
  can.set(ox + 19, oy + 18, 0xe8fbff);
});

tile((ox, oy) => {   // PALM
  can.line(ox + 16, oy + 28, ox + 15, oy + 18, 0x8a6a3f);
  can.line(ox + 15, oy + 19, ox + 16, oy + 28, 0x6f5430);
  const top = [ox + 15, oy + 16];
  for (const [tx, ty] of [[4, 11], [7, 6], [15, 4], [24, 6], [28, 12]]) {
    can.line(top[0], top[1], ox + tx, oy + ty, 0x3f8f4f);
  }
  can.disc(ox + 15, oy + 15, 3, 0x57ab55);
});

tile((ox, oy) => {   // TREE
  can.rect(ox + 14, oy + 20, 3, 8, 0x7a5a3a);
  can.disc(ox + 16, oy + 13, 10, 0x4a9a44);
  can.ring(ox + 16, oy + 13, 10, 0x3d7d39);
  can.disc(ox + 12, oy + 10, 2, 0x66b85f);
  can.disc(ox + 20, oy + 16, 2, 0x66b85f);
});

tile((ox, oy) => {   // LAMP (decor, not solid)
  can.vline(ox + 16, oy + 10, oy + 27, 0x5a5f66);
  can.frame(ox + 15, oy + 10, 3, 3, 0x5a5f66);
  can.disc(ox + 16, oy + 8, 3, 0xffd75e);
  can.set(ox + 17, oy + 7, 0xfff2b8);
});

tile((ox, oy) => {   // BENCH (decor)
  can.panel(ox + 6, oy + 17, 20, 7, 0x8a5a33, 0x6f4526);
  can.rect(ox + 11, oy + 25, 2, 4, 0x6f4526);
  can.rect(ox + 19, oy + 25, 2, 4, 0x6f4526);
});

/* road markings (row 1 continues; asphalt-based, not transparent) */

tile((ox, oy) => {   // DASH_X: dashed white lane line along X
  asphaltBase(ox, oy, 13, 0x3d4048, 0x45484f);
  can.rect(ox + 3, oy + 15, 10, 2, 0xece6d2);
  can.rect(ox + 19, oy + 15, 10, 2, 0xece6d2);
});

tile((ox, oy) => {   // DASH_DIAG: one 45° dash corner-to-corner; consecutive
  // tiles along the avenue chain it into a proper dashed median line
  asphaltBase(ox, oy, 15, 0x3d4048, 0x45484f);
  can.line(ox + 26, oy + 7, ox + 7, oy + 26, 0xece6d2);
  can.line(ox + 26, oy + 8, ox + 8, oy + 26, 0xece6d2);
});

/* remaining row-1 slots stay empty (transparent) */

// 27 tiles defined -> ends at col 11, row 1.
const DRAWS = 27;
if (col !== DRAWS % SHEET_COLS || row !== Math.floor(DRAWS / SHEET_COLS)) {
  throw new Error(`tile layout drifted: col=${col} row=${row}, expected 11/1`);
}

mkdirSync(dirname(OUT), { recursive: true });
can.save(OUT);
console.log('tileset done: 27 tiles drawn (16 ground + 9 walls + 2 markings)');
