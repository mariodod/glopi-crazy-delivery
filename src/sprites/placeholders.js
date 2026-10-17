import * as Phaser from 'phaser';

/**
 * Placeholder textures generated at runtime for M0.
 * Real pixel art in assets/sprites will replace these from M1 on.
 */

/**
 * Draws Glopi seen from above riding his bike: round pineapple body
 * with a crosshatch pattern and green leaves pointing RIGHT (+X), so
 * `sprite.rotation = velocity angle` reads correctly.
 */
function drawGlopi(g) {
  const cx = 14;
  const cy = 16;
  const r = 10;

  // Leaves sprouting to the right (three spikes).
  g.fillStyle(0x2ecc71, 1);
  g.fillTriangle(20, 13, 31, 5, 24, 15); // upper
  g.fillStyle(0x27ae60, 1);
  g.fillTriangle(18, 12, 31, 16, 18, 20); // middle (facing forward)
  g.fillStyle(0x2ecc71, 1);
  g.fillTriangle(20, 19, 31, 27, 24, 17); // lower

  // Body.
  g.fillStyle(0xffd75e, 1);
  g.fillCircle(cx, cy, r);
  g.lineStyle(2, 0x8a5a00, 1);
  g.strokeCircle(cx, cy, r);

  // Diamond crosshatch clipped to the circle.
  const hatch = (deg) => {
    const a = Phaser.Math.DegToRad(deg);
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    for (let d = -6; d <= 6; d += 3) {
      const len = Math.sqrt(Math.max(r * r - d * d, 0)) - 1.5;
      if (len <= 0) continue;
      const nx = -uy;
      const ny = ux;
      const px = cx + nx * d;
      const py = cy + ny * d;
      g.lineBetween(px - ux * len, py - uy * len, px + ux * len, py + uy * len);
    }
  };
  g.lineStyle(1, 0xa9741a, 1);
  hatch(45);
  hatch(135);
}

export function createPlaceholderTextures(scene) {
  if (scene.textures.exists('glopi')) return;

  const g = scene.add.graphics();
  drawGlopi(g);
  g.generateTexture('glopi', 32, 32);

  drawSpark(g);
  g.generateTexture('spark', 4, 4);

  g.destroy();
}

/** Small white-hot spark pixel for wall impact particles. */
function drawSpark(g) {
  g.fillStyle(0xffd75e, 1);
  g.fillCircle(2, 2, 2);
  g.fillStyle(0xffffff, 1);
  g.fillRect(1, 1, 2, 2);
}
