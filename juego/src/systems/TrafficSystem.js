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
    this.handlers = { nearmiss: new Set(), bumped: new Set() };
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

    // Diagonal avenue (v1.1.3): the swath sweeps from (col 52, row 2) to
    // (col 16, row 39); its centerline in px is diagCenter(y) = 1680 −
    // (y − 80)·36/37 (xOf 1680 = col 52 center @ row-2 line, 528 = col 16
    // center @ row-39 line). `along` parametrizes by y; `offX/offY` push
    // each direction onto its right-hand side, ±16 px off the median.
    const tangent = { x: -36 / Math.hypot(36, 37), y: 37 / Math.hypot(36, 37) };
    const rightOf = (t) => ({ x: -t.y * 16, y: t.x * 16 }); // screen right = −90°
    const offSSW = rightOf(tangent);        // dir +1 (down-left) rides the NW side
    const offNNE = rightOf({ x: -tangent.x, y: -tangent.y }); // dir −1 … SE side
    this.diagCenter = (y) => 1680 - (y - 80) * (36 / 37);
    // arcK = arc-length per +1 px of y — dividing by it makes `speed` the
    // true screen speed (same tuning language as the h/v lanes)
    const arcK = Math.hypot(36, 37) / 37;
    this.carLanes.push({
      axis: 'd', dir: 1, lo: 80, hi: 1264,
      offX: offSSW.x, offY: offSSW.y,
      arcK, tx: tangent.x, ty: tangent.y,
    });
    this.carLanes.push({
      axis: 'd', dir: -1, lo: 80, hi: 1264,
      offX: offNNE.x, offY: offNNE.y,
      arcK, tx: tangent.x, ty: tangent.y, // dir folds the flip into δalong
    });

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
      this.applyLane(cars[i], along);
    }
    // v1.1.3: keep the flagship avenue alive — grid roulette usually starves
    // the long Diagonal, so dedicate one car + one scooter to its two lanes
    for (let k = 0; k < T.diagonalCars; k++) {
      const dLanes = this.carLanes.filter((l) => l.axis === 'd');
      const type = k % 2 === 0 ? 'car' : 'scooter';
      const lane = dLanes[k % dLanes.length];
      const speed = type === 'car'
        ? this.randBetween(T.carSpeed)
        : this.randBetween(T.scooterSpeed);
      const along = lane.lo + this.rng() * (lane.hi - lane.lo);
      cars.push({
        type,
        lane,
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
      this.applyLane(cars[cars.length - 1], along);
    }
    return cars;
  }

  /** Place a car on its lane; `along` = coordinate on the axis of travel. */
  applyLane(car, along) {
    if (car.lane.axis === 'h') {
      car.x = along;
      car.y = car.lane.pos + car.wobble; // sway is perpendicular, non-accumulating
    } else if (car.lane.axis === 'v') {
      car.x = car.lane.pos + car.wobble;
      car.y = along;
    } else {
      // Diagonal: along runs down the centerline; clamping keeps the parked
      // extension straight past both avenue ends instead of drifting off-path
      const y = along < car.lane.lo ? car.lane.lo : along > car.lane.hi ? car.lane.hi : along;
      car.x = this.diagCenter(y) + car.lane.offX + (car.wobble * 0.6);
      car.y = along + car.lane.offY;
      car.along = along;
      return;
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
      car.along += car.lane.dir * car.speed * dt / (car.lane.arcK || 1);
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
      let carVx = 0;
      let carVy = 0;
      if (car.lane.axis === 'h') {
        carVx = car.lane.dir * car.speed;
      } else if (car.lane.axis === 'v') {
        carVy = car.lane.dir * car.speed;
      } else {
        // Diagonal: normalized tangent units on the lane make this velocity
        // exactly `speed` px/s along the path (same scale as h/v lanes)
        carVx = car.lane.dir * car.speed * car.lane.tx;
        carVy = car.lane.dir * car.speed * car.lane.ty;
      }
      const relV = Math.hypot(carVx - probe.vx, carVy - probe.vy);
      if (relV < T.nearMissRelSpeed) continue;
      const now = performance.now();
      if (now - car.lastNearMiss < T.nearMissCooldown) continue;
      car.lastNearMiss = now;
      this.emit('nearmiss', { x: car.x, y: car.y, amount: T.nearMissReward });
    }
  }
}
