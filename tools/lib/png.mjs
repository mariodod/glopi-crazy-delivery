// Minimal zero-dependency RGBA PNG writer + tiny pixel canvas.
// Lets the asset generators produce real .png files without npm deps.
import zlib from 'node:zlib';
import { writeFileSync } from 'node:fs';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

export class PixelCanvas {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  set(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    let r, g, b, a;
    if (typeof color === 'number') {
      r = (color >>> 16) & 0xff;
      g = (color >>> 8) & 0xff;
      b = color & 0xff;
      a = 255;
    } else {
      [r, g, b, a = 255] = color;
    }
    const i = (y * this.w + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }

  fill(c) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, c);
  }

  rect(x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }

  frame(x, y, w, h, c) {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }

  /** Filled rect with 1px outline — the bread & butter of readable pixel art. */
  panel(x, y, w, h, fill, outline) {
    this.rect(x, y, w, h, fill);
    this.frame(x, y, w, h, outline);
  }

  hline(x0, x1, y, c) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c);
  }

  vline(x, y0, y1, c) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c);
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  disc(cx, cy, r, c) {
    const r2 = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) this.set(x, y, c);
  }

  ring(cx, cy, r, c, tol = 0.8) {
    for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r) + 1; y++)
      for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r) + 1; x++)
        if (Math.abs(Math.hypot(x - cx, y - cy) - r) <= tol) this.set(x, y, c);
  }

  tri(x0, y0, x1, y1, x2, y2, c) {
    const minY = Math.max(0, Math.ceil(Math.min(y0, y1, y2)));
    const maxY = Math.min(this.h - 1, Math.floor(Math.max(y0, y1, y2)));
    const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (let y = minY; y <= maxY; y++) {
      const xs = [];
      for (const [ax, ay, bx, by] of edges) {
        if (ay === by) continue;
        if (y >= Math.min(ay, by) && y < Math.max(ay, by)) {
          xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((p, q) => p - q);
      if (xs.length >= 2) {
        for (let x = Math.round(xs[0]); x <= Math.round(xs[xs.length - 1]); x++) this.set(x, y, c);
      }
    }
  }

  toPNG() {
    const stride = this.w * 4;
    const raw = Buffer.alloc((stride + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      Buffer.from(this.data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }

  save(path) {
    writeFileSync(path, this.toPNG());
    console.log(`wrote ${path} (${this.w}x${this.h})`);
  }
}

/** Deterministic PRNG so generated art is stable between commits. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
