/**
 * M8.3 audio prefs — one localStorage-backed switch ("glopi-mute") applied to
 * the Phaser sound manager's master mute, so every SFX and music loop obeys
 * one button on the menu and the HUD.
 *
 * NOTE: music takes its display state from isMuted(); the effective mute
 * is Phaser's GlobalSoundManager.mute (set at boot + on every toggle).
 */
const MUTE_KEY = 'glopi-mute';
const TILT_KEY = 'glopi-tilt';

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch (_e) {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch (_e) { /* storage unavailable */ }
}

/** Push the stored preference into the running Phaser sound manager. */
export function applySoundMute(game) {
  try {
    if (game && game.sound) game.sound.mute = isMuted();
  } catch (_e) { /* sound manager not up yet */ }
}

/** Fullscreen the game canvas (guarded — several browsers limit it). */
export function toggleFullscreen(game) {
  try {
    if (document.fullscreenElement) {
      const exit = document.exitFullscreen();
      if (exit && exit.catch) exit.catch(() => {});
    } else {
      const el = (game && game.canvas) || document.querySelector('canvas');
      const req = el && el.requestFullscreen && el.requestFullscreen();
      if (req && req.catch) req.catch(() => {});
    }
  } catch (_e) {
    // no fullscreen support — stay silent
  }
}

// ---- M13.3 tilt steering preference ("glopi-tilt") ------------------------

/** Coarse pointer = phones/tablets — the worlds the touch UI and tilt cover. */
export function isTouchLike() {
  try {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  } catch (_e) {
    return false;
  }
}

/** Stored tilt pref; unset defaults to ON on touch devices. */
export function isTiltOn() {
  try {
    const v = localStorage.getItem(TILT_KEY);
    if (v != null) return v === '1';
  } catch (_e) { /* storage unavailable */ }
  return isTouchLike();
}

export function setTiltOn(on) {
  try {
    localStorage.setItem(TILT_KEY, on ? '1' : '0');
  } catch (_e) { /* storage unavailable */ }
}


/**
 * M13.3: on phones, starting a shift fullscreen-locks the canvas to
 * landscape (browsers only allow it inside a user gesture, which is where
 * launch() calls this from). iOS has no orientation.lock — it just gets
 * fullscreen, or nothing where even that is unsupported; the touch UI
 * still works everywhere, so every failure path stays silent.
 */
export function enterMobileFullscreen(game) {
  if (!isTouchLike()) return;
  try {
    if (document.fullscreenElement) return;
    const el = (game && game.canvas) || document.querySelector('canvas');
    const rf = el && (el.requestFullscreen || el.webkitRequestFullscreen);
    if (!rf) return;
    const req = rf.call(el, el.requestFullscreen ? { navigationUI: 'hide' } : undefined);
    const lock = () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (_e) { /* iOS et al. — no lock API */ }
    };
    if (req && typeof req.then === 'function') req.then(lock, () => {});
    else lock();
  } catch (_e) {
    // gesture rejected by the engine — the game keeps running windowed
  }
}
