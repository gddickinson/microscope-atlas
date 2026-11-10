// Microscope builder: parsing of database specs and the report, against hand calculations.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseObjective, parseCamera, immersionIndex, report } from '../atlas/web/static/builder_calc.js';

const load = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const objs = load('components/objectives.json'), cams = load('components/detectors.json'), spectra = load('spectra.json');
const rel = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) <= tol, `${msg}: ${a} vs ${b}`);

assert.equal(immersionIndex('oil'), 1.518); assert.equal(immersionIndex('silicone oil'), 1.406);
assert.equal(immersionIndex('clearing medium, refractive index 1.53'), 1.53); assert.equal(immersionIndex('immersion medium, ne = 1.457'), 1.457);
assert.equal(immersionIndex('80% glycerol (silicone oil and oil versions available)'), 1.45);
assert.equal(immersionIndex('special high-index oil'), null); assert.equal(immersionIndex('ScaleView-A2 (silicone oil and oil versions available)'), null);

const O = objs.map(parseObjective).filter(Boolean), Cm = cams.map(parseCamera).filter(Boolean);
assert.ok(O.length >= 20, `objectives usable: ${O.length}`); assert.ok(Cm.length >= 15, `cameras usable: ${Cm.length}`);
for (const c of Cm) { assert.ok(c.nx > 0 && c.ny > 0 && c.px > 0, c.id); assert.ok(c.read === null || c.read >= 0, c.id); }
const fusion = Cm.find(c => c.id === 'hamamatsu-orca-fusion-bt');
assert.deepEqual([fusion.px, fusion.nx, fusion.ny, fusion.read, fusion.qe], [6.5, 2304, 2304, 0.7, null]);
const kin = Cm.find(c => c.id === 'photometrics-kinetix'); assert.equal(kin.nx, 3200); assert.equal(kin.qe, 0.95); // 20.8 mm / 6.5 µm
const ixon = Cm.find(c => c.id === 'andor-ixon-ultra-897'); assert.equal(ixon.F, Math.SQRT2); assert.equal(ixon.read, 1);
const nik = O.find(o => o.id === 'nikon-cfi-apo-tirf-60xc-oil'); assert.deepEqual([nik.M, nik.NA, nik.n], [60, 1.49, 1.518]);

// 60x/1.49 oil, Prime BSI Express (6.5 µm, 95%), Alexa Fluor 488 at 488 nm
const prime = Cm.find(c => c.id === 'photometrics-prime-bsi-express'), af = spectra['Alexa Fluor 488'];
const r = report({ obj: nik, cam: prime, fluor: { ec: 73000, qy: 0.92, lifetime: 4.1 }, ex: af.ex, em: af.em, laser: 488,
  powerMw: 10, fieldUm: 100, lo: 500, hi: 550, filterT: 0.9, exposureMs: 100, bgPx: 10 });
rel(r.pxS, 6500 / 60, 1e-12, 'pixel at the sample'); rel(r.fov[0], 2048 * 6.5 / 60, 1e-9, 'field of view');
rel(r.fwhm, 0.51 * 525 / 1.49, 1e-9, 'FWHM'); rel(r.kWcm2, 0.1273, 1e-3, 'power density');
// k = σ relEx flux: σ = 3.824e-21 × 73000, flux = 0.1273 kW/cm² at 488 nm
rel(r.k, 3.8236e-21 * 73000 * r.relEx * 0.12732e6 * 1e-3 / (6.62607e-34 * 2.99792e8 / 488e-9), 2e-3, 'excitation rate');
rel(r.photons, r.emit * r.coll * r.inBand * 0.9 * 0.1, 1e-9, 'photons per exposure');
assert.ok(r.relEx > 0.5 && r.relEx <= 1 && r.inBand > 0.4 && r.inBand < 0.9, `relEx ${r.relEx} inBand ${r.inBand}`);
assert.ok(r.sat < 0.01, 'far from saturation at 0.13 kW/cm²'); assert.ok(r.snrPeak > 1 && r.locNm > 0);
console.log(`builder: ${O.length} objectives, ${Cm.length} cameras usable; AF488 example ${r.photons.toFixed(0)} photons, σloc ${r.locNm.toFixed(1)} nm`);
