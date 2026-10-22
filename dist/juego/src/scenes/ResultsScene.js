import * as Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { t } from '../i18n.js';
import { bumpCareer, rankOf } from '../data/career.js';
import { isTouchLike, enterMobileFullscreen } from '../data/settings.js';

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
 * record (localStorage). SPACE, a gamepad button or — since the M13.3
 * phone pass — a tap anywhere restarts.
 *
 * M13.3 layout: under Scale.RESIZE the canvas is the window, so the dim
 * overlay grows with it and the 960×640 design card rivers in a container
 * that re-centers on resize.
 */
export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data) {
    const cx = GAME_WIDTH / 2;

    // the dimmer tracks the real canvas size (redone in syncLayout)
    this.overlay = this.add.rectangle(
      cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14142b, 0.8,
    );

    // ---- everything below stays in 960×640 design coords, inside a card
    // container that recenters on resize
    const card = [];
    const put = (obj) => {
      card.push(obj);
      return obj;
    };

    put(
      this.add
        .text(cx, 96, t('res.title'), { ...MONO, fontSize: '34px', color: '#ffffff' })
        .setOrigin(0.5, 0),
    );

    const color = GRADE_COLOR[data.grade] ?? '#9aa4ad';
    put(
      this.add
        .text(cx - 250, 180, data.grade, { ...MONO, fontSize: '170px', color })
        .setOrigin(0.5, 0),
    );
    put(
      this.add
        .text(cx - 250, 372, t('res.rank'), { ...MONO, fontSize: '16px', color: '#8f96b3' })
        .setOrigin(0.5, 0),
    );

    const rows = [
      t('res.money', { n: Math.round(data.money) }),
      t(data.deliveries === 1 ? 'res.deliveries1' : 'res.deliveriesN', { n: data.deliveries }),
      t('res.streak', { n: data.bestStreak }),
      t('res.nearMiss', { n: data.nearMisses }),
    ];
    // v1.1.3: surface the clock the player earned back through deliveries
    if (data.bonusSeconds > 0) {
      rows.push(t('res.timeBonus', { n: Math.round(data.bonusSeconds) }));
    }
    put(
      this.add
        .text(cx + 60, 196, rows.join('\n'), { ...MONO, fontSize: '22px', color: '#e9e9f5', align: 'left', lineSpacing: 10 })
        .setOrigin(0, 0),
    );

    const best = saveBest({
      money: Math.round(data.money),
      deliveries: data.deliveries,
      grade: data.grade,
      bestStreak: data.bestStreak,
    });
    const bestLine = best.prev
      ? t('res.best', { m: Math.round(best.prev.money), d: best.prev.deliveries }) +
        (best.isNew ? t('res.newRecord') : '')
      : t('res.firstSave');
    put(
      this.add
        .text(cx, 430, bestLine, { ...MONO, fontSize: '15px', color: best.isNew ? '#ffd75e' : '#8f96b3' })
        .setOrigin(0.5, 0),
    );

    // Rider Rank (M8.2): fold the shift into the lifetime career; a tier
    // crossing gets the gold celebration line, the steady state stays cyan.
    const { prev: careerPrev, career } = bumpCareer(data);
    const rank = rankOf(career.deliveries);
    const rankedUp = rankOf(careerPrev.deliveries).key !== rank.key;
    put(
      this.add
        .text(
          cx, 458,
          rankedUp ? t('res.rankUp', { rank: t(rank.key) }) : t('res.career', { rank: t(rank.key), d: career.deliveries }),
          { ...MONO, fontSize: '15px', color: rankedUp ? '#ffd75e' : '#66d9e8' }
        )
        .setOrigin(0.5, 0),
    );

    // M13.3: touch players get the tap-anywhere prompt; desks keep SPACE
    this.againTouch = isTouchLike();
    put(
      this.add
        .text(cx, GAME_HEIGHT - 70, this.againTouch ? t('res.againTouch') : t('res.again'), {
          ...MONO, fontSize: '17px', color: '#ffd75e',
        })
        .setOrigin(0.5, 0),
    );

    this.card = this.add.container(0, 0, card);

    const again = () => {
      // M13.3: phones stay fullscreen-locked to landscape across shifts —
      // runs inside the gesture; every failure path stays silent
      enterMobileFullscreen(this.game);
      this.scene.stop('Game');
      this.scene.stop('HUD');
      this.scene.start('Game'); // starting another scene stops this one
    };
    this.input.keyboard.once('keydown-SPACE', again);
    // any gamepad button restarts too (M6.4)
    if (this.input.gamepad) {
      this.input.gamepad.once('gamepadbuttondown', again);
    }
    // M13.3: tap anywhere restarts (real-phone playtest: touch players had
    // no way back to the street). A finger still held from the shift end
    // produces no new pointerdown, so this only fires on a fresh tap.
    this.input.once('pointerdown', again);

    this.syncLayout = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      this.overlay.setSize(w, h).setPosition(w / 2, h / 2);
      this.card.setPosition((w - GAME_WIDTH) / 2, (h - GAME_HEIGHT) / 2);
    };
    this.syncLayout();
    this.scale.on('resize', this.syncLayout);
    this.events.once('shutdown', () => this.scale.off('resize', this.syncLayout));
  }
}
