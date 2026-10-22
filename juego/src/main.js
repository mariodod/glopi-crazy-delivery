import * as Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import ResultsScene from './scenes/ResultsScene.js';

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config.js';
import { applySoundMute } from './data/settings.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  input: {
    gamepad: true,
    // M13.3: 4 active pointers (mouse + 3 touches). Phaser ships ONE touch
    // pointer by default, so the second finger stole pointer1 and steering
    // while pedaling never registered (real-phone playtest).
    activePointers: 4,
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
    // M13.3: RESIZE (was FIT) — the canvas IS the window, so landscape
    // phones go full-bleed with more city visible; scenes re-anchor their
    // UI on the resize event (see syncLayout in each scene).
    mode: Phaser.Scale.RESIZE,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, HUDScene, ResultsScene],
};

const game = new Phaser.Game(config);

// Debug hook: reach the scene manager from devtools / test probes.
// Way more useful than console.log spaghetti for tuning M2's bike feel.
window.__game = game;

// M8.3: honor the stored audio preference once the sound manager is ready.
game.events.once('ready', () => applySoundMute(game));
