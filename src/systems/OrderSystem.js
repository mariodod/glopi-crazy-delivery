/**
 * Orders core loop (M3) — plain JS, decoupled from Phaser so
 * unit tests can run it headlessly (node, vitest later).
 *
 * State machine:  (none) → offered → active → delivered | expired
 * Events:         'spawned', 'accepted', 'delivered', 'expired'
 *                 (each emits the order object as payload)
 */
export class OrderSystem {
  /** @param config  ORDER block from src/config.js */
  constructor({ restaurants, customers, config, rng = Math.random }) {
    if (!restaurants || restaurants.length === 0) throw new Error('OrderSystem: no restaurants');
    if (!customers || customers.length === 0) throw new Error('OrderSystem: no customers');
    this.restaurants = restaurants;
    this.customers = customers;
    this.cfg = config;
    this.rng = rng;
    this.handlers = {
      spawned: new Set(),
      accepted: new Set(),
      delivered: new Set(),
      expired: new Set(),
    };
    this.reset();
  }

  /** Tiny emitter — no Phaser dependency. Returns an unsubscribe fn. */
  on(event, fn) {
    this.handlers[event]?.add(fn);
    return () => this.handlers[event]?.delete(fn);
  }

  emit(event, payload) {
    this.handlers[event]?.forEach((fn) => fn(payload));
  }

  reset() {
    this.current = null;
    this.lastRestaurant = null;
    this.orderSeq = 0;
    this.totalDelivered = 0;
    this.earnings = 0;
    this.respawnIn = 0; // s; 0 → spawns on the first update()
  }

  get order() {
    return this.current;
  }

  get state() {
    return this.current ? this.current.state : 'idle';
  }

  /** Timer + respawn heartbeat; call once per frame. */
  update(dt) {
    if (!this.current) {
      if (this.respawnIn > 0) {
        this.respawnIn -= dt;
        if (this.respawnIn > 0) return;
      }
      this.spawnOrder();
      return;
    }

    const o = this.current;
    if (o.state === 'active') {
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        o.timeLeft = 0;
        o.state = 'expired';
        this.current = null;
        this.respawnIn = this.cfg.respawnDelay;
        this.emit('expired', o);
      }
    }
  }

  /** New offered order at a random restaurant, riding to a far customer. */
  spawnOrder() {
    const cfg = this.cfg;
    const r = this.pick(this.restaurants, (p) => p.name !== this.lastRestaurant);
    this.lastRestaurant = r.name;

    // Sample a few customers and keep the farthest one so the fare scale
    // feels like a real ride, not a 2-tile hop.
    let best = null;
    let bestD = 0;
    for (let i = 0; i < 4; i++) {
      const c = this.pick(this.customers);
      const d = dist(c.x, c.y, r);
      if (d > bestD) {
        bestD = d;
        best = c;
      }
    }

    const fare = Math.max(3, Math.round(cfg.fareBase + (bestD / 32) * cfg.farePerTile));
    this.current = {
      id: ++this.orderSeq,
      state: 'offered',
      restaurant: { ...r },
      customer: { ...best },
      routePx: Math.round(bestD),
      fare,
      timeTotal: cfg.timeBase + (bestD / 32) * cfg.timePerTile,
      timeLeft: 0, // set below
      tip: 0,
      pay: 0,
    };
    this.current.timeLeft = this.current.timeTotal;
    this.emit('spawned', this.current);
    return this.current;
  }

  /** Full stop at a restaurant while an order is offered. */
  tryAccept(px, py) {
    const o = this.current;
    if (!o || o.state !== 'offered') return false;
    if (dist(px, py, o.restaurant) > this.cfg.pickupRadius) return false;
    o.state = 'active';
    this.emit('accepted', o);
    return true;
  }

  /** Reaching the customer zone with the bag auto-completes. */
  tryDeliver(px, py) {
    const o = this.current;
    if (!o || o.state !== 'active') return false;
    if (dist(px, py, o.customer) > this.cfg.dropRadius) return false;
    o.tip = Math.round(o.fare * this.cfg.tipMax * (o.timeLeft / o.timeTotal));
    o.pay = o.fare + o.tip;
    o.state = 'delivered';
    this.current = null;
    this.totalDelivered += 1;
    this.earnings += o.pay;
    this.respawnIn = this.cfg.respawnDelay;
    this.emit('delivered', o);
    return true;
  }

  /** Convenience predicates used for hints + zone pulsing. */
  inPickupRange(px, py) {
    const o = this.current;
    return !!o && o.state === 'offered' && dist(px, py, o.restaurant) <= this.cfg.pickupRadius;
  }

  inDropRange(px, py) {
    const o = this.current;
    return !!o && o.state === 'active' && dist(px, py, o.customer) <= this.cfg.dropRadius;
  }

  pick(list, filter) {
    let pool = list;
    if (filter) {
      pool = list.filter(filter);
      if (pool.length === 0) pool = list;
    }
    return pool[Math.floor(this.rng() * pool.length)];
  }
}

function dist(px, py, point) {
  return Math.hypot(point.x - px, point.y - py);
}
