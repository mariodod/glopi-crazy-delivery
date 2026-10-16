/**
 * Global configuration constants for Glopi's Crazy Delivery.
 * Layout and art in PLAN.md. Tuning values live here so the bike
 * feel can be iterated fast during M2.
 */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

/** Extent of the M0 blank test world (real Barcelona tilemap arrives in M1). */
export const WORLD = {
  width: 2400,
  height: 1800,
};

export const COLORS = {
  night: 0x14142b, // boot / menu background
  asphalt: 0x3a3a52, // placeholder ground
  asphaltJoint: 0x454560, // grid joints, only there to perceive motion
  border: 0xffd75e, // world edge marker (pineapple gold)
};

export const PLAYER = {
  textureKey: 'glopi',
  maxSpeed: 260, // px/s
  accel: 0.16, // fraction of the velocity gap closed per frame @60fps (frame-rate dependent for now; real accel+drag tuning in M2)
  turnRate: 0.35, // max radians of rotation per frame toward velocity direction
  bodyRadius: 14, // arcade physics circle radius (texture is 32x32)
};
