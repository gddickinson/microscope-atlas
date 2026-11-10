// Pure analysis calculations for Lab Tools (no DOM): table parsing, FRET, FRAP normalisation and exponential fit,
// MSD of a pasted track, detectability. Physics comes from sim_engine.js. Tested by tests/lab_bench.test.mjs.
import { locPrecision, fretDistance, msd, fitMSD, cameraSNR } from './sim_engine.js';

// Parse pasted columns (tab, comma, semicolon or space separated). Non-numeric rows (headers) are skipped.
export function parseTable(textIn, minCols = 2) {
  const rows = [];
  for (const line of String(textIn).split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const cells = t.split(/[\t,; ]+/).filter(Boolean).map(Number);
    if (cells.length >= minCols && cells.every(Number.isFinite)) rows.push(cells);
  }
  return rows;
}

// --- localization precision ---------------------------------------------------------------------------
// Photons needed to reach a target σ (nm), by bisection (σ falls monotonically with N). NaN if unreachable.
export function photonsForPrecision(target, s, a, b = 0, em = false) {
  let lo = 1, hi = 1e9;
  if (locPrecision(s, a, hi, b, em) > target) return NaN;
  for (let i = 0; i < 200 && hi / lo > 1.0001; i++) {
    const mid = Math.sqrt(lo * hi);
    if (locPrecision(s, a, mid, b, em) > target) lo = mid; else hi = mid;
  }
  return hi;
}

// --- FRET ---------------------------------------------------------------------------------------------
export const fretFromIntensity = (fDA, fD) => 1 - fDA / fD;
export const fretFromLifetime = (tauDA, tauD) => 1 - tauDA / tauD;
export const fretR = (E, R0) => (E > 0 && E < 1 ? fretDistance(E, R0) : NaN);

// --- FRAP ---------------------------------------------------------------------------------------------
// rows: [[t, I]]. nPre: pre-bleach points (default: everything before the minimum). mode 'full' maps pre-bleach to 1 and
// the first post-bleach point to 0; mode 'pre' divides by the pre-bleach mean only. Returns post-bleach points with t
// measured from the bleach frame.
export function frapNormalise(rows, { nPre = null, mode = 'full' } = {}) {
  if (rows.length < 4) return null;
  let iMin = 0;
  rows.forEach((r, i) => { if (r[1] < rows[iMin][1]) iMin = i; });
  const k = nPre === null || !(nPre >= 1) ? iMin : Math.min(nPre, rows.length - 3);
  if (k < 1) return null;
  const pre = rows.slice(0, k).reduce((s, r) => s + r[1], 0) / k;
  const post0 = rows[k][1], t0 = rows[k][0];
  const norm = mode === 'full' ? I => (I - post0) / (pre - post0) : I => I / pre;
  return { pre, post0, t0, nPre: k, preNorm: rows.slice(0, k).map(r => [r[0] - t0, norm(r[1])]),
    post: rows.slice(k).map(r => [r[0] - t0, norm(r[1])]) };
}

// For fixed τ the model I = A(1 − e^(−t/τ)) + I0 is linear in A and I0: solve those by least squares.
function linearAI0(pts, tau) {
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  const n = pts.length;
  for (const [t, y] of pts) { const x = 1 - Math.exp(-t / tau); sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const det = n * sxx - sx * sx;
  const A = det ? (n * sxy - sx * sy) / det : 0;
  const I0 = (sy - A * sx) / n;
  let sse = 0;
  for (const [t, y] of pts) { const r = y - (A * (1 - Math.exp(-t / tau)) + I0); sse += r * r; }
  return { A, I0, sse };
}

// Least-squares fit of I(t) = A(1 − e^(−t/τ)) + I0: log grid over τ, then golden-section refinement (variable projection).
export function fitRecovery(pts) {
  const ts = pts.map(p => p[0]).filter(t => t > 0);
  if (pts.length < 3 || !ts.length) return null;
  const tMin = Math.min(...ts), tMax = Math.max(...pts.map(p => p[0]));
  let lo = Math.log(tMin / 20), hi = Math.log(tMax * 20), best = null, bestL = 0;
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const L = lo + (hi - lo) * i / N, f = linearAI0(pts, Math.exp(L));
    if (!best || f.sse < best.sse) { best = f; bestL = L; }
  }
  const step = (hi - lo) / N;
  let a = bestL - step, b = bestL + step;
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  let fc = linearAI0(pts, Math.exp(c)).sse, fd = linearAI0(pts, Math.exp(d)).sse;
  for (let i = 0; i < 80; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = linearAI0(pts, Math.exp(c)).sse; }
    else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = linearAI0(pts, Math.exp(d)).sse; }
  }
  const tau = Math.exp((a + b) / 2), f = linearAI0(pts, tau);
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const sst = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0);
  return { A: f.A, I0: f.I0, tau, sse: f.sse, r2: sst > 0 ? 1 - f.sse / sst : NaN, atEdge: Math.abs(Math.log(tau) - lo) < 2 * step || Math.abs(Math.log(tau) - hi) < 2 * step };
}
export const recoveryModel = (t, { A, tau, I0 }) => A * (1 - Math.exp(-t / tau)) + I0;

// FRAP summary from the fit (data normalised so pre-bleach = 1). w: bleach radius (µm).
// Mobile fraction = A / (1 − I0); t½ = τ ln 2; D ≈ 0.224 w² / t½ (Soumpasis 1983, circular uniform bleach).
export function frapSummary(fit, w) {
  const thalf = fit.tau * Math.LN2;
  return { mobile: fit.A / (1 - fit.I0), immobile: 1 - fit.A / (1 - fit.I0), thalf, plateau: fit.A + fit.I0, D: 0.224 * w * w / thalf };
}

// --- MSD of a pasted track ----------------------------------------------------------------------------
// rows: [[x, y]] or [[frame/t, x, y]] in µm. Returns MSD curve and the fit of the first nFit lags (2D: MSD = 4Dt + 4σ²).
export function analyseTrack(rows, dt, nFit = 4, maxLagFrac = 0.25) {
  const track = rows.map(r => (r.length >= 3 ? [r[1], r[2]] : [r[0], r[1]]));
  if (track.length < 3) return null;
  const maxLag = Math.max(2, Math.min(track.length - 1, Math.floor(track.length * maxLagFrac)));
  const m = msd(track, maxLag);
  const k = Math.max(2, Math.min(nFit, m.length));
  const fit = fitMSD(m, dt, k);
  return { track, curve: m.map((v, i) => [(i + 1) * dt, v]), D: fit.D, offset: fit.offset, nFit: k,
    sigmaLoc: fit.offset > 0 ? Math.sqrt(fit.offset / 4) : 0 };
}

// --- detectability ------------------------------------------------------------------------------------
// S: signal photons per pixel, bg: background photons per pixel. EM gain adds excess noise F = √2 and divides read noise.
export function detectability({ S, bg = 0, qe = 0.8, read = 1.5, em = false, emGain = 300 }) {
  const snr = cameraSNR(S, { qe, read, bg, F: em ? Math.SQRT2 : 1, gain: em ? emGain : 1 });
  return { snr, rose: snr >= 5, shotLimit: Math.sqrt(qe * S) };
}
