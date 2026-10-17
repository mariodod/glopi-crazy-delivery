import * as Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { createPlaceholderTextures } from '../sprites/placeholders.js';

/**
 * Loads the city tileset, landmark spritesheet and the Tiled map JSON,
 * with a simple progress bar; generates placeholder textures in create.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const { width, height } = this.scale.gameSize;

    const bar = this.add.graphics();
    const label = this.add
      .text(width / 2, height / 2 - 40, 'Cargando Barcelona…', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const draw = (p) => {
      bar.clear();
      bar.fillStyle(0x2b2b45, 1).fillRect(width / 4, height / 2, width / 2, 12);
      bar.fillStyle(0x27ae60, 1).fillRect(width / 4, height / 2, (width / 2) * p, 12);
    };
    draw(0);
    this.load.on('progress', draw);
    this.load.once('complete', () => {
      bar.destroy();
      label.setText('¡Listo!');
    });

    this.load.image('city', 'assets/tilesets/city.png');
    this.load.spritesheet('landmarks', 'assets/tilesets/landmarks.png', {
      frameWidth: 128,
      frameHeight: 192,
    });
    this.load.tilemapTiledJSON('barcelona', 'assets/tilemaps/barcelona.json');
    this.load.audio('sfx-coin', 'assets/sfx/coin.wav');
    this.load.audio('sfx-blip', 'assets/sfx/blip.wav');
    this.load.audio('sfx-fail', 'assets/sfx/fail.wav');
  }

  create() {
    createPlaceholderTextures(this);
    this.scene.start('Menu');
  }
}
