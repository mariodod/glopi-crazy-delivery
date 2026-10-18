import * as Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import ResultsScene from './scenes/ResultsScene.js';

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  input: {
    gamepad: true,
  },
  // keeps the GL framebuffer readable between frames: canvas.toDataURL /
  // drawImage stay valid for promo captures (screenshots + gameplay GIF)
  render: {
    preserveDrawingBuffer: true,
  },
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
  scene: [BootScene, PreloadScene, MenuScene, GameScene, HUDScene, ResultsScene],
};

const game = new Phaser.Game(config);

// Debug hook: reach the scene manager from devtools / test probes.
// Way more useful than console.log spaghetti for tuning M2's bike feel.
window.__game = game;
