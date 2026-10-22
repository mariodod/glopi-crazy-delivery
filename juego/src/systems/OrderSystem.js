/**
 * Orders core loop (M3, chains M8.1) — plain JS, decoupled from Phaser so
 * unit tests can run it headlessly (node, vitest later).
 *
 * State machine:  (none) → offered → active → delivered | expired
 * An order is now 1–3 chained stops: a restaurant pickup, then customers
 * back-to-back. Each delivered stop pays immediately and re-arms the clock
 * for the next leg; walking away lets it expire mid-chain.
 * Events:         'spawned', 'accepted', 'legDone', 'delivered',
 *                 'chainDone', 'expired'
 *                 (each emits the order object as payload)
 */
import { t } from '../i18n.js';
/**
 * Crazy-Taxi-style tip tiers: how much delivery time is left decides the
 * tip multiplier. Used by OrderSystem (money math) and the HUD (colors).
 *   GREEN  ≥ 55%  — full tip
 *   YELLOW ≥ 30%  — 60% tip
 *   ORANGE ≥ 12%  — 30% tip
 *   RED    < 12%  — 10% tip
 */
const TIERS = [
  { key: 'GREEN', at: 0.55, mult: 1.0, wordKey: 'tier.word.fast', color: '#7de695' },
  { key: 'YELLOW', at: 0.30, mult: 0.6, wordKey: 'tier.word.ok', color: '#ffd75e' },
  { key: 'ORANGE', at: 0.12, mult: 0.3, wordKey: 'tier.word.late', color: '#ff9e42' },
  { key: 'RED', at: 0, mult: 0.1, wordKey: 'tier.word.slow', color: '#ff5e8b' },
];

/** Resolve the tier for a time fraction, word pre-translated (M7.2). */
export function tipTier(frac) {
  const tier = TIERS.find((tr) => frac >= tr.at) ?? TIERS[TIERS.length - 1];
  return { ...tier, word: t(tier.wordKey) };
}

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
      legDone: new Set(),
      delivered: new Set(),
      chainDone: new Set(),
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
    this.respawnIn = 0; // s; 0 → spawns on the first update()
  }

  get order() {
    return this.current;
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

  /** One chained stop: customer + its route stats measured from `from`. */
  makeStop(point, from, cfg) {
    const routePx = dist(point.x, point.y, from);
    const tiles = routePx / 32;
    return {
      x: point.x,
      y: point.y,
      name: point.name,
      note: point.note,
      routePx: Math.round(routePx),
      fare: Math.max(3, Math.round(cfg.fareBase + tiles * cfg.farePerTile)),
      timeTotal: cfg.timeBase + tiles * cfg.timePerTile,
    };
  }

  /** New offered order: a restaurant ride with 1–3 chained customer stops. */
  spawnOrder() {
    const cfg = this.cfg;
    const r = this.pick(this.restaurants, (p) => p.name !== this.lastRestaurant);
    this.lastRestaurant = r.name;

    // How far does the chain go? 35% get a 2nd stop; conditional 50% of those
    // get a 3rd (≈ an 18% chance of the full triple).
    let legCount = 1;
    if (this.rng() < cfg.chain2Chance) {
      legCount = this.rng() < cfg.chain3Chance ? 3 : 2;
    }

    // Each leg samples a few customers and keeps the farthest from the
    // previous stop, so every leg feels like a real ride, not a 2-tile hop.
    const legs = [];
    const used = [];
    let from = r;
    for (let i = 0; i < legCount; i++) {
      let best = null;
      let bestD = 0;
      for (let s = 0; s < 4; s++) {
        const c = this.pick(this.customers, (p) => !used.includes(p));
        const d = dist(c.x, c.y, from);
        if (d > bestD) {
          bestD = d;
          best = c;
        }
      }
      used.push(best);
      legs.push(this.makeStop(best, from, cfg));
      from = best;
    }

    // While offered, the card teases the FULL chain fare; once accepted the
    // HUD switches to the current leg (passed via this.current.legs/legIndex).
    const fare = legs.reduce((sum, leg) => sum + leg.fare, 0);
    const routePx = legs.reduce((sum, leg) => sum + leg.routePx, 0);
    this.current = {
      id: ++this.orderSeq,
      state: 'offered',
      restaurant: { ...r },
      legs,
      legIndex: 0,
      legCount: legs.length,
      customer: legs[0], // current stop; advances at every delivery
      routePx,
      fare,
      timeTotal: legs[0].timeTotal,
      timeLeft: legs[0].timeTotal, // ticks only once the order is active
      tip: 0,
      pay: 0,
      chainPay: 0,
    };
    this.emit('spawned', this.current);
    return this.current;
  }

  /** Full stop at a restaurant while an order is offered. */
  tryAccept(px, py) {
    const o = this.current;
    if (!o || o.state !== 'offered') return false;
    if (dist(px, py, o.restaurant) > this.cfg.pickupRadius) return false;
    o.state = 'active';
    o.timeLeft = o.legs[0].timeTotal;
    this.emit('accepted', o);
    return true;
  }

  /** Reaching the current stop's zone with the bag auto-completes that leg. */
  tryDeliver(px, py) {
    const o = this.current;
    if (!o || o.state !== 'active') return false;
    if (dist(px, py, o.customer) > this.cfg.dropRadius) return false;

    const stop = o.customer;
    const tier = tipTier(o.timeLeft / o.timeTotal);
    o.tip = Math.round(stop.fare * this.cfg.tipMax * tier.mult);
    o.pay = stop.fare + o.tip;
    o.tier = tier;
    o.chainPay += o.pay;
    this.totalDelivered += 1; // every stop served counts as a delivery

    if (o.legIndex < o.legCount - 1) {
      // mid-chain: pay this leg, then the next stop becomes the target with
      // a fresh clock (handlers run before the reset clears this leg's fields)
      o.nextStop = true;
      this.emit('legDone', o);
      if (this.current !== o) return true; // a handler ended the shift
      o.legIndex += 1;
      o.customer = o.legs[o.legIndex];
      o.timeTotal = o.customer.timeTotal;
      o.timeLeft = o.timeTotal;
      o.tip = 0;
      o.pay = 0;
    } else {
      o.nextStop = false;
      o.state = 'delivered';
      if (this.current !== o) return true; // a handler ended the shift
      this.current = null;
      this.respawnIn = this.cfg.respawnDelay;
      this.emit('delivered', o);
      if (o.legCount > 1) this.emit('chainDone', o);
    }
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
