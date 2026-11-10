// Single-molecule localization for the Image Lab (re-exported by sim_engine.js): spot detection on a smoothed frame
// and a 2D Gaussian least-squares fit (Levenberg-Marquardt) per spot. Coordinates are in pixels, origin at the centre
// of the top-left pixel. Checked against scipy.optimize.curve_fit in tests/test_imagelab.py.
import { gaussBlur } from './sim_engine.js';

function median(a) { const s = Float64Array.from(a).sort(); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

// Robust background and noise: median, and 1.4826 × median absolute deviation (σ for Gaussian noise).
export function robustNoise(img) {
  const med = median(img);
  return { bg: med, sd: 1.4826 * median(Array.from(img, v => Math.abs(v - med))) };
}

// Spots: local maxima (in a (2r+1)² neighbourhood) of the frame smoothed with the PSF σ that rise more than
// k noise σ (of the smoothed frame) above its median. Returns [{x, y, peak}] sorted by peak, brightest first.
export function detectSpots(img, N, { sigma = 1.3, k = 5, r = 3 } = {}) {
  const s = gaussBlur(img, N, Math.max(0.5, sigma)), { bg, sd } = robustNoise(s), thr = bg + k * Math.max(sd, 1e-9), out = [];
  for (let y = r; y < N - r; y++) for (let x = r; x < N - r; x++) {
    const v = s[y * N + x];
    if (v <= thr) continue;
    let max = true;
    for (let dy = -r; dy <= r && max; dy++) for (let dx = -r; dx <= r; dx++) if ((dx || dy) && s[(y + dy) * N + x + dx] >= v && (s[(y + dy) * N + x + dx] > v || dy < 0 || (dy === 0 && dx < 0))) { max = false; break; }
    if (max) out.push({ x, y, peak: v - bg });
  }
  return out.sort((a, b) => b.peak - a.peak);
}

// Solve the small dense system A x = b (Gaussian elimination with partial pivoting).
function solve(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-300) return null;
    for (let i = c + 1; i < n; i++) { const f = M[i][c] / M[c][c]; for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}

// Model value at pixel (u, v): bg + A exp(-((u - x)² + (v - y)²) / 2σ²), and its gradient over p = [x, y, A, bg, σ].
function model(p, u, v) {
  const [x, y, A, , s] = p, dx = u - x, dy = v - y, e = Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
  return [p[3] + A * e, [A * e * dx / (s * s), A * e * dy / (s * s), e, 1, A * e * (dx * dx + dy * dy) / (s * s * s)]];
}

// Least-squares fit of a symmetric 2D Gaussian in the (2r+1)² window around (x0, y0).
// Returns { x, y, A, bg, sigma, photons = 2πσ²A, iters, ok, chi2 }.
export function fitGaussian2D(img, N, x0, y0, { r = 3, sigma = 1.3, maxIter = 100 } = {}) {
  const px = [];
  for (let v = Math.max(0, y0 - r); v <= Math.min(N - 1, y0 + r); v++) for (let u = Math.max(0, x0 - r); u <= Math.min(N - 1, x0 + r); u++) px.push([u, v, img[v * N + u]]);
  let lo = Infinity, hi = -Infinity; for (const q of px) { if (q[2] < lo) lo = q[2]; if (q[2] > hi) hi = q[2]; }
  let p = [x0, y0, Math.max(1e-6, hi - lo), lo, sigma], lam = 1e-3, it = 0;
  const cost = q => { let c = 0; for (const [u, v, d] of px) { const m = model(q, u, v)[0] - d; c += m * m; } return c; };
  let c0 = cost(p);
  for (; it < maxIter; it++) {
    const JTJ = Array.from({ length: 5 }, () => new Array(5).fill(0)), JTr = new Array(5).fill(0);
    for (const [u, v, d] of px) {
      const [m, g] = model(p, u, v), res = d - m;
      for (let i = 0; i < 5; i++) { JTr[i] += g[i] * res; for (let j = 0; j < 5; j++) JTJ[i][j] += g[i] * g[j]; }
    }
    let improved = false;
    for (let tries = 0; tries < 20 && !improved; tries++) {
      const A = JTJ.map((row, i) => row.map((v, j) => (i === j ? v * (1 + lam) + 1e-12 : v)));
      const d = solve(A, JTr);
      if (!d) { lam *= 10; continue; }
      const q = p.map((v, i) => v + d[i]);
      q[4] = Math.abs(q[4]) || 1e-3;
      const c1 = cost(q);
      if (c1 < c0) {
        const rel = (c0 - c1) / Math.max(c0, 1e-300); p = q; c0 = c1; lam = Math.max(lam / 10, 1e-12); improved = true;
        if (rel < 1e-12 && Math.max(Math.abs(d[0]), Math.abs(d[1])) < 1e-7) it = maxIter;
      } else lam *= 10;
    }
    if (!improved) break;
  }
  const [x, y, A, bg, s] = p;
  const ok = A > 0 && s > 0.3 && s < r && Math.abs(x - x0) <= r && Math.abs(y - y0) <= r;
  return { x, y, A, bg, sigma: s, photons: 2 * Math.PI * s * s * A, iters: it, ok, chi2: c0 };
}

// Detect and fit every spot in a frame: [{x, y, A, bg, sigma, photons, ok, ...}] for the fits that converged.
export function localize(img, N, { sigma = 1.3, k = 5, r = 3 } = {}) {
  return detectSpots(img, N, { sigma, k, r }).map(s => ({ ...fitGaussian2D(img, N, s.x, s.y, { r, sigma }), x0: s.x, y0: s.y })).filter(f => f.ok);
}

// Match localizations to true positions (nearest within maxDist px, each truth used once):
// { matched, missed, extra, rms (px, per axis), pairs: [[fit, truth]] }.
export function matchLocalizations(fits, truth, maxDist = 2) {
  const used = new Set(), pairs = [];
  for (const f of fits) {
    let best = -1, bd = maxDist;
    truth.forEach((t, i) => { const d = Math.hypot(f.x - t[0], f.y - t[1]); if (!used.has(i) && d <= bd) { bd = d; best = i; } });
    if (best >= 0) { used.add(best); pairs.push([f, truth[best]]); }
  }
  const rms = pairs.length ? Math.sqrt(pairs.reduce((s, [f, t]) => s + (f.x - t[0]) ** 2 + (f.y - t[1]) ** 2, 0) / pairs.length / 2) : NaN;
  return { matched: pairs.length, missed: truth.length - pairs.length, extra: fits.length - pairs.length, rms, pairs };
}
