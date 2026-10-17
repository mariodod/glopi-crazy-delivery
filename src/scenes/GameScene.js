import * as Phaser from 'phaser';

import {
  GAME_WIDTH, GAME_HEIGHT, PLAYER, VEHICLE, CAMERA, IMPACT, DEBUG_KEY, ORDER, ZONE,
} from '../config.js';
import { createPlaceholderTextures } from '../sprites/placeholders.js';
import { OrderSystem } from '../systems/OrderSystem.js';
import { RESTAURANTS, CUSTOMERS } from '../data/places.js';

/** Middle of La Rambla (cols 32-33), heading north. */
const SPAWN = { x: 1056, y: 288, heading: -Math.PI / 2 };

/** Tiled object name -> frame index in assets/tilesets/landmarks.png. */
const LANDMARK_FRAME = { sagrada: 0, glories: 1, arc: 2 };

/**
 * M2 gameplay: heading-based arcade bike physics. The bike accelerates
 * along its heading; velocity recomposes into forward/lateral components
 * each frame so lateral slip (drift) is damped by grip. Tuning lives in
 * src/config.js VEHICLE — press DEBUG_KEY in-game for live values.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    if (!this.textures.exists(PLAYER.textureKey)) {
      createPlaceholderTextures(this);
    }

    this.buildCity();

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.glopi = this.physics.add.sprite(SPAWN.x, SPAWN.y, PLAYER.textureKey);
    this.glopi.setDepth(20);
    this.glopi.body.setSize(PLAYER.bodyW, PLAYER.bodyH, true);
    this.glopi.body.setCollideWorldBounds(true);

    // Bike state
    this.heading = SPAWN.heading;
    this.vel = new Phaser.Math.Vector2(0, 0);
    this.lastImpact = -1;

    this.physics.add.collider(this.glopi, this.wallLayer, this.onWallHit, null, this);
    this.physics.add.collider(this.glopi, this.groundLayer, this.onWallHit, null, this); // sea edges

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.glopi, true, 0.08, 0.08);

    this.sparks = this.add
      .particles(0, 0, 'spark', {
        lifespan: 320,
        speed: { min: 30, max: 190 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 0,
        emitting: false,
        blendMode: 'ADD',
        tint: 0xffd75e,
      })
      .setDepth(30);

    this.keys = this.input.keyboard.addKeys(
      'W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE'
    );

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop('HUD'); // overlay scene (M3.3); no-op if not running
      this.scene.start('Menu');
    });

    // ---- Orders core loop (M3) -------------------------------------------
    this.orders = new OrderSystem({
      restaurants: this.pickPassable(RESTAURANTS),
      customers: this.pickPassable(CUSTOMERS),
      config: ORDER,
    });
    this.orders.on('spawned', (o) =>
      this.floatText(o.restaurant.x, o.restaurant.y - 48, '¡NUEVO PEDIDO!', '#ffd75e'));
    this.orders.on('accepted', (o) =>
      this.floatText(o.restaurant.x, o.restaurant.y - 48, `¡Recogido! €${o.fare}`, '#7de695'));
    this.orders.on('delivered', (o) =>
      this.floatText(o.customer.x, o.customer.y - 48, `+€${o.pay}${o.tip > 0 ? ` (+€${o.tip} propina!)` : ''}`, '#ffd75e'));
    this.orders.on('expired', (o) =>
      this.floatText(o.customer.x, o.customer.y - 48, '¡Pedido perdido!', '#ff5e8b'));

    // pulsing zone rings + floating label
    this.orderGfx = this.add.graphics().setDepth(14);
    this.beaconGfx = this.add.graphics().setDepth(18);
    this.orderLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffd75e',
        stroke: '#14142b',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(16);
    // ----------------------------------------------------------------------

    // Debug overlay (H): velocity/heading vectors + live tuning readout.
    this.debugOn = false;
    this.debugVals = { forward: 0, lateral: 0 };
    this.debugGfx = this.add.graphics().setDepth(120);
    this.debugText = this.add
      .text(8, 8, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        backgroundColor: '#14142bcc',
        padding: { x: 4, y: 2 },
        color: '#c9f7c1',
      })
      .setScrollFactor(0)
      .setDepth(110);
    this.input.keyboard.on('keydown-' + DEBUG_KEY, () => {
      this.debugOn = !this.debugOn;
      if (!this.debugOn) {
        this.debugGfx.clear();
        this.debugText.setText('');
      }
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, 'M3 · W acelera · S frena · A/D virar · ESPACIO acepta pedido · H debug · ESC = menú', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.85);
  }

  buildCity() {
    this.map = this.add.tilemap('barcelona');
    const city = this.map.addTilesetImage('city', 'city');

    this.groundLayer = this.map.createLayer('Ground', city).setDepth(0);
    this.wallLayer = this.map.createLayer('Walls', city).setDepth(5);

    this.wallLayer.setCollisionByProperty({ collides: true });
    this.groundLayer.setCollisionByProperty({ collides: true });

    const frameOf = LANDMARK_FRAME;
    for (const obj of this.map.getObjectLayer('landmarks')?.objects ?? []) {
      const frame = frameOf[obj.name];
      if (frame === undefined) continue;
      // Decorative doodad; landmark collision zones come with traffic in M4.
      this.add.image(obj.x, obj.y, 'landmarks', frame).setOrigin(0.5, 1).setDepth(8);
    }
  }

  /**
   * Collide callback (walls + sea). Bounces the model velocity along the
   * dominant contact normal and fires FX; arcade already resolved overlap.
   */
  onWallHit() {
    const blocked = this.glopi.body.blocked;
    const impulse = this.vel.length();
    const now = this.time.now;
    if (impulse < IMPACT.minImpulse || now - this.lastImpact < IMPACT.cooldown) {
      return;
    }
    this.lastImpact = now;
    if (blocked.up) this.vel.y = Math.abs(this.vel.y) * IMPACT.restitution;
    if (blocked.down) this.vel.y = -Math.abs(this.vel.y) * IMPACT.restitution;
    if (blocked.left) this.vel.x = Math.abs(this.vel.x) * IMPACT.restitution;
    if (blocked.right) this.vel.x = -Math.abs(this.vel.x) * IMPACT.restitution;

    // Realign heading with the outgoing velocity (bounce forward, not sideways).
    if (this.vel.length() > 20) {
      this.heading = this.vel.angle();
    }

    this.sparks.explode(IMPACT.sparks, this.glopi.x, this.glopi.y);
    this.cameras.main.shake(70, 0.003);
  }

  /** Filter out places whose tile would collide (defensive against map edits). */
  pickPassable(list) {
    return list.filter((p) => {
      const wall = this.wallLayer.getTileAtWorldXY(p.x, p.y);
      const ground = this.groundLayer.getTileAtWorldXY(p.x, p.y);
      const blocked = (wall && wall.properties && wall.properties.collides) ||
        (ground && ground.properties && ground.properties.collides);
      if (blocked) {
        console.warn(`[places] skipped (collider tile): ${p.name || p.note} @ ${p.x},${p.y}`);
      }
      return !blocked;
    });
  }

  /** Short-lived floating text (popups on order events). */
  floatText(x, y, msg, color) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color,
        stroke: '#14142b',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({
      targets: t,
      y: y - 36,
      alpha: 0,
      duration: 1100,
      ease: 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /** Pulsing pickup/dropoff rings + label + beacon arrow. */
  drawOrderZones(nowMs) {
    const g = this.orderGfx;
    g.clear();
    const blink = Math.sin(nowMs / 100);

    this.orderLabel.setText('');
    this.beaconGfx.clear();

    const o = this.orders.order;
    if (!o) return;

    if (o.state === 'offered') {
      this.ring(g, o.restaurant, ORDER.pickupRadius, ZONE.offerColor, blink);
      this.orderLabel
        .setText(`${o.restaurant.name} · ${o.restaurant.dish}`)
        .setColor('#ffd75e')
        .setPosition(o.restaurant.x, o.restaurant.y - 52);
    } else if (o.state === 'active') {
      this.ring(g, o.customer, ORDER.dropRadius, ZONE.activeColor, blink);
      this.orderLabel
        .setText(`${o.customer.name} · ${Math.ceil(o.timeLeft)}s`)
        .setColor('#ff8aa4')
        .setPosition(o.customer.x, o.customer.y - 52);
    }
    this.drawBeacon(o.state === 'offered' ? o.restaurant : o.customer, nowMs);
  }

  ring(g, place, radius, color, blink) {
    const pulse = 0.55 + 0.45 * Math.sin(blink);
    g.fillStyle(color, 0.1 + 0.08 * pulse);
    g.fillCircle(place.x, place.y, radius);
    g.lineStyle(2.5, color, 0.45 + 0.55 * pulse);
    g.strokeCircle(place.x, place.y, radius);
    g.fillStyle(color, 0.95);
    g.fillCircle(place.x, place.y, 3);
  }

  /** Hypnotizing arrow bobbing above Glopi, aimed at the current target. */
  drawBeacon(target, nowMs) {
    const g = this.beaconGfx;
    const bike = this.glopi;
    const bob = Math.sin(nowMs / 1000 * 4) * 3;
    const bx = bike.x;
    const by = bike.y - 56 + bob;
    const ang = Math.atan2(target.y - by, target.x - bx); // aim at the target
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    // local coords: forward = +x (tip ahead); rotate into world space by hand
    const world = (lx, ly) => bx + lx * cos - ly * sin;
    const worldY = (lx, ly) => by + lx * sin + ly * cos;
    g.fillStyle(ZONE.beaconColor, 0.95);
    g.fillTriangle(
      world(14, 0), worldY(14, 0),
      world(-10, -9), worldY(-10, -9),
      world(-10, 9), worldY(-10, 9)
    );
  }

  drawDebug() {
    const g = this.debugGfx;
    const bike = this.glopi;
    const b = bike.body;
    g.clear();

    // physics body outline
    g.lineStyle(1, 0xff4466, 0.9);
    g.strokeRect(b.position.x, b.position.y, b.width, b.height);

    // velocity arrow (yellow)
    g.lineStyle(2, 0xffd75e, 1);
    g.lineBetween(bike.x, bike.y, bike.x + this.vel.x * 0.15, bike.y + this.vel.y * 0.15);

    // heading arrow (cyan)
    const h = new Phaser.Math.Vector2(Math.cos(this.heading), Math.sin(this.heading));
    g.lineStyle(2, 0x66d9e8, 1);
    g.lineBetween(bike.x, bike.y, bike.x + h.x * 44, bike.y + h.y * 44);

    this.debugText.setText(
      [
        `vel   ${this.vel.length().toFixed(0)} px/s`,
        `fwd   ${this.debugVals.forward.toFixed(0)}`,
        `lat   ${this.debugVals.lateral.toFixed(1)}`,
        `head  ${this.heading.toFixed(2)} rad`,
        `zoom  ${this.cameras.main.zoom.toFixed(3)}`,
      ].join('\n')
    );
  }

  update(timeMs, deltaRaw) {
    const dt = Math.min(deltaRaw, 50) / 1000; // frame-rate independent, capped
    const { W, A, S, D, UP, LEFT, DOWN, RIGHT } = this.keys;

    const steer = (D.isDown || RIGHT.isDown ? 1 : 0) - (A.isDown || LEFT.isDown ? 1 : 0);
    const pedaling = W.isDown || UP.isDown;
    const braking = S.isDown || DOWN.isDown;

    const V = VEHICLE;

    // 1) steer the heading (sharper while slow, faded near standstill)
    const spd = this.vel.length();
    const spdFrac = Phaser.Math.Clamp(spd / V.maxSpeed, 0, 1);
    const rate = Phaser.Math.Linear(V.steerRate[0], V.steerRate[1], spdFrac);
    this.heading +=
      steer * rate * Phaser.Math.Clamp(spd / V.steerMinSpeed, 0, 1) * dt;

    // 2) project velocity onto the NEW heading basis. Rotating the heading
    //    leaves the velocity vector untouched, so the projection picks up a
    //    lateral slip component (vel lags the heading = drift arcs).
    const h = new Phaser.Math.Vector2(Math.cos(this.heading), Math.sin(this.heading));
    const p = new Phaser.Math.Vector2(-h.y, h.x);
    let forward = this.vel.dot(h);
    let lateral = this.vel.dot(p);

    // 3) throttle / brake / reverse
    if (pedaling && !braking) {
      forward += V.throttle * dt;
    } else if (braking) {
      forward -= (forward > 0 ? V.brake : V.throttle) * dt;
      if (forward < -V.reverseMax) forward = -V.reverseMax;
    } else if (forward !== 0) {
      const sense = Math.sign(forward);
      forward -= sense * V.coastDrag * dt;
      if (Math.sign(forward) !== sense) forward = 0;
    }
    forward = Phaser.Math.Clamp(forward, -V.reverseMax, V.maxSpeed);

    // 4) lateral slip damps out (grip) and bleeds speed while sliding
    lateral *= Math.exp(-V.grip * dt);
    forward -= lateral * V.driftDrag * dt;

    // 5) recompose — same basis as the projection, so damping is the only
    //    unwanted change and slip survives until grip eats it.
    this.vel.set(h.x * forward + p.x * lateral, h.y * forward + p.y * lateral);

    this.glopi.body.velocity.set(this.vel.x, this.vel.y);
    this.glopi.rotation = this.heading;

    // camera: look where you're going, zoom out at speed
    const cam = this.cameras.main;
    const spdNow = this.vel.length();
    cam.setFollowOffset(-this.vel.x * CAMERA.lookahead, -this.vel.y * CAMERA.lookahead);
    const targetZoom = 1 - CAMERA.zoomSpan * Phaser.Math.Clamp(spdNow / VEHICLE.maxSpeed, 0, 1);
    cam.setZoom(cam.zoom + (targetZoom - cam.zoom) * Math.min(1, CAMERA.zoomLerp * dt));

    this.debugVals = { forward, lateral };
    if (this.debugOn) this.drawDebug();

    // ---- orders core loop (M3) ----
    this.orders.update(dt);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.orders.tryAccept(this.glopi.x, this.glopi.y);
    }
    if (this.orders.inDropRange(this.glopi.x, this.glopi.y)) {
      this.orders.tryDeliver(this.glopi.x, this.glopi.y);
    }
    this.drawOrderZones(timeMs);
  }
}
