/**
 * Scoring & economy (M5) — plain JS, no Phaser dependency.
 *
 * The single wallet for a shift: near-miss bonuses (streak-multiplied),
 * delivery pay, crash penalties. Also tracks best streak and totals that
 * the results screen (M5.3) will grade.
 *
 * Near-miss streak: consecutive misses within `streakWindow` seconds chain
 * up. The bonus multiplier is 1 + multStep × (streak − 1), capped at
 * multMax. Any crash — or letting the window lapse — resets the streak.
 */
export class ScoreSystem {
  /** @param config SCORE block from src/config.js */
  constructor(config) {
    this.cfg = config;
    this.handlers = {
      nearmiss: new Set(),
      deliver: new Set(),
      crash: new Set(),
      shiftEnd: new Set(),
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
    this.money = 0;
    this.streak = 0; // live bonus multiplier level (0 = no chain)
    this.bestStreak = 0;
    this.streakLeft = 0; // s until the chain breaks
    this.nearMisses = 0;
    this.earnedFromMisses = 0; // total bonuses earned from near misses
    this.penalties = 0; // total € actually paid out on crashes
    this.deliveries = 0;
    this.bonusSeconds = 0; // seconds added back by good deliveries (v1.1.2)
    this.shiftLeft = this.cfg.shiftLength ?? 60;
    this.shiftOver = false;
  }

  /** Chain window + shift countdown; call once per frame. */
  update(dt) {
    if (this.streakLeft > 0) {
      this.streakLeft -= dt;
      if (this.streakLeft <= 0) {
        this.streakLeft = 0;
        this.streak = 0;
      }
    }

    if (!this.shiftOver) {
      this.shiftLeft -= dt;
      if (this.shiftLeft <= 0) {
        this.shiftLeft = 0;
        this.shiftOver = true;
        this.emit('shiftEnd', this.snapshot());
      }
    }
  }

  /** Full run summary for the results screen. */
  snapshot() {
    return {
      money: this.money,
      deliveries: this.deliveries,
      bestStreak: this.bestStreak,
      nearMisses: this.nearMisses,
      bonuses: this.earnedFromMisses,
      penalties: this.penalties,
      bonusSeconds: this.bonusSeconds,
    };
  }

  /**
   * Rank letter: weighted score of delivery count, best streak and money.
   * Value = deliveries×3 + bestStreak×2 + floor(money/25), then thresholds.
   */
  grade() {
    const value =
      this.deliveries * 3 +
      this.bestStreak * 2 +
      Math.floor(this.money / 25);
    const { grades } = this.cfg;
    if (value >= grades.S) return 'S';
    if (value >= grades.A) return 'A';
    if (value >= grades.B) return 'B';
    if (value >= grades.C) return 'C';
    return 'D';
  }

  /** Current bonus multiplier for a fresh near-miss (before it chains). */
  multiplier() {
    return Math.min(this.cfg.multMax, 1 + this.cfg.multStep * this.streak);
  }

  /**
   * Near-miss: pass the base € reward; the streak multiplies it and then
   * extends the chain. Returns the bonus actually earned.
   */
  nearMiss(baseAmount) {
    const mult = this.multiplier();
    this.streak += 1;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    this.streakLeft = this.cfg.streakWindow;
    this.nearMisses += 1;
    const amount = Math.round(baseAmount * mult);
    this.money += amount;
    this.earnedFromMisses += amount;
    this.emit('nearmiss', { amount, mult, streak: this.streak });
    return amount;
  }

  /**
   * Delivery pay lands in the wallet (fare + tip) and a good delivery hands
   * seconds back (v1.1.2): the tip tier decides the bonus from
   * SCORE.deliveryBonus, extending the shift. `tierKey` is the tip tier
   * ('GREEN'…'RED'); unknown/omitted tiers just pay, no bonus.
   */
  deliver(pay, tierKey) {
    this.deliveries += 1;
    this.money += pay;
    const table = this.cfg.deliveryBonus;
    const bonus = (tierKey && table?.[tierKey.toLowerCase()]) || 0;
    if (bonus > 0) {
      this.shiftLeft += bonus;
      this.bonusSeconds += bonus;
    }
    this.emit('deliver', { pay, bonus, tierKey });
    return pay;
  }

  /** Crash: lose the chain instantly and pay what the wallet allows. */
  crash(penalty) {
    const paid = Math.min(penalty, this.money);
    this.money -= paid;
    this.penalties += paid;
    this.streak = 0;
    this.streakLeft = 0;
    this.emit('crash', { paid });
    return paid;
  }
}
