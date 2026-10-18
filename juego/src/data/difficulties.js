/**
 * M7 difficulty tiers — pure data, no Phaser.
 *
 * Each tier is a full override pack: GameScene shallow-merges these onto the
 * base config blocks before wiring the systems, so OrderSystem/TrafficSystem
 * stay untouched. `order.timeMult` scales the order clock
 * (higher = friendlier timings). Default is 'rush' = the M3-M6 tuning.
 */
import { TRAFFIC, PEDS, ORDER } from '../config.js';
import { t } from '../i18n.js';

export const DIFFICULTIES = {
  chill: {
    key: 'chill',
    labelKey: 'tier.calmado',
    descKey: 'tier.calmado.desc',
    traffic: {
      carCount: 6,
      scooterCount: 3,
      carSpeed: [95, 130],
      hitPenalty: 4,
    },
    peds: { count: 10 },
    order: { timeMult: 1.25 },
  },
  rush: {
    key: 'rush',
    labelKey: 'tier.rush',
    descKey: 'tier.rush.desc',
    traffic: {
      carCount: TRAFFIC.carCount,
      scooterCount: TRAFFIC.scooterCount,
      carSpeed: [TRAFFIC.carSpeed[0], TRAFFIC.carSpeed[1]],
      hitPenalty: TRAFFIC.hitPenalty,
    },
    peds: { count: PEDS.count },
    order: { timeMult: 1.0 },
  },
  monsoon: {
    key: 'monsoon',
    labelKey: 'tier.monsoon',
    descKey: 'tier.monsoon.desc',
    traffic: {
      carCount: 12,
      scooterCount: 7,
      carSpeed: [150, 205],
      hitPenalty: 6,
    },
    peds: { count: 20 },
    order: { timeMult: 0.82 },
  },
};

const DIFFICULTY_ORDER = ['chill', 'rush', 'monsoon'];
const DEFAULT_DIFFICULTY = 'rush';
const STORAGE_KEY = 'glopi-diff';

/** Resolve the tier at GameScene.create: data overrides storage overrides default. */
export function resolveDifficulty(sceneData) {
  const fromScene = sceneData && sceneData.difficulty;
  if (fromScene && DIFFICULTIES[fromScene]) return DIFFICULTIES[fromScene];
  return DIFFICULTIES[storedKey()] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
}

/** Read the stored selection ('' on any storage problem). */
export function storedKey() {
  try {
    const k = localStorage.getItem(STORAGE_KEY);
    return k && DIFFICULTIES[k] ? k : DEFAULT_DIFFICULTY;
  } catch (_e) {
    return DEFAULT_DIFFICULTY;
  }
}

/** Persist the selection (silently ignored when storage is unavailable). */
export function storeKey(key) {
  try {
    if (DIFFICULTIES[key]) localStorage.setItem(STORAGE_KEY, key);
  } catch (_e) { /* storage unavailable */ }
}

/** Cycle helper for the menu selector. */
export function nextDiffKey(key, step = 1) {
  const i = DIFFICULTY_ORDER.indexOf(key);
  const n = DIFFICULTY_ORDER.length;
  return DIFFICULTY_ORDER[(i + step + n) % n];
}

/** Merge a tier onto the base config blocks for the systems. */
export function applyDifficulty(key) {
  const d = DIFFICULTIES[key] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
  return {
    difficulty: d,
    traffic: { ...TRAFFIC, ...d.traffic },
    peds: { ...PEDS, ...d.peds },
    order: {
      ...ORDER,
      timeBase: Math.round(ORDER.timeBase * d.order.timeMult),
      timePerTile: ORDER.timePerTile * d.order.timeMult,
    },
  };
}
