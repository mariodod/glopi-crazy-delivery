// tools/gen-music.mjs — zero-dependency chiptune loop generator (16-bit PCM WAV).
// Run: node tools/gen-music.mjs  →  assets/sfx/music-calm.wav + music-chaos.wav
//
// Both files share the SAME length, tempo and rhythm spine so the scene
// can crossfade between them without losing the beat (M6.2 dynamic music).
// Notes written close to the loop end wrap modulo the buffer → seamless.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050; // Hz
const BPM = 106;
const BEAT = 60 / BPM;
const BARS = 4;
const LOOP = BARS * 4 * BEAT; // ~9.06 s of seamless groove
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const N = Math.round(LOOP * SR);

/** Mix into the buffer with modulo wrap, so tail notes loop seamlessly. */
function mixIn(data, t0, dur, gain, wave) {
  const start = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    data[(start + i) % N] += gain * wave(t);
  }
}

const kick = (t) => {
  // pitch-dropping sine with a tiny click for the stick
  const pitch = 120 * Math.exp(-30 * t) + 44;
  return Math.sin(2 * Math.PI * pitch * t) * Math.exp(-14 * t);
};
const hat = (t) =>
  // deterministic pseudo-noise: two close high sines beat against each other
  ((Math.sin(2 * Math.PI * 2827 * t) + Math.sin(2 * Math.PI * 3313 * t)) / 2) *
  Math.exp(-55 * t) * 0.5;
const bass = (freq) => (t) => {
  // rounded square: harmonic mix, decays into the pulse
  const env = Math.min(1, t / 0.004) * Math.exp(-6 * t);
  return (
    (Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.4) * env
  );
};
const pad = (freqs) => (t) => {
  const a = Math.min(1, t / 0.25);
  let v = 0;
  for (const f of freqs) v += Math.sin(2 * Math.PI * f * t);
  return (v / freqs.length) * a * Math.exp(-1.0 * t);
};
const arp = (freq) => (t) => {
  // bright triangle-ish ping
  const f = Math.min(1, t / 0.003) * Math.exp(-9 * t);
  return (Math.abs((freq * t) % 1 * 4 - 2) - 1) * f * 0.9 +
    Math.sin(2 * Math.PI * freq * t) * f * 0.35;
};

/** Write 44-byte header mono 16-bit PCM. */
function writeWav(path, samples) {
  const buf = Buffer.alloc(44 + N * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + N * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  writeFileSync(path, buf);
  console.log(`wrote ${path} (${N} samples, ${(LOOP).toFixed(2)}s)`);
}

function normalize(data, peak = 0.72) {
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  if (max > 0) {
    const k = peak / max;
    for (let i = 0; i < data.length; i++) data[i] *= k;
  }
}

// A minor groove: Am / Am / F / G  — chord roots and triads per bar
const ROOTS = [110.0, 110.0, 87.31, 98.0]; // A2, A2, F2, G2
const TRIADS = [
  [220.0, 261.63, 329.63], // Am
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];

const outDir = join(root, 'assets', 'sfx');
mkdirSync(outDir, { recursive: true });

// ---------- rhythm spine (identical in both loops so crossfade holds) ----------
function addSpine(data, { bassGain, kickGain }) {
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT;
    const rootHz = ROOTS[bar];
    for (let beat = 0; beat < 4; beat++) {
      mixIn(data, t0 + beat * BEAT, 0.4, kickGain, kick);
    }
    // walking 8ths: root on the beat, fifth on the 'and'
    for (let eighth = 0; eighth < 8; eighth++) {
      const t = t0 + eighth * BEAT * 0.5;
      const hz = eighth % 2 === 0 ? rootHz : rootHz * 1.5;
      mixIn(data, t, BEAT * 0.48, bassGain, bass(hz));
    }
    // skip-fill on the last bar: kick double at beat 4
    if (bar === BARS - 1) {
      mixIn(data, t0 + 3 * BEAT + BEAT * 0.5, 0.35, kickGain * 0.9, kick);
    }
  }
}

// ---------- CALM: pads + sparse hats ----------
{
  const data = new Float32Array(N);
  addSpine(data, { bassGain: 0.2, kickGain: 0.42 });
  for (let bar = 0; bar < BARS; bar++) {
    mixIn(data, bar * 4 * BEAT, 4 * BEAT, 0.16, pad(TRIADS[bar]));
    mixIn(data, bar * 4 * BEAT + BEAT, 0.08, 0.12, hat);
    mixIn(data, bar * 4 * BEAT + 3 * BEAT, 0.08, 0.12, hat);
  }
  normalize(data, 0.6);
  writeWav(join(outDir, 'music-calm.wav'), data);
}

// ---------- CHAOS: 16th arpeggio + busy hats ----------
{
  const data = new Float32Array(N);
  addSpine(data, { bassGain: 0.3, kickGain: 0.5 });
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT;
    const triad = TRIADS[bar];
    // 16th arpeggio cycling the triad + an octave lift
    for (let sixteenth = 0; sixteenth < 16; sixteenth++) {
      const t = t0 + sixteenth * BEAT * 0.25;
      const tone = triad[sixteenth % 3] * (sixteenth % 8 === 7 ? 2 : 1);
      mixIn(data, t, 0.14, 0.11, arp(tone));
    }
    // 8th hats, 16th burst on the last bar
    for (let eighth = 0; eighth < 8; eighth++) {
      mixIn(data, t0 + eighth * BEAT * 0.5, 0.06, 0.1, hat);
    }
    if (bar === BARS - 1) {
      for (let s16 = 8; s16 < 16; s16++) {
        mixIn(data, t0 + s16 * BEAT * 0.25, 0.05, 0.1, hat);
      }
    }
  }
  normalize(data, 0.62);
  writeWav(join(outDir, 'music-chaos.wav'), data);
}
