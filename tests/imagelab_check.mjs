// Helper for tests/test_imagelab.py: decode a TIFF with imagelab_io.js and print numbers for Python to compare.
import { readFileSync } from 'node:fs';
import { decodeTiff } from '../atlas/web/static/imagelab_io.js';
import { imageStats, binImage, powerSpectrum, toSquare } from '../atlas/web/static/sim_engine.js';

const b = readFileSync(process.argv[2]);
const r = decodeTiff(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const out = { w: r.w, h: r.h, bits: r.bits, format: r.format, samples: r.samples, pages: r.pages, stats: imageStats(r.data),
  first: Array.from(r.data.slice(0, 5)), last: r.data[r.data.length - 1] };
if (r.w === r.h && (r.w & (r.w - 1)) === 0) {
  out.bin2 = Array.from(binImage(r.data, r.w, 2).slice(0, 4));
  const p = powerSpectrum(r.data, r.w); let k = 0; for (let i = 1; i < p.length; i++) if (p[i] > p[k]) k = i;
  out.peak = [k % r.w, Math.floor(k / r.w)];
  out.square = imageStats(toSquare(r.data, r.w, r.h, r.w));
}
console.log(JSON.stringify(out));
