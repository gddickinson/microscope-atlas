// Image Lab input: a small baseline TIFF reader (first page; uncompressed or PackBits; 8/16/32-bit integer or
// 32/64-bit float; strips or tiles; chunky or planar samples averaged to one channel), and PNG/JPEG via a canvas.
// Pure apart from fromImageFile; decodeTiff is checked against tifffile/numpy in tests/test_imagelab.py.

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 16: 8 };

function readIFD(dv, off, le) {
  const n = dv.getUint16(off, le), tags = {};
  for (let k = 0; k < n; k++) {
    const e = off + 2 + k * 12, tag = dv.getUint16(e, le), type = dv.getUint16(e + 2, le), count = dv.getUint32(e + 4, le);
    const size = (TYPE_SIZE[type] || 1) * count, at = size <= 4 ? e + 8 : dv.getUint32(e + 8, le), vals = [];
    for (let i = 0; i < Math.min(count, 1 << 20); i++) {
      if (type === 3 || type === 8) vals.push(dv.getUint16(at + 2 * i, le));
      else if (type === 4 || type === 9) vals.push(dv.getUint32(at + 4 * i, le));
      else if (type === 5) vals.push(dv.getUint32(at + 8 * i, le) / (dv.getUint32(at + 8 * i + 4, le) || 1));
      else if (type === 16) vals.push(Number(dv.getBigUint64(at + 8 * i, le)));
      else vals.push(dv.getUint8(at + i));
    }
    tags[tag] = vals;
  }
  return tags;
}

export function unpackBits(src, outLen) {
  const out = new Uint8Array(outLen);
  let i = 0, o = 0;
  while (i < src.length && o < outLen) {
    const n = (src[i] << 24) >> 24; i++;
    if (n >= 0) { for (let k = 0; k <= n && o < outLen; k++) out[o++] = src[i++]; }
    else if (n !== -128) { const v = src[i++]; for (let k = 0; k < 1 - n && o < outLen; k++) out[o++] = v; }
  }
  return out;
}

export function isTiff(buf) {
  const b = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  return b.length === 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 42) || (b[0] === 0x4d && b[1] === 0x4d && b[3] === 42));
}

// -> { w, h, data: Float64Array (single channel), bits, format: 'uint' | 'int' | 'float', samples, pages }
export function decodeTiff(buf) {
  if (!isTiff(buf)) throw new Error('not a TIFF file');
  const dv = new DataView(buf), le = dv.getUint8(0) === 0x49;
  let off = dv.getUint32(4, le), pages = 0, first = null;
  while (off && pages < 10000 && off + 2 <= buf.byteLength) { const t = readIFD(dv, off, le); if (!first) first = t; pages++; off = dv.getUint32(off + 2 + dv.getUint16(off, le) * 12, le); }
  const t = first, w = t[256][0], h = t[257][0], bits = (t[258] || [1])[0], spp = (t[277] || [1])[0], comp = (t[259] || [1])[0];
  const planar = (t[284] || [1])[0], sf = (t[339] || [1])[0], format = sf === 3 ? 'float' : sf === 2 ? 'int' : 'uint';
  if (comp !== 1 && comp !== 32773) throw new Error(`TIFF compression ${comp} is not supported here (uncompressed or PackBits only); save an uncompressed copy, or use the inspector tool`);
  if (![8, 16, 32, 64].includes(bits)) throw new Error(`${bits}-bit TIFF samples are not supported`);
  const B = bits / 8, tiled = Boolean(t[322]);
  const tw = tiled ? t[322][0] : w, th = tiled ? t[323][0] : ((t[278] || [h])[0] || h);
  const offs = tiled ? t[324] : t[273], lens = tiled ? t[325] : (t[279] || offs.map(() => tw * th * B * (planar === 2 ? 1 : spp)));
  const sum = new Float64Array(w * h), across = Math.ceil(w / tw), down = Math.ceil(h / th), per = across * down;
  const read = (v, o) => {
    if (format === 'float') return B === 4 ? v.getFloat32(o, le) : v.getFloat64(o, le);
    if (B === 1) return format === 'int' ? v.getInt8(o) : v.getUint8(o);
    if (B === 2) return format === 'int' ? v.getInt16(o, le) : v.getUint16(o, le);
    if (B === 4) return format === 'int' ? v.getInt32(o, le) : v.getUint32(o, le);
    return Number(v.getBigUint64(o, le));
  };
  const chunkSpp = planar === 2 ? 1 : spp;
  for (let c = 0; c < offs.length; c++) {
    const plane = planar === 2 ? Math.floor(c / per) : 0, idx = c % per, cx = (idx % across) * tw, cy = Math.floor(idx / across) * th;
    if (planar === 2 && plane >= spp) break;
    const rows = tiled ? th : Math.min(th, h - cy), need = tw * rows * chunkSpp * B;
    let bytes = new Uint8Array(buf, offs[c], Math.min(lens[c], buf.byteLength - offs[c]));
    if (comp === 32773) bytes = unpackBits(bytes, need);
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let y = 0; y < rows; y++) for (let x = 0; x < tw; x++) {
      const X = cx + x, Y = cy + y;
      if (X >= w || Y >= h) continue;
      for (let s = 0; s < chunkSpp; s++) { const o = ((y * tw + x) * chunkSpp + s) * B; if (o + B <= v.byteLength) sum[Y * w + X] += read(v, o); }
    }
  }
  if (spp > 1) for (let i = 0; i < sum.length; i++) sum[i] /= spp;
  return { w, h, data: sum, bits, format, samples: spp, pages };
}

// Luminance (Rec. 709 weights) of RGBA pixel data from a canvas.
export function fromRGBA(rgba, w, h) {
  const out = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = 0.2126 * rgba[4 * i] + 0.7152 * rgba[4 * i + 1] + 0.0722 * rgba[4 * i + 2];
  return out;
}

// Browser only: a File (TIFF, PNG, JPEG...) -> { w, h, data, note }.
export async function fromImageFile(file) {
  const buf = await file.arrayBuffer();
  if (isTiff(buf)) {
    const r = decodeTiff(buf);
    return { ...r, note: `TIFF, ${r.bits}-bit ${r.format}${r.samples > 1 ? `, ${r.samples} samples averaged` : ''}${r.pages > 1 ? `, first of ${r.pages} pages` : ''}` };
  }
  const bmp = await createImageBitmap(new Blob([buf]));
  const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
  const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
  return { w: c.width, h: c.height, data: fromRGBA(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height), note: `${file.type || 'image'}, 8-bit, converted to luminance` };
}
