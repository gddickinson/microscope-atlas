// Pure optics and photophysics used by the simulations. No DOM access: tested with node (tests/sim_engine.test.mjs).
// Image-Lab physics (resampling, binning, camera noise, power spectrum) lives in sim_engine_image.js, re-exported at the end.

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

// ---- Simulations II: Fourier optics, deconvolution, aberrations, FLIM phasors, electron CTF, tomography ----

// In-place radix-2 FFT of complex arrays (re, im) of length 2^k; inverse divides by n.
export function fft(re, im, inverse = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

// 2D FFT (row-major N x N, N a power of 2).
export function fft2(re, im, N, inverse = false) {
  const r = new Float64Array(N), m = new Float64Array(N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) { r[x] = re[y * N + x]; m[x] = im[y * N + x]; }
    fft(r, m, inverse);
    for (let x = 0; x < N; x++) { re[y * N + x] = r[x]; im[y * N + x] = m[x]; }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) { r[y] = re[y * N + x]; m[y] = im[y * N + x]; }
    fft(r, m, inverse);
    for (let y = 0; y < N; y++) { re[y * N + x] = r[y]; im[y * N + x] = m[y]; }
  }
}

// Swap quadrants so the zero frequency (or the PSF centre) sits in the middle.
export function fftshift(a, N) {
  const out = new a.constructor(N * N), h = N / 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[((y + h) % N) * N + (x + h) % N] = a[y * N + x];
  return out;
}

// Zernike modes with Noll normalisation (rms over the unit pupil = 1, so a coefficient is the rms in waves).
export const ZERNIKE = {
  defocus: (r, t) => Math.sqrt(3) * (2 * r * r - 1),
  astigmatism: (r, t) => Math.sqrt(6) * r * r * Math.cos(2 * t),
  coma: (r, t) => Math.sqrt(8) * (3 * r ** 3 - 2 * r) * Math.cos(t),
  trefoil: (r, t) => Math.sqrt(8) * r ** 3 * Math.cos(3 * t),
  spherical: (r, t) => Math.sqrt(5) * (6 * r ** 4 - 6 * r * r + 1),
};

// Pupil-function PSF: circular pupil of radius `pupil` grid units with phase 2π Σ a_j Z_j (a in waves rms).
// Returns {psf (centred, N x N), strehl (peak relative to the unaberrated pupil), rms (waves)}.
export function aberratedPSF(N, coeffs = {}, pupil = N / 8) {
  const peakOf = withPhase => {
    const re = new Float64Array(N * N), im = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (x - N / 2) / pupil, dy = (y - N / 2) / pupil, r = Math.hypot(dx, dy);
      if (r > 1) continue;
      let ph = 0;
      if (withPhase) for (const [k, a] of Object.entries(coeffs)) if (a) ph += 2 * Math.PI * a * ZERNIKE[k](r, Math.atan2(dy, dx));
      re[y * N + x] = Math.cos(ph); im[y * N + x] = Math.sin(ph);
    }
    fft2(re, im, N);
    const I = new Float64Array(N * N);
    let peak = 0;
    for (let i = 0; i < N * N; i++) { I[i] = re[i] * re[i] + im[i] * im[i]; if (I[i] > peak) peak = I[i]; }
    return { I, peak, atZero: I[0] };
  };
  const ideal = peakOf(false), ab = peakOf(true);
  const rms = Math.sqrt(Object.values(coeffs).reduce((s, a) => s + a * a, 0)); // Noll modes are orthonormal
  return { psf: fftshift(ab.I, N).map(v => v / ideal.peak), strehl: ab.peak / ideal.peak, rms };
}

// Maréchal approximation: Strehl ≈ exp(−(2π σ)²), σ = rms wavefront error in waves. Diffraction-limited when S ≥ 0.8.
export const marechal = rmsWaves => Math.exp(-((2 * Math.PI * rmsWaves) ** 2));

// Separable Gaussian blur (σ in pixels, edges clamped) of an N x N image; the Gaussian is symmetric so it is also its own adjoint.
export function gaussBlur(img, N, sigma) {
  const R = Math.ceil(3 * sigma), k = [];
  let sum = 0;
  for (let i = -R; i <= R; i++) { const v = Math.exp(-i * i / (2 * sigma * sigma)); k.push(v); sum += v; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float64Array(N * N), out = new Float64Array(N * N);
  const cl = v => (v < 0 ? 0 : v >= N ? N - 1 : v);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let i = -R; i <= R; i++) s += k[i + R] * img[y * N + cl(x + i)]; tmp[y * N + x] = s; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let i = -R; i <= R; i++) s += k[i + R] * tmp[cl(y + i) * N + x]; out[y * N + x] = s; }
  return out;
}

// Richardson-Lucy deconvolution (Richardson 1972, Lucy 1974) with a Gaussian PSF:
// u_{k+1} = u_k · H^T( d / H u_k ). Starts from a flat estimate with the data's mean.
export function richardsonLucy(data, N, sigma, iters, start = null) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  let u = start ? Float64Array.from(start) : new Float64Array(N * N).fill(mean);
  for (let it = 0; it < iters; it++) {
    const Hu = gaussBlur(u, N, sigma), ratio = new Float64Array(N * N);
    for (let i = 0; i < N * N; i++) ratio[i] = Hu[i] > 1e-12 ? data[i] / Hu[i] : 0;
    const c = gaussBlur(ratio, N, sigma);
    for (let i = 0; i < N * N; i++) u[i] *= c[i];
  }
  return u;
}

// FLIM phasor of a single exponential at angular modulation frequency ω (rad/ns, τ in ns): on the universal semicircle.
export function phasorOf(tau, omega) {
  const wt = omega * tau;
  return { g: 1 / (1 + wt * wt), s: wt / (1 + wt * wt) };
}
// Phasor of a sampled decay over one laser period T (ns): g = Σ I cos ωt / Σ I, s = Σ I sin ωt / Σ I, ω = 2π/T.
export function phasorFromDecay(I, T) {
  const n = I.length, w = 2 * Math.PI / T;
  let g = 0, s = 0, tot = 0;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) * T / n; g += I[i] * Math.cos(w * t); s += I[i] * Math.sin(w * t); tot += I[i]; }
  return { g: g / tot, s: s / tot };
}
// Single-exponential decay of lifetime τ, periodically excited (period T), sampled in n bins.
export function periodicDecay(tau, T, n) {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) * T / n; out[i] = Math.exp(-t / tau) / (1 - Math.exp(-T / tau)); }
  return out;
}
// Phase and modulation lifetimes from a phasor: τφ = s/(ωg), τm = sqrt(1/m² − 1)/ω with m² = g² + s².
export function phasorLifetimes({ g, s }, omega) {
  const m2 = g * g + s * s;
  return { tauPhase: s / (omega * g), tauMod: Math.sqrt(Math.max(0, 1 / m2 - 1)) / omega };
}

// Weak-phase-object contrast transfer function (units: Å, Å⁻¹; defocus > 0 = underfocus).
// χ(k) = π λ Δf k² − (π/2) Cs λ³ k⁴;  CTF = −[√(1−A²) sin χ + A cos χ] · exp(−B k²/4).
export function ctf(k, { kV = 300, defocusUm = 1.5, csMm = 2.7, amp = 0.07, bfactor = 0 } = {}) {
  const lam = electronWavelength(kV) / 100; // pm -> Å
  const df = defocusUm * 1e4, cs = csMm * 1e7;
  const chi = Math.PI * lam * df * k * k - 0.5 * Math.PI * cs * lam ** 3 * k ** 4;
  return -(Math.sqrt(1 - amp * amp) * Math.sin(chi) + amp * Math.cos(chi)) * Math.exp(-bfactor * k * k / 4);
}
// Scherzer defocus √(1.5 Cs λ) and point resolution 0.66 Cs^¼ λ^¾ (Å).
export function scherzer(kV, csMm) {
  const lam = electronWavelength(kV) / 100, cs = csMm * 1e7;
  return { defocusUm: Math.sqrt(1.5 * cs * lam) / 1e4, resolution: 0.66 * cs ** 0.25 * lam ** 0.75 };
}

// Missing-wedge elongation along the beam for a ±α tilt series (Radermacher 1988): e = √[(α + sinα cosα)/(α − sinα cosα)].
export function wedgeElongation(alphaDeg) {
  const a = alphaDeg * Math.PI / 180, sc = Math.sin(a) * Math.cos(a);
  return Math.sqrt((a + sc) / (a - sc));
}
// Reconstruct an N x N (x across, z down) slice from only the Fourier components inside a ±α tilt range
// (central-slice theorem; tilt axis perpendicular to the slice). Returns the real part.
export function missingWedge(img, N, alphaDeg) {
  if (alphaDeg >= 90) return Float64Array.from(img);
  const re = Float64Array.from(img), im = new Float64Array(N * N), t = Math.tan(alphaDeg * Math.PI / 180);
  fft2(re, im, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const kx = x < N / 2 ? x : x - N, kz = y < N / 2 ? y : y - N;
    if ((kx || kz) && Math.abs(kz) > t * Math.abs(kx) + 1e-9) { re[y * N + x] = 0; im[y * N + x] = 0; }
  }
  fft2(re, im, N, true);
  return re;
}

// ---- Simulations II, part 2: Abbe imaging with a condenser, DIC, FCS traces, AFM tips, spinning disks, expansion ----

// Abbe image of an amplitude grating t(x) = 1 + m cos(2πx/P) under partially coherent illumination: each source point
// (sin θ uniformly across the condenser NA) passes the diffraction orders the objective accepts, |s + kλ/P| ≤ NAo;
// intensities from different source points add. Resolution limit P = λ/(NAo + NAc).
export function abbeImage(xs, P, lambda, NAo, NAc, m = 1, nSrc = 41) {
  const out = new Float64Array(xs.length);
  for (let j = 0; j < nSrc; j++) {
    const s = nSrc === 1 || NAc === 0 ? 0 : -NAc + 2 * NAc * j / (nSrc - 1);
    const pass = k => Math.abs(s + k * lambda / P) <= NAo + 1e-12;
    const a0 = pass(0) ? 1 : 0, a1 = pass(1), am = pass(-1);
    for (let i = 0; i < xs.length; i++) {
      const ph = 2 * Math.PI * xs[i] / P;
      // orders: 0 -> a0, ±1 -> (m/2) e^{±iφ}
      const re = a0 + (a1 ? m / 2 * Math.cos(ph) : 0) + (am ? m / 2 * Math.cos(ph) : 0);
      const im = (a1 ? m / 2 * Math.sin(ph) : 0) - (am ? m / 2 * Math.sin(ph) : 0);
      out[i] += (re * re + im * im) / nSrc;
    }
  }
  return out;
}
export const partialCoherenceLimit = (lambda, NAo, NAc) => lambda / (NAo + Math.min(NAc, NAo));
export const michelsonContrast = a => { let lo = Infinity, hi = -Infinity; for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; } return hi + lo > 0 ? (hi - lo) / (hi + lo) : 0; };

// DIC: two sheared copies of the wave interfere after a bias retardation b (radians):
// I = I0 · sin²((Δφ + b)/2), Δφ(x) = φ(x + s/2) − φ(x − s/2) along the shear direction (dx, dy), s in pixels.
export function dicImage(phase, N, shear, angleDeg, bias) {
  const c = Math.cos(angleDeg * Math.PI / 180) * shear / 2, d = Math.sin(angleDeg * Math.PI / 180) * shear / 2;
  const at = (x, y) => {
    const xi = Math.max(0, Math.min(N - 1.001, x)), yi = Math.max(0, Math.min(N - 1.001, y));
    const x0 = Math.floor(xi), y0 = Math.floor(yi), fx = xi - x0, fy = yi - y0;
    const p = (u, v) => phase[v * N + u];
    return p(x0, y0) * (1 - fx) * (1 - fy) + p(x0 + 1, y0) * fx * (1 - fy) + p(x0, y0 + 1) * (1 - fx) * fy + p(x0 + 1, y0 + 1) * fx * fy;
  };
  const out = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[y * N + x] = Math.sin((at(x + c, y + d) - at(x - c, y - d) + bias) / 2) ** 2;
  return out;
}

// FCS by simulation: n particles diffusing (D, µm²/s) in a periodic 2D box (side L, µm) seen through a Gaussian
// spot I(r) = exp(−2r²/w²). Returns the intensity trace sampled every dt seconds.
export function fcsTrace(n, L, w, D, dt, steps, rand) {
  const xs = Float64Array.from({ length: n }, () => (rand() - 0.5) * L), ys = Float64Array.from({ length: n }, () => (rand() - 0.5) * L);
  const sd = Math.sqrt(2 * D * dt), out = new Float64Array(steps), wrap = v => v - L * Math.round(v / L);
  for (let t = 0; t < steps; t++) {
    let I = 0;
    for (let i = 0; i < n; i++) { xs[i] = wrap(xs[i] + sd * rand.normal()); ys[i] = wrap(ys[i] + sd * rand.normal()); I += Math.exp(-2 * (xs[i] ** 2 + ys[i] ** 2) / (w * w)); }
    out[t] = I;
  }
  return out;
}
// Normalised autocorrelation G(τ) = ⟨δI(t)δI(t+τ)⟩/⟨I⟩² at integer lags.
export function autocorrelation(trace, lags) {
  const n = trace.length, mean = trace.reduce((a, b) => a + b, 0) / n;
  return lags.map(k => { let s = 0; for (let i = 0; i + k < n; i++) s += (trace[i] - mean) * (trace[i + k] - mean); return s / (n - k) / (mean * mean); });
}
// 2D Gaussian spot: G(τ) = (1/N)/(1 + τ/τD), N = c·πw², τD = w²/4D.
export const fcsG2D = (tau, N, tauD) => (1 / N) / (1 + tau / tauD);
// Confocal (3D) volume Veff = π^{3/2} w² z (z = κw) and the concentration (nM) for N molecules in it (w in µm).
export function fcsConcentration(N, w, kappa) {
  const V = Math.PI ** 1.5 * w ** 3 * kappa * 1e-15; // litres (1 µm³ = 1 fL)
  return N / (V * 6.02214076e23) * 1e9;
}

// AFM: the image is the dilation of the surface by the tip, img(x) = max_u [h(x+u) − tip(u)], tip(u) = height of the
// tip surface above its apex: a sphere of radius R joined tangentially to a cone of half-angle θ (θ → 0: a pure sphere).
export function tipShape(u, R, coneDeg) {
  const th = coneDeg * Math.PI / 180, ut = R * Math.cos(th), a = Math.abs(u);
  if (a <= ut) return R - Math.sqrt(R * R - a * a);
  return R - R * Math.sin(th) + (a - ut) / Math.tan(th);
}
export function afmImage(h, dx, R, coneDeg) {
  const n = h.length, out = new Float64Array(n), reach = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    let best = -Infinity;
    for (let k = -reach; k <= reach; k++) { const j = i + k; if (j < 0 || j >= n) continue; const v = h[j] - tipShape(k * dx, R, coneDeg); if (v > best) best = v; }
    out[i] = best;
  }
  return out;
}
// Apparent base width of a sphere of radius r imaged by a spherical tip of radius R: 4√(R r).
export const afmApparentWidth = (R, r) => 4 * Math.sqrt(R * r);

// Spinning disk: fraction of light from a uniform thin layer at defocus z that returns through the pinholes,
// relative to the focal plane. Geometric blur radius r = |z| tan α (sin α = NA/n). One pinhole: (a/r)²;
// an array of pitch p adds crosstalk through the neighbours and levels off at the fill factor π a²/p².
export function diskSectioning(z, a, p, NA, n) {
  const r = Math.abs(z) * Math.tan(Math.asin(Math.min(0.999, NA / n)));
  const single = r <= a ? 1 : (a / r) ** 2, fill = Math.PI * a * a / (p * p);
  return { single, disk: Math.min(1, Math.max(single, fill)), fill };
}

// Expansion microscopy: resolution in pre-expansion units with linear expansion E and label displacement (linkage) ℓ.
export const expansionResolution = (d, E, linkage) => Math.sqrt((d / E) ** 2 + linkage ** 2);
export * from './sim_engine_image.js';
