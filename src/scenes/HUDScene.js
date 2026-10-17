import * as Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

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

    // collision with the world-space debug overlay (game draws it at the same corner)
    const game = this.scene.get('Game');
    if (game && game.debugText) game.debugText.setPosition(8, GAME_HEIGHT - 112);
  }

  update() {
    const game = this.scene.get('Game');
    const sys = game && game.orders;
    if (!sys) return;
    this.barGfx.clear();
    this.statsText.setText(`€${Math.round(sys.earnings)} · ${sys.totalDelivered} entrega${sys.totalDelivered === 1 ? '' : 's'}`);

    const o = sys.order;
    if (!o) {
      this.tagText.setText('ESPERA').setColor('#9aa0ff');
      this.nameText.setText('Sigue las flechas…');
      this.subText.setText('nuevo pedido en camino');
      this.fareText.setText('');
      return;
    }

    if (o.state === 'offered') {
      this.tagText.setText('RECOGER · FRENA EN EL CÍRCULO').setColor('#ffd75e');
      this.nameText.setText(o.restaurant.name);
      this.subText.setText(o.restaurant.dish);
      this.fareText.setText(`€${o.fare} · ${Math.round(o.routePx / 32)}m`);
    } else {
      const frac = Phaser.Math.Clamp(o.timeLeft / o.timeTotal, 0, 1);
      this.tagText.setText('ENTREGA').setColor(frac > 0.4 ? '#ff8aa4' : '#ff5e8b');
      this.nameText.setText(o.customer.name);
      this.subText.setText(o.customer.note);
      this.fareText.setText(`€${o.fare} · ${this.playerMeters(o.customer)}m`);
      const color = frac > 0.5 ? 0x51e07a : frac > 0.25 ? 0xffd75e : 0xff5e8b;
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
