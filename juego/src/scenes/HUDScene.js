import * as Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { tipTier } from '../systems/OrderSystem.js';
import { applySoundMute, isMuted, setMuted, toggleFullscreen } from '../data/settings.js';
import { t } from '../i18n.js';

const MONO = { fontFamily: 'monospace' };

/**
 * M3 HUD: overlay scene running in parallel with Game (launched by
 * GameScene). Top-left order card + top-right session stats. Reads the
 * OrderSystem directly (poll each frame); keeps coupling pragmatic for v1.
 */
export default class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  create() {
    this.cardBg = this.add.rectangle(12, 12, 302, 118, 0x14142b, 0.72).setOrigin(0, 0);
    this.tagText = this.add
      .text(24, 20, '', { ...MONO, fontSize: '13px', color: '#9aa0ff' })
      .setDepth(1);
    this.nameText = this.add
      .text(24, 38, '', { ...MONO, fontSize: '17px', color: '#ffffff' })
      .setDepth(1);
    this.subText = this.add
      .text(24, 62, '', { ...MONO, fontSize: '13px', color: '#8f96b3' })
      .setDepth(1);
    this.fareText = this.add
      .text(24, 80, '', { ...MONO, fontSize: '14px', color: '#ffd75e' })
      .setDepth(1);
    this.barGfx = this.add.graphics().setDepth(1);

    this.statsText = this.add
      .text(GAME_WIDTH - 12, 12, '', { ...MONO, fontSize: '14px', color: '#e9e9f5', align: 'right' })
      .setOrigin(1, 0);

    // shift countdown (M5.3), top-center
    this.shiftText = this.add
      .text(GAME_WIDTH / 2, 12, '', { ...MONO, fontSize: '18px', color: '#e9e9f5' })
      .setOrigin(0.5, 0);

    // collision with the world-space debug overlay (game draws it at the same corner)
    const game = this.scene.get('Game');
    if (game && game.debugText) game.debugText.setPosition(8, GAME_HEIGHT - 112);

    // ---- M8.3 system buttons: sound + fullscreen (top-right) ------------
    this.muteText = this.add
      .text(GAME_WIDTH - 12, 36, isMuted() ? '🔇' : '🔊', { ...MONO, fontSize: '16px', color: '#66d9e8' })
      .setOrigin(1, 0);
    this.muteText.setInteractive({ useHandCursor: true });
    this.muteText.on('pointerdown', (_p, _x, _y, event) => {
      event.stopPropagation();
      setMuted(!isMuted());
      applySoundMute(this.game);
      this.muteText.setText(isMuted() ? '🔇' : '🔊');
    });
    this.fsText = this.add
      .text(GAME_WIDTH - 52, 36, '⛶', { ...MONO, fontSize: '16px', color: '#66d9e8' })
      .setOrigin(1, 0);
    this.fsText.setInteractive({ useHandCursor: true });
    this.fsText.on('pointerdown', (_p, _x, _y, event) => {
      event.stopPropagation();
      toggleFullscreen(this.game);
    });

    // ---- M8.3 touch zones (bottom edges), hidden until a touch is seen --
    this.touch = game ? game.touch : null;
    this.syncTouchUI = () => {};
    if (this.touch) {
      this.touchOn = window.matchMedia
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
      this.touchGfx = this.add.graphics().setDepth(2);
      this.touchBtns = this.touch.zones.map((z) => {
        const big = z.key === 'left' || z.key === 'right';
        const label = big
          ? z.key === 'left' ? '◀' : '▶'
          : z.key === 'pedal' ? t('ui.pedal') : t('ui.brake');
        return this.add
          .text(z.x + z.w / 2, z.y + z.h / 2, label, {
            ...MONO, fontSize: big ? '34px' : '17px', color: '#c8d8e8',
          })
          .setOrigin(0.5)
          .setDepth(2)
          .setVisible(this.touchOn);
      });
      this.syncTouchUI = () => {
        const on = this.touchOn;
        this.touchGfx.clear();
        for (const zone of this.touch.zones) {
          if (!on) break;
          this.touchGfx
            .fillStyle(0x66d9e8, 0.09)
            .lineStyle(2, 0x66d9e8, 0.28);
          this.touchGfx.fillRoundedRect(zone.x, zone.y, zone.w, zone.h, 14);
          this.touchGfx.strokeRoundedRect(zone.x, zone.y, zone.w, zone.h, 14);
        }
        for (const btn of this.touchBtns) btn.setVisible(on);
      };
      this.onFirstTouch = (p) => {
        if (!this.touchOn && p && p.wasTouch) this.setTouchOn(true);
      };
      this.input.on('pointerdown', this.onFirstTouch);
      this.events.once('shutdown', () => {
        this.input.off('pointerdown', this.onFirstTouch);
      });
      this.syncTouchUI();
    }

    // M13.3: responsive anchors — under Scale.RESIZE the canvas IS the
    // window: right/center HUD items track the edges and the touch zones
    // hug them (steer pair bottom-left, brake/pedal pair bottom-right).
    this.syncLayout = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      this.statsText.x = w - 12;
      this.shiftText.x = w / 2;
      this.muteText.x = w - 12;
      this.fsText.x = w - 52;
      if (this.touch) {
        const byKey = {};
        for (const z of this.touch.zones) byKey[z.key] = z;
        const pedal = byKey.pedal;
        const brake = byKey.brake;
        pedal.x = w - 172;
        brake.x = pedal.x - 120; // same 14px gap the design used
        for (const z of this.touch.zones) z.y = h - 170;
        this.touchBtns.forEach((btn, i) => {
          const z = this.touch.zones[i];
          btn.setPosition(z.x + z.w / 2, z.y + z.h / 2);
        });
        this.syncTouchUI();
      }
    };
    this.syncLayout();
    this.scale.on('resize', this.syncLayout);
    this.events.once('shutdown', () => this.scale.off('resize', this.syncLayout));
  }

  /** Coarse-pointer devices (or the first real touch) bring the zones up. */
  setTouchOn(on) {
    if (!this.touch || this.touchOn === !!on) return;
    this.touchOn = !!on;
    this.syncTouchUI();
  }

  update() {
    const game = this.scene.get('Game');
    const sys = game && game.orders;
    const score = game && game.score;
    if (!sys || !score) return;

    // M8.3: ride the live pointers through the touch zones every frame;
    // mouse-only sessions stay inert (zones off ⟹ reset).
    if (this.touch) {
      if (this.touchOn) {
        const mgr = this.input.manager;
        this.touch.update((mgr && mgr.pointers) || []);
      } else {
        this.touch.reset();
      }
    }

    this.barGfx.clear();
    const deliveries = sys.totalDelivered;
    this.statsText.setText(
      `€${Math.round(score.money)} · ${deliveries} ${deliveries === 1 ? t('hud.delivery1') : t('hud.deliveryN')}` +
      (score.bestStreak > 1 ? ` · ${t('hud.streak', { n: score.bestStreak })}` : '')
    );

    const secs = Math.max(0, Math.ceil(score.shiftLeft));
    const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    this.shiftText
      .setText(t('hud.turno', { t: clock }))
      .setColor(secs <= 20 ? '#ff5e8b' : '#e9e9f5');

    const o = sys.order;
    if (!o) {
      this.tagText.setText(t('hud.waitTag')).setColor('#9aa0ff');
      this.nameText.setText(t('hud.waitName'));
      this.subText.setText(t('hud.waitSub'));
      this.fareText.setText('');
      return;
    }

    if (o.state === 'offered') {
      this.tagText.setText(t('hud.pickTag')).setColor('#ffd75e');
      this.nameText.setText(o.restaurant.name);
      this.subText.setText(o.restaurant.dish);
      this.fareText.setText(`€${o.fare} · ${Math.round(o.routePx / 32)}m`);
    } else {
      const frac = Phaser.Math.Clamp(o.timeLeft / o.timeTotal, 0, 1);
      const tier = tipTier(frac);
      this.tagText.setText(t('hud.deliverTag', { word: tier.word })).setColor(tier.color);
      this.nameText.setText(o.customer.name);
      this.subText.setText(o.customer.note);
      const stopTag = o.legCount > 1 ? ` · ${t('hud.stop', { i: o.legIndex + 1, n: o.legCount })}` : '';
      this.fareText.setText(`€${o.customer.fare} · ${this.playerMeters(o.customer)}m${stopTag}`);
      const color = parseInt(tier.color.slice(1), 16);
      this.barGfx.fillStyle(0x2b2b45, 1);
      this.barGfx.fillRect(24, 100, 280, 8);
      this.barGfx.fillStyle(color, 1);
      this.barGfx.fillRect(24, 100, 280 * frac, 8);
    }
  }

  playerMeters(target) {
    const game = this.scene.get('Game');
    if (!game || !game.glopi) return 0;
    const d = Phaser.Math.Distance.Between(
      game.glopi.x, game.glopi.y, target.x, target.y
    );
    return Math.round(d / 32);
  }
}
