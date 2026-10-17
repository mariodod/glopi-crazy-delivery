// tools/gen-sfx.mjs — tiny zero-dependency SFX generator (16-bit PCM WAV).
// Run: node tools/gen-sfx.mjs  →  assets/sfx/*.wav
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050; // Hz
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Mix exponential-decay sine notes (+1 octave shimmer) into a mono buffer. */
function build(totalSec, notes) {
  const n = Math.ceil(totalSec * SR);
  const data = new Float32Array(n);
  for (const nt of notes) {
    const start = Math.max(0, Math.floor(nt.t0 * SR));
    const len = Math.min(Math.floor(nt.dur * SR), n - start);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const attack = Math.min(1, t / 0.006);
      const env = attack * Math.exp(-nt.decay * t);
      const wave =
        Math.sin(2 * Math.PI * nt.freq * t) * 0.74 +
        Math.sin(2 * Math.PI * nt.freq * 2 * t) * 0.26;
      data[start + i] += nt.gain * env * wave;
    }
  }
  return data;
}

/** Standard 44-byte header, 16-bit little-endian mono PCM. */
function writeWav(path, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(path, buf);
}

const sfxDir = join(root, 'assets', 'sfx');
mkdirSync(sfxDir, { recursive: true });

// coin.wav — delivery jingle: quick two-note sparkle (B5 → E6)
writeWav(join(sfxDir, 'coin.wav'), build(0.5, [
  { freq: 987.77, gain: 0.5, t0: 0, dur: 0.12, decay: 24 },
  { freq: 1318.51, gain: 0.55, t0: 0.09, dur: 0.4, decay: 9 },
]));

// blip.wav — order accept: low pop with an octave overtone (A4)
writeWav(join(sfxDir, 'blip.wav'), build(0.16, [
  { freq: 440, gain: 0.55, t0: 0, dur: 0.09, decay: 30 },
  { freq: 880, gain: 0.2, t0: 0.02, dur: 0.1, decay: 30 },
]));

// fail.wav — expiry: descending sad pair (E4 → B3)
writeWav(join(sfxDir, 'fail.wav'), build(0.45, [
  { freq: 329.63, gain: 0.5, t0: 0, dur: 0.18, decay: 14 },
  { freq: 246.94, gain: 0.55, t0: 0.15, dur: 0.3, decay: 10 },
]));

// bell.wav — bike bell: two rising dings (G6 → C7), bright and short
writeWav(join(sfxDir, 'bell.wav'), build(0.5, [
  { freq: 1567.98, gain: 0.45, t0: 0, dur: 0.12, decay: 26 },
  { freq: 2093.0, gain: 0.55, t0: 0.11, dur: 0.34, decay: 11 },
]));

console.log('generated: assets/sfx/coin.wav, assets/sfx/blip.wav, assets/sfx/fail.wav, assets/sfx/bell.wav');
