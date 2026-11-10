// Virtual Optical Table image viewer: look-up tables, contrast mapping, histogram, line profiles and the scale bar.
// Pure helpers except drawHistogram / drawScaleBar, which paint on a 2D canvas context they are given.
import { CMAPS } from './sim_ui.js';
import { percentile } from './table_imaging.js';

const fire = v => { // black → blue → red → yellow → white, like ImageJ's "Fire"
  const r = Math.min(1, v * 2.2), g = Math.max(0, Math.min(1, (v - 0.4) * 2)), b = v < 0.3 ? v * 2.6 : v < 0.55 ? Math.max(0, 0.78 - (v - 0.3) * 3.1) : Math.max(0, (v - 0.8) * 5);
  return [r * 255, g * 255, b * 255];
};
export const LUTS = {
  grey: CMAPS.gray, green: CMAPS.green, magenta: CMAPS.magenta, hot: CMAPS.hot, fire,
  inverted: v => [255 - v * 255, 255 - v * 255, 255 - v * 255],
};
const tables = {};
export function lutTable(name) {
  if (tables[name]) return tables[name];
  const f = LUTS[name] || LUTS.grey, t = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) { const c = f(i / 255); t[i * 3] = c[0]; t[i * 3 + 1] = c[1]; t[i * 3 + 2] = c[2]; }
  return (tables[name] = t);
}

// Map data to RGBA with a display range [lo, hi] and gamma.
export function toRGBA(data, lo, hi, gamma, lut) {
  const t = lutTable(lut), out = new Uint8ClampedArray(data.length * 4), span = hi - lo || 1, g = gamma || 1;
  for (let i = 0; i < data.length; i++) {
    let v = (data[i] - lo) / span;
    v = v <= 0 ? 0 : v >= 1 ? 1 : g === 1 ? v : Math.pow(v, g);
    const k = (v * 255 + 0.5) | 0;
    out[i * 4] = t[k * 3]; out[i * 4 + 1] = t[k * 3 + 1]; out[i * 4 + 2] = t[k * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}

export function range(data) {
  let lo = Infinity, hi = -Infinity;
  for (const v of data) { if (v < lo) lo = v; if (v > hi) hi = v; }
  return [lo, hi > lo ? hi : lo + 1];
}
// Auto-contrast: 0.1 and 99.9 percentiles.
export function autoRange(data) {
  const lo = percentile(data, 0.001), hi = percentile(data, 0.999);
  return [lo, hi > lo ? hi : lo + 1];
}

export function histogram(data, lo, hi, bins = 128) {
  const h = new Float64Array(bins), span = hi - lo || 1;
  for (const v of data) h[Math.max(0, Math.min(bins - 1, Math.floor((v - lo) / span * bins)))]++;
  return h;
}
export function drawHistogram(ctx, data, [dlo, dhi], lo, hi) {
  const { width: W, height: H } = ctx.canvas, h = histogram(data, dlo, dhi, W / 2);
  let m = 1; for (const v of h) m = Math.max(m, Math.log1p(v));
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#8fa3c8';
  h.forEach((v, i) => { const y = Math.log1p(v) / m * (H - 4); ctx.fillRect(i * 2, H - y, 2, y); });
  ctx.strokeStyle = '#3dff8f';
  for (const v of [lo, hi]) { const x = (v - dlo) / (dhi - dlo || 1) * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
}

// Bilinear samples along a line in pixel coordinates (pixel centres at i + 0.5).
export function profile(data, W, H, x0, y0, x1, y1) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L * 2)), out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, fx = x0 + (x1 - x0) * t - 0.5, fy = y0 + (y1 - y0) * t - 0.5;
    const ix = Math.max(0, Math.min(W - 2, Math.floor(fx))), iy = Math.max(0, Math.min(H - 2, Math.floor(fy)));
    const tx = Math.max(0, Math.min(1, fx - ix)), ty = Math.max(0, Math.min(1, fy - iy)), p = (x, y) => data[y * W + x];
    out.push([t * L, (1 - ty) * ((1 - tx) * p(ix, iy) + tx * p(ix + 1, iy)) + ty * ((1 - tx) * p(ix, iy + 1) + tx * p(ix + 1, iy + 1))]);
  }
  return out;
}

// A 1-2-5 scale bar about a fifth of the visible width (µm).
export function niceBar(visibleUm) {
  const target = visibleUm / 5, p = 10 ** Math.floor(Math.log10(target));
  return [1, 2, 5, 10].map(k => k * p).filter(v => v <= target).pop() || p;
}
export function drawScaleBar(ctx, umPerCssPx, dpr = 1) {
  const W = ctx.canvas.width, H = ctx.canvas.height, bar = niceBar(W / dpr * umPerCssPx), len = bar / umPerCssPx * dpr;
  const x = W - len - 14 * dpr, y = H - 16 * dpr;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - 6 * dpr, y - 16 * dpr, len + 12 * dpr, 26 * dpr);
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, len, 3 * dpr);
  ctx.font = `${11 * dpr}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center';
  ctx.fillText(bar >= 1 ? `${bar} µm` : `${Math.round(bar * 1000)} nm`, x + len / 2, y - 4 * dpr);
}
