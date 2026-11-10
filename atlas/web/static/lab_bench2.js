// Lab Tools, 'Bench calculators' (part 2): cell seeding, hemocytometer, centrifuge, buffer recipes, photons and diffusion.
// Re-exported through lab_bench.js. Pure calculations live in lab_bench_calc.js; reference data in lab_bench_data.js.
import { esc } from './core.js';
import { num, text, select, row, panel, results, out, table, note, sources, fmt } from './lab_ui.js';
import { seeding, densityFromConfluence, hemocytometer, parseNumbers, rcf, rpmFromRcf, scaleRecipe, VOLUME,
  photonEnergyJ, photonEnergyEV, photonsPerSecond, powerFromPhotons, radiusFromMW, stokesEinstein } from './lab_bench_calc.js';
import { VESSELS, RECIPES, SRC, HELA_CONFLUENT } from './lab_bench_data.js';

const G = 'Bench calculators';
const srcList = keys => [...new Set(keys)].map(k => SRC[k]);

function mountSeeding(host) {
  const p = panel(host);
  const fmtSel = select(p, { id: 'vf', label: 'Plate or dish', options: VESSELS.map(v => [v.id, `${v.name}: ${v.area} cm²`]), value: '24' }, () => draw());
  const r1 = row(p);
  const by = select(r1, { id: 'vby', label: 'Target given as', options: [['density', 'Density (cells/cm²)'], ['conf', 'Confluence (%)']], value: 'density' }, () => draw());
  const dens = num(r1, { id: 'vd', label: 'Density', unit: 'cells/cm²', value: 20000 }, () => draw());
  const conf = num(r1, { id: 'vc', label: 'Confluence', unit: '%', value: 50 }, () => draw());
  const cd = num(r1, { id: 'vcd', label: 'Density at 100 % confluence', unit: 'cells/cm²', value: HELA_CONFLUENT, help: 'Default: HeLa, from the Thermo table. Measure for your cell line.' }, () => draw());
  const r2 = row(p);
  const stock = num(r2, { id: 'vs', label: 'Counted cell stock', unit: 'cells/mL', value: 1e6 }, () => draw());
  const wells = num(r2, { id: 'vw', label: 'Wells or dishes to seed', value: 24, step: 1 }, () => draw());
  const over = num(r2, { id: 'vo', label: 'Overage', unit: '%', value: 10 }, () => draw());
  const res = out(p), msg = out(p);
  function draw() {
    const v = VESSELS.find(x => x.id === fmtSel.value);
    const isConf = by.value === 'conf';
    dens.parentElement.style.display = isConf ? 'none' : '';
    conf.parentElement.style.display = cd.parentElement.style.display = isConf ? '' : 'none';
    const d = isConf ? densityFromConfluence(+conf.value, +cd.value) : +dens.value;
    const s = seeding({ area: v.area, density: d, stock: +stock.value, wells: Math.round(+wells.value), overage: +over.value / 100 });
    const ul = s.volPerWellMl * 1e3;
    results(res, [['Cells per well', fmt(s.perWell, 3)], ['Cell suspension per well', ul >= 1000 ? `${fmt(s.volPerWellMl, 3)} mL` : `${fmt(ul, 3)} µL`],
      ['Cells needed (with overage)', fmt(s.totalCells, 3)], ['Suspension needed (with overage)', `${fmt(s.totalVolMl, 3)} mL`],
      ['Growth area', `${v.area} cm²`, v.note], ['Medium per well', v.medium ? `${v.medium} mL` : '—', 'from the source table']]);
    const tooDilute = v.medium && s.volPerWellMl > parseFloat(v.medium.split('–').pop());
    msg.innerHTML = tooDilute ? '<div class="callout">The stock is too dilute: the suspension per well exceeds the working medium volume. Spin down and resuspend in less medium.</div>'
      : s.volPerWellMl * 1e3 < 2 ? '<div class="callout">Under 2 µL per well is hard to pipette accurately: dilute the stock and seed a larger volume.</div>' : '';
  }
  draw();
  note(host, 'Growth areas are the manufacturer figures linked below; other brands differ slightly. Seed glass-bottom wells by volume to cover only the glass if needed.', 'callout g small');
  sources(host, srcList(VESSELS.map(v => v.src)));
}

function mountHemocytometer(host) {
  const p = panel(host);
  const live = text(p, { id: 'hl', label: 'Live (unstained) cells per large square, separated by spaces', value: '52 48 55 50' }, () => draw());
  const dead = text(p, { id: 'hd', label: 'Dead (blue) cells per large square (same squares; may be empty)', value: '4 6 3 5' }, () => draw());
  const r = row(p);
  const dil = num(r, { id: 'hdf', label: 'Total dilution factor', value: 2, help: '1:1 trypan blue = 2. Multiply in any pre-dilution.' }, () => draw());
  const sq = select(r, { id: 'hsq', label: 'Square counted', options: [['1e-4', 'Large 1 mm² square (0.1 µL)'], ['4e-6', 'Medium 0.2 mm × 0.2 mm (4 nL)']], value: '1e-4' }, () => draw());
  const vol = num(r, { id: 'hv', label: 'Suspension volume', unit: 'mL', value: 10 }, () => draw());
  const res = out(p);
  function draw() {
    const h = hemocytometer({ live: parseNumbers(live.value), dead: parseNumbers(dead.value), dilution: +dil.value, squareMl: +sq.value });
    if (!Number.isFinite(h.liveMl)) { res.className = 'callout'; res.textContent = 'Enter at least one count.'; return; }
    results(res, [['Live cells/mL', fmt(h.liveMl, 3)], ['Viability', `${fmt(h.viability, 3)} %`], ['Total cells/mL', fmt(h.totalMl, 3)],
      ['Live cells in suspension', fmt(h.liveMl * +vol.value, 3)], ['Mean live per square', fmt(h.meanLive, 3), 'aim for 20–100 per square for good statistics']]);
  }
  draw();
  note(host, 'cells/mL = mean count per square × dilution factor ÷ square volume (1 large square of an improved Neubauer chamber = 1 mm² × 0.1 mm = 10⁻⁴ mL).', 'callout g small');
}

function mountCentrifuge(host) {
  const p = panel(host);
  const r = num(p, { id: 'cr', label: 'Rotor radius (to the tube bottom)', unit: 'cm', value: 10, help: 'From the rotor manual (r max).' }, () => draw('rpm'));
  const rr = row(p);
  const rpm = num(rr, { id: 'crpm', label: 'Speed', unit: 'rpm', value: 3000 }, () => draw('rpm'));
  const g = num(rr, { id: 'cg', label: 'Relative centrifugal force', unit: '× g', value: 1006 }, () => draw('g'));
  const res = out(p);
  function draw(from) {
    if (from === 'rpm') g.value = Math.round(rcf(+rpm.value, +r.value));
    else rpm.value = Math.round(rpmFromRcf(+g.value, +r.value));
    results(res, [['RCF', `${fmt(+g.value, 4)} × g`], ['Speed', `${fmt(+rpm.value, 4)} rpm`]]);
  }
  draw('rpm');
  note(host, 'RCF = 1.118 × 10⁻⁵ × r (cm) × rpm². Protocols should quote × g, which transfers between rotors; rpm does not.', 'callout g small');
}

function mountRecipes(host) {
  const p = panel(host);
  const groups = [...new Set(RECIPES.map(r => r.group))];
  const sel = document.createElement('div');
  sel.innerHTML = `<label for="lt-rsel">Recipe</label><select id="lt-rsel">${groups.map(g => `<optgroup label="${esc(g)}">${RECIPES.filter(r => r.group === g).map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('')}</optgroup>`).join('')}</select>`;
  p.appendChild(sel);
  const s = sel.querySelector('select');
  s.onchange = () => { const rc = RECIPES.find(x => x.id === s.value); v.value = +(rc.baseMl >= 1 ? rc.baseMl : rc.baseMl * 1000).toPrecision(4); vu.value = rc.baseMl >= 1 ? 'mL' : 'µL'; draw(); };
  const rr = row(p);
  const v = num(rr, { id: 'rv', label: 'Volume to make', value: 1000 }, () => draw());
  const vu = select(rr, { id: 'rvu', label: 'Unit', options: [['L', 'L'], ['mL', 'mL'], ['µL', 'µL']], value: 'mL' }, () => draw());
  const tab = out(p), src = out(p);
  function draw() {
    const rc = RECIPES.find(x => x.id === s.value);
    const ml = +v.value * VOLUME[vu.value] * 1e3;
    table(tab, ['Component', 'Amount', 'Notes'], scaleRecipe(rc, ml).map(x => [esc(x.name), x.amount === null ? '' : esc(`${fmt(x.amount, 3)} ${x.unit}`), esc(x.note)]));
    src.innerHTML = rc.computed ? '<p class="small mute">The source gives concentrations; masses were computed here from the molecular weights shown. Check the hydrate form on your bottle.</p>' : '';
    sources(src, rc.src.map(k => SRC[k]));
  }
  draw();
  note(host, 'Recipes are scaled linearly from the published amounts. Adjust pH at the temperature of use, and follow your lab\'s safety rules for MEA, BME and enzymes.', 'callout g small');
}

function mountPhotons(host) {
  const p = panel(host, 'Laser power ↔ photon flux');
  const r = row(p);
  const lam = num(r, { id: 'pl', label: 'Wavelength', unit: 'nm', value: 488 }, () => draw('mw'));
  const mw = num(r, { id: 'pmw', label: 'Power', unit: 'mW', value: 1 }, () => draw('mw'));
  const ph = num(r, { id: 'pph', label: 'Photons per second', value: 0 }, () => draw('ph'));
  const res = out(p);
  function draw(from) {
    if (from === 'mw') ph.value = (+photonsPerSecond(+mw.value, +lam.value)).toPrecision(4);
    else mw.value = (+powerFromPhotons(+ph.value, +lam.value)).toPrecision(4);
    results(res, [['Photons/s', fmt(+ph.value, 4)], ['Energy per photon', `${fmt(photonEnergyJ(+lam.value), 4)} J`], ['Energy per photon (eV)', `${fmt(photonEnergyEV(+lam.value), 4)} eV`]]);
  }
  draw('mw');
  const q = panel(host, 'Diffusion coefficient (Stokes–Einstein)');
  const by = select(q, { id: 'dby', label: 'Size given as', options: [['r', 'Hydrodynamic radius (nm)'], ['mw', 'Molecular weight (kDa)']], value: 'mw' }, () => drawD());
  const r2 = row(q);
  const rad = num(r2, { id: 'drad', label: 'Radius', unit: 'nm', value: 2.4 }, () => drawD());
  const kda = num(r2, { id: 'dkda', label: 'Molecular weight', unit: 'kDa', value: 27 }, () => drawD());
  const r3 = row(q);
  const t = num(r3, { id: 'dt', label: 'Temperature', unit: '°C', value: 25 }, () => drawD());
  const eta = num(r3, { id: 'deta', label: 'Viscosity', unit: 'mPa·s', value: 0.89, help: 'Water: 1.00 at 20 °C, 0.89 at 25 °C, 0.69 at 37 °C. Cytoplasm is effectively 2–5× higher.' }, () => drawD());
  const dres = out(q);
  function drawD() {
    const isMW = by.value === 'mw';
    rad.parentElement.style.display = isMW ? 'none' : '';
    kda.parentElement.style.display = isMW ? '' : 'none';
    const rnm = isMW ? radiusFromMW(+kda.value * 1000) : +rad.value;
    const D = stokesEinstein(rnm, +t.value, +eta.value);
    results(dres, [['D', `${fmt(D, 3)} µm²/s`], ['Radius used', `${fmt(rnm, 3)} nm`], ['Mean square displacement in 1 s (2D)', `${fmt(4 * D, 3)} µm²`],
      ['Time to diffuse 1 µm (2D, ⟨r²⟩ = 4Dt)', `${fmt(1 / (4 * D) * 1e3, 3)} ms`]]);
  }
  drawD();
  note(host, 'D = k<sub>B</sub>T / (6πηr). MW → radius treats the molecule as a compact, unhydrated sphere with partial specific volume 0.73 cm³/g (typical for proteins): r = (3·MW·v̄ / 4πN<sub>A</sub>)<sup>1/3</sup>. This is a lower bound: real hydrodynamic radii are larger (hydration shell, non-spherical shape), so D is overestimated, often by 20–30 %.', 'callout g small');
}

export const TOOLS = [
  { id: 'seeding', group: G, title: 'Cell seeding calculator', blurb: 'Cells and suspension volume per well for 384-well to 100 mm dishes, chambered coverglass and glass-bottom dishes.', mount: mountSeeding },
  { id: 'hemocytometer', group: G, title: 'Hemocytometer counter', blurb: 'Square counts and trypan blue dilution to cells/mL and viability.', mount: mountHemocytometer },
  { id: 'centrifuge', group: G, title: 'Centrifuge rpm ↔ × g', blurb: 'Convert speed and relative centrifugal force for your rotor radius.', mount: mountCentrifuge },
  { id: 'recipes', group: G, title: 'Buffer and imaging-solution recipes', blurb: 'PBS, TBS, HEPES imaging saline, dSTORM GLOX/MEA and BME, DNA-PAINT PCA/PCD, Mowiol: scaled to any volume, with sources.', mount: mountRecipes },
  { id: 'photons', group: G, title: 'Photons, power and diffusion', blurb: 'mW ↔ photons/s at any wavelength, photon energy, and Stokes–Einstein D from radius or molecular weight.', mount: mountPhotons },
];
