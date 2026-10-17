export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const COLORS = {
  night: 0x14142b, // boot / menu background
};

export const PLAYER = {
  textureKey: 'glopi',
  // Slim centered box: tilemap collision doesn't support circle bodies.
  bodyW: 24,
  bodyH: 22,
};

/** Bike physics, per-second units. M2 exit: fun within 10 seconds of play. */
export const VEHICLE = {
  maxSpeed: 300, // px/s
  reverseMax: 90, // px/s backwards cap
  throttle: 340, // px/s^2
  brake: 680, // px/s^2
  coastDrag: 110, // px/s^2 rolling loss when idle
  steerRate: [3.0, 1.5], // rad/s: at near-stop -> at top speed
  steerMinSpeed: 40, // px/s; below it steering fades out
  grip: 5.0, // lateral velocity damping per second (5 = tight, 2 = drifty)
  driftDrag: 0.9, // forward speed bleed per px/s of lateral slip, per second
};

export const CAMERA = {
  lookahead: 0.16, // camera offset = velocity * lookahead (world px)
  zoomSpan: 0.1, // zoom-out amount at top speed
  zoomLerp: 4.0, // zoom approach rate per second
};

export const IMPACT = {
  minImpulse: 100, // px/s of speed for an impact to count
  restitution: 0.35, // bounce coefficient
  cooldown: 220, // ms between impact effects
  sparks: 8, // particles per burst
};

/** Keyboard toggle for the velocity/debug overlay. */
export const DEBUG_KEY = 'H';
