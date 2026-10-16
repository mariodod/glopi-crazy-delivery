import Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#' + COLORS.night.toString(16).padStart(6, '0'),
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
