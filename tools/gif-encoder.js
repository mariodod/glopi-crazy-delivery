/**
 * Zero-dependency GIF89a encoder (browser + node).
 * M7.3 promo pipeline: gameplay frames are captured inside the dev tab
 * (downscaled via a 2D canvas), quantized to the classic 3-3-2 color cube
 * (256 colors, index = rrrgggbb) and LZW-compressed here. No npm deps.
 *
 *   encodeGIF(frames, w, h, delayCs) -> Uint8Array
 *     frames  Array<Uint8Array>, each w*h bytes of palette indexes
 *     delayCs per-frame delay in 1/100 s units
 */
export function encodeGIF(frames, w, h, delayCs) {
  // ---- header + logical screen + global 3-3-2 palette ------------------
  const out = [];
  const push = (...bytes) => out.push(...bytes);
  pushStr(out, 'GIF89a');
  push(w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff);
  push(0xe7, 0, 0); // GCT present, 256 entries
  for (let i = 0; i < 256; i++) {
    const r = Math.round(((i >> 5) & 7) * 255 / 7);
    const g = Math.round(((i >> 2) & 7) * 255 / 7);
    const b = Math.round((i & 3) * 255 / 3);
    push(r, g, b);
  }
  // Netscape extension: loop forever
  push(0x21, 0xff, 0x0b);
  pushStr(out, 'NETSCAPE2.0');
  push(3, 1, 0, 0, 0);

  for (const pix of frames) {
    // graphic control extension: keep frame, delay, opaque
    push(0x21, 0xf9, 4, 0x04, delayCs & 0xff, (delayCs >> 8) & 0xff, 0, 0);
    // image descriptor: left(2) top(2) width(2) height(2) packed(1)
    push(0x2c, 0, 0, 0, 0, w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff, 0);
    // LZW data stream
    push(8);
    for (const block of lzwBlocks(pix, 8)) push(...block);
    push(0x00); // block terminator
  }
  push(0x3b); // trailer
  return new Uint8Array(out);
}

function pushStr(arr, s) {
  for (let i = 0; i < s.length; i++) arr.push(s.charCodeAt(i));
}

/**
 * GIF-flavored LZW: 12-bit dictionary saturation with an auto CLEAR,
 * variable-width codes emitted LSB-first, chunked in 255-byte blocks.
 */
function* lzwBlocks(pixels, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let dict = new Map();
  const writer = new BitWriter();

  writer.write(clear, codeSize);
  let prefix = -1;
  for (let i = 0; i < pixels.length; i++) {
    const k = pixels[i];
    if (prefix < 0) {
      prefix = k;
      continue;
    }
    const key = (prefix << 8) | k;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    writer.write(prefix, codeSize);
    // one-emission-late width growth: the decoder stays one dictionary
    // entry behind the encoder, so the code right after a boundary
    // crossing still goes out at the narrower width
    if (next >= (1 << codeSize) && codeSize < 12) codeSize++;
    if (next < 4096) {
      dict.set(key, next);
      next++;
    } else {
      writer.write(clear, codeSize);
      dict.clear();
      next = eoi + 1;
      codeSize = minCodeSize + 1;
    }
    prefix = k;
  }
  writer.write(prefix, codeSize);
  if (next >= (1 << codeSize) && codeSize < 12) codeSize++;
  writer.write(eoi, codeSize);

  const bytes = writer.finish();
  for (let i = 0; i < bytes.length; i += 255) {
    const block = bytes.slice(i, i + 255);
    yield [block.length, ...block];
  }
}

class BitWriter {
  constructor() {
    this.bytes = [];
    this.cur = 0;
    this.bits = 0;
  }

  write(code, len) {
    this.cur |= code << this.bits;
    this.bits += len;
    while (this.bits >= 8) {
      this.bytes.push(this.cur & 0xff);
      this.cur >>= 8;
      this.bits -= 8;
    }
  }

  finish() {
    if (this.bits > 0) this.bytes.push(this.cur & 0xff);
    return this.bytes;
  }
}

/** 3-3-2 quantization lookup tables: rgb byte -> palette index. */
export function quantTables() {
  const lut = (levels) => new Uint8Array(256).map((_, v) => Math.round((v / 255) * (levels - 1)));
  return { r: lut(8), g: lut(8), b: lut(4) };
}
