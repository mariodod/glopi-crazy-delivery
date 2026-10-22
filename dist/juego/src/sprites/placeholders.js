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

  drawCar(g);
  g.generateTexture('car', 40, 22);

  drawScooter(g);
  g.generateTexture('scooter', 18, 12);

  drawPed(g);
  g.generateTexture('ped', 12, 16);

  g.destroy();
}

/** Small white-hot spark pixel for wall impact particles. */
function drawSpark(g) {
  g.fillStyle(0xffd75e, 1);
  g.fillCircle(2, 2, 2);
  g.fillStyle(0xffffff, 1);
  g.fillRect(1, 1, 2, 2);
}

/** Top-down car facing +x (0 = forward). White so sprites can tint it. */
function drawCar(g) {
  // wheels
  g.fillStyle(0x222222, 1);
  g.fillRect(7, 0, 7, 4);
  g.fillRect(7, 18, 7, 4);
  g.fillRect(27, 0, 7, 4);
  g.fillRect(27, 18, 7, 4);
  // body
  g.fillStyle(0xffffff, 1);
  g.fillRect(2, 3, 37, 16);
  // windshield + rear window
  g.fillStyle(0x2b2b45, 1);
  g.fillRect(24, 5, 5, 12);
  g.fillRect(3, 5, 3, 12);
  // headlights
  g.fillStyle(0xffe08a, 1);
  g.fillRect(38, 5, 2, 4);
  g.fillRect(38, 13, 2, 4);
}

/** Top-down scooter facing +x. */
function drawScooter(g) {
  g.fillStyle(0x222222, 1);
  g.fillRect(1, 3, 3, 6);   // rear wheel
  g.fillRect(12, 3, 3, 6);  // front wheel
  g.fillStyle(0xffffff, 1);
  g.fillRect(3, 1, 12, 10); // deck + rider base
  g.fillStyle(0x333333, 1);
  g.fillCircle(8, 6, 3);    // rider
  g.fillStyle(0xffe08a, 1);
  g.fillRect(16, 4, 2, 4);  // headlight
}

/** Tiny pedestrian (best watched while scattering). */
function drawPed(g) {
  g.fillStyle(0x2b2b45, 1);
  g.fillRect(5, 11, 2, 5);  // legs
  g.fillStyle(0xffd75e, 1); // shirt (pineapple-ish matching)
  g.fillRect(4, 5, 4, 6);
  g.fillStyle(0xe8b88a, 1); // head
  g.fillCircle(6, 3, 3);
}
