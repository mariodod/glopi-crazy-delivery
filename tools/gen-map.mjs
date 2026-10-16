// Generates assets/tilemaps/barcelona.json — the M1 city map.
// 64x48 tiles of 32px (2048x1536 world px), Tiled-format JSON supported
// directly by Phaser (embeds the city tileset + collision properties).
//
// Layout (rows 0..39 = city, 40..47 = beach & sea):
//   - Eixample grid: streets every 6 tiles (2 wide), 4x4 city blocks
//   - La Rambla: pedestrian plaza strip at cols 32-33
//   - Diagonal: an anti-diagonal avenue carved from (52,2) to (16,39)
//   - Special blocks: parks (grass + trees), Plaça (terrazzo + fountain)
//   - Beach: boardwalk, sand with palms, then sea (two depths, collides)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { mulberry32 } from './lib/png.mjs';
import { T, COLLIDES, TILESET_NAME, gid } from './tiles.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'tilemaps', 'barcelona.json');

const COLS = 64;
const ROWS = 48;
const CITY_ROWS = 40;        // rows 0..39: city proper
const H_STREETS = [2, 8, 14, 20, 26, 32, 38];
const V_STREETS = [2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62];
const RAMBLA_COLS = [32, 33]; // pedestrian: replaces the col-32 street
const PARKS = [[1, 0], [5, 2], [2, 5]];
const PLAZAS = [[3, 1]];

const rnd = mulberry32(20261016);

// Layers as row-major grids of gids (0 = empty).
const ground = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
const walls = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

const set = (layer, x, y, t) => {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return;
  layer[y][x] = gid(t);
};

/* ---------- 1. base ground: sidewalks in the city, beach below ---------- */

for (let y = 0; y < CITY_ROWS; y++) {
  for (let x = 0; x < COLS; x++) set(ground, x, y, T.SIDEWALK0);
}
for (let x = 0; x < COLS; x++) {
  set(ground, x, 40, T.SIDEWALK0); // boardwalk
  for (let y = 41; y <= 43; y++) set(ground, x, y, rnd() < 0.25 ? T.SAND1 : T.SAND0);
  for (let y = 44; y <= 45; y++) set(ground, x, y, T.WATER0);
  for (let y = 46; y <= 47; y++) set(ground, x, y, T.WATER1);
}

/* ---------- 2. streets (Eixample grid) ---------- */

for (const r of H_STREETS) {
  for (let y = r; y <= r + 1; y++) {
    for (let x = 0; x < COLS; x++) set(ground, x, y, rnd() < 0.4 ? T.ASPHALT1 : T.ASPHALT0);
  }
}
for (const s of V_STREETS) {
  for (let x = s; x <= s + 1; x++) {
    for (let y = 0; y < CITY_ROWS; y++) set(ground, x, y, rnd() < 0.4 ? T.ASPHALT1 : T.ASPHALT0);
  }
}

/* ---------- 3. city blocks: sidewalks ring + roofs | special blocks ---------- */

const isStreetRow = (y) => H_STREETS.some((r) => y === r || y === r + 1);
const isStreetCol = (x) => V_STREETS.some((s) => x === s || x === s + 1);
const inRambla = (x) => RAMBLA_COLS.includes(x);

for (let by = 0; by < 6; by++) {
  for (let bx = 0; bx < 10; bx++) {
    const x0 = 4 + 6 * bx;
    const y0 = 4 + 6 * by;

    if (PLAZAS.some(([px, py]) => px === bx && py === by)) {
      // Plaça: terrazzo across the whole block + props in the middle
      const isThisPlaza = true;
      for (let y = y0; y < y0 + 4; y++) {
        for (let x = x0; x < x0 + 4; x++) set(ground, x, y, rnd() < 0.3 ? T.PLAZA1 : T.PLAZA0);
      }
      set(walls, x0 + 1, y0 + 1, T.FOUNTAIN);
      set(walls, x0 + 2, y0 + 1, T.TREE);
      set(walls, x0 + 1, y0 + 2, T.PALM);
      set(walls, x0 + 2, y0 + 2, T.BENCH);
      void isThisPlaza;
      continue;
    }

    if (PARKS.some(([px, py]) => px === bx && py === by)) {
      // Parc: grass interior with tree + palm
      for (let y = y0 + 1; y < y0 + 3; y++) {
        for (let x = x0 + 1; x < x0 + 3; x++) {
          set(walls, x, y, 0);
          set(ground, x, y, rnd() < 0.35 ? T.GRASS1 : T.GRASS0);
        }
      }
      set(walls, x0 + 1, y0 + 1, T.TREE);
      set(walls, x0 + 2, y0 + 2, T.PALM);
      // sidewalk ring stays → continue to shared building fill? no: skip roofs
      continue;
    }

    // Sidewalk ring (default ground) + 2x2 roof of a random palette
    const roofs = [T.BUILDING_A, T.BUILDING_B, T.BUILDING_C, T.BUILDING_D];
    const roof = roofs[Math.floor(rnd() * roofs.length)];
    for (let y = y0 + 1; y < y0 + 3; y++) {
      for (let x = x0 + 1; x < x0 + 3; x++) set(walls, x, y, roof);
    }
  }
}

/* ---------- 4. La Rambla: pedestrian plaza strip with palms & benches ---------- */

for (let y = 0; y < CITY_ROWS; y++) {
  for (const x of RAMBLA_COLS) {
    if (isStreetRow(y) && false) continue; // Rambla cuts through everything
    set(ground, x, y, rnd() < 0.25 ? T.PLAZA1 : T.PLAZA0);
  }
}
for (const [y, x] of [[6, 33], [14, 33], [22, 33], [30, 33], [38, 33]]) set(walls, x, y, T.PALM);
for (const [y, x] of [[10, 32], [18, 32], [26, 32], [34, 32]]) set(walls, x, y, T.PALM);
for (const [y, x] of [[8, 32], [16, 24], [24, 32], [32, 33], [36, 32]]) set(walls, x, y, T.BENCH);

/* ---------- 5. Av. Diagonal: carved anti-diagonal avenue ---------- */

const diagCol = (r) => Math.round(52 - ((r - 2) * 36) / 37);
for (let r = 2; r <= 39; r++) {
  const c = diagCol(r);
  for (const x of [c, c + 1]) {
    if (x < 0 || x >= COLS) continue;
    set(walls, x, r, 0); // clear any roof/palm it slices
    set(ground, x, r, T.ASPHALT0);
  }
}

/* ---------- 6. crosswalks around every normal intersection ---------- */

for (const s of V_STREETS) {
  if (inRambla(s) || inRambla(s + 1)) continue; // Rambla is pedestrian
  for (const r of H_STREETS) {
    for (const y of [r - 1, r + 2]) {
      if (y < 0 || y >= CITY_ROWS || isStreetRow(y)) continue;
      for (let x = s; x <= s + 1; x++) set(ground, x, y, T.CROSS_Y);
    }
    for (const x of [s - 1, s + 2]) {
      if (x < 0 || x >= COLS || isStreetCol(x)) continue;
      for (let y = r; y <= r + 1; y++) set(ground, x, y, T.CROSS_X);
    }
  }
}

/* ---------- 7. manholes on leftover asphalt ---------- */

const asphaltTiles = new Set([gid(T.ASPHALT0), gid(T.ASPHALT1), gid(T.ASPHALT2)]);
let placed = 0;
while (placed < 18) {
  const x = Math.floor(rnd() * COLS);
  const y = Math.floor(rnd() * CITY_ROWS);
  if (asphaltTiles.has(ground[y][x])) {
    set(ground, x, y, T.MANHOLE);
    placed++;
  }
}

/* ---------- 8. beach greens: palms & trees on the sand, plus boardwalk benches ---------- */

for (let i = 0; i < 14; i++) {
  const x = 1 + Math.floor(rnd() * (COLS - 2));
  const y = 41 + Math.floor(rnd() * 3);
  set(walls, x, y, rnd() < 0.6 ? T.PALM : T.TREE);
}
for (const x of [6, 26, 52]) set(walls, x, 40, T.BENCH);

/* ---------- 9. landmarks (Tiled object layer, point objects) ---------- */

const landmarks = [
  { name: 'sagrada', x: 576, y: 1208 },   // park block (2,5), bottom baseline
  { name: 'glories', x: 768, y: 440 },    // plaza block (3,1), bottom baseline
  { name: 'arc', x: 384, y: 248 },        // park block (1,0), bottom baseline
].map((o, i) => ({
  id: i + 1,
  name: o.name,
  type: '',
  rotation: 0,
  visible: true,
  width: 0,
  height: 0,
  x: o.x,
  y: o.y,
  point: { x: true, y: true },
}));

/* ---------- 10. serialize as a Tiled map with the embedded tileset ---------- */

const map = {
  type: 'map',
  version: '1.10',
  tiledversion: '1.10.2',
  orientation: 'orthogonal',
  renderorder: 'right-down',
  infinite: false,
  width: COLS,
  height: ROWS,
  tilewidth: 32,
  tileheight: 32,
  nextlayerid: 4,
  nextobjectid: landmarks.length + 1,
  layers: [
    {
      id: 1, name: 'Ground', type: 'tilelayer',
      x: 0, y: 0, width: COLS, height: ROWS,
      opacity: 1, visible: true, data: ground,
    },
    {
      id: 2, name: 'Walls', type: 'tilelayer',
      x: 0, y: 0, width: COLS, height: ROWS,
      opacity: 1, visible: true, data: walls,
    },
    {
      id: 3, name: 'landmarks', type: 'objectgroup',
      draworder: 'topdown', opacity: 1, visible: true,
      objects: landmarks,
    },
  ],
  tilesets: [
    {
      firstgid: 1,
      name: TILESET_NAME,
      tilewidth: 32,
      tileheight: 32,
      spacing: 0,
      margin: 0,
      columns: 16,
      tilecount: 32,
      image: '../tilesets/city.png',
      imagewidth: 512,
      imageheight: 64,
      tiles: [...COLLIDES].map((t) => ({
        id: t,
        properties: [{ name: 'collides', type: 'bool', value: true }],
      })),
    },
  ],
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map, null, 1));
console.log(`wrote ${OUT} — ${COLS}x${ROWS} tiles, city grid + Rambla + diagonal + beach, ${landmarks.length} landmarks`);
