import * as Phaser from 'phaser';

import { COLORS, GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config.js';

/**
 * Title screen: game logo, bouncing Glopi and the prompt to start.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.night);

    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 112, "GLOPI'S", {
        fontFamily: 'monospace',
        fontSize: '44px',
        color: '#ffd75e',
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#000000', 4, false, true);

    this.add
      .text(cx, 180, 'CRAZY DELIVERY', {
        fontFamily: 'monospace',
        fontSize: '58px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#27ae60', 6, false, true);

    const glopi = this.add.image(cx, 320, PLAYER.textureKey).setScale(4);
    this.tweens.add({
      targets: glopi,
      y: 334,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(cx, 396, 'Repartidor de Glovo en Barcelona · ¡a pedalear!', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#27ae60',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, 452, 'Pulsa ESPACIO para empezar', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(12, GAME_HEIGHT - 26, 'v0.1.0 · M0 · Phaser 3.90', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8d8daa',
      })
      .setAlpha(0.8);

    const start = () => this.scene.start('Game');
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
