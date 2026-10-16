import * as Phaser from 'phaser';

import { createPlaceholderTextures } from '../sprites/placeholders.js';

/**
 * Generates in-code placeholder textures today; from M1 on it also
 * loads Tiled maps and real pixel art, with a progress bar in place.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create() {
    createPlaceholderTextures(this);
    this.scene.start('Menu');
  }
}
