/**
 * Dev-only sanity check for tools/gif-encoder.js output: walk the GIF
 * structure and LZW-decode every frame, mirroring the encoder.
 *   node tools/verify-gif.mjs promo/gameplay.gif
 */
import { readFileSync } from 'node:fs';
const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/verify-gif.mjs <file.gif>');
  process.exit(1);
}
const b = readFileSync(file);
const tag = b.subarray(0, 6).toString('ascii');
if (tag !== 'GIF89a') {
  console.error('bad signature', tag);
  process.exit(1);
}
const w = b.readUInt16LE(6);
const h = b.readUInt16LE(8);
const packed = b[10];
const gct = (packed >> 7) & 1;
const gctSize = gct ? 2 << (packed & 7) : 0;
let p = 13 + gctSize * 3;

function readBlock(readAt) {
  const len = b[readAt];
  return { sub: readAt + 1, len };
}

/**Decode a full LZW stream from sub-blocks starting at index `at`. */
function lzwDecode(at, minCodeSize, expect) {
  const bytes = [];
  let q = at;
  while (b[q] !== 0) {
    const len = b[q];
    for (let i = 0; i < len; i++) bytes.push(b[q + 1 + i]);
    q += len + 1;
  }
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let dict = [];
  let next = eoi + 1;
  const reset = () => {
    dict = [];
    for (let i = 0; i < clear; i++) dict.push([i]);
    dict.push([]); // clear
    dict.push([]); // eoi
  };
  reset();
  const out = [];
  let bit = 0;
  let prev = null;
  const readCode = () => {
    let code = 0;
    for (let i = 0; i < codeSize; i++) {
      const byte = bytes[(bit >> 3) | 0] ?? 0;
      code |= ((byte >> (bit & 7)) & 1) << i;
      bit++;
    }
    return code;
  };
  while (out.length < expect) {
    const code = readCode();
    if (code === clear) { reset(); next = eoi + 1; codeSize = minCodeSize + 1; prev = null; continue; }
    if (code === eoi) break;
    let entry;
    if (dict[code]) {
      entry = dict[code];
    } else if (prev) {
      entry = [...prev, prev[0]];
    } else {
      throw new Error('bad code at ' + bit);
    }
    for (const v of entry) out.push(v);
    if (prev) {
      dict.push([...prev, entry[0]]);
      next = dict.length;
      if (next === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    prev = entry;
  }
  if (out.length !== expect) throw new Error('frame underflow ' + out.length + '/' + expect);
  return { pixels: out.length, end: q };
}

let frames = 0;
while (p < b.length) {
  const i = b[p];
  if (i === 0x3b) { p++; break; } // trailer
  if (i === 0x21) { // extension
    const label = b[p + 1];
    let q = p + 2;
    while (b[q] !== 0) q += b[q] + 1;
    p = q + 1;
    continue;
  }
  if (i === 0x2c) { // image descriptor
    const minCode = b[p + 10];
    const startAt = p + 11;
    const res = lzwDecode(startAt, minCode, w * h);
    frames++;
    p = res.end + 1; // past the block terminator
    continue;
  }
  throw new Error('unknown block 0x' + i.toString(16) + ' at ' + p);
}
if (p !== b.length) throw new Error('trailing bytes ' + (b.length - p));
console.log(`OK ${tag} ${w}x${h} · GCT ${gct ? gctSize : 0} colors · frames ${frames} · consumed all ${b.length} bytes`);
