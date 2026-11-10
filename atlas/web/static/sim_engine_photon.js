// Photon budget for the microscope builder (re-exported by sim_engine.js): from laser power to detected photons.
// Units: wavelengths in nm, power in mW, areas in cm², rates per second.
const H = 6.62607015e-34, C = 2.99792458e8, NA_AV = 6.02214076e23;

// One-photon absorption cross-section from the molar extinction coefficient ε (M⁻¹ cm⁻¹): σ = 1000 ln10 ε / N_A
// (cm²), about 3.82e-21 ε.
export const crossSection = ec => 1000 * Math.LN10 * ec / NA_AV;

// Photons per second per cm² for power P (mW) spread over area A (cm²) at wavelength λ.
export const photonFlux = (PmW, areaCm2, lambda) => (PmW * 1e-3) / (H * C / (lambda * 1e-9)) / areaCm2;

// Power density (kW/cm²) of P mW over a flat-top disc of diameter d µm.
export const powerDensity = (PmW, dUm) => (PmW * 1e-6) / (Math.PI * (dUm * 1e-4 / 2) ** 2);

// Excitation rate k = σ(λ) × flux; relEx is the excitation spectrum at the laser line (0..1, 1 at the peak).
export const excitationRate = (ec, relEx, PmW, areaCm2, lambda) => crossSection(ec) * relEx * photonFlux(PmW, areaCm2, lambda);

// Emission rate of a two-level emitter with lifetime τ (ns): QY k / (1 + k τ), saturating at QY / τ.
export const emissionRate = (k, qy, tauNs) => qy * k / (1 + k * tauNs * 1e-9);

// Fraction of isotropic emission inside the objective's collection cone: (1 − cos θ) / 2 with sin θ = NA / n.
export const collectionEfficiency = (NA, n) => (1 - Math.cos(Math.asin(Math.min(1, NA / n)))) / 2;

// Linear interpolation in a sampled spectrum [[nm, value], ...] (0 outside it).
export function specAt(spec, nm) {
  if (!spec || !spec.length || nm < spec[0][0] || nm > spec[spec.length - 1][0]) return 0;
  let i = 1; while (spec[i][0] < nm) i++;
  const [x0, y0] = spec[i - 1], [x1, y1] = spec[i];
  return x1 === x0 ? y0 : y0 + (y1 - y0) * (nm - x0) / (x1 - x0);
}

// Fraction of the emission spectrum inside a band-pass filter [lo, hi] nm (trapezoid rule on the samples).
export function bandFraction(spec, lo, hi) {
  let tot = 0, inb = 0;
  for (let i = 1; i < spec.length; i++) {
    const [x0, y0] = spec[i - 1], [x1, y1] = spec[i], a = (y0 + y1) / 2 * (x1 - x0);
    tot += a;
    const l = Math.max(lo, x0), h = Math.min(hi, x1);
    if (h > l) inb += (specAt(spec, l) + specAt(spec, h)) / 2 * (h - l);
  }
  return tot > 0 ? inb / tot : 0;
}

// Fraction of a Gaussian PSF (σ in pixels) that lands in the pixel it is centred on: erf(1/(2√2 σ))².
export function centralPixelFraction(sigmaPx) {
  const x = 1 / (2 * Math.SQRT2 * sigmaPx), t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return erf * erf;
}
