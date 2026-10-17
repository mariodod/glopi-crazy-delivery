import * as Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

const MONO = { fontFamily: 'monospace' };

const GRADE_COLOR = {
  S: '#ffd75e',
  A: '#7de695',
  B: '#66d9e8',
  C: '#ff9e42',
  D: '#9aa4ad',
};

const BEST_KEY = 'glopi-best';

/** Previous best turn, if any. Storage can throw in probes — guard it. */
function loadBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || null;
  } catch (_e) {
    return null;
  }
}

function saveBest(entry) {
  const prev = loadBest();
  if (prev && prev.money >= entry.money) {
    return { prev, isNew: false };
  }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(entry));
  } catch (_e) { /* storage unavailable */ }
  return { prev, isNew: true };
}

/**
 * M5.3 results: end-of-shift card with rank, totals and the best-turn
 * record (localStorage). SPACE starts a fresh shift.
 */
export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data) {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14142b, 0.8);
    this.add
      .text(cx, 96, 'SE TERMINÓ EL TURNO', { ...MONO, fontSize: '34px', color: '#ffffff' })
      .setOrigin(0.5, 0);

    const color = GRADE_COLOR[data.grade] ?? '#9aa4ad';
    this.add
      .text(cx - 250, 180, data.grade, { ...MONO, fontSize: '170px', color })
      .setOrigin(0.5, 0);
    this.add
      .text(cx - 250, 372, 'RANGO', { ...MONO, fontSize: '16px', color: '#8f96b3' })
      .setOrigin(0.5, 0);

    const rows = [
      `EUR ${Math.round(data.money)}`,
      `${data.deliveries} entregas`,
      `mejor racha x${data.bestStreak}`,
      `${data.nearMisses} casi-accidentes`,
    ];
    this.add
      .text(cx + 60, 196, rows.join('\n'), { ...MONO, fontSize: '22px', color: '#e9e9f5', align: 'left', lineSpacing: 10 })
      .setOrigin(0, 0);

    const best = saveBest({
      money: Math.round(data.money),
      deliveries: data.deliveries,
      grade: data.grade,
      bestStreak: data.bestStreak,
    });
    const bestLine = best.prev
      ? `mejor turno: €${Math.round(best.prev.money)} · ${best.prev.deliveries} entregas${best.isNew ? '  ¡NUEVO RÉCORD!' : ''}`
      : 'primer turno guardado';
    this.add
      .text(cx, 430, bestLine, { ...MONO, fontSize: '15px', color: best.isNew ? '#ffd75e' : '#8f96b3' })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, GAME_HEIGHT - 70, 'Pulsa ESPACIO para otra ronda', {
        ...MONO, fontSize: '17px', color: '#ffd75e',
      })
      .setOrigin(0.5, 0);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.stop('Game');
      this.scene.stop('HUD');
      this.scene.start('Game'); // starting another scene stops this one
    });
  }
}
