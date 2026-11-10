// Lab Tools, 'Bench calculators' group: molarity, dilution, serial dilution, concentration units, percent solutions.
// Seeding, hemocytometer, centrifuge, recipes and photon/diffusion tools live in lab_bench2.js and are re-exported here.
// Pure calculations are in lab_bench_calc.js (tests/lab_bench.test.mjs).
import { esc } from './core.js';
import { num, select, row, panel, results, out, table, note, fmt } from './lab_ui.js';
import { CONC_UNITS, VOLUME, MASS, PREFIX, convertConc, convertPrefix, autoUnit, molarity, dilute, serialDilution,
  percentWV, percentVV, stockToWorking } from './lab_bench_calc.js';
import { TOOLS as MORE } from './lab_bench2.js';
export * from './lab_bench_calc.js';

const G = 'Bench calculators';
const opts = obj => Object.keys(obj).map(k => [k, k]);
const MOLAR = ['M', 'mM', 'µM', 'nM', 'pM'];
const vol = (v, u) => v * VOLUME[u];
const showVol = L => { const [v, u] = autoUnit(L, { L: 1, mL: 1e-3, 'µL': 1e-6, nL: 1e-9 }); return `${fmt(v, 4)} ${u}`; };
const showMass = g => { const [v, u] = autoUnit(g, { kg: 1e3, g: 1, mg: 1e-3, 'µg': 1e-6, ng: 1e-9 }); return `${fmt(v, 4)} ${u}`; };

// A number input with a unit select beside it. Returns {get: () => value in base units of table, el}.
function numUnit(host, { id, label, value, units, unit }, cb) {
  const r = row(host);
  const i = num(r, { id, label, value }, cb);
  const s = select(r, { id: id + 'u', label: 'Unit', options: units.map(u => [u, u]), value: unit }, cb);
  r.children[1].style.maxWidth = '140px';
  return { v: () => +i.value, u: () => s.value, input: i, sel: s };
}

function mountMolarity(host) {
  const p = panel(host);
  const mode = select(p, { id: 'mmode', label: 'Solve for', options: [['mass', 'Mass to weigh'], ['vol', 'Volume to dissolve in'], ['conc', 'Concentration']], value: 'mass' }, () => draw());
  const mw = num(p, { id: 'mw', label: 'Molecular weight', unit: 'g/mol', value: 58.44, help: 'Formula weight from the bottle (include waters of hydration).' }, () => draw());
  const m = numUnit(p, { id: 'mmass', label: 'Mass', value: 1, units: Object.keys(MASS), unit: 'g' }, () => draw());
  const v = numUnit(p, { id: 'mvol', label: 'Volume', value: 100, units: Object.keys(VOLUME), unit: 'mL' }, () => draw());
  const c = numUnit(p, { id: 'mconc', label: 'Concentration', value: 150, units: MOLAR, unit: 'mM' }, () => draw());
  const res = out(p);
  function draw() {
    const md = mode.value;
    [m, v, c].forEach((x, k) => { x.input.disabled = ['mass', 'vol', 'conc'][k] === md; });
    const args = { mw: +mw.value, massG: m.v() * MASS[m.u()], volL: vol(v.v(), v.u()), molar: convertConc(c.v(), c.u(), 'M') };
    if (md === 'mass') args.massG = null; else if (md === 'vol') args.volL = null; else args.molar = null;
    const r = molarity(args);
    const conc = autoUnit(r.molar, { M: 1, mM: 1e-3, 'µM': 1e-6, nM: 1e-9, pM: 1e-12 });
    results(res, [['Mass', showMass(r.massG)], ['Volume', showVol(r.volL)], ['Concentration', `${fmt(conc[0], 4)} ${conc[1]}`],
      ['Moles', `${fmt(r.molar * r.volL * 1e3, 4)} mmol`]]);
  }
  draw();
}

function mountDilution(host) {
  const p = panel(host, 'C1 V1 = C2 V2');
  const c1 = numUnit(p, { id: 'dc1', label: 'Stock concentration (C1)', value: 1, units: CONC_UNITS, unit: 'mg/mL' }, () => draw());
  const c2 = numUnit(p, { id: 'dc2', label: 'Final concentration (C2)', value: 10, units: CONC_UNITS, unit: 'µg/mL' }, () => draw());
  const v2 = numUnit(p, { id: 'dv2', label: 'Final volume (V2)', value: 1, units: Object.keys(VOLUME), unit: 'mL' }, () => draw());
  const mw = num(p, { id: 'dmw', label: 'Molecular weight (only to mix molar and mass units)', unit: 'g/mol', value: '' }, () => draw());
  const res = out(p);
  function draw() {
    const r = dilute({ c1: c1.v(), u1: c1.u(), c2: c2.v(), u2: c2.u(), v2: vol(v2.v(), v2.u()), mw: +mw.value || NaN });
    if (r.error) { res.className = 'callout'; res.textContent = r.error; return; }
    results(res, [['Stock to add (V1)', showVol(r.v1)], ['Diluent', showVol(r.diluent)], ['Dilution', `1 : ${fmt(r.fold, 4)}`]]);
  }
  draw();
}

function mountSerial(host) {
  const p = panel(host);
  const r1 = row(p);
  const c0 = num(r1, { id: 'sc0', label: 'Starting concentration', value: 100 }, () => draw());
  const cu = select(r1, { id: 'scu', label: 'Unit', options: CONC_UNITS.map(u => [u, u]), value: 'µM' }, () => draw());
  const r2 = row(p);
  const fold = num(r2, { id: 'sf', label: 'Fold per step', value: 2, min: 1 }, () => draw());
  const steps = num(r2, { id: 'sn', label: 'Number of tubes', value: 8, step: 1, min: 1 }, () => draw());
  const v = numUnit(p, { id: 'sv', label: 'Volume per tube', value: 100, units: ['mL', 'µL'], unit: 'µL' }, () => draw());
  const mode = select(p, { id: 'smode', label: 'Volume means', options: [['remaining', 'Volume left in each tube after transfer'], ['mixed', 'Total volume mixed in each tube']], value: 'remaining' }, () => draw());
  const res = out(p), tab = out(p);
  function draw() {
    const s = serialDilution({ c0: +c0.value, fold: +fold.value, steps: Math.round(+steps.value), volume: vol(v.v(), v.u()), mode: mode.value });
    if (!s.rows.length) { res.className = 'callout'; res.textContent = 'Fold must be above 1 and at least one tube.'; tab.innerHTML = ''; return; }
    results(res, [['Transfer each step', showVol(s.transfer)], ['Diluent per tube', showVol(s.diluent)], ['Stock needed', showVol(s.stockNeeded)], ['Diluent in total', showVol(s.diluentTotal)]]);
    table(tab, ['Tube', `Concentration (${cu.value})`, 'Dilution', 'Add diluent', 'Transfer in'], s.rows.map(r =>
      [r.tube, fmt(r.conc, 4), `1:${fmt(r.dilution, 4)}`, esc(showVol(r.diluent)), esc(`${showVol(r.transfer)} from ${r.tube === 1 ? 'stock' : 'tube ' + (r.tube - 1)}`)]));
  }
  draw();
  note(host, 'Pre-fill every tube with diluent, then transfer down the row, mixing well and changing tips each step. In "volume left" mode the last tube holds one transfer extra: discard it if all tubes must match.', 'callout g small');
}

function mountUnits(host) {
  const p = panel(host, 'Concentration: mass/volume ↔ molar');
  const a = numUnit(p, { id: 'uv', label: 'Value', value: 1, units: CONC_UNITS, unit: 'µg/mL' }, () => draw());
  const mw = num(p, { id: 'umw', label: 'Molecular weight', unit: 'g/mol', value: 150000, help: 'e.g. IgG ≈ 150,000 g/mol (150 kDa).' }, () => draw());
  const res = out(p);
  function draw() {
    results(res, CONC_UNITS.filter(u => u !== 'X' && u !== a.u()).map(u => [u, fmt(convertConc(a.v(), a.u(), u, +mw.value), 4)]));
  }
  draw();
  const q = panel(host, 'SI prefix converter');
  const r = row(q);
  const x = num(r, { id: 'px', label: 'Value', value: 1 }, () => drawP());
  const f = select(r, { id: 'pf', label: 'From prefix', options: Object.keys(PREFIX).map(k => [k, k || '(none)']), value: 'm' }, () => drawP());
  const base = select(r, { id: 'pb', label: 'Base unit', options: ['g', 'L', 'M', 'm', 'W', 's', 'Hz', 'mol'].map(u => [u, u]), value: 'g' }, () => drawP());
  const pres = out(q);
  function drawP() {
    results(pres, Object.keys(PREFIX).filter(k => k !== f.value).map(k => [`${k}${base.value}`, fmt(convertPrefix(+x.value, f.value, k), 4)]));
  }
  drawP();
}

function mountPercent(host) {
  const p = panel(host, 'Percent solutions');
  const r = row(p);
  const kind = select(r, { id: 'pk', label: 'Type', options: [['wv', '% w/v (g per 100 mL)'], ['vv', '% v/v (mL per 100 mL)']], value: 'wv' }, () => draw());
  const pct = num(r, { id: 'pp', label: 'Percent', value: 4, unit: '%' }, () => draw());
  const v = numUnit(p, { id: 'pvol', label: 'Final volume', value: 50, units: ['L', 'mL', 'µL'], unit: 'mL' }, () => draw());
  const res = out(p);
  function draw() {
    const ml = vol(v.v(), v.u()) * 1e3;
    if (kind.value === 'wv') results(res, [['Solute to weigh', showMass(percentWV(+pct.value, ml))], ['Then make up to', showVol(ml / 1e3)]]);
    else results(res, [['Solute (liquid)', showVol(percentVV(+pct.value, ml) / 1e3)], ['Solvent to add (approx.)', showVol((ml - percentVV(+pct.value, ml)) / 1e3), 'volumes are not strictly additive: make up to volume']]);
  }
  draw();
  const q = panel(host, 'Stock to working (e.g. 10X → 1X)');
  const r2 = row(q);
  const sx = num(r2, { id: 'sx', label: 'Stock strength', unit: 'X', value: 10 }, () => drawS());
  const wx = num(r2, { id: 'wx', label: 'Working strength', unit: 'X', value: 1 }, () => drawS());
  const fv = numUnit(q, { id: 'fv', label: 'Final volume', value: 500, units: ['L', 'mL', 'µL'], unit: 'mL' }, () => drawS());
  const sres = out(q);
  function drawS() {
    const s = stockToWorking({ stockX: +sx.value, workX: +wx.value, finalVol: vol(fv.v(), fv.u()) });
    if (+wx.value > +sx.value) { sres.className = 'callout'; sres.textContent = 'Working strength is above the stock.'; return; }
    results(sres, [['Stock', showVol(s.v1)], ['Water / diluent', showVol(s.diluent)]]);
  }
  drawS();
}

export const TOOLS = [
  { id: 'molarity', group: G, title: 'Molarity, mass and volume', blurb: 'Grams to weigh, volume to dissolve in, or concentration: any one from the other two, with MW.', mount: mountMolarity },
  { id: 'dilution', group: G, title: 'Dilution (C1V1 = C2V2)', blurb: 'Stock volume and diluent for a working solution, across M, mM, µM, nM, mg/mL, µg/mL, % and X.', mount: mountDilution },
  { id: 'serial', group: G, title: 'Serial dilution planner', blurb: 'Transfer and diluent volumes and the concentration in every tube of a dilution series.', mount: mountSerial },
  { id: 'units', group: G, title: 'Concentration unit converter', blurb: 'µg/mL ↔ µM ↔ nM with molecular weight, and a general SI prefix converter.', mount: mountUnits },
  { id: 'percent', group: G, title: 'Percent solutions and stock to working', blurb: '% w/v and v/v amounts, and 10X → 1X style dilutions.', mount: mountPercent },
  ...MORE,
];
