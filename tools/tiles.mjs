/**
 * Single source of truth for tile indexes. gid = index + 1 (firstgid 1).
 * Both gen-tileset.mjs (drawing order) and gen-map.mjs (map layout) import
 * from here so art and map never disagree.
 */

export const TILE = 32;
export const SHEET_COLS = 16;

/** Tile index constants (position of each tile in assets/tilesets/city.png). */
export const T = {
  // Ground (row 0)
  ASPHALT0: 0, ASPHALT1: 1, ASPHALT2: 2, MANHOLE: 3,
  SIDEWALK0: 4, SIDEWALK1: 5, PLAZA0: 6, PLAZA1: 7,
  CROSS_X: 8, CROSS_Y: 9, SAND0: 10, SAND1: 11, WATER0: 12, WATER1: 13,
  GRASS0: 14, GRASS1: 15,
  // Walls & props (row 1). Empty pixels = transparent, ground shows through.
  BUILDING_A: 16, BUILDING_B: 17, BUILDING_C: 18, BUILDING_D: 19,
  FOUNTAIN: 20, PALM: 21, TREE: 22, LAMP: 23, BENCH: 24,
};

/** Tiles that stop the bike (set as `collides` property in the map JSON).
 *  Water too — Glopi doesn't swim. Lamps & benches are knobs to knock over later (M4), not walls. */
export const COLLIDES = new Set([
  T.BUILDING_A, T.BUILDING_B, T.BUILDING_C, T.BUILDING_D,
  T.FOUNTAIN, T.PALM, T.TREE,
  T.WATER0, T.WATER1,
]);

export const TILESET_NAME = 'city';

export function gid(index) {
  return index + 1;
}
