// Node tests for the optical table's simulated images: run with `node tests/table_imaging.test.mjs`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { imageFormation, makeOptics, sectionWeight, blur, binImage, SIGMA_K } from '../atlas/web/static/table_imaging.js';
import { inferOptics, imagingDetectors, specimenFov } from '../atlas/web/static/table_imaging_optics.js';
import { makeSpecimen, SPECIMENS, SPECIMEN_OPTIONS } from '../atlas/web/static/table_specimens.js';
import { trace } from '../atlas/web/static/table_engine.js';
import { PRESETS, presetById } from '../atlas/web/static/table_presets.js';
import { PARTS } from '../atlas/web/static/table_parts.js';
import { rng } from '../atlas/web/static/sim_engine.js';

const spectra = JSON.parse(fs.readFileSync(new URL('../data/spectra.json', import.meta.url)));
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const point = (fov, z = 0, w = 1) => ({ fov, focus: 0, emitters: Float32Array.from([fov / 2, fov / 2, z, w]) });
const quiet = { kind: 'camera', sensor: 'sCMOS', qe: 100, read: 0, bits: 16 };
const sum = a => a.reduce((s, v) => s + v, 0);

// FWHM along the row through the brightest pixel (linear interpolation of the half-maximum crossings), in nm.
function fwhm(img) {
  const { width: W, expected: E } = img;
  let iMax = 0; for (let i = 0; i < E.length; i++) if (E[i] > E[iMax]) iMax = i;
  const y = Math.floor(iMax / W), row = Array.from(E.slice(y * W, y * W + W)), x0 = iMax % W, half = row[x0] / 2;
  let l = x0; while (l > 0 && row[l - 1] > half) l--;
  let r = x0; while (r < W - 1 && row[r + 1] > half) r++;
  const xl = l - 1 + (half - row[l - 1]) / (row[l] - row[l - 1]), xr = r + (row[r] - half) / (row[r] - row[r + 1]);
  return (xr - xl) * img.pixelNm;
}

// 1. PSF width scales with λ/NA, and a point source images with FWHM ≈ 0.51 λ/NA at fine sampling.
{
  const cases = [[500, 1.4], [600, 1.4], [500, 0.8], [700, 1.2]];
  const widths = cases.map(([lam, NA]) => {
    const o = makeOptics({ lam, NA, n: 1.518, pixelNm: 10 });
    close(o.sigma0, SIGMA_K * lam / NA, 1e-9, 'σ = 0.21 λ/NA');
    const w = fwhm(imageFormation(point(4000), o, quiet, { noise: false, focus: 0 }));
    close(w, 0.51 * lam / NA, 0.1 * 0.51 * lam / NA, `FWHM for λ ${lam}, NA ${NA}`);
    return w / (lam / NA);
  });
  for (const w of widths) close(w, widths[0], 0.03 * widths[0], 'FWHM ∝ λ/NA');
}

// 2. Photons are conserved before noise: the image sum equals photons per fluorophore × fluorophores.
{
  const o = makeOptics({ lam: 520, NA: 1.4, pixelNm: 65, rho: 1 });
  const img = imageFormation(point(8000, 0, 3), o, quiet, { noise: false, exposure: 20, focus: 0 });
  close(sum(img.expected), 3 * img.meta.photonsPerFluor, 1e-3 * sum(img.expected), 'photon total');
  const defocused = imageFormation(point(8000, 600, 3), o, quiet, { noise: false, exposure: 20, focus: 0 });
  close(sum(defocused.expected), sum(img.expected), 0.01 * sum(img.expected), 'widefield: defocus spreads light but keeps it');
  assert.ok(Math.max(...defocused.expected) < 0.5 * Math.max(...img.expected), 'defocus lowers the peak');
}

// 3. Poisson noise: variance ≈ mean for a flat field (QE 1, no read noise, unit gain).
{
  const o = makeOptics({ lam: 520, NA: 1.4, pixelNm: 100, rho: 0, leak: 1 });
  const img = imageFormation(point(12800), o, { ...quiet, sensor: 'CMOS' }, { exposure: 2.5, seed: 3 });
  const vals = Array.from(img.data, v => v - img.meta.offset), m = sum(vals) / vals.length;
  const v = sum(vals.map(x => (x - m) ** 2)) / (vals.length - 1);
  close(m, 100, 2, 'flat field mean');
  close(v / m, 1, 0.06, 'Poisson variance / mean');
  const R = rng(5), xs = Array.from({ length: 20000 }, () => R.poisson(4.2)), mm = sum(xs) / xs.length;
  close(sum(xs.map(x => (x - mm) ** 2)) / xs.length / mm, 1, 0.05, 'small-mean Poisson');
}

// 4. EMCCD: the EM register doubles the shot-noise variance (excess noise factor F² = 2).
{
  const o = makeOptics({ lam: 520, NA: 1.4, pixelNm: 100, rho: 0, leak: 1 });
  const img = imageFormation(point(12800), o, { ...quiet, sensor: 'EMCCD' }, { exposure: 1, gain: 100, seed: 4 });
  const e = Array.from(img.data, v => (v - img.meta.offset) / img.meta.aduPerE / 100), m = sum(e) / e.length;
  close(sum(e.map(x => (x - m) ** 2)) / e.length / m, 2, 0.15, 'EM excess noise');
}

// 5. TIRF weighting: an emitter 1 µm up is suppressed relative to one at 50 nm by exp(−(1000 − 50)/d).
{
  const o = makeOptics({ mode: 'tirf', depth: 90, pixelNm: 100 });
  close(sectionWeight(o, 1000, 1000) / sectionWeight(o, 50, 50), Math.exp(-950 / 90), 1e-12, 'evanescent ratio');
  const a = imageFormation(point(6000, 50), o, quiet, { noise: false, focus: 0 }), b = imageFormation(point(6000, 1000), o, quiet, { noise: false, focus: 0 });
  close(sum(b.expected) / sum(a.expected), Math.exp(-950 / 90), 1e-6, 'TIRF image totals');
  const c = makeOptics({ mode: 'confocal', au: 1, pixelNm: 50 }), w = makeOptics({ mode: 'widefield', pixelNm: 50 });
  assert.ok(sectionWeight(c, 2000, 2000) < 0.05 && sectionWeight(w, 2000, 2000) === 1, 'confocal sections, widefield does not');
}

// 6. Binning sums counts (expected photons, before noise).
{
  const sp = makeSpecimen('beadpairs', { fov: 6400, seed: 2 }), o1 = makeOptics({ pixelNm: 50 });
  const a = imageFormation(sp, o1, quiet, { noise: false, bin: 1 }), b = imageFormation(sp, o1, quiet, { noise: false, bin: 2 });
  assert.equal(b.width, a.width / 2);
  const s2 = binImage(a.expected, a.width, 2);
  let err = 0; for (let i = 0; i < s2.length; i++) err = Math.max(err, Math.abs(s2[i] - b.expected[i]));
  assert.ok(err <= 1e-3 * Math.max(...s2), `2×2 binning sums the four pixels (max diff ${err})`);
  const g = new Float32Array(64 * 64); g[32 * 64 + 32] = 1; blur(g, 64, 5);
  close(sum(g), 1, 1e-4, 'box-blur Gaussian conserves energy');
}

// 7. The Nyquist verdict flips at λ/(4NA).
{
  const nyq = 520 / (4 * 1.4), at = px => imageFormation(point(4000), makeOptics({ lam: 520, NA: 1.4, pixelNm: px }), quiet, { noise: false }).meta;
  assert.ok(at(nyq * 0.99).nyqOk && !at(nyq * 1.01).nyqOk, 'flip at λ/4NA');
  assert.equal(at(nyq * 1.01).nyquist, 'undersampled');
}

// 8. Sectioning in images: a bead 2 µm out of focus keeps its light in widefield, loses nearly all of it in confocal and light sheet.
{
  const share = mode => { const o = makeOptics({ mode, au: 1, sheet: 1500, pixelNm: 100 });
    const at = z => sum(imageFormation(point(25600, z), o, quiet, { noise: false, focus: 0 }).expected);
    return at(2000) / at(0); };
  assert.ok(share('widefield') > 0.95, 'widefield keeps out-of-focus light');
  assert.ok(share('confocal') < 0.05 && share('light-sheet') < 0.01, 'sectioning removes it');
}

// 9. Specimens: every one generates emitters with a description and teaching note, reproducibly from the seed.
for (const id of Object.keys(SPECIMENS)) {
  const a = makeSpecimen(id, { seed: 7 }), b = makeSpecimen(id, { seed: 7 });
  assert.ok(a.n > 10 && a.desc && a.note, `${id}: content`);
  assert.deepEqual(a.emitters.slice(0, 40), b.emitters.slice(0, 40), `${id}: seeded`);
  for (let i = 0; i < a.emitters.length; i += 4) assert.ok(a.emitters[i + 2] >= 0 && Number.isFinite(a.emitters[i]), `${id}: emitter ${i}`);
}
assert.ok(SPECIMEN_OPTIONS.length === Object.keys(SPECIMENS).length + 1 && 'specimen' in PARTS.sample.params, 'specimen parameter on the sample');
{
  const npc = makeSpecimen('npc', { seed: 1 }), e = npc.emitters, cx = (e[0] + e[8] + e[16] + e[24] + e[32] + e[40] + e[48] + e[56]) / 8, cy = (e[1] + e[9] + e[17] + e[25] + e[33] + e[41] + e[49] + e[57]) / 8;
  close(2 * Math.hypot(e[0] - cx, e[1] - cy), 107, 1e-3, 'nuclear pore ring diameter');
}

// 10. Optics inferred from the presets, and every preset with a camera or point detector returns an image.
const modes = {};
for (const p of PRESETS) {
  const r = trace(p, { spectra });
  for (const d of imagingDetectors(r)) {
    const o = inferOptics(r, d.id);
    if (!o.ok) { assert.ok(o.reason, `${p.id}/${d.id}: reason`); continue; }
    modes[p.id] = o.mode;
    const sp = makeSpecimen(o.specimen, { fov: specimenFov(o) });
    const t0 = performance.now(), im = imageFormation(sp, o, o.camera, { exposure: o.defaultExposure });
    const ms = performance.now() - t0;
    assert.ok(im.width >= 4 && im.data.length === im.width * im.height && im.data.every(Number.isFinite), `${p.id}/${d.id}: image`);
    assert.ok(im.meta.peakPhotons > 0 && im.meta.limits.length, `${p.id}/${d.id}: signal and explanation`);
    assert.ok(ms < 1500, `${p.id}/${d.id}: ${ms.toFixed(0)} ms`);
  }
}
const expect = { widefield: 'widefield', 'tirf-objective': 'tirf', 'tirf-prism': 'tirf', hilo: 'hilo', confocal: 'confocal', 'spinning-disk': 'spinning-disk',
  'two-photon': 'two-photon', 'light-sheet': 'light-sheet', sted: 'sted', sim: 'sim', kohler: 'brightfield', darkfield: 'darkfield', 'lit-minsky-1961': 'confocal', 'lit-huisken-2004': 'light-sheet', 'lit-denk-1990': 'two-photon' };
for (const [id, m] of Object.entries(expect)) assert.equal(modes[id], m, `${id}: mode`);
{
  const r = trace(presetById('widefield'), { spectra }), o = inferOptics(r, 'camera8');
  close(o.M, 60, 1e-9, 'widefield magnification'); assert.equal(o.NA, 1.4); close(o.pixelNm, 6500 / 60, 1e-9, 'pixel at the sample');
  const t = inferOptics(trace(presetById('tirf-objective'), { spectra }), 'camera8');
  assert.ok(t.depth > 50 && t.depth < 150 && t.camera.sensor === 'EMCCD', 'TIRF depth from the trace; EMCCD camera');
  const c = inferOptics(trace(presetById('confocal'), { spectra }), 'pmt12');
  assert.ok(c.au > 0.5 && c.au < 1.5, `confocal pinhole ≈ 1 AU (${c.au})`);
}

console.log('table_imaging tests passed');
