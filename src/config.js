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

/**
 * Orders core loop (M3/M4). Zones are radius checks against Glopi's center.
 * Pickup AND delivery both happen automatically when Glopi comes fully to a
 * stop inside the zone — no button. All time units are seconds, fares in €.
 * tipMax multiplies the base fare at full remaining time — time tiers become
 * a proper meter in M5.
 */
export const ORDER = {
  pickupRadius: 44, // px — restaurant ring
  dropRadius: 44, // px — customer ring
  stopSpeed: 22, // px/s — below this Glopi counts as "fully stopped"
  stopTime: 0.65, // s stationary inside a zone before pickup/delivery fires
  fareBase: 6, // € regardless of distance
  farePerTile: 0.9, // € per tile (32px) of restaurant→customer distance
  timeBase: 10, // s of free time
  timePerTile: 0.55, // s per tile of route (≈2.5x straight-line cruise)
  tipMax: 2.0, // max tip at full time left = fare × tipMax
  respawnDelay: 1.6, // s before the next order appears
};

/** Zone render palette (pulsing rings + beacon arrow). */
export const ZONE = {
  offerColor: 0xffcf40, // gold = order waiting at a restaurant
  activeColor: 0xff5e8b, // pink = customer waiting for the delivery
  beaconColor: 0x66d9e8, // arrow above Glopi pointing at the target
};

/**
 * Traffic (M4). Straight two-way lane cruise on the Eixample grid;
 * the Rambla (col 32) and the Diagonal are pedestrian/off-grid.
 * Right-hand rule: forward traffic uses the lower/later line.
 */
export const TRAFFIC = {
  world: { w: 2048, h: 1536 },
  carCount: 8,
  scooterCount: 5,
  carSpeed: [130, 180], // px/s
  scooterSpeed: [85, 160],
  palette: [0xc0392b, 0x3466b3, 0xf1c40f, 0xe8e8e8],
  wrapMargin: 40, // px off-screen before a vehicle wraps
  hitPenalty: 5, // € lost per collision
  hitCooldown: 500, // ms between collisions counting
  nearMissRadius: 52, // px between Glopi and a car for a near miss
  nearMissRelSpeed: 190, // px/s closing speed needed
  nearMissReward: 2, // € per near miss
  nearMissCooldown: 900, // per car, ms
};

/** Pedestrians (M4). Sidewalk lines + boardwalk; bell scattering. */
export const PEDS = {
  count: 14,
  speed: [40, 70], // px/s strolling
  bumpRadius: 20, // running into a ped scatters them
  bellRadius: 130, // SHIFT ring reaching this far
  scatterSpeed: [180, 300], // px/s away from Glopi/bell
  scatterDecay: 4.0, // per-second decay of the scatter velocity
  stunTime: 0.7, // s of panicking after a bump/bell
};

/**
 * M6 juice: fast-riding streaks, drift skid marks and the take-off hop.
 * All per-second units; thresholds in px/s.
 */
export const JUICE = {
  linesAbove: 215, // px/s: speed streaks start
  linesSaturate: 330, // px/s: streaks at full strength
  linesCount: 9, // pooled streaks (recycled by phase)
  linesSpan: 300, // px a streak sweeps past the bike
  linesLen: [16, 44], // px at low..full speed

  skidLateral: 75, // |lateral| px/s to start marking the asphalt
  skidGap: 0.035, // s between marked pairs
  skidLife: 3.0, // s before a mark fades away
  skidCap: 260, // max live marks

  hopAngle: 0.24, // rad of front-lift at full hop
  hopTime: 0.4, // s the hop takes to unwind
  hopKick: 28, // px/s of windowed speed gain (0.18s) that triggers a hop
};

/**
 * M6.2 dynamic music: two same-length seamless loops the scene crossfades.
 * Chaos rises with an active order or a hot streak; calm is the baseline.
 */
export const MUSIC = {
  calmBase: 0.5,
  calmLow: 0.24,
  chaosOn: 0.62,
  chaosOff: 0.0,
  lerp: 2.6, // per-second crossfade speed
};

/**
 * Scoring (M5). One wallet for the whole shift: near-miss bonuses chain
 * into a streak multiplier, delivery pay lands here, crash penalties burn.
 * `shiftLength` drives the 3-minute shift; grade thresholds rank the run.
 */
export const SCORE = {
  streakWindow: 5, // s — consecutive near-misses within this window chain
  multStep: 0.5, // multiplier gain per streak step (x1, x1.5, x2, …)
  multMax: 3, // bonus multiplier cap
  shiftLength: 180, // s — a full Glopo shift
  grades: { S: 45, A: 32, B: 20, C: 10 }, // rank thresholds (score = d·3 + streak·2 + money/25), D below C
};
