// Virtual Optical Table: image formation for cameras and scanned point detectors (pure, no DOM; tests/table_imaging.test.mjs).
// imageFormation(specimen, optics, camera, opts) -> { width, height, data (ADU), expected (photons), pixelNm, truth, meta }
//   specimen: from table_specimens.js makeSpecimen(); optics: makeOptics({...}) (built from a traced layout by
//   table_imaging_optics.js); camera: { kind: 'camera' | 'point', sensor, qe (%), read (e⁻ rms), bits };
//   opts: { seed, focus (nm), exposure (ms for cameras, µs pixel dwell for point scanners), brightness, gain, bin, noise }.
// Pipeline: emitters -> excitation/sectioning weight -> grouped by blur width -> splatted on a fine grid -> Gaussian PSF ->
// summed into camera pixels -> photons -> Poisson shot noise, EM multiplication, read noise, offset and bit-depth clipping.
import { rng, nyquistPixel, rayleigh, stedResolution, sectioningFWHM, cameraSNR } from './sim_engine.js';

// PSF model: a Gaussian with σ = 0.21 λ/NA, the least-squares fit to the widefield Airy pattern (Zhang, Zerubia &
// Olivo-Marin 2007, Appl Opt 46:1819). Its FWHM, 2.355 σ = 0.49 λ/NA, is within 3% of the Airy FWHM 0.51 λ/NA. The
// Gaussian has no rings, and it is separable, which keeps a refresh fast.
export const SIGMA_K = 0.21;
export const MODES = {
  widefield: 'Widefield epifluorescence', tirf: 'TIRF (evanescent excitation)', hilo: 'HILO (inclined sheet)',
  confocal: 'Point-scanning confocal', 'spinning-disk': 'Spinning-disk confocal', 'two-photon': 'Two-photon scanning',
  sted: 'STED', sim: 'Structured illumination (one raw frame)', 'light-sheet': 'Light sheet', scanning: 'Point scanning without a pinhole',
  brightfield: 'Brightfield (transmitted light)', darkfield: 'Darkfield (scattered light)',
};
const CONFOCAL = ['confocal', 'spinning-disk', 'sted'];
export const SECTIONING = ['tirf', 'hilo', 'light-sheet', 'two-photon', ...CONFOCAL];

// Photometry of this teaching model: detected photons per fluorophore per ms (camera) or per µs (scanned spot) for
// 1 mW of emission reaching the detector in the 2D ray trace. Set so the presets give realistic counts (hundreds to
// thousands of photons per single molecule in 50 ms; tens of photons per confocal pixel). Relative, not absolute.
export const PHOTOMETRY = { camera: 10, point: 3, leak: 40, brightfield: 30 };

export function makeOptics(o) {
  const p = { mode: 'widefield', lam: 520, NA: 1.4, n: 1.518, M: 60, pixelNm: 108, kind: 'camera', rho: 1, leak: 0, au: 1, sat: 30, ...o };
  p.lamEx = p.lamEx || p.lam;
  const wf = SIGMA_K * p.lam / p.NA;
  let s0 = wf;
  if (CONFOCAL.includes(p.mode)) {
    // Confocal lateral gain: ~1/√2 narrower for a closed pinhole (≤ 0.25 AU), close to widefield at ≥ 1 AU (Wilson 2011,
    // J Microsc 244:113); linear in between as an approximation.
    const au = p.au;
    s0 = wf * (au <= 0.25 ? 0.72 : au >= 1 ? 0.95 : 0.72 + 0.23 * (au - 0.25) / 0.75);
    p.sectionFWHM = sectioningFWHM(p.lam, p.NA, p.n, au);
  }
  if (p.mode === 'scanning') s0 = SIGMA_K * p.lamEx / p.NA; // excitation spot sets the resolution
  if (p.mode === 'sted') s0 = Math.min(s0, stedResolution(p.lamEx, p.NA, p.sat) / 2.3548); // d = λ/(2NA√(1+I/Is)) as FWHM
  if (p.mode === 'two-photon') {
    // Two-photon (I²) focus, Zipfel, Williams & Webb 2003 (Nat Biotechnol 21:1369): exp(−2r²/ω_xy² − 2z²/ω_z²) with
    // ω_xy = 0.320 λ/(√2 NA) (NA ≤ 0.7) or 0.325 λ/(√2 NA^0.91), ω_z = 0.532 λ/√2 · 1/(n − √(n² − NA²)).
    const wxy = p.NA <= 0.7 ? 0.320 * p.lamEx / (Math.SQRT2 * p.NA) : 0.325 * p.lamEx / (Math.SQRT2 * p.NA ** 0.91);
    const wz = 0.532 * p.lamEx / Math.SQRT2 / (p.n - Math.sqrt(Math.max(0, p.n * p.n - p.NA * p.NA)));
    s0 = wxy / 2;
    p.zR = 0.589 * wz; // Lorentzian with the same FWHM (1.177 ω_z) as the Gaussian axial profile
  }
  if (p.mode === 'light-sheet') p.sheet = p.sheet || 2000;
  if (p.mode === 'hilo') p.hiloDz = p.hiloDz || 3000;
  if (p.mode === 'tirf') p.depth = p.depth || 100;
  p.sigma0 = s0;
  p.fwhm = 2.3548 * s0;
  p.resolution = rayleigh(p.lam, p.NA) * s0 / wf; // Rayleigh distance scaled by the effective PSF width
  p.nyqNm = nyquistPixel(p.lam, p.NA) * s0 / wf; // λ/(4NA) for widefield, scaled the same way
  p.tanT = Math.tan(Math.asin(Math.min(0.999, p.NA / p.n)));
  p.label = MODES[p.mode] || p.mode;
  return p;
}

// Fraction of an emitter's light that ends up in the image, from its height z above the glass and distance dz from focus.
export function sectionWeight(o, z, dz) {
  switch (o.mode) {
    case 'tirf': return Math.exp(-Math.max(0, z) / o.depth); // evanescent intensity I(z) = I0 exp(−z/d)
    case 'hilo': return Math.exp(-4 * Math.LN2 * (dz / o.hiloDz) ** 2); // inclined sheet of FWHM dz = D / tan θ (Tokunaga 2008)
    case 'light-sheet': { const w0 = o.sheet / 2; return Math.exp(-2 * dz * dz / (w0 * w0)); } // Gaussian sheet, 1/e² half-width w0
    case 'two-photon': return 1 / (1 + (dz / o.zR) ** 2); // ∫I² over a plane falls as 1/w(z)²
    case 'confocal': case 'spinning-disk': case 'sted': return 1 / (1 + (2 * dz / o.sectionFWHM) ** 2);
    default: return 1;
  }
}
// PSF σ for an emitter dz from focus: geometric defocus blur adds a disc of radius dz tan θ (per-axis σ ≈ r/2) in
// quadrature; for two-photon the focus widens like a Gaussian beam, σ0 √(1 + (dz/zR)²).
export function sigmaAt(o, dz) {
  if (o.mode === 'two-photon') return o.sigma0 * Math.sqrt(1 + (dz / o.zR) ** 2);
  return Math.sqrt(o.sigma0 ** 2 + (dz * o.tanT / 2) ** 2);
}

// --- grid helpers ----------------------------------------------------------------------------------
function splat(a, N, g, x, y, w) { // bilinear, conserves w; pixel centres at (i + 0.5) g
  const fx = x / g - 0.5, fy = y / g - 0.5, i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
  const put = (ii, jj, v) => { if (ii >= 0 && jj >= 0 && ii < N && jj < N) a[jj * N + ii] += v; };
  put(i, j, w * (1 - tx) * (1 - ty)); put(i + 1, j, w * tx * (1 - ty)); put(i, j + 1, w * (1 - tx) * ty); put(i + 1, j + 1, w * tx * ty);
}
// One separable pass along x (horiz) or y of an N × N grid; kern has 2r + 1 taps; zero outside the grid.
function pass1D(src, dst, N, horiz, kern, r) {
  const sl = horiz ? N : 1, sm = horiz ? 1 : N;
  for (let l = 0; l < N; l++) {
    const b = l * sl;
    for (let m = 0; m < N; m++) {
      const q0 = Math.max(-r, -m), q1 = Math.min(r, N - 1 - m);
      let s = 0, j = b + (m + q0) * sm;
      for (let q = q0; q <= q1; q++, j += sm) s += kern[q + r] * src[j];
      dst[b + m * sm] = s;
    }
  }
}
function boxPass(src, dst, N, horiz, r) { // running-sum box filter of width 2r + 1, zero outside the grid
  const inv = 1 / (2 * r + 1), sl = horiz ? N : 1, sm = horiz ? 1 : N;
  for (let l = 0; l < N; l++) {
    const b = l * sl;
    let s = 0;
    for (let m = 0; m <= Math.min(r, N - 1); m++) s += src[b + m * sm];
    for (let m = 0; m < N; m++) {
      dst[b + m * sm] = s * inv;
      if (m + r + 1 < N) s += src[b + (m + r + 1) * sm];
      if (m - r >= 0) s -= src[b + (m - r) * sm];
    }
  }
}
// Gaussian blur (σ in grid pixels): direct kernel for small σ, three box passes (Wells 1986, IEEE PAMI 8:234) for large σ.
export function blur(a, N, s) {
  if (s < 0.2) return a;
  const t = new Float32Array(a.length);
  if (s < 1.6) {
    const r = Math.ceil(3.5 * s), k = new Float32Array(2 * r + 1);
    let sum = 0;
    for (let q = -r; q <= r; q++) sum += k[q + r] = Math.exp(-q * q / (2 * s * s));
    for (let q = 0; q < k.length; q++) k[q] /= sum;
    pass1D(a, t, N, true, k, r); pass1D(t, a, N, false, k, r);
    return a;
  }
  const wIdeal = Math.sqrt(12 * s * s / 3 + 1);
  let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--;
  const mm = Math.round((12 * s * s - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4));
  for (let i = 0; i < 3; i++) {
    const r = ((i < mm ? wl : wl + 2) - 1) / 2;
    boxPass(a, t, N, true, r); boxPass(t, a, N, false, r);
  }
  return a;
}
export function binImage(a, N, k) {
  const W = N / k, out = new Float32Array(W * W);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[((y / k) | 0) * W + ((x / k) | 0)] += a[y * N + x];
  return out;
}
export function percentile(a, q) {
  const s = Float32Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * (s.length - 1))))];
}

// --- detector noise ------------------------------------------------------------------------------------
export const ADU_PER_E = { sCMOS: 2, qCMOS: 4, CMOS: 1, CCD: 1, EMCCD: 0.1 };
function detect(S, cam, o2, R) {
  const isEM = cam.sensor === 'EMCCD', G = isEM ? Math.max(1, o2.gain) : 1, qe = cam.qe / 100, point = cam.kind === 'point';
  const max = 2 ** (cam.bits || 16) - 1, offset = point ? 0 : 100, adu = point ? 1 : (ADU_PER_E[cam.sensor] || 1) * (isEM ? 1 : o2.gain);
  const digitalBin = !point && !isEM && cam.sensor !== 'CCD' ? o2.bin : 1; // CMOS bins after readout: read noise per pixel adds
  const read = point ? 0 : (cam.read || 0) * digitalBin;
  const out = new Float32Array(S.length);
  let sat = 0;
  for (let i = 0; i < S.length; i++) {
    let e;
    if (o2.noise) {
      e = R.poisson(qe * S[i]); // shot noise: Poisson, variance = mean
      if (G > 1) { // EM register: gamma-distributed gain, excess noise factor F = √2 (Robbins & Hadwen 2003)
        if (e < 30) { let s = 0; for (let k = 0; k < e; k++) s -= G * Math.log(1 - R()); e = s; } else e = e * G + G * Math.sqrt(e) * R.normal();
      }
      e += read * R.normal();
    } else e = qe * S[i] * G;
    let v = e * adu + offset;
    if (o2.noise) v = Math.round(v);
    if (v >= max) { v = max; sat++; }
    out[i] = Math.max(0, v);
  }
  return { out, sat: sat / S.length, G, adu, offset, max, F: G > 1 ? Math.SQRT2 : 1, readEff: read };
}

// --- image formation ---------------------------------------------------------------------------------
export function imageFormation(spec, optics, camera, opts = {}) {
  const o = optics, cam = { kind: o.kind, sensor: 'sCMOS', qe: 80, read: 1.6, bits: 16, ...camera };
  const o2 = { seed: 1, focus: spec.focus, brightness: 1, exposure: o.kind === 'point' ? 2 : 50, gain: 1, bin: 1, noise: true, maxFine: 720, maxPx: 256, ...opts };
  // Work on the unbinned sensor grid (W × W pixels of pix nm at the sample); binning then sums b × b pixels, as on-chip
  // (CCD) or digital (CMOS) binning sums their charge.
  const b = Math.max(1, Math.round(o2.bin)), pix = o.pixelNm;
  const W = Math.max(4, Math.floor(Math.min(o2.maxPx, Math.round(spec.fov / pix)) / b)) * b;
  const field = W * pix, x0 = (spec.fov - field) / 2;
  const k = Math.max(1, Math.min(16, Math.ceil(pix / (o.sigma0 / 2)), Math.floor(o2.maxFine / W)));
  const g = pix / k, N = W * k, em = spec.emitters, focus = o2.focus;
  const stripe = o.mode === 'sim' && o.stripe > 0 ? o.stripe : 0;
  const groups = new Map();
  let total = 0, far = 0;
  for (let i = 0; i < em.length; i += 4) {
    const x = em[i] - x0, y = em[i + 1] - x0;
    if (x < 0 || y < 0 || x >= field || y >= field) continue;
    const z = em[i + 2], dz = z - focus;
    let w = em[i + 3] * sectionWeight(o, z, dz);
    if (stripe) w *= 1 + Math.cos(2 * Math.PI * (x + x0) / stripe); // raw SIM frame: stripes of period λ/(2 n sin θ), contrast 1
    if (w < 1e-6) continue;
    total += w; if (Math.abs(dz) > 1000) far += w;
    const key = Math.round(Math.log(sigmaAt(o, dz) / o.sigma0) / Math.log(1.15));
    let G = groups.get(key);
    if (!G) groups.set(key, G = []);
    G.push(x, y, w);
  }
  const fine = new Float32Array(N * N), coarse = new Float32Array(W * W);
  let tmpF = null;
  for (const [key, list] of groups) {
    const s = o.sigma0 * 1.15 ** key;
    if (s > 2 * pix || k === 1) { // wide blur: work on the camera grid; pixel integration adds pix²/12 to σ² (approx.)
      const a = new Float32Array(W * W);
      for (let i = 0; i < list.length; i += 3) splat(a, W, pix, list[i], list[i + 1], list[i + 2]);
      blur(a, W, Math.sqrt(s * s + (k === 1 ? 0 : pix * pix / 12)) / pix);
      for (let i = 0; i < a.length; i++) coarse[i] += a[i];
    } else {
      tmpF = tmpF ? tmpF.fill(0) : new Float32Array(N * N);
      for (let i = 0; i < list.length; i += 3) splat(tmpF, N, g, list[i], list[i + 1], list[i + 2]);
      blur(tmpF, N, s / g);
      for (let i = 0; i < tmpF.length; i++) fine[i] += tmpF[i];
    }
  }
  const E = binImage(fine, N, k);
  for (let i = 0; i < E.length; i++) E[i] += coarse[i];

  // photons: expected count per pixel before noise
  const t = o2.exposure * o2.brightness;
  let S = new Float32Array(W * W);
  let ppf = 0, bg = 0;
  if (o.mode === 'brightfield') {
    let m = 1e-9; for (const v of E) m = Math.max(m, v);
    const I0 = PHOTOMETRY.brightfield * o.rho * t;
    for (let i = 0; i < E.length; i++) S[i] = I0 * Math.exp(-0.8 * E[i] / m); // absorption contrast, Beer–Lambert
    bg = I0 * b * b;
  } else {
    ppf = PHOTOMETRY[o.kind === 'point' ? 'point' : 'camera'] * o.rho * t;
    bg = PHOTOMETRY.leak * (o.leak || 0) * t * (o.kind === 'point' ? 0.05 : 1);
    for (let i = 0; i < E.length; i++) S[i] = E[i] * ppf + bg;
    bg *= b * b;
  }
  const Wb = W / b, pb = pix * b;
  if (b > 1) S = binImage(S, W, b);
  const D = detect(S, cam, o2, rng(o2.seed));
  const truth = groundTruth(spec, x0, field, Math.max(g, field / 512));
  // summary numbers
  let peak = 0; for (const v of S) peak = Math.max(peak, v);
  const base = percentile(S, 0.1), sig = o.mode === 'brightfield' ? base - percentile(S, 0.001) : peak - base;
  const snr = cameraSNR(Math.max(0, sig), { qe: cam.qe / 100, read: D.readEff, bg: o.mode === 'brightfield' ? percentile(S, 0.001) : base, F: D.F, gain: D.G });
  const nyqOk = pb <= o.nyqNm;
  const meta = {
    mode: o.mode, label: o.label, M: o.M, NA: o.NA, lam: o.lam, lamEx: o.lamEx, pixelNm: pb, nyqNm: o.nyqNm,
    nyquist: nyqOk ? (pb < o.nyqNm / 2 ? 'oversampled' : 'Nyquist met') : 'undersampled', nyqOk,
    fwhm: o.fwhm, resolution: o.resolution, fieldNm: field, photonsPerFluor: ppf, peakPhotons: sig, bgPhotons: base, snr,
    saturated: D.sat, outOfFocus: total ? far / total : 0, emGain: D.G, adcMax: D.max, offset: D.offset, aduPerE: D.adu,
    exposure: o2.exposure, expUnit: o.kind === 'point' ? 'µs per pixel' : 'ms', bin: b, finePitch: g, grid: N,
  };
  meta.limits = limits(meta, o, cam);
  return { width: Wb, height: Wb, data: D.out, expected: S, pixelNm: pb, truth, meta };
}

function groundTruth(spec, x0, field, gt) {
  const n = Math.max(8, Math.round(field / gt)), p = field / n, a = new Float32Array(n * n), em = spec.emitters;
  for (let i = 0; i < em.length; i += 4) {
    const x = em[i] - x0, y = em[i + 1] - x0;
    if (x >= 0 && y >= 0 && x < field && y < field) splat(a, n, p, x, y, em[i + 3]);
  }
  return { width: n, height: n, data: blur(a, n, 0.6), pixelNm: p };
}

const r0 = v => Math.round(v);
function limits(m, o, cam) {
  const L = [];
  if (!m.nyqOk) L.push(`Sampling: each pixel covers ${r0(m.pixelNm)} nm of the sample, coarser than the Nyquist limit of ${r0(m.nyqNm)} nm, so detail finer than two pixels is lost or aliased. More magnification, smaller pixels or less binning would help.`);
  if (m.saturated > 0.0005) L.push(`Saturation: ${(100 * m.saturated).toFixed(1)}% of pixels hit the ${cam.kind === 'point' ? 'counter' : (cam.bits || 16) + '-bit'} ceiling; shorten the ${cam.kind === 'point' ? 'dwell time' : 'exposure'}, lower the gain or the power.`);
  if (m.snr < 5) L.push(`Photon noise: the brightest feature has an SNR of only ${m.snr.toFixed(1)}; ${cam.kind === 'point' ? 'a longer pixel dwell, more excitation or averaging several frames' : `a longer exposure, more excitation${cam.sensor === 'EMCCD' ? ' or more EM gain' : ', binning or an EMCCD'}`} would help.`);
  if (m.outOfFocus > 0.35 && !SECTIONING.includes(m.mode)) L.push(`Out-of-focus light: ${r0(100 * m.outOfFocus)}% of the detected signal comes from more than 1 µm above or below focus and fills in the background. A sectioning method (TIRF, confocal, light sheet, two-photon) would remove it.`);
  if (o.leak > 0.05 * o.rho && m.mode !== 'brightfield') L.push('Excitation light leaks through to the detector and adds a flat background: check the emission filter and dichroic.');
  if (m.mode === 'sim') L.push('This is one raw SIM frame: the stripes must be shifted and rotated (9–15 frames) and the images combined to reach about twice the widefield resolution.');
  L.push(`Diffraction: the PSF is ${r0(m.fwhm)} nm wide (FWHM) at ${r0(m.lam)} nm and NA ${m.NA}; two points closer than about ${r0(m.resolution)} nm merge.`);
  return L;
}
