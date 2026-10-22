/**
 * Dump specific GIF frames to PNG (480x320) using the same LZW decode as
 * tools/verify-gif.mjs. Usage: node tools/gif-frame.mjs promo/gameplay.gif 7,20 out-prefix
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const file = process.argv[2];
const want = (process.argv[3] || '').split(',').map(Number).filter((n) => !isNaN(n));
const prefix = process.argv[4] || 'frame';
const b = readFileSync(file);
const w = b.readUInt16LE(6);
const h = b.readUInt16LE(8);
const packed = b[10];
const gctSize = (packed >> 7) & 1 ? 2 << (packed & 7) : 0;
const gct = [];
for (let i = 0; i < gctSize; i++) {
  gct.push([b[13 + i * 3], b[14 + i * 3], b[15 + i * 3]]);
}

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
    dict.push([]);
    dict.push([]);
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
    if (dict[code]) entry = dict[code];
    else if (prev) entry = [...prev, prev[0]];
    else break;
    for (const v of entry) out.push(v);
    if (prev) {
      dict.push([...prev, entry[0]]);
      next = dict.length;
      if (next === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    prev = entry;
  }
  return { pixels: out, end: q };
}

let p = 13 + gctSize * 3;
let frameIdx = 0;
const slain = {};
while (p < b.length) {
  const i = b[p];
  if (i === 0x3b) break;
  if (i === 0x21) {
    const label = b[p + 1];
    let q = p + 2;
    while (b[q] !== 0) q += b[q] + 1;
    p = q + 1;
    continue;
  }
  if (i === 0x2c) {
    const minCode = b[p + 10];
    const res = lzwDecode(p + 11, minCode, w * h);
    if (want.includes(frameIdx)) slain[frameIdx] = res.pixels;
    frameIdx++;
    p = res.end + 1;
    continue;
  }
  break;
}

for (const idx of Object.keys(slain)) {
  const px = slain[idx];
  // build truecolor
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const c = gct[px[y * w + x]] || [255, 0, 255];
      raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2];
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (const x of body) crc = crcTable[(crc ^ x) & 0xff] ^ (crc >>> 8);
    crc = (crc ^ 0xffffffff) >>> 0;
    const cr = Buffer.alloc(4);
    cr.writeUInt32BE(crc);
    return Buffer.concat([len, body, cr]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(String.raw`C:\Users\mario\Documents\glopi-crazy-delivery\promo__f${idx}.png`, png);
}
console.log('dumped frames', Object.keys(slain).join(', '));
