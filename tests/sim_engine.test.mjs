// Node tests for the pure simulation engine: run with `node tests/sim_engine.test.mjs`.
import assert from 'node:assert/strict';
import * as E from '../atlas/web/static/sim_engine.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// Bessel functions against tabulated values
close(E.besselJ1(1), 0.4400505857, 1e-7, 'J1(1)');
close(E.besselJ0(2.404825557695773), 0, 1e-7, 'J0 first zero');
close(E.besselJ1(3.831705970207512), 0, 1e-7, 'J1 first zero');
// Airy: first zero at 0.61 λ/NA, encircled energy at first ring 83.8%
close(E.airy(E.rayleigh(500, 1), 1, 500), 0, 1e-6, 'Airy zero at Rayleigh radius');
close(E.encircledEnergy(1), 0.838, 0.002, 'encircled energy at 1 AU');
// TIRF depth: 488 nm, 1.518/1.33, 70° -> ~ 74 nm (I-decay)
close(E.criticalAngle(1.518, 1.33), 61.2, 0.1, 'critical angle');
close(E.penetrationDepth(488, 1.518, 1.33, 70), 488 / (4 * Math.PI * Math.sqrt(1.518 ** 2 * Math.sin(70 * Math.PI / 180) ** 2 - 1.33 ** 2)), 1e-9, 'depth formula');
assert.equal(E.penetrationDepth(488, 1.518, 1.33, 50), Infinity);
// FRET at R0 is 0.5
close(E.fretEfficiency(5, 5), 0.5, 1e-12, 'FRET at R0');
close(E.fretDistance(0.5, 6), 6, 1e-9, 'FRET inverse');
// Electron wavelength: 300 kV = 1.969 pm, 200 kV = 2.508 pm
close(E.electronWavelength(300), 1.969, 0.002, 'λ at 300 kV');
close(E.electronWavelength(200), 2.508, 0.002, 'λ at 200 kV');
// STED with no depletion equals the Abbe limit
close(E.stedResolution(600, 1.4, 0), E.abbe(600, 1.4), 1e-9, 'STED at zero');
// Localization precision falls as 1/sqrt(N)
close(E.locPrecision(100, 100, 400) / E.locPrecision(100, 100, 1600), 2, 1e-9, 'σ ∝ 1/√N');
// Soumpasis recovery tends to 1 and passes 0.5 near t = 0.88 τD... (t½ = 0.224 w²/D = 0.896 τD)
close(E.soumpasis(0.896, 1), 0.5, 0.01, 'Soumpasis half time');
close(E.soumpasis(1e4, 1), 1, 0.01, 'Soumpasis plateau');
// Random walk MSD recovers D
const rand = E.rng(42);
const tr = E.randomWalk(20000, 0.5, 0.01, rand);
close(E.fitMSD(E.msd(tr, 5), 0.01, 4).D, 0.5, 0.03, 'MSD fit recovers D');
// Gaussian sheet: w0 = λ/(π NA)
close(E.gaussianSheet(500, 0.1, 1.33).w0, 500 / (Math.PI * 0.1), 1e-9, 'sheet waist');
// Sectioning grows with pinhole
assert.ok(E.sectioningFWHM(520, 1.4, 1.518, 2) > E.sectioningFWHM(520, 1.4, 1.518, 1));
console.log('sim_engine: all tests passed');
