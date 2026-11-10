// Image physics for the Image Lab (re-exported by sim_engine.js): resampling, diffraction blur, pixel binning,
// photon and camera noise, power spectrum and image statistics. Images are row-major Float64Arrays.
import { fft2, fftshift, gaussBlur, fwhmLateral } from './sim_engine.js';

// Centre-crop the largest square and resample it bilinearly onto an N x N grid.
export function toSquare(img, w, h, N) {
  const s = Math.min(w, h), x0 = (w - s) / 2, y0 = (h - s) / 2, out = new Float64Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = Math.min(w - 1, Math.max(0, x0 + (i + 0.5) * s / N - 0.5)), y = Math.min(h - 1, Math.max(0, y0 + (j + 0.5) * s / N - 0.5));
    const xi = Math.min(w - 2, Math.floor(x)), yi = Math.min(h - 2, Math.floor(y)), fx = w > 1 ? x - xi : 0, fy = h > 1 ? y - yi : 0;
    const a = img[yi * w + xi], b = img[yi * w + Math.min(w - 1, xi + 1)], c = img[Math.min(h - 1, yi + 1) * w + xi], d = img[Math.min(h - 1, yi + 1) * w + Math.min(w - 1, xi + 1)];
    out[j * N + i] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  return out;
}

// Gaussian approximation of the widefield PSF: FWHM 0.51 λ/NA, σ = FWHM / 2.355, in pixels of size px (nm).
export const psfSigmaPx = (lambda, NA, px) => fwhmLateral(lambda, NA) / 2.3548 / px;

export function blurPSF(img, N, lambda, NA, px) { return gaussBlur(img, N, psfSigmaPx(lambda, NA, px)); }

// Sum f x f blocks (camera pixels f times larger): N x N -> N/f x N/f. Signal per pixel grows f².
export function binImage(img, N, f) {
  const M = Math.floor(N / f), out = new Float64Array(M * M);
  for (let y = 0; y < M * f; y++) for (let x = 0; x < M * f; x++) out[Math.floor(y / f) * M + Math.floor(x / f)] += img[y * N + x];
  return out;
}

// Camera image in electrons: scale so the brightest pixel collects `photons`, add a uniform background, then shot
// noise (Poisson), and Gaussian read noise (σ = read e⁻ rms). rand is a seeded rng from sim_engine.js.
export function cameraImage(img, { photons = 100, bg = 0, read = 0, rand }) {
  let m = 0; for (const v of img) if (v > m) m = v;
  const k = m > 0 ? photons / m : 0, out = new Float64Array(img.length);
  for (let i = 0; i < img.length; i++) out[i] = rand.poisson(Math.max(0, img[i] * k + bg)) + (read ? read * rand.normal() : 0);
  return out;
}

// Log power spectrum log10(1 + |F|²) with zero frequency at the centre (N a power of two); the mean is removed first.
export function powerSpectrum(img, N) {
  let mean = 0; for (const v of img) mean += v; mean /= img.length;
  const re = Float64Array.from(img, v => v - mean), im = new Float64Array(N * N);
  fft2(re, im, N);
  const p = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) p[i] = Math.log10(1 + re[i] * re[i] + im[i] * im[i]);
  return fftshift(p, N);
}

export function imageStats(a) {
  let lo = Infinity, hi = -Infinity, s = 0, s2 = 0;
  for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; s += v; s2 += v * v; }
  const mean = s / a.length;
  return { min: lo, max: hi, mean, sd: Math.sqrt(Math.max(0, s2 / a.length - mean * mean)) };
}

// Pearson correlation of two images (1 = identical up to brightness and offset): how well a restoration matches the truth.
export function pearson(a, b) {
  const A = imageStats(a), B = imageStats(b); let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - A.mean) * (b[i] - B.mean);
  return A.sd > 0 && B.sd > 0 ? s / a.length / (A.sd * B.sd) : 0;
}

// Root-mean-square difference after scaling b to a's mean (to compare a restoration with the truth).
export function rmsError(a, b) {
  let ma = 0, mb = 0; for (let i = 0; i < a.length; i++) { ma += a[i]; mb += b[i]; }
  const k = mb > 0 ? ma / mb : 1; let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - k * b[i]) ** 2;
  return Math.sqrt(s / a.length);
}
