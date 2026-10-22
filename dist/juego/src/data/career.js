/**
 * M8.2 Rider Rank — career totals in localStorage (`glopi-career`) and the
 * rank ladder by lifetime deliveries. Pure data, no Phaser, storage-guarded
 * like difficulties.js. GameScene feeds the totals at Results (= shift end).
 */
const STORAGE_KEY = 'glopi-career';

/** Rank ladder: lifetime deliveries threshold → i18n title. */
const RANKS = [
  { at: 0, key: 'rank.novato' },
  { at: 10, key: 'rank.junior' },
  { at: 30, key: 'rank.senior' },
  { at: 60, key: 'rank.experto' },
  { at: 100, key: 'rank.guru' },
  { at: 150, key: 'rank.leyenda' },
];

/** Read the stored career stats ('' ⟹ fresh profile). */
export function loadCareer() {
  try {
    const c = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (c && typeof c === 'object') {
      // defensive against anything but numbers in storage
      return {
        shifts: c.shifts | 0,
        deliveries: c.deliveries | 0,
        money: Number(c.money) || 0,
      };
    }
  } catch (_e) { /* storage unavailable */ }
  return null;
}

function saveCareer(career) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(career));
  } catch (_e) { /* storage unavailable */ }
}

/** Blank career (fresh profiles). */
function emptyCareer() {
  return { shifts: 0, deliveries: 0, money: 0 };
}

/**
 * Fold one finished shift into the career. Rank uses lifetime DELIVERIES
 * (crash money noise shouldn't gate the ladder); money is kept for the menu.
 * Negative-shift money (crashes) never lowers the lifetime tally.
 */
export function bumpCareer(snapshot) {
  const prev = loadCareer() ?? emptyCareer();
  const career = {
    shifts: prev.shifts + 1,
    deliveries: prev.deliveries + Math.max(0, snapshot.deliveries | 0),
    money: prev.money + Math.max(0, Math.round(snapshot.money || 0)),
  };
  saveCareer(career);
  return { prev, career };
}

/** Resolve rank + progress for a delivered count. */
export function rankOf(deliveries) {
  let rank = RANKS[0];
  for (const r of RANKS) if (deliveries >= r.at) rank = r;
  return {
    ...rank,
    next: RANKS.find((r) => deliveries < r.at) ?? null,
  };
}
