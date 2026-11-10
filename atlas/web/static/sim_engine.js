// Pure optics and photophysics used by the simulations. No DOM access: tested with node (tests/sim_engine.test.mjs).

// Bessel J1 (Numerical Recipes polynomial approximation, |error| < 1e-7).
export function besselJ1(x) {
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const a = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
    const b = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
    return a / b;
  }
  const z = 8 / ax, y = z * z, xx = ax - 2.356194491;
  const a = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
  const b = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a - z * Math.sin(xx) * b);
  return x < 0 ? -ans : ans;
}

// Airy intensity at radius r (same units as wavelength).
export function airy(r, NA, lambda) {
  const v = 2 * Math.PI * NA * r / lambda;
  if (Math.abs(v) < 1e-9) return 1;
  const t = 2 * besselJ1(v) / v;
  return t * t;
}

export const rayleigh = (lambda, NA) => 0.61 * lambda / NA;
export const abbe = (lambda, NA) => lambda / (2 * NA);
export const fwhmLateral = (lambda, NA) => 0.51 * lambda / NA;
export const axialWidefield = (lambda, NA, n) => 2 * n * lambda / (NA * NA);
export const halfAngle = (NA, n) => Math.asin(Math.min(1, NA / n));
export const nyquistPixel = (lambda, NA) => lambda / (4 * NA); // sample at half the Abbe period

// Critical angle (degrees) and evanescent intensity decay depth d = λ / (4π sqrt(n1² sin²θ − n2²)).
export const criticalAngle = (n1, n2) => (n2 >= n1 ? NaN : Math.asin(n2 / n1) * 180 / Math.PI);
export function penetrationDepth(lambda, n1, n2, thetaDeg) {
  const s = n1 * n1 * Math.sin(thetaDeg * Math.PI / 180) ** 2 - n2 * n2;
  return s <= 0 ? Infinity : lambda / (4 * Math.PI * Math.sqrt(s));
}

// STED resolution d ≈ λ / (2 NA sqrt(1 + I/Is)).
export const stedResolution = (lambda, NA, saturation) => lambda / (2 * NA * Math.sqrt(1 + saturation));

// Localization precision (Thompson 2002 with the Mortensen 2010 EMCCD factor F² = 2 when em = true).
// s: PSF std (nm), a: pixel size (nm), N: photons, b: background photons per pixel.
export function locPrecision(s, a, N, b = 0, em = false) {
  const sa2 = s * s + a * a / 12;
  const v = (sa2 / N) * (16 / 9 + 8 * Math.PI * sa2 * b / (N * a * a));
  return Math.sqrt((em ? 2 : 1) * v);
}

export const fretEfficiency = (r, R0) => 1 / (1 + (r / R0) ** 6);
export const fretDistance = (E, R0) => R0 * Math.pow(1 / E - 1, 1 / 6);

// FRAP: Soumpasis (1983) recovery for a circular uniform bleach spot of radius w. tau_D = w²/4D.
export function besselI0(x) {
  let s = 1, t = 1;
  for (let k = 1; k < 40; k++) { t *= (x / (2 * k)) ** 2; s += t; if (t < 1e-12 * s) break; }
  return s;
}
export function besselI1(x) {
  let t = x / 2, s = t;
  for (let k = 1; k < 40; k++) { t *= (x * x / 4) / (k * (k + 1)); s += t; if (t < 1e-12 * s) break; }
  return s;
}
export function soumpasis(t, tauD) {
  if (t <= 0) return 0;
  const u = 2 * tauD / t; // Soumpasis 1983: f = exp(-2τD/t)[I0(2τD/t) + I1(2τD/t)], τD = w²/4D
  if (u > 300) return 2 / Math.sqrt(2 * Math.PI * u); // asymptotic e^-u (I0 + I1)
  return Math.exp(-u) * (besselI0(u) + besselI1(u));
}

// Gaussian beam: waist w0 = λ/(π NA), Rayleigh range zR = π w0² n / λ; usable field of view ≈ 2 zR.
export function gaussianSheet(lambda, NA, n = 1.33) {
  const w0 = lambda / (Math.PI * NA);
  const zR = Math.PI * w0 * w0 * n / lambda;
  return { w0, zR, fov: 2 * zR, thickness: 2 * w0 };
}

// Relativistic electron wavelength (pm) for accelerating voltage in kV.
export function electronWavelength(kV) {
  const h = 6.62607015e-34, m = 9.1093837e-31, e = 1.602176634e-19, c = 2.99792458e8;
  const V = kV * 1e3;
  return 1e12 * h / Math.sqrt(2 * m * e * V * (1 + e * V / (2 * m * c * c)));
}

// Camera SNR for a signal S photons/pixel: QE, read noise σr (e-), dark+background B, excess noise factor F.
export function cameraSNR(S, { qe = 0.8, read = 1.5, bg = 0, F = 1, gain = 1 } = {}) {
  const sig = qe * S;
  const noise = Math.sqrt(F * F * (sig + qe * bg) + (read / gain) ** 2);
  return noise > 0 ? sig / noise : 0;
}

// Deterministic random numbers (mulberry32) and samplers, so simulations and tests are repeatable.
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.normal = () => { const u = 1 - next(), v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  next.poisson = lam => {
    if (lam > 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * next.normal()));
    const L = Math.exp(-lam); let k = 0, p = 1;
    do { k++; p *= next(); } while (p > L);
    return k - 1;
  };
  return next;
}

// 2D random walk (Brownian, optionally confined in a circle). D in µm²/s, dt in s. Returns [[x,y],...] in µm.
export function randomWalk(n, D, dt, rand, { confine = 0, locErr = 0 } = {}) {
  const sd = Math.sqrt(2 * D * dt);
  let x = 0, y = 0;
  const out = [];
  for (let i = 0; i < n; i++) {
    let nx = x + sd * rand.normal(), ny = y + sd * rand.normal();
    if (confine > 0 && Math.hypot(nx, ny) > confine) { nx = x; ny = y; }
    x = nx; y = ny;
    out.push([x + locErr * rand.normal(), y + locErr * rand.normal()]);
  }
  return out;
}

// Mean squared displacement for lags 1..maxLag.
export function msd(track, maxLag) {
  const out = [];
  for (let lag = 1; lag <= maxLag; lag++) {
    let s = 0, k = 0;
    for (let i = 0; i + lag < track.length; i++) {
      const dx = track[i + lag][0] - track[i][0], dy = track[i + lag][1] - track[i][1];
      s += dx * dx + dy * dy; k++;
    }
    out.push(k ? s / k : 0);
  }
  return out;
}

// Least-squares line through the first k MSD points: MSD = 4 D t + offset (offset = 4σ² for localization error).
export function fitMSD(m, dt, k = 4) {
  const xs = [], ys = [];
  for (let i = 0; i < Math.min(k, m.length); i++) { xs.push((i + 1) * dt); ys.push(m[i]); }
  const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxy / sxx;
  return { D: slope / 4, offset: my - slope * mx };
}

// FCS autocorrelation for 3D free diffusion: G(τ) = (1/N)(1+τ/τD)^-1 (1+τ/(κ²τD))^-1/2.
export const fcsG = (tau, N, tauD, kappa = 5) => (1 / N) / (1 + tau / tauD) / Math.sqrt(1 + tau / (kappa * kappa * tauD));

// Confocal optical section thickness (FWHM, same units as λ) vs pinhole diameter in Airy units.
// Wilson / ZEISS formula: below ~0.25 AU the wave-optical limit 0.64 λ/(n − √(n² − NA²)) applies;
// above it, FWHM = √[(0.88 λ/(n − √(n² − NA²)))² + (√2 · n · PH / NA)²], PH = pinhole diameter in object space.
export function sectioningFWHM(lambda, NA, n, pinholeAU) {
  const k = n - Math.sqrt(n * n - NA * NA);
  if (pinholeAU < 0.25) return 0.64 * lambda / k;
  const PH = pinholeAU * 1.22 * lambda / NA;
  return Math.sqrt((0.88 * lambda / k) ** 2 + (Math.SQRT2 * n * PH / NA) ** 2);
}

// Bessel J0 (Numerical Recipes approximation).
export function besselJ0(x) {
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const a = 57568490574.0 + y * (-13362590354.0 + y * (651619640.7 + y * (-11214424.18 + y * (77392.33017 + y * (-184.9052456)))));
    const b = 57568490411.0 + y * (1029532985.0 + y * (9494680.718 + y * (59272.64853 + y * (267.8532712 + y))));
    return a / b;
  }
  const z = 8 / ax, y = z * z, xx = ax - 0.785398164;
  const a = 1 + y * (-0.1098628627e-2 + y * (0.2734510407e-4 + y * (-0.2073370639e-5 + y * 0.2093887211e-6)));
  const b = -0.1562499995e-1 + y * (0.1430488765e-3 + y * (-0.6911147651e-5 + y * (0.7621095161e-6 - y * 0.934935152e-7)));
  return Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a - z * Math.sin(xx) * b);
}

// Fraction of the Airy pattern's energy inside a pinhole of the given diameter in Airy units.
export function encircledEnergy(pinholeAU) {
  const v = Math.PI * 1.2197 * pinholeAU; // first zero of J1 at v = 3.8317 when AU = 1
  return 1 - besselJ0(v) ** 2 - besselJ1(v) ** 2;
}
