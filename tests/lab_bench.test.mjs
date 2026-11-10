// Node tests for the bench and analysis Lab Tools calculations: run with `node tests/lab_bench.test.mjs`.
import assert from 'node:assert/strict';
import * as B from '../atlas/web/static/lab_bench_calc.js';
import * as A from '../atlas/web/static/lab_analysis_calc.js';
import { VESSELS, RECIPES, SRC } from '../atlas/web/static/lab_bench_data.js';
import { locPrecision, rng } from '../atlas/web/static/sim_engine.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// Units
close(B.convertConc(1, 'mM', 'µM'), 1000, 1e-9, 'mM -> µM');
close(B.convertConc(150, 'µg/mL', 'nM', 150000), 1000, 1e-6, 'IgG 150 µg/mL = 1 µM');
close(B.convertConc(1, '% (w/v)', 'mg/mL'), 10, 1e-12, '1 % w/v = 10 mg/mL');
assert.ok(Number.isNaN(B.convertConc(1, 'mM', 'mg/mL')), 'molar to mass needs MW');
assert.ok(Number.isNaN(B.convertConc(1, 'X', 'mM', 100)), 'X does not convert');
close(B.convertPrefix(1, 'm', 'µ'), 1000, 1e-9, 'prefix');
{ const [av, au] = B.autoUnit(2.5e-4, B.VOLUME); close(av, 250, 1e-9, 'autoUnit'); assert.equal(au, 'µL'); }
// Molarity: 1 L of 1 M NaCl = 58.44 g; 5.844 g in 100 mL = 1 M
close(B.molarity({ massG: null, volL: 1, molar: 1, mw: 58.44 }).massG, 58.44, 1e-9, 'mass');
close(B.molarity({ massG: 5.844, volL: 0.1, molar: null, mw: 58.44 }).molar, 1, 1e-9, 'molar');
close(B.molarity({ massG: 5.844, volL: null, molar: 0.5, mw: 58.44 }).volL, 0.2, 1e-9, 'volume');
// Dilution: 10 mM stock to 100 µM in 1 mL -> 10 µL + 990 µL
const d = B.dilute({ c1: 10, u1: 'mM', c2: 100, u2: 'µM', v2: 1e-3 });
close(d.v1, 1e-5, 1e-15, 'V1'); close(d.diluent, 9.9e-4, 1e-15, 'diluent'); close(d.fold, 100, 1e-9, 'fold');
assert.ok(B.dilute({ c1: 1, u1: 'µM', c2: 2, u2: 'µM', v2: 1 }).error, 'cannot concentrate');
close(B.c1v1({ c1: 10, v1: 1, v2: 4 }).c2, 2.5, 1e-12, 'C2');
// Serial: 2-fold, 100 µL left per tube -> transfer 100, diluent 100; 10-fold mixed 100 µL -> transfer 10, diluent 90
let s = B.serialDilution({ c0: 100, fold: 2, steps: 4, volume: 100 });
close(s.transfer, 100, 1e-9, 'serial transfer'); close(s.rows[3].conc, 6.25, 1e-9, 'tube 4 conc');
s = B.serialDilution({ c0: 1, fold: 10, steps: 3, volume: 100, mode: 'mixed' });
close(s.transfer, 10, 1e-9, 'mixed transfer'); close(s.diluent, 90, 1e-9, 'mixed diluent');
// Percent and X
close(B.percentWV(4, 50), 2, 1e-12, '4 % w/v in 50 mL = 2 g');
const x = B.stockToWorking({ stockX: 10, workX: 1, finalVol: 500 });
close(x.v1, 50, 1e-12, '10X -> 1X'); close(x.diluent, 450, 1e-12, 'water');
// Seeding: 24-well (1.9 cm²) at 20,000 cells/cm² = 38,000 cells; 1e6/mL stock -> 38 µL
const sd = B.seeding({ area: 1.9, density: 2e4, stock: 1e6, wells: 10, overage: 0.1 });
close(sd.perWell, 38000, 1e-6, 'cells/well'); close(sd.volPerWellMl, 0.038, 1e-12, 'vol/well'); close(sd.totalCells, 418000, 1e-6, 'total');
// Hemocytometer: mean 50 live per large square, 1:1 trypan -> 50 × 2 × 1e4 = 1e6 /mL; 5 dead -> 90.9 % viable
const h = B.hemocytometer({ live: [52, 48, 55, 45], dead: [5, 5, 4, 6], dilution: 2 });
close(h.liveMl, 1e6, 1e-6, 'cells/mL'); close(h.viability, 100 * 50 / 55, 1e-9, 'viability');
assert.deepEqual(B.parseNumbers(' 1, 2  3;x '), [1, 2, 3]);
assert.deepEqual(B.parseNumbers(''), []);
// Centrifuge: 10 cm, 3000 rpm -> 1006 g
close(B.rcf(3000, 10), 1006.2, 0.1, 'RCF'); close(B.rpmFromRcf(1006.2, 10), 3000, 0.5, 'rpm');
// Photons: 1 mW at 488 nm = 2.457e15 photons/s; 2.54 eV
close(B.photonsPerSecond(1, 488) / 1e15, 2.4567, 0.001, 'photons/s');
close(B.photonEnergyEV(488), 2.5407, 0.001, 'eV');
close(B.powerFromPhotons(B.photonsPerSecond(3, 561), 561), 3, 1e-9, 'round trip');
// Stokes–Einstein: r = 1 nm in water at 25 °C (0.89 mPa·s) -> 245 µm²/s; GFP (27 kDa) radius ≈ 2 nm
close(B.stokesEinstein(1, 25, 0.89), 245.3, 0.5, 'D');
close(B.radiusFromMW(27000), 1.98, 0.02, 'radius from MW');
// Recipes scale linearly and every reference has a source
const pbs = B.scaleRecipe(RECIPES.find(r => r.id === 'pbs1'), 500);
assert.equal(pbs[0].unit, 'g'); close(pbs[0].amount, 4, 1e-9, 'PBS NaCl in 500 mL');
const mea = B.scaleRecipe(RECIPES.find(r => r.id === 'stormMEA'), 0.697 * 2);
close(mea[0].amount, 1.24, 1e-9, 'Buffer B doubled'); assert.equal(mea[0].unit, 'mL');
for (const r of RECIPES) assert.ok(r.src.length && r.src.every(k => SRC[k]?.url), `recipe ${r.id} source`);
for (const v of VESSELS) assert.ok(v.area > 0 && SRC[v.src]?.url, `vessel ${v.id} source`);

// --- analysis ---------------------------------------------------------------------------------------
assert.deepEqual(A.parseTable('t,I\n0,1\n1\t2\n2 3\n'), [[0, 1], [1, 2], [2, 3]]);
// Photons for a target precision inverts locPrecision
const n = A.photonsForPrecision(10, 120, 100, 10, false);
close(locPrecision(120, 100, n, 10, false), 10, 0.01, 'photons for 10 nm');
assert.ok(locPrecision(120, 100, 1000, 0, true) > locPrecision(120, 100, 1000, 0, false), 'EMCCD worse');
// FRET
close(A.fretFromIntensity(600, 1000), 0.4, 1e-12, 'E intensity');
close(A.fretFromLifetime(1.3, 2.6), 0.5, 1e-12, 'E lifetime');
close(A.fretR(0.5, 5), 5, 1e-9, 'r at E = 0.5');
assert.ok(Number.isNaN(A.fretR(1.2, 5)));
// FRAP: synthetic exponential with noise; the fit recovers τ = 4 s and 70 % mobile
const rand = rng(11), rows = [];
for (let i = 0; i < 60; i++) {
  const t = i * 0.5, tb = t - 2.5;
  rows.push([t, (tb < 0 ? 1000 : 200 + 560 * (1 - Math.exp(-tb / 4))) + 3 * rand.normal()]);
}
const nm = A.frapNormalise(rows, { mode: 'full' });
assert.equal(nm.nPre, 5);
const fit = A.fitRecovery(nm.post);
close(fit.tau, 4, 0.15, 'τ recovered'); assert.ok(fit.r2 > 0.99, 'R²');
const sm = A.frapSummary(fit, 1);
close(sm.mobile, 0.7, 0.02, 'mobile fraction'); close(sm.thalf, 4 * Math.LN2, 0.1, 't½'); close(sm.D, 0.224 / sm.thalf, 1e-12, 'Soumpasis D');
// Noise-free fit is exact
const clean = Array.from({ length: 30 }, (_, i) => [i, 0.1 + 0.6 * (1 - Math.exp(-i / 7))]);
const cf = A.fitRecovery(clean);
close(cf.tau, 7, 1e-3, 'exact τ'); close(cf.A, 0.6, 1e-4, 'exact A'); close(cf.I0, 0.1, 1e-4, 'exact I0');
// MSD: straight-line track at 1 µm/frame gives MSD = lag²; Brownian track recovers D
const line = Array.from({ length: 20 }, (_, i) => [i, 0]);
const la = A.analyseTrack(line, 1, 2);
close(la.curve[1][1], 4, 1e-12, 'MSD lag 2');
const r2 = rng(5), walk = [];
let px = 0, py = 0;
const D = 0.5, dt = 0.05, sd2 = Math.sqrt(2 * D * dt);
for (let i = 0; i < 4000; i++) { px += sd2 * r2.normal(); py += sd2 * r2.normal(); walk.push([i, px, py]); }
close(A.analyseTrack(walk, dt, 4).D, D, 0.05, 'MSD D (frame, x, y columns)');
// Detectability: Rose criterion
assert.ok(A.detectability({ S: 100, bg: 0, qe: 1, read: 0 }).rose, '100 photons detectable');
close(A.detectability({ S: 100, bg: 0, qe: 1, read: 0 }).snr, 10, 1e-9, 'shot-limited SNR');
assert.ok(!A.detectability({ S: 10, bg: 20, qe: 0.8, read: 2 }).rose, 'dim spot not detectable');

console.log('lab_bench tests passed');
