/**
 * M8.3 touch controls — no Phaser import, pure state + zone rects so the
 * E2E probes can drive it headlessly.
 *
 * Multi-touch friendly: each frame the HUD re-checks which on-screen zones
 * hold a pressed pointer (dragging a finger across zones is allowed).
 * GameScene reads `steer` (-1/0/+1), `pedal`, `brake` AFTER the keyboard and
 * the gamepad, so desktop behavior is untouched.
 */
export const TOUCH_ZONES = [
  { key: 'left', x: 76, y: 470, w: 108, h: 106 },
  { key: 'right', x: 196, y: 470, w: 108, h: 106 },
  { key: 'brake', x: 668, y: 470, w: 106, h: 106 },
  { key: 'pedal', x: 788, y: 470, w: 106, h: 106 },
];

export class TouchControls {
  constructor(zones = TOUCH_ZONES) {
    this.zones = zones;
    this.reset();
  }

  reset() {
    this.steer = 0;
    this.pedal = false;
    this.brake = false;
    return this;
  }

  /**
   * Recompute the control state from a list of pointer-like objects
   * ({isDown, x, y}) — Phaser pointers quack the same way.
   */
  update(pointers) {
    let steer = 0;
    let pedal = false;
    let brake = false;
    for (const z of this.zones) {
      if (!this.holds(pointers, z)) continue;
      if (z.key === 'left') steer -= 1;
      else if (z.key === 'right') steer += 1;
      else if (z.key === 'pedal') pedal = true;
      else if (z.key === 'brake') brake = true;
    }
    this.steer = steer;
    this.pedal = pedal;
    this.brake = brake;
    return this;
  }

  holds(pointers, z) {
    return pointers.some(
      (p) =>
        p && p.isDown &&
        p.x >= z.x && p.x < z.x + z.w &&
        p.y >= z.y && p.y < z.y + z.h
    );
  }
}
