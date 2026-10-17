import * as Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config.js';
import { createPlaceholderTextures } from '../sprites/placeholders.js';

/** Middle of La Rambla (cols 32-33, between street rows 8-9). */
const SPAWN = { x: 1056, y: 288 };

/** Tiled object name -> frame index in assets/tilesets/landmarks.png. */
const LANDMARK_FRAME = { sagrada: 0, glories: 1, arc: 2 };

/**
 * M1 gameplay: Glopi rides a real (generated) Barcelona map —
 * Eixample grid, Rambla, Diagonal, beach — with hard collisions.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    if (!this.textures.exists(PLAYER.textureKey)) {
      createPlaceholderTextures(this);
    }

    this.buildCity();

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.glopi = this.physics.add.sprite(SPAWN.x, SPAWN.y, PLAYER.textureKey);
    // Rect body, not circle: Phaser tilemap-vs-body collision does not
    // support circular bodies, so Glopi rides with a slim centered box.
    this.glopi.setDepth(20);
    this.glopi.body.setSize(PLAYER.bodyW, PLAYER.bodyH, true);
    this.glopi.body.setCollideWorldBounds(true);

    this.physics.add.collider(this.glopi, this.wallLayer);
    this.physics.add.collider(this.glopi, this.groundLayer); // water edges

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.glopi, true, 0.08, 0.08);

    this.keys = this.input.keyboard.addKeys(
      'W,A,S,D,UP,LEFT,DOWN,RIGHT'
    );

    this.input.keyboard.once('keydown-ESC', () => this.scene.start('Menu'));

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, 'M1 · Barcelona —Conduce con WASD / flechas · ESC = menú', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.85);
  }

  buildCity() {
    this.map = this.add.tilemap('barcelona');
    const city = this.map.addTilesetImage('city', 'city');

    this.groundLayer = this.map.createLayer('Ground', city).setDepth(0);
    this.wallLayer = this.map.createLayer('Walls', city).setDepth(5);

    this.wallLayer.setCollisionByProperty({ collides: true });
    this.groundLayer.setCollisionByProperty({ collides: true });

    const frameOf = LANDMARK_FRAME;
    for (const obj of this.map.getObjectLayer('landmarks')?.objects ?? []) {
      const frame = frameOf[obj.name];
      if (frame === undefined) continue;
      // Decorative doodad; landmark collision zones come with traffic in M4.
      this.add.image(obj.x, obj.y, 'landmarks', frame).setOrigin(0.5, 1).setDepth(8);
    }
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

    // Smooth arcade feel: chase the target velocity, then rotate toward
    // the travel direction with a capped step so headings lean in.
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
