import * as Phaser from 'phaser';

import { COLORS, GAME_WIDTH, GAME_HEIGHT, WORLD, PLAYER } from '../config.js';
import { createPlaceholderTextures } from '../sprites/placeholders.js';

/**
 * M0 gameplay: an empty asphalt world, Glopi, and a camera that
 * follows him while you steer with the keyboard.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    if (!this.textures.exists(PLAYER.textureKey)) {
      createPlaceholderTextures(this);
    }

    this.drawPlaceholderWorld();

    this.glopi = this.physics.add.sprite(
      WORLD.width / 2,
      WORLD.height / 2,
      PLAYER.textureKey
    );
    this.glopi.setDepth(10);
    this.glopi.body.setCircle(
      PLAYER.bodyRadius,
      16 - PLAYER.bodyRadius,
      16 - PLAYER.bodyRadius
    );
    this.glopi.body.setCollideWorldBounds(true);

    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.glopi, true, 0.08, 0.08);

    this.keys = this.input.keyboard.addKeys(
      'W,A,S,D,UP,LEFT,DOWN,RIGHT'
    );

    this.input.keyboard.once('keydown-ESC', () => this.scene.start('Menu'));

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, 'M0 ·  WASD / flechas para pedalear · ESC = menú', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.85);
  }

  drawPlaceholderWorld() {
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(COLORS.asphalt, 1);
    g.fillRect(0, 0, WORLD.width, WORLD.height);

    // Faint grid joints so motion is perceivable on a blank canvas.
    g.lineStyle(1, COLORS.asphaltJoint, 0.6);
    for (let x = 0; x <= WORLD.width; x += 64) {
      g.lineBetween(x, 0, x, WORLD.height);
    }
    for (let y = 0; y <= WORLD.height; y += 64) {
      g.lineBetween(0, y, WORLD.width, y);
    }

    g.lineStyle(6, COLORS.border, 0.9);
    g.strokeRect(3, 3, WORLD.width - 6, WORLD.height - 6);

    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
  }

  update() {
    const { W, A, S, D, UP, LEFT, DOWN, RIGHT } = this.keys;

    const dirX = (D.isDown || RIGHT.isDown ? 1 : 0) - (A.isDown || LEFT.isDown ? 1 : 0);
    const dirY = (S.isDown || DOWN.isDown ? 1 : 0) - (W.isDown || UP.isDown ? 1 : 0);

    const input = new Phaser.Math.Vector2(dirX, dirY);
    if (input.lengthSq() > 0) {
      input.normalize().scale(PLAYER.maxSpeed);
    }

    const body = this.glopi.body;

    // Smooth arcade feel: chase the target velocity instead of snapping,
    // then rotate the sprite toward the direction of travel with a capped
    // step so the heading "leans in" instead of snapping instantly.
    body.velocity.x += (input.x - body.velocity.x) * PLAYER.accel;
    body.velocity.y += (input.y - body.velocity.y) * PLAYER.accel;

    if (body.speed > 15) {
      this.glopi.rotation = Phaser.Math.Angle.RotateTo(
        this.glopi.rotation,
        body.velocity.angle(),
        PLAYER.turnRate
      );
    }
  }
}
