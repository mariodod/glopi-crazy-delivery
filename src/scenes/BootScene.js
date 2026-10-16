import Phaser from 'phaser';

/**
 * First scene in the game. Right now it only forwards to gameplay;
 * it will grow into engine-scale setup (renderer checks, device flags).
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Preload');
  }
}
