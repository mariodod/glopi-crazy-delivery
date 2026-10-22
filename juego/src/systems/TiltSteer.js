/**
 * M13.3 tilt steering — lean the phone to steer during landscape play.
 * Pure logic, no Phaser, so the headless suite can drive it with a
 * DeviceOrientationEvent-shaped object ({gamma, beta, orientationAngle}).
 *
 * The screen orientation angle tells us which device axis is "lean right":
 * portrait reads roll (gamma), the two landscapes read pitch (beta), and
 * everything flips when the device is rotated 180°. The neutral rest angle
 * is captured from the first sample after enabling, so a hand-held phone
 * with a slight bias still steers from center. Hysteresis (enter > exit)
 * keeps the digital steer from flickering around the threshold.
 *
 * GameScene merges this AFTER the touch zones, so a finger on ◀ ▶ always
 * wins and tilt only fills in when no zone is held.
 */
export class TiltSteer {
  /** @param cfg the TILT block from src/config.js ({enter, exit}) */
  constructor(cfg) {
    this.cfg = cfg;
    this.reset();
  }

  reset() {
    this.steer = 0; // -1/0/+1 like the touch zones
    this.enabled = false;
    this.base = null; // captured neutral lean (deg)
    this.active = 0; // engaged side with hysteresis
    return this;
  }

  /** One orientation sample → the signed lean in degrees (null = no data). */
  leanOf(e) {
    if (!e || typeof e.gamma !== 'number' || typeof e.beta !== 'number') return null;
    const angle = ((typeof e.orientationAngle === 'number' ? e.orientationAngle : 0) % 360 + 360) % 360;
    if (angle === 90) return e.beta; // landscape-primary: lean = pitch
    if (angle === 270) return -e.beta; // landscape-secondary: mirrored
    if (angle === 180) return -e.gamma; // upside-down portrait
    return e.gamma; // portrait: lean = roll
  }

  /**
   * Feed one orientation sample (or null — events pause briefly on some
   * devices; the last steer holds until data returns).
   */
  update(e) {
    if (!this.enabled) {
      this.steer = 0;
      this.active = 0;
      return this;
    }
    const deg = this.leanOf(e);
    if (deg == null) return this;
    if (this.base == null) this.base = deg; // first sample = rest angle
    const d = deg - this.base;
    if (!this.active && Math.abs(d) >= this.cfg.enter) this.active = d > 0 ? 1 : -1;
    // hysteresis: a held side releases only when the lean falls back
    // through the (smaller) exit band around the rest angle
    if (this.active === 1 && d < this.cfg.exit) this.active = 0;
    if (this.active === -1 && d > -this.cfg.exit) this.active = 0;
    this.steer = this.active;
    return this;
  }
}
