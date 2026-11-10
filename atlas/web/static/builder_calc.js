// Microscope builder, pure part: read objective and camera numbers from the database's free-text specs, and compute
// the full report (resolution, sampling, field of view, photon budget, SNR). Node-tested in tests/builder.test.mjs.
import { fwhmLateral, rayleigh, axialWidefield, nyquistPixel, cameraSNR, locPrecision, powerDensity, excitationRate, emissionRate,
  collectionEfficiency, specAt, bandFraction, centralPixelFraction } from './sim_engine.js';
import { firstNumber, IMMERSIONS, MEDIA } from './lab_setup2.js';

const nOf = name => +((IMMERSIONS.find(i => i[0] === name) || [])[1]);

// Refractive index of the immersion medium named in an objective's spec, or null if the spec does not settle it.
export function immersionIndex(text) {
  const t = String(text || '').toLowerCase(), m = t.match(/(?:refractive index|ne\s*=)\s*(1\.\d+)/);
  if (m) return +m[1];
  if (t.startsWith('80% glycerol')) return +MEDIA.find(r => r[0] === 'Glycerol / water 80:20')[2];
  for (const [k, name] of [['silicone', 'Silicone'], ['oil', 'Oil'], ['glycerol', 'Glycerol'], ['water', 'Water']]) if (t.startsWith(k)) return nOf(name);
  return null;
}

// Objective entry -> { id, label, M, NA, n } or null when magnification, NA or medium are not given.
export function parseObjective(o) {
  const s = o.specs || {}, M = firstNumber(s.Magnification), NA = firstNumber(s.NA), n = immersionIndex(s.Immersion);
  if (!(M > 0 && NA > 0 && n)) return null;
  return { id: o.id, label: `${o.manufacturer.split(' (')[0]} ${o.name}`, M, NA, n, immersion: s.Immersion };
}

// Camera entry -> { id, label, type, px (µm), nx, ny, sizeNote, qe (0..1 or null), read (e⁻), F, fps } or null.
export function parseCamera(c) {
  const s = c.specs || {}, px = firstNumber(s['Pixel size']);
  if (!/CMOS|EMCCD|SPAD array/.test(c.type) || !(px > 0)) return null;
  const pix = String(s.Pixels || ''), dims = pix.match(/(?<![\d.])(\d[\d,]*)\s*x\s*(\d[\d,]*)(?![\d.,]|\s*mm)/), mm = pix.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mm/);
  let nx, ny, sizeNote = '';
  if (dims && !/k\b/i.test(dims[0])) { nx = +dims[1].replace(/,/g, ''); ny = +dims[2].replace(/,/g, ''); }
  else if (mm) { nx = Math.round(+mm[1] * 1000 / px); ny = Math.round(+mm[2] * 1000 / px); sizeNote = 'from the sensor size'; }
  else { const mp = firstNumber(pix); if (mp > 0) { nx = ny = Math.round(Math.sqrt(mp * 1e6)); sizeNote = 'square sensor assumed from the megapixel count'; } }
  const qeText = String(s['Peak QE'] || ''), q = firstNumber(qeText);
  const rd = String(s['Read noise'] || ''), em = c.type === 'EMCCD';
  const read = /none|photon counting/i.test(rd) ? 0 : em ? (firstNumber(rd.match(/[^;]*EM gain[^;]*/i)?.[0]) || 1) : firstNumber(rd);
  return { id: c.id, label: `${c.manufacturer} ${c.name}`, type: c.type, px, nx, ny, sizeNote, qe: q > 0 ? q / 100 : null,
    read: Number.isFinite(read) ? read : null, F: em ? Math.SQRT2 : 1, fps: firstNumber(s['Max frame rate']) || null };
}

// Everything the builder reports. cfg: { obj, cam, extraMag, qe, read, fluor {ec, qy, lifetime}, ex, em (spectra),
// laser (nm), powerMw, fieldUm, lo, hi, filterT, exposureMs, bgPx (background photons per camera pixel per exposure) }
export function report(cfg) {
  const { obj, cam, extraMag = 1, fluor, laser, powerMw, fieldUm, lo, hi, filterT = 0.9, exposureMs, bgPx = 0 } = cfg;
  const lamEm = (lo + hi) / 2, M = obj.M * extraMag, pxS = cam.px * 1000 / M; // nm at the sample
  const fov = [cam.nx * pxS / 1000, cam.ny * pxS / 1000], fieldMax = fieldUm;
  const relEx = specAt(cfg.ex, laser), inBand = bandFraction(cfg.em, lo, hi);
  const k = excitationRate(fluor.ec, relEx, powerMw, Math.PI * (fieldUm * 1e-4 / 2) ** 2, laser);
  const emit = emissionRate(k, fluor.qy, fluor.lifetime || 3);
  const coll = collectionEfficiency(obj.NA, obj.n), qe = cfg.qe ?? cam.qe ?? 0.8, read = cfg.read ?? cam.read ?? 1.5;
  const detRate = emit * coll * inBand * filterT * qe; // photoelectrons per second per molecule
  const T = exposureMs / 1000, photons = detRate / qe * T; // photons reaching the camera in one exposure
  const sigmaNm = fwhmLateral(lamEm, obj.NA) / 2.3548, frac = centralPixelFraction(sigmaNm / pxS);
  return {
    lamEm, M, pxS, nyq: nyquistPixel(lamEm, obj.NA), fov, fovNote: fov[0] > fieldMax || fov[1] > fieldMax ? 'camera field larger than the illuminated field' : '',
    fwhm: fwhmLateral(lamEm, obj.NA), rayleigh: rayleigh(lamEm, obj.NA), axial: axialWidefield(lamEm, obj.NA, obj.n),
    kWcm2: powerDensity(powerMw, fieldUm), relEx, k, sat: k * (fluor.lifetime || 3) * 1e-9, emit, coll, inBand, qe, read,
    detRate, photons, peakPx: photons * frac, frac, bgPx,
    snrPeak: cameraSNR(photons * frac, { qe, read, bg: bgPx, F: cam.F }),
    locNm: locPrecision(sigmaNm, pxS, photons * qe, bgPx * qe, cam.F > 1), // Mortensen's factor 2 for EMCCDs
    fpsMax: cam.fps ? Math.min(cam.fps, 1000 / exposureMs) : 1000 / exposureMs,
  };
}
