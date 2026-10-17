/**
 * Global configuration constants for Glopi's Crazy Delivery.
 * Layout and art in PLAN.md. Tuning values live here so the bike
 * feel can be iterated fast during M2.
 */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const COLORS = {
  night: 0x14142b, // boot / menu background
};

export const PLAYER = {
  textureKey: 'glopi',
  maxSpeed: 280, // px/s
  accel: 0.18, // fraction of the velocity gap closed per frame @60fps (frame-rate dependent for now; real accel+drag tuning in M2)
  turnRate: 0.35, // max radians of rotation per frame toward velocity direction
  bodyW: 24, // slim centered box: tilemap collision doesn't support circle bodies
  bodyH: 22,
};
