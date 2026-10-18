/**
 * Traffic & pedestrians (M4) — plain JS, no Phaser dependency.
 *
 * Mirrors the tile grid from tools/gen-map.mjs so lanes sit on real streets:
 *   H street rows 2,8,14,20,26,32,38 (2-wide) — lane line = row*32+16
 *   V street cols 2,8,14,20,26,32(Rambla),38,44,50,56,62 — col 32-33 is the
 *   pedestrian Rambla, excluded from car lanes.
 * Right-hand rule: forward traffic keeps to the right, which is the
 * southern row for eastbound H lanes and the eastern col for northbound V.
 *
 * Cars/scooters cruise their lane (scooters sway a little) and wrap at the
 * world edge. Pedestrians stroll sidewalk lines + boardwalk + Rambla; the
 * bell (SHIFT) or a bike bump scatters them.
 */
export class TrafficSystem {
  /** @param config merged blocks: { traffic, peds } from src/config.js */
  constructor({ traffic, peds, rng = Math.random }) {
    this.traffic = traffic;
    this.pedsCfg = peds;
    this.rng = rng;
    this.handlers = { nearmiss: new Set(), bumped: new Set(), bell: new Set() };
    this.buildLanes();
    this.cars = this.spawnCars();
    this.peds = this.spawnPeds();
  }

  on(event, fn) {
    this.handlers[event]?.add(fn);
    return () => this.handlers[event]?.delete(fn);
  }

  emit(event, payload) {
    this.handlers[event]?.forEach((fn) => fn(payload));
  }

  buildLanes() {
    const T = this.traffic;
    const H_STREETS = [2, 8, 14, 20, 26, 32, 38];
    const V_STREETS = [2, 8, 14, 20, 26, 38, 44, 50, 56, 62]; // 32 = Rambla: peds only
    const line = (n) => n * 32 + 16; // lane/sidewalk centerline of a tile row/col

    this.carLanes = [];
    for (const r of H_STREETS) {
      this.carLanes.push({
        axis: 'h', pos: line(r + 1), dir: 1, lo: 0, hi: T.world.w,
      });
      this.carLanes.push({
        axis: 'h', pos: line(r), dir: -1, lo: 0, hi: T.world.w,
      });
    }
    for (const s of V_STREETS) {
      this.carLanes.push({
        axis: 'v', pos: line(s), dir: 1, lo: line(0), hi: line(39),
      });
      this.carLanes.push({
        axis: 'v', pos: line(s + 1), dir: -1, lo: line(0), hi: line(39),
      });
    }

    this.pedLanes = [];
    for (const r of H_STREETS) {
      // sidewalks bordering the street pair (r-1 and r+2 are block rings)
      this.pedLanes.push({ axis: 'h', pos: line(r - 1), lo: 32, hi: T.world.w - 32 });
      this.pedLanes.push({ axis: 'h', pos: line(r + 2), lo: 32, hi: T.world.w - 32 });
    }
    // boardwalk along the beach
    this.pedLanes.push({ axis: 'h', pos: line(40), lo: 32, hi: T.world.w - 32 });
    // the Rambla — pedestrians up and down the pedestrian strip
    for (const c of [32, 33]) {
      this.pedLanes.push({ axis: 'v', pos: line(c), lo: line(0), hi: line(39) });
    }
  }

  randBetween([lo, hi]) {
    return lo + this.rng() * (hi - lo);
  }

  spawnCars() {
    const T = this.traffic;
    const cars = [];
    for (let i = 0; i < T.carCount + T.scooterCount; i++) {
      const type = i < T.carCount ? 'car' : 'scooter';
      const lane = this.carLanes[Math.floor(this.rng() * this.carLanes.length)];
      const speed = type === 'car'
        ? this.randBetween(T.carSpeed)
        : this.randBetween(T.scooterSpeed);
      const along = lane.lo + this.rng() * (lane.hi - lane.lo);
      cars.push({
        type,
        lane,
        // direction always reads from lane.dir — no second copy of the truth
        speed,
        tintIndex: Math.floor(this.rng() * T.palette.length),
        along,
        x: 0,
        y: 0,
        wobble: 0,
        swayPhase: this.rng() * Math.PI * 2,
        sway: type === 'scooter' ? this.randBetween([4, 8]) : this.randBetween([2, 4]),
        lastNearMiss: -1e9,
      });
      this.applyLane(cars[i], along, 0);
    }
    return cars;
  }

  /** Place a car on its lane; `along` = coordinate on the axis of travel. */
  applyLane(car, along) {
    if (car.lane.axis === 'h') {
      car.x = along;
      car.y = car.lane.pos + car.wobble; // sway is perpendicular, non-accumulating
    } else {
      car.x = car.lane.pos + car.wobble;
      car.y = along;
    }
    car.along = along;
  }

  spawnPeds() {
    const P = this.pedsCfg;
    const peds = [];
    for (let i = 0; i < P.count; i++) {
      const lane = this.pedLanes[Math.floor(this.rng() * this.pedLanes.length)];
      const line = lane.pos + (Math.floor(this.rng() * 3) - 1) * 12; // ±12px jitter
      peds.push({
        lane,
        line,
        dir: this.rng() < 0.5 ? -1 : 1,
        speed: this.randBetween(P.speed),
        along: lane.lo + this.rng() * (lane.hi - lane.lo),
        x: 0,
        y: 0,
        scatterVx: 0,
        scatterVy: 0,
        stun: 0,
        phase: this.rng() * Math.PI * 2,
      });
      this.applyPedLine(peds[i]);
    }
    return peds;
  }

  applyPedLine(ped) {
    if (ped.lane.axis === 'h') {
      ped.x = ped.along;
      ped.y = ped.line;
    } else {
      ped.x = ped.line;
      ped.y = ped.along;
    }
  }

  /**
   * Advance everything. probe = { x, y, vx, vy, speed } — Glopi's state, used
   * for pedestrian bumps (and the M4.3 near-miss detector via checkNearMisses).
   */
  update(dt, probe) {
    const T = this.traffic;
    for (const car of this.cars) {
      car.along += car.lane.dir * car.speed * dt;
      if (car.along < -T.wrapMargin) car.along = car.lane.hi + T.wrapMargin;
      else if (car.along > car.lane.hi + T.wrapMargin) car.along = -T.wrapMargin;
      car.wobble = Math.sin(performance.now() / 320 + car.swayPhase) * car.sway;
      this.applyLane(car, car.along);
    }

    for (const ped of this.peds) {
      if (ped.stun > 0) {
        ped.stun -= dt;
        ped.x += ped.scatterVx * dt;
        ped.y += ped.scatterVy * dt;
        const decay = Math.exp(-this.pedsCfg.scatterDecay * dt);
        ped.scatterVx *= decay;
        ped.scatterVy *= decay;
        if (ped.stun <= 0) {
          ped.scatterVx = 0;
          ped.scatterVy = 0;
          // resume from wherever panic put them, on their line
          ped.along = ped.lane.axis === 'h' ? ped.x : ped.y;
        }
      } else {
        ped.along += ped.dir * ped.speed * dt;
        if (ped.along < ped.lane.lo - 16) ped.along = ped.lane.hi + 16;
        else if (ped.along > ped.lane.hi + 16) ped.along = ped.lane.lo - 16;
        this.applyPedLine(ped);
      }

      if (probe && ped.stun <= 0) {
        // a bump knocks them loose once; stunned peds don't re-bump
        const d = Math.hypot(probe.x - ped.x, probe.y - ped.y);
        if (d < this.pedsCfg.bumpRadius) this.scatterPed(ped, probe.x, probe.y);
      }
    }
  }

  /** Push a pedestrian away from a source point, stunned for a beat. */
  scatterPed(ped, fx, fy) {
    const P = this.pedsCfg;
    const ang = Math.atan2(ped.y - fy, ped.x - fx);
    const sp = this.randBetween(P.scatterSpeed);
    ped.scatterVx = Math.cos(ang || 0) * sp;
    ped.scatterVy = Math.sin(ang || 0) * sp;
    ped.stun = P.stunTime;
    this.emit('bumped', { x: ped.x, y: ped.y });
  }

  /** SHIFT ring: every ped inside the radius scatters away from Glopi. */
  bell(fx, fy) {
    let scattered = 0;
    for (const ped of this.peds) {
      if (Math.hypot(fx - ped.x, fy - ped.y) <= this.pedsCfg.bellRadius) {
        this.scatterPed(ped, fx, fy);
        scattered++;
      }
    }
    if (scattered > 0) this.emit('bell', { x: fx, y: fy, scattered });
    return scattered;
  }

  /**
   * Near-miss detector: a car passes within radius while both sides are
   * moving fast; per-car cooldown keeps each pass to a single bonus.
   */
  checkNearMisses(probe) {
    const T = this.traffic;
    for (const car of this.cars) {
      const d = Math.hypot(probe.x - car.x, probe.y - car.y);
      if (d > T.nearMissRadius) continue;
      if (probe.speed < 120) continue; // only counts while riding
      const carVx = car.lane.axis === 'h' ? car.lane.dir * car.speed : 0;
      const carVy = car.lane.axis === 'v' ? car.lane.dir * car.speed : 0;
      const relV = Math.hypot(carVx - probe.vx, carVy - probe.vy);
      if (relV < T.nearMissRelSpeed) continue;
      const now = performance.now();
      if (now - car.lastNearMiss < T.nearMissCooldown) continue;
      car.lastNearMiss = now;
      this.emit('nearmiss', { x: car.x, y: car.y, amount: T.nearMissReward });
    }
  }
}
