// Node tests for the Lab Tools setup/planning calculations: run with `node tests/lab_setup.test.mjs`.
import assert from 'node:assert/strict';
import * as L from '../atlas/web/static/lab_setup.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// TIRF: 60x 1.49 NA on a Nikon (200 mm tube): f = 3.333 mm, θc(1.518→1.33) = 61.2°, r(θc) = f·1.33 = 4.43 mm, r(NA) = 4.97 mm
const t = L.tirfRange({ M: 60, fTube: L.TUBE_LENS.Nikon, NA: 1.49, n1: 1.518, n2: 1.33 });
close(t.f, 3.3333, 1e-3, 'objective focal length');
close(t.thetaC, 61.2, 0.05, 'critical angle');
close(t.rMin, 4.433, 1e-3, 'offset at critical angle');
close(t.rMax, 4.967, 1e-3, 'offset at NA edge');
close(L.tirfOffset(t.f, 1.518, t.thetaC), t.rMin, 1e-9, 'tirfOffset at θc equals f·n2');
close(t.thetaMax, Math.asin(1.49 / 1.518) * 180 / Math.PI, 1e-9, 'NA-limited angle');
assert.equal(L.tirfRange({ M: 60, fTube: 180, NA: 1.2, n2: 1.33 }).possible, false, 'water objective cannot do TIRF');
close(L.objectiveFocal(L.TUBE_LENS.Zeiss, 100), 1.65, 1e-12, 'Zeiss 100x focal length');

// Camera matcher: 6.5 µm pixel, 60x, no relay -> 108.3 nm; Nyquist at 520 nm / 1.4 NA = 92.9 nm; relay for Nyquist 1.167x
const m = L.cameraMatch({ pixelUm: 6.5, mag: 60, relay: 1, lambda: 520, NA: 1.4, nx: 2048, ny: 2048 });
close(m.samplePx, 108.33, 0.01, 'pixel at sample');
close(m.nyq, 92.857, 0.01, 'Nyquist pixel');
close(m.relayNyquist, 1.1667, 1e-3, 'relay for Nyquist');
close(m.fovW, 2048 * 6.5 / 60, 1e-9, 'field of view');
assert.match(m.verdict, /under-sampled/);
assert.match(L.cameraMatch({ pixelUm: 6.5, mag: 100, relay: 1, lambda: 520, NA: 1.4 }).verdict, /meets Nyquist/);
assert.ok(Number.isNaN(L.cameraMatch({ pixelUm: 6.5, mag: 100, lambda: 520, NA: 1.4 }).fovW), 'no sensor size -> NaN FOV');

// Sensor strings from data/components/detectors.json
assert.deepEqual(L.parseSensor('2304 x 2304 (5.3 MP)'), { nx: 2304, ny: 2304 });
assert.deepEqual(L.parseSensor('8k x 8k (67.1 MP)'), { nx: 8192, ny: 8192 });
assert.deepEqual(L.parseSensor('1.4 MP (13.3 x 13.3 mm sensor)'), { wMm: 13.3, hMm: 13.3 });
assert.equal(L.parseSensor('4.1 MP'), null);
assert.equal(L.firstNumber('16.38 µm pitch'), 16.38);

// Z-step: widefield axial 2nλ/NA² = 2·1.518·520/1.96 = 805.5 nm -> step 402.7 nm; 10 µm stack -> 25 slices
const z = L.zStep({ mode: 'widefield', lambda: 520, NA: 1.4, n: 1.518 });
close(z.axial, 805.47, 0.05, 'widefield axial');
close(z.step, 402.73, 0.05, 'widefield z-step');
close(z.strict, 520 / (2 * 1.518 * (1 - Math.sqrt(1 - (1.4 / 1.518) ** 2))), 1e-9, 'band-limit step');
const plan = L.stackPlan({ depthUm: 10, stepNm: 400, exposureMs: 50, overheadMs: 10 });
assert.equal(plan.slices, 26);
close(plan.seconds, 1.56, 1e-9, 'time per stack');
close(L.zStep({ mode: 'lightsheet', lambda: 520, NA: 0.8, n: 1.33, sheetUm: 4 }).step, 2000, 1e-9, 'light-sheet step');
assert.ok(L.zStep({ mode: 'confocal', lambda: 520, NA: 1.4, n: 1.518, pinholeAU: 1 }).step > 0);

// Power density: 10 mW over a 100 µm field = 127.3 W/cm²; 1 kW/cm² at 640 nm = 3.22e13 photons/s/µm²
close(L.powerDensity(10, L.circleAreaCm2(100)), 127.32, 0.01, 'W/cm²');
close(L.photonFlux(1000, 640), 3.2219e13, 0.001e13, 'photon flux');
close(L.confocalSpotUm(488, 1.4), 0.42526, 1e-4, 'confocal spot');

// Acquisition planner: 2048² 16-bit, 2 ch, 30 z, 100 t, 4 pos = 24000 frames × 8.39 MB = 201.3 GB
const a = L.acquisitionPlan({ nx: 2048, ny: 2048, bits: 16, channels: 2, z: 30, t: 100, positions: 4, fps: 50 });
assert.equal(a.frames, 24000);
close(a.GB, 201.33, 0.01, 'data volume');
close(a.MBps, 419.43, 0.01, 'write speed');
close(a.seconds, 480, 1e-9, 'acquisition time');
assert.equal(L.acquisitionPlan({ nx: 10, ny: 10, bits: 12 }).bpp, 2, '12-bit stored as 2 bytes');
close(L.timeSampling(10, 'periodic').nyquist, 5, 1e-12, 'Nyquist in time');

// Light dose: 1 W/cm² × 100 ms × 600 frames = 60 J/cm²
close(L.lightDose(1, 100, 600), 60, 1e-9, 'dose');

// Immersion advice: matched oil sample -> oil first; live cells deep -> water/silicone ahead of oil
assert.equal(L.recommendImmersion(1.52, 100)[0].name, 'Oil');
const deep = L.recommendImmersion(1.36, 50);
assert.equal(deep.find(r => r.name === 'Oil').grade, 'poor');
assert.ok(['Water', 'Silicone'].includes(deep[0].name));

// Objective finder classification and filtering
assert.deepEqual(L.immersionClass('silicone oil'), ['silicone']);
assert.deepEqual(L.immersionClass('oil'), ['oil']);
assert.ok(L.immersionClass('oil, water or glycerol').includes('water'));
const objs = [{ specs: { NA: '1.49', Immersion: 'oil', 'Working distance': '0.12 mm', Magnification: '100x' } },
  { specs: { NA: '1.0', Immersion: 'water (immersion or dipping)', 'Working distance': '2 mm', Magnification: '25x' } }];
assert.equal(L.filterObjectives(objs, { immersion: 'water' }).length, 1);
assert.equal(L.filterObjectives(objs, { minNA: 1.4 }).length, 1);
assert.equal(L.filterObjectives(objs, { minWD: 1 }).length, 1);
assert.equal(L.filterObjectives(objs, { minMag: 50, maxMag: 200 }).length, 1);

// Tool registry contract
const ids = L.TOOLS.map(x => x.id);
assert.equal(new Set(ids).size, ids.length, 'unique ids');
for (const x of L.TOOLS) {
  assert.match(x.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(!['chooser', 'calc', 'spectra'].includes(x.id));
  assert.ok(['Microscope setup', 'Planning'].includes(x.group));
  assert.equal(typeof x.mount, 'function');
}
for (const r of L.MEDIA) assert.ok(r[4].length > 0, `${r[0]} has a source`);
console.log('lab_setup tests passed');
