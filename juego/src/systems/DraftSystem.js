/**
 * Slipstream / draft (the §4 lean/draft promise) — plain JS, no Phaser.
 *
 * Riding close BEHIND a moving car in its wake fills a meter; the meter is
 * a graded sprint: on top of the fill itself it raises the bike's speed cap
 * (maxBonus) and adds acceleration while pedaling (accelBonus). Leaving the
 * wake drains the meter over meterDrain s, so pulling out of a long draft
 * keeps the sprint for a moment — classic slipstream release.
 *
 * Alignment rules (all must hold for a car to feed the meter):
 *   · the car moves at ≥ minCarSpeed (parked props don't draft)
 *   · its motion direction matches the bike heading (dot ≥ coneDot);
 *     oncoming cars and perpendicular crosses don't count
 *   · the bike trails the car along that motion by 4..followDist px
 *   · lateral offset off the wake ≤ lateralMax px
 */
export class DraftSystem {
  /** @param cfg the DRAFT block from src/config.js */
  constructor(cfg) {
    this.cfg = cfg;
    this.reset();
  }

  reset() {
    this.meter = 0;
    this.wasFull = false;
    this.car = null;
    return this;
  }

  /** Velocity of a traffic car — same math GameScene feeds the sprites. */
  static carVel(car) {
    if (car.lane.axis === 'h') return { x: car.lane.dir * car.speed, y: 0 };
    if (car.lane.axis === 'v') return { x: 0, y: car.lane.dir * car.speed };
    // diagonal lanes carry their normalized tangent on the lane itself
    return {
      x: car.lane.dir * car.speed * car.lane.tx,
      y: car.lane.dir * car.speed * car.lane.ty,
    };
  }

  /**
   * One sensor step. @param bike {x, y, heading}; @param cars the traffic
   * data array. Returns { meter, active, fullEdge, car }.
   */
  update(bike, cars, dt) {
    const C = this.cfg;
    const hb = { x: Math.cos(bike.heading), y: Math.sin(bike.heading) };

    let best = null;
    let bestAlong = Infinity;
    for (const car of cars) {
      const cv = DraftSystem.carVel(car);
      const sp = Math.hypot(cv.x, cv.y);
      if (sp < C.minCarSpeed) continue;
      const ux = cv.x / sp;
      const uy = cv.y / sp;
      // aligned with the bike heading (wake goes the same way)
      if (ux * hb.x + uy * hb.y < C.coneDot) continue;
      const dx = car.x - bike.x;
      const dy = car.y - bike.y;
      // bike trails the car along its motion (along > 0 = behind)
      const along = dx * ux + dy * uy;
      if (along <= 4 || along > C.followDist) continue;
      if (Math.abs(dy * ux - dx * uy) > C.lateralMax) continue;
      if (along < bestAlong) {
        bestAlong = along;
        best = car;
      }
    }

    this.car = best;
    this.meter = best
      ? Math.min(1, this.meter + dt / C.meterFill)
      : Math.max(0, this.meter - dt / C.meterDrain);

    // full-edge fires once per fill cycle (re-charging after a drain
    // triggers it again, but sitting parked on the meter doesn't)
    const full = this.meter >= 0.999;
    const fullEdge = full && !this.wasFull;
    if (!full) this.wasFull = false;
    else this.wasFull = true;

    return { meter: this.meter, active: !!best, fullEdge, car: best };
  }
}
