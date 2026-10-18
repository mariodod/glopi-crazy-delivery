/**
 * M8.3 audio prefs — one localStorage-backed switch ("glopi-mute") applied to
 * the Phaser sound manager's master mute, so every SFX and music loop obeys
 * one button on the menu and the HUD.
 *
 * NOTE: music takes its display state from isMuted(); the effective mute
 * is Phaser's GlobalSoundManager.mute (set at boot + on every toggle).
 */
const MUTE_KEY = 'glopi-mute';

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
