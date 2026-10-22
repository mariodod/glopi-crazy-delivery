import * as Phaser from 'phaser';

import { COLORS, GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config.js';
import { DIFFICULTIES, nextDiffKey, storedKey, storeKey } from '../data/difficulties.js';
import { loadCareer, rankOf } from '../data/career.js';
import { applySoundMute, isMuted, isTiltOn, setTiltOn, setMuted, toggleFullscreen, enterMobileFullscreen } from '../data/settings.js';
import { cycleLang, getLang, t } from '../i18n.js';

/**
 * Title screen: game logo, bouncing Glopi and the prompt to start.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.night);

    const cx = GAME_WIDTH / 2;

    this.titleText = this.add
      .text(cx, 112, "GLOPI'S", {
        fontFamily: 'monospace',
        fontSize: '44px',
        color: '#ffd75e',
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#000000', 4, false, true);

    this.crazyText = this.add
      .text(cx, 180, 'CRAZY DELIVERY', {
        fontFamily: 'monospace',
        fontSize: '58px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#27ae60', 6, false, true);

    const glopi = this.add.image(cx, 320, PLAYER.textureKey).setScale(4);
    this.glopiPortrait = glopi;
    this.tweens.add({
      targets: glopi,
      y: 334,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.subtitle = this.add
      .text(cx, 396, t('menu.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#27ae60',
      })
      .setOrigin(0.5);

    this.prompt = this.add
      .text(cx, 452, t('menu.prompt'), {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.stampText = this.add
      .text(12, GAME_HEIGHT - 26, 'v1.3 · M13 · Phaser 3.90', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8d8daa',
      })
      .setAlpha(0.8);

    // ---- difficulty tier selector (M7): click or arrows to cycle ----------
    this.diffKey = storedKey();
    const TIER_COLORS = { chill: '#7de695', rush: '#ffd75e', monsoon: '#ff9e42' };
    // ---- Rider Rank (M8.2): lifetime badge, hidden on fresh profiles -------
    this.rankText = this.add
      .text(12, 10, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#66d9e8',
      });
    this.diffText = this.add
      .text(cx, 520, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.diffDesc = this.add
      .text(cx, 550, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8d8daa',
      })
      .setOrigin(0.5);
    this.langText = this.add
      .text(GAME_WIDTH - 12, 12, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#66d9e8',
      })
      .setOrigin(1, 0);
    this.langHint = this.add
      .text(GAME_WIDTH - 12, 32, t('menu.langHint'), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#5b5b78',
      })
      .setOrigin(1, 0);

    // ---- system buttons (M8.3): sound + fullscreen, right column --------
    this.muteText = this.add
      .text(GAME_WIDTH - 12, 54, '', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#66d9e8',
      })
      .setOrigin(1, 0);
    this.fsText = this.add
      .text(GAME_WIDTH - 46, 54, '⛶', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#66d9e8',
      })
      .setOrigin(1, 0);

    // ---- M13.3 tilt steering row: tap or the T key toggles device lean ----
    this.tiltText = this.add
      .text(cx, 584, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#66d9e8',
      })
      .setOrigin(0.5);

    const refreshMenuTexts = () => {
      const tier = DIFFICULTIES[this.diffKey];
      this.subtitle.setText(t('menu.subtitle'));
      this.prompt.setText(t('menu.prompt'));
      this.diffText
        .setText(`◀ ${t('menu.turno')} ${t(tier.labelKey)} ▶`)
        .setColor(TIER_COLORS[this.diffKey] ?? '#ffffff');
      this.diffDesc.setText(t(tier.descKey));
      this.langText.setText(t('menu.lang', { lang: getLang().toUpperCase() }));
      this.muteText.setText(isMuted() ? '🔇' : '🔊');
      // M13.3 tilt row reflects the stored preference (cyan = engaged)
      this.tiltText
        .setText(t('menu.tilt', { mode: isTiltOn() ? t('ui.tiltTilt') : t('ui.tiltTouch') }))
        .setColor(isTiltOn() ? '#66d9e8' : '#8d8daa');
      const career = loadCareer();
      this.rankText
        .setText(career && career.shifts > 0 ? t('menu.rank', { rank: t(rankOf(career.deliveries).key), d: career.deliveries }) : '');
    };
    const cycleDiff = () => {
      this.diffKey = nextDiffKey(this.diffKey, 1);
      storeKey(this.diffKey);
      refreshMenuTexts();
    };
    const pointerCycle = (cycle) => {
      this.diffClickedAt = performance.now(); // block the start-on-click binding
      cycle();
    };
    const cycleLangUi = () => {
      cycleLang();
      refreshMenuTexts();
    };
    const cycleTilt = () => {
      setTiltOn(!isTiltOn());
      refreshMenuTexts();
    };
    refreshMenuTexts();
    this.diffText.setInteractive({ useHandCursor: true });
    this.diffText.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation(); // cycle the tier; don't start the shift
      pointerCycle(cycleDiff);
    });
    this.langText.setInteractive({ useHandCursor: true });
    this.langText.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation();
      pointerCycle(cycleLangUi);
    });
    // sound + fullscreen share the click-gate so they never launch a shift
    this.muteText.setInteractive({ useHandCursor: true });
    this.muteText.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation();
      pointerCycle(() => {
        setMuted(!isMuted());
        applySoundMute(this.game);
        refreshMenuTexts();
      });
    });
    this.fsText.setInteractive({ useHandCursor: true });
    this.fsText.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation();
      pointerCycle(() => toggleFullscreen(this.game));
    });
    // M13.3: the tilt row shares the click-gate so a tap on it never starts
    this.tiltText.setInteractive({ useHandCursor: true });
    this.tiltText.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation();
      pointerCycle(cycleTilt);
    });
    this.input.keyboard.on('keydown-LEFT', cycleDiff);
    this.input.keyboard.on('keydown-RIGHT', cycleDiff);
    this.input.keyboard.on('keydown-L', cycleLangUi);
    this.input.keyboard.on('keydown-T', cycleTilt);

    const launch = () => {
      // M13.3: phones start fullscreen-locked to landscape — this call must
      // run inside the launching gesture; every failure path stays silent
      enterMobileFullscreen(this.game);
      this.scene.start('Game', { difficulty: this.diffKey });
    };
    const start = () => {
      // a click within the last 300ms was the tier/lang row cycling, not a start
      if (performance.now() - (this.diffClickedAt || 0) < 300) return;
      launch();
    };
    this.input.keyboard.once('keydown-SPACE', launch);
    this.input.keyboard.once('keydown-ENTER', launch);
    this.input.once('pointerdown', start);
    // any gamepad button starts too (M6.4)
    if (this.input.gamepad) this.input.gamepad.once('gamepadbuttondown', launch);

    // M13.3: under Scale.RESIZE the canvas IS the window — re-anchor the
    // columns on resize (center content, right tools, bottom stamp)
    this.syncLayout = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      const cxw = w / 2;
      this.titleText.x = cxw;
      this.crazyText.x = cxw;
      this.glopiPortrait.x = cxw;
      this.subtitle.x = cxw;
      this.prompt.x = cxw;
      this.diffText.x = cxw;
      this.diffDesc.x = cxw;
      this.tiltText.x = cxw;
      this.langText.x = w - 12;
      this.langHint.x = w - 12;
      this.muteText.x = w - 12;
      this.fsText.x = w - 46;
      this.stampText.setPosition(12, h - 26);
    };
    this.syncLayout();
    this.scale.on('resize', this.syncLayout);
    this.events.once('shutdown', () => this.scale.off('resize', this.syncLayout));
  }
}
