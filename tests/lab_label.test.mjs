// Node tests for the Labelling and probes calculations: run with `node tests/lab_label.test.mjs`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as L from '../atlas/web/static/lab_label_calc.js';
import { DOL_DYES, TAGS, FIX, SEC_RULES, SRC } from '../atlas/web/static/lab_label_data.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// --- antibody dilution: 1:500 of 1 mg/mL into 1 mL = 2 µL (= 2 µg/mL)
{ const r = L.antibodyDilution({ ratio: 500, finalUl: 1000, stockMgMl: 1 });
  close(r.abUl, 2, 1e-12, '1:500 into 1 mL'); close(r.diluentUl, 998, 1e-9, 'diluent'); close(r.workingUgMl, 2, 1e-12, 'working conc'); }
{ const r = L.antibodyDilution({ stockMgMl: 1, targetUgMl: 2, finalUl: 1000 });
  close(r.factor, 500, 1e-9, '1 mg/mL → 2 µg/mL is 1:500'); close(r.abUl, 2, 1e-12, 'same volume'); }
assert.ok(Number.isNaN(L.antibodyDilution({ stockMgMl: 1, targetUgMl: 2000, finalUl: 100 }).abUl), 'target above stock');
close(L.totalVolume(12, 50, 10), 660, 1e-9, '12 coverslips × 50 µL + 10%');
{ const c = L.antibodyCost({ abUl: 2, price: 400, vialUl: 100 }); close(c.cost, 8, 1e-12, 'cost'); close(c.experimentsPerVial, 50, 1e-12, 'per vial'); }
close(L.antibodyCost({ abUl: 2, price: 400, vialUg: 100, stockMgMl: 0.5 }).vialUl, 200, 1e-12, '100 µg at 0.5 mg/mL = 200 µL');

// --- DOL: Thermo DyLight manual example (DyLight 550 IgG, ×40 dilution): protein 0.00002737 M.
// (The manual then prints "2.9" with A280 in the numerator; with Amax as its own formula states, DOL = 4.0.)
{ const r = L.degreeOfLabelling({ a280: 0.177, amax: 0.411, epsDye: 150000, cf: 0.081, epsProt: 210000, dilution: 40 });
  close(r.protM, 0.00002737, 2e-8, 'DyLight protein M'); close(r.dol, 4.00, 0.01, 'DyLight DOL from Amax'); }
// Thermo blog example: A280 0.289, Amax 0.906, CF 0.0806 → 1.03 µM protein, F/P 5.86
{ const r = L.degreeOfLabelling({ a280: 0.289, amax: 0.906, epsDye: 150000, cf: 0.0806 });
  close(r.protM * 1e6, 1.03, 0.005, 'blog protein µM'); close(r.dol, 5.86, 0.02, 'blog F/P'); }
// Dilution and path length cancel in the DOL
{ const a = L.degreeOfLabelling({ a280: 0.5, amax: 0.6, epsDye: 71000, cf: 0.11 }), b = L.degreeOfLabelling({ a280: 0.5, amax: 0.6, epsDye: 71000, cf: 0.11, dilution: 10, path: 0.1 });
  close(a.dol, b.dol, 1e-12, 'DOL independent of dilution/path'); }

// --- protein concentration: IgG ε 210,000 and MW 150,000 → E0.1% = 1.4 (Thermo's 1.4 A units = 1 mg/mL)
close(L.e01FromEps(210000, 150000), 1.4, 1e-12, 'IgG E0.1%');
close(L.proteinFromAbsorbance({ a: 1.4, mode: 'e01', e01: 1.4 }).mgMl, 1, 1e-12, 'E0.1%');
close(L.proteinFromAbsorbance({ a: 1.4, mode: 'e1pct', e1pct: 14 }).mgMl, 1, 1e-12, 'E1%');
{ const r = L.proteinFromAbsorbance({ a: 1.4, eps: 210000, mw: 150000 }); close(r.uM, 6.6667, 1e-3, 'µM'); close(r.mgMl, 1, 1e-12, 'mg/mL'); }
close(L.mgMlToUM(1, 150000), 6.6667, 1e-3, 'mg/mL → µM'); close(L.uMToMgMl(6.6667, 150000), 1, 1e-4, 'µM → mg/mL');

// --- labelling reaction: 1 mg IgG = 6.67 nmol; 10× AF488 NHS (643 g/mol) = 66.7 nmol = 42.9 µg = 6.67 µL of 10 mM
{ const r = L.labellingReaction({ protMg: 1, protMw: 150000, excess: 10, dyeMw: 643, stockMM: 10 });
  close(r.protNmol, 6.6667, 1e-3, 'nmol IgG'); close(r.dyeNmol, 66.667, 1e-2, 'nmol dye'); close(r.dyeUg, 42.87, 0.01, 'µg dye'); close(r.stockUl, 6.6667, 1e-3, 'µL stock'); }
close(L.labellingReaction({ protMg: 1, excess: 10, dyeMw: 643, stockMgMl: 10 }).stockUl, 4.287, 1e-3, 'µL of 10 mg/mL');
close(L.labellingReaction({ protMg: 1, excess: 10, dyeMw: 643, stockMM: 10, reactivity: 50 }).dyeNmol, 133.33, 0.01, 'reactivity');

// --- spectra helpers
const gauss = (mu, sd) => Array.from({ length: 301 }, (_, k) => [300 + 2 * k, Math.exp(-(((300 + 2 * k) - mu) ** 2) / (2 * sd * sd))]);
close(L.interp([[500, 0], [502, 1]], 501), 0.5, 1e-12, 'interp'); assert.equal(L.interp([[500, 1]], 600), 0);
{ const cum = L.emissionCum(gauss(550, 20)); close(L.bandFraction(cum, 300, 900), 1, 1e-9, 'all'); close(L.bandFraction(cum, 550, 900), 0.5, 0.02, 'half'); close(L.bandFraction(cum, 510, 590), 0.954, 0.01, '±2σ'); }

// --- panel designer on synthetic dyes: the clean pair beats the overlapping pair
{ const mk = (name, ex, em, b) => ({ name, kind: 'dye', brightness: b, ex: gauss(ex, 15), em: gauss(em, 15) });
  const fl = [mk('A', 490, 520, 50), mk('B', 488, 530, 60), mk('C', 640, 665, 50)];
  const top = L.designPanels(fl, [488, 640], 2);
  assert.ok(top.length >= 1, 'found panels');
  assert.deepEqual(top[0].members.map(m => m.f.name).sort(), ['B', 'C'], 'brightest well-separated pair');
  top[0].X.forEach((r, i) => close(r[i], 1, 1e-12, 'diagonal is 1'));
  assert.ok(top[0].maxX < 0.05, 'little crosstalk'); assert.ok(top[0].bands[1][0] >= 648, 'band above the 640 laser');
  assert.equal(L.designPanels(fl, [405], 2).length, 0, 'nothing excitable'); }

// --- panel designer on the real FPbase spectra: 4 dyes at 405/488/561/640
{ const spec = JSON.parse(readFileSync(new URL('../data/spectra.json', import.meta.url)));
  const rows = Object.fromEntries(JSON.parse(readFileSync(new URL('../data/fluorophores.json', import.meta.url))).map(r => [r.name, r]));
  const fl = Object.keys(spec).filter(n => rows[n]?.kind === 'dye').map(n => ({ name: n, kind: 'dye', brightness: rows[n].brightness, ex: spec[n].ex, em: spec[n].em }));
  const t0 = Date.now(), top = L.designPanels(fl, [405, 488, 561, 640], 4);
  assert.equal(top.length, 3, 'three panels'); assert.ok(Date.now() - t0 < 5000, 'fast enough');
  assert.deepEqual(top[0].members.map(m => m.laser), [405, 488, 561, 640], 'one channel per laser');
  assert.ok(top[0].maxX < 0.5, `crosstalk ${top[0].maxX}`);
  const sim = L.evaluatePanel(top[0].members, { simultaneous: true });
  assert.ok(sim.maxX > top[0].maxX, 'simultaneous excitation adds crosstalk');
  sim.X.forEach((r, i) => close(r[i], 1, 1e-12, 'sim diagonal')); }

// --- FP picker
{ const rows = [{ name: 'a', kind: 'protein', em: 510, agg: 'M', maturation: 10, pka: 5, brightness: 50, switch: 'B' },
    { name: 'b', kind: 'protein', em: 515, agg: 'D', maturation: 10, pka: 5, brightness: 90, switch: 'B' },
    { name: 'c', kind: 'protein', em: 600, agg: 'M', pka: 4, brightness: 70, switch: 'PC' },
    { name: 'd', kind: 'dye', em: 510, brightness: 99 }];
  assert.deepEqual(L.filterFPs(rows, { colour: 'green' }).map(r => r.name), ['b', 'a']);
  assert.deepEqual(L.filterFPs(rows, { monomer: true }).map(r => r.name), ['c', 'a']);
  assert.deepEqual(L.filterFPs(rows, { maxMaturation: 20 }).map(r => r.name), ['b', 'a'], 'unknown maturation excluded');
  assert.deepEqual(L.filterFPs(rows, { maxPka: 4.5, switchType: 'pc' }).map(r => r.name), ['c']);
  assert.equal(L.colourOf(700), 'near-IR'); }

// --- secondary planner
{ const p = L.planSecondaries([{ host: 'goat' }, { host: 'rabbit' }, { host: 'mouse' }]);
  assert.equal(p.host, 'donkey'); assert.equal(p.secondaries[0].name, 'Donkey anti-Goat IgG (H+L)');
  assert.deepEqual(p.secondaries[2].minX, ['goat', 'rabbit']); assert.ok(!p.issues.some(i => i.level === 'error')); }
{ const p = L.planSecondaries([{ host: 'mouse', isotype: 'IgG1' }, { host: 'mouse', isotype: 'IgG2a' }, { host: 'rabbit' }]);
  assert.equal(p.host, 'goat'); assert.ok(p.subclass); assert.equal(p.secondaries[1].name, 'Goat anti-Mouse IgG2a (Fcγ subclass specific)'); }
{ const p = L.planSecondaries([{ host: 'mouse' }, { host: 'mouse' }]); assert.ok(p.issues.some(i => i.rule === 'dupHost' && i.level === 'error')); }
{ const p = L.planSecondaries([{ host: 'mouse', isotype: 'IgG1' }, { host: 'mouse', isotype: 'IgG2b' }, { host: 'goat' }]);
  assert.equal(p.host, null); assert.ok(p.issues.some(i => i.rule === 'subclass' && i.level === 'error')); }
{ const p = L.planSecondaries([{ host: 'donkey' }, { host: 'goat' }]); assert.equal(p.host, null); }
{ const p = L.planSecondaries([{ host: 'goat' }, { host: 'sheep' }]); assert.ok(p.issues.some(i => i.rule === 'goatSheep' && i.level === 'error')); }
{ const p = L.planSecondaries([{ host: 'mouse' }, { host: 'rat' }], { sample: 'mouse' });
  assert.ok(p.issues.some(i => i.rule === 'adsorb')); assert.ok(p.issues.some(i => i.rule === 'endogenous'));
  assert.equal(p.secondaries[1].name, 'Donkey anti-Rat IgG (H+L)'); assert.deepEqual(p.secondaries[1].minX, ['mouse']); }
assert.equal(L.planSecondaries([{ host: 'chicken' }]).secondaries[0].name, 'Donkey anti-Chicken IgY');
assert.equal(L.planSecondaries([{ host: 'donkey' }]).host, 'goat');
{ const ch = [{ dye: 'dim', brightness: 10 }, { dye: 'bright', brightness: 90 }];
  assert.deepEqual(L.assignChannels([{ abundance: 'high' }, { abundance: 'low' }], ch).map(c => c.dye), ['dim', 'bright']); }

// --- reference data: every row cites a known source
for (const d of DOL_DYES) { assert.ok(SRC[d.src], d.name); assert.ok(d.eps > 1000 && d.cf >= 0 && d.cf < 1, d.name); }
for (const t of [...TAGS, ...FIX]) t.src.forEach(s => assert.ok(SRC[s], `${t.name}: ${s}`));
for (const [k, r] of Object.entries(SEC_RULES)) assert.ok(SRC[r.src], k);
console.log('lab_label tests passed');
