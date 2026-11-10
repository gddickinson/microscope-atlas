// Lab Tools, 'Labelling and probes' (part 2): degree of labelling, labelling reaction planner, protein concentration
// from absorbance, tags and probes reference, fixation and permeabilisation guide. Re-exported through lab_label.js.
import { esc } from './core.js';
import { num, select, row, panel, results, out, table, note, sources, fmt } from './lab_ui.js';
import { degreeOfLabelling, proteinFromAbsorbance, mgMlToUM, uMToMgMl, e01FromEps, labellingReaction } from './lab_label_calc.js';
import { SRC, DOL_DYES, IGG, TAGS, FIX, FIX_GENERAL } from './lab_label_data.js';

const G = 'Labelling and probes';
const srcLinks = keys => keys.map(k => `<a href="${esc(SRC[k].url)}" target="_blank" rel="noopener" title="${esc(SRC[k].title)}">[${Object.keys(SRC).indexOf(k) + 1}]</a>`).join(' ');
const dyeOptions = [['', 'Custom (type ε, CF and MW)'], ...DOL_DYES.map((d, i) => [String(i), `${d.name} (λmax ${d.lmax} nm)`])];
const show = (el, on) => { el.parentElement.style.display = on ? '' : 'none'; };

// ---------------- 5. Degree of labelling ----------------
function mountDOL(host) {
  const p = panel(host, 'Dye');
  const r1 = row(p);
  const dye = select(r1, { id: 'dd', label: 'Dye', options: dyeOptions, value: '3' }, () => { fill(); draw(); });
  const eps = num(r1, { id: 'de', label: 'Dye ε at λmax', unit: 'M⁻¹cm⁻¹', value: 71000 }, () => draw());
  const cf = num(r1, { id: 'dcf', label: 'CF280 (A280/Amax of free dye)', value: 0.11 }, () => draw());
  const srcEl = out(p);
  const p2 = panel(host, 'Measurement (after removing free dye)');
  const r2 = row(p2);
  const a280 = num(r2, { id: 'da', label: 'A280', value: 0.177 }, () => draw());
  const amax = num(r2, { id: 'dm', label: 'Amax (at the dye λmax)', value: 0.411 }, () => draw());
  const path = num(r2, { id: 'dp', label: 'Path length', unit: 'cm', value: 1 }, () => draw());
  const dil = num(r2, { id: 'ddf', label: 'Dilution factor of the measured sample', value: 1 }, () => draw());
  const r3 = row(p2);
  const ep = num(r3, { id: 'dep', label: 'Protein ε280', unit: 'M⁻¹cm⁻¹', value: IGG.eps, help: 'IgG ≈ 210,000 (Thermo).' }, () => draw());
  const mw = num(r3, { id: 'dmw', label: 'Protein MW', unit: 'g/mol', value: 150000 }, () => draw());
  const res = out(host);
  function fill() {
    const d = DOL_DYES[+dye.value];
    if (dye.value === '' || !d) { srcEl.innerHTML = '<p class="small mute">Enter ε and CF280 from your dye’s datasheet.</p>'; return; }
    eps.value = d.eps; cf.value = d.cf;
    srcEl.innerHTML = `<p class="small mute">ε ${d.eps.toLocaleString()} and CF280 ${d.cf} from <a href="${esc(SRC[d.src].url)}" target="_blank" rel="noopener">${esc(SRC[d.src].title)}</a>.${/Alexa Fluor (405|594|660)$/.test(d.name) ? ' Thermo’s older amine-reactive guide (MP00143) lists a different ε for this dye; check your lot’s datasheet.' : ''}</p>`;
  }
  function draw() {
    const r = degreeOfLabelling({ a280: +a280.value, amax: +amax.value, epsDye: +eps.value, cf: +cf.value, epsProt: +ep.value, path: +path.value || 1, dilution: +dil.value || 1, mw: +mw.value || null });
    if (!(r.aProt > 0)) { res.className = 'callout'; res.textContent = 'A280 − Amax × CF280 is not positive: the dye accounts for all of A280. Check the values or remove free dye.'; return; }
    const ratio = +amax.value / +a280.value;
    results(res, [['Degree of labelling (dyes per protein)', fmt(r.dol, 3)], ['Protein concentration', `${fmt(r.protM * 1e6, 4)} µM`, 'in the undiluted conjugate'], ['Protein concentration', `${fmt(r.protMgMl, 3)} mg/mL`],
      ['Dye concentration', `${fmt(r.dyeM * 1e6, 4)} µM`], ['Corrected A280', fmt(r.aProt, 3), 'A280 − Amax × CF280'], ['Amax : A280', fmt(ratio, 3), 'Thermo: should be > 1 for dye-labelled antibodies']]);
  }
  fill(); draw();
  note(host, `Protein (M) = (A280 − Amax·CF280) / (ε<sub>protein</sub>·l) × dilution; dye (M) = Amax / (ε<sub>dye</sub>·l) × dilution; <b>DOL = (Amax·ε<sub>protein</sub>) / ((A280 − Amax·CF280)·ε<sub>dye</sub>)</b>. The defaults reproduce Thermo’s DyLight 550 example (protein 2.737 × 10⁻⁵ M at ×40 dilution; with Amax in the numerator, as the manual’s own formula states, the DOL is 4.0). Unbound dye must be removed first, or the DOL is overestimated. Thermo notes the dye absorption maximum shifts slightly on conjugation: measure Amax at the conjugate’s peak.`, 'callout g small');
  sources(host, [SRC.af, SRC.amine, SRC.dylight, SRC.fpblog]);
}

// ---------------- 6. Labelling reaction planner ----------------
const BUFFER = {
  nhs: [['Amine-free buffer: no Tris, glycine, ammonium ions or carrier protein such as BSA; dialyse into PBS first. Azide < 3 mM is tolerated.', 'amine'],
    ['0.1–0.2 M sodium bicarbonate, pH 8.3 for NHS (succinimidyl), STP and SDP esters (pH 9.0 for TFP esters and isothiocyanates); or add 0.1 mL of 1 M bicarbonate per mL of antibody in PBS.', 'amine'],
    ['Protein at 5–20 mg/mL in the reaction; below 2 mg/mL the efficiency drops sharply.', 'amine'],
    ['Dissolve the NHS ester in anhydrous DMSO or DMF (e.g. 10 mg/mL) immediately before use; it hydrolyses in water.', 'amine'],
    ['1 h at room temperature with stirring; optionally stop with freshly made 1.5 M hydroxylamine, pH 8.5. Typically a quarter to a third of the dye conjugates; try three dye:protein ratios.', 'amine'],
    ['Packaged 100 µg / 1 mg NHS esters are certified ≥ 50% reactive; Alexa Fluor 488 NHS may be only 30–40% reactive: use the reactivity field.', 'af'],
    ['Purify on a gel-filtration column (Sephadex G-25 or similar) and measure the DOL.', 'amine']],
  mal: [['10–100 mM phosphate (PBS), Tris or HEPES at pH 7.0–7.5; protein at 50–100 µM. The optimum pH for maleimides is near 7.0; above pH 8 hydrolysis to maleamic acid competes.', 'thiol'],
    ['Reduce disulfides first with a 10-fold molar excess of DTT or TCEP. DTT must be removed (dialysis) before adding the dye; excess TCEP need not be removed for maleimides or iodoacetamides.', 'thiol'],
    ['Thiols re-oxidise: deoxygenate buffers and work under inert gas if the protein was reduced.', 'thiol'],
    ['Dye stock 1–10 mM, made just before use; add 10–20 mol dye per mol protein dropwise while stirring.', 'thiol'],
    ['2 h at room temperature or overnight at 4 °C, protected from light; quench with excess glutathione or mercaptoethanol, then gel-filter or dialyse.', 'thiol']],
};
function mountReaction(host) {
  const p = panel(host, 'Reaction');
  const r0 = row(p);
  const chem = select(r0, { id: 'rc', label: 'Chemistry', options: [['nhs', 'NHS ester (amines, lysines)'], ['mal', 'Maleimide (thiols, cysteines)']], value: 'nhs' }, () => draw());
  const pmode = select(r0, { id: 'rpm', label: 'Protein given as', options: [['conc', 'Concentration × volume'], ['mass', 'Mass']], value: 'conc' }, () => draw());
  const r1 = row(p);
  const pc = num(r1, { id: 'rpc', label: 'Protein concentration', unit: 'mg/mL', value: 2 }, () => draw());
  const pv = num(r1, { id: 'rpv', label: 'Protein volume', unit: 'µL', value: 500 }, () => draw());
  const pmass = num(r1, { id: 'rpg', label: 'Protein mass', unit: 'mg', value: 1 }, () => draw());
  const pmw = num(r1, { id: 'rpw', label: 'Protein MW', unit: 'g/mol', value: 150000, help: 'IgG ≈ 150,000.' }, () => draw());
  const r2 = row(p);
  const dye = select(r2, { id: 'rd', label: 'Dye (MW of NHS ester from Thermo)', options: dyeOptions.map(([v, l]) => [v, v === '' ? 'Custom MW' : l]), value: '3' }, () => { const d = DOL_DYES[+dye.value]; if (dye.value !== '' && d && d.mw) dmw.value = d.mw; draw(); });
  const dmw = num(r2, { id: 'rdw', label: 'Dye MW (reactive form)', unit: 'g/mol', value: 643, help: 'Use the MW on your vial: maleimides and other salts differ.' }, () => draw());
  const ex = num(r2, { id: 'rx', label: 'Molar excess (dye : protein)', value: 10 }, () => draw());
  const react = num(r2, { id: 'rr', label: 'Dye reactivity', unit: '%', value: 100 }, () => draw());
  const r3 = row(p);
  const smode = select(r3, { id: 'rsm', label: 'Dye stock given as', options: [['mM', 'mM'], ['mgml', 'mg/mL']], value: 'mM' }, () => draw());
  const stock = num(r3, { id: 'rs', label: 'Dye stock concentration', value: 10 }, () => draw());
  const res = out(host), warn = out(host), tips = out(host);
  function draw() {
    const byConc = pmode.value === 'conc';
    [pc, pv].forEach(i => show(i, byConc)); show(pmass, !byConc);
    const mg = byConc ? +pc.value * +pv.value / 1000 : +pmass.value;
    const s = smode.value === 'mM' ? { stockMM: +stock.value } : { stockMgMl: +stock.value };
    const r = labellingReaction({ protMg: mg, protMw: +pmw.value, excess: +ex.value, dyeMw: +dmw.value, reactivity: +react.value || 100, ...s });
    results(res, [['Protein', `${fmt(mg, 3)} mg = ${fmt(r.protNmol, 3)} nmol`], ['Dye to add', `${fmt(r.dyeNmol, 3)} nmol`], ['Dye mass', `${fmt(r.dyeUg, 3)} µg`], ['Dye stock to add', `${fmt(r.stockUl, 3)} µL`, r.stockUl < 1 ? 'under 1 µL: dilute the stock' : '']]);
    const msgs = [];
    if (byConc && chem.value === 'nhs' && +pc.value < 2) msgs.push('Protein below 2 mg/mL: Thermo notes NHS labelling efficiency drops greatly; concentrate the protein first.');
    if (byConc && chem.value === 'mal') { const uM = mgMlToUM(+pc.value, +pmw.value); if (uM < 50 || uM > 100) msgs.push(`Protein is ${fmt(uM, 3)} µM; Thermo’s thiol protocol uses 50–100 µM.`); }
    if (byConc && r.stockUl > 0.1 * +pv.value) msgs.push('Dye stock is over 10% of the reaction volume (Thermo adds 50–100 µL of dye solution per mL of protein): use a more concentrated stock.');
    warn.innerHTML = msgs.map(m => `<div class="callout">${esc(m)}</div>`).join('');
    tips.innerHTML = `<h3>${chem.value === 'nhs' ? 'NHS ester' : 'Maleimide'} checklist</h3><ul>${BUFFER[chem.value].map(([t, s]) => `<li>${esc(t)} ${srcLinks([s])}</li>`).join('')}</ul>`;
  }
  draw();
  note(host, 'nmol protein = mg / MW × 10⁶; nmol dye = nmol protein × excess / reactivity; µg dye = nmol × MW / 1000; µL of stock = nmol / mM (or µg / (mg/mL)).', 'callout g small');
  sources(host, [SRC.amine, SRC.thiol, SRC.af]);
}

// ---------------- 7. Protein concentration from absorbance ----------------
function mountA280(host) {
  const p = panel(host, 'Beer–Lambert');
  const r1 = row(p);
  const mode = select(r1, { id: 'pam', label: 'Absorptivity given as', options: [['eps', 'Molar ε (M⁻¹cm⁻¹)'], ['e01', 'A280 of 1 mg/mL (E0.1%)'], ['e1pct', 'A280 of 1% = 10 mg/mL (E1%)']], value: 'eps' }, () => draw());
  const a = num(r1, { id: 'paa', label: 'Absorbance (A280)', value: 1.4 }, () => draw());
  const path = num(r1, { id: 'pap', label: 'Path length', unit: 'cm', value: 1 }, () => draw());
  const r2 = row(p);
  const eps = num(r2, { id: 'pae', label: 'ε280', unit: 'M⁻¹cm⁻¹', value: IGG.eps }, () => draw());
  const e01 = num(r2, { id: 'pa1', label: 'E0.1%', value: IGG.e01 }, () => draw());
  const e1 = num(r2, { id: 'pa2', label: 'E1%', value: 14 }, () => draw());
  const mw = num(r2, { id: 'paw', label: 'MW', unit: 'g/mol', value: 150000 }, () => draw());
  const res = out(p);
  const p2 = panel(host, 'mg/mL ↔ µM');
  const r3 = row(p2);
  const cm = num(r3, { id: 'pcm', label: 'mg/mL', value: 1 }, v => { cu.value = +mgMlToUM(v, +cw.value).toPrecision(6); });
  const cu = num(r3, { id: 'pcu', label: 'µM', value: 6.667 }, v => { cm.value = +uMToMgMl(v, +cw.value).toPrecision(6); });
  const cw = num(r3, { id: 'pcw', label: 'MW', unit: 'g/mol', value: 150000 }, () => { cu.value = +mgMlToUM(+cm.value, +cw.value).toPrecision(6); });
  function draw() {
    show(eps, mode.value === 'eps'); show(e01, mode.value === 'e01'); show(e1, mode.value === 'e1pct');
    const r = proteinFromAbsorbance({ a: +a.value, path: +path.value || 1, mode: mode.value, eps: +eps.value, e01: +e01.value, e1pct: +e1.value, mw: +mw.value || null });
    const rows = [['Concentration', `${fmt(r.mgMl, 4)} mg/mL`], ['Concentration', `${fmt(r.uM, 4)} µM`]];
    if (mode.value === 'eps' && +mw.value) rows.push(['E0.1% (A of 1 mg/mL)', fmt(e01FromEps(+eps.value, +mw.value), 3), 'ε / MW']);
    results(res, rows);
  }
  draw();
  note(host, 'c (M) = A / (ε·l); mg/mL = A / (E0.1%·l) = 10·A / (E1%·l); µM = mg/mL / MW × 10⁶. IgG defaults: ε ≈ 210,000 M⁻¹cm⁻¹ (Thermo DyLight manual) and 1.4 A280 units = 1 mg/mL (Thermo MP00143). For a dye conjugate, subtract Amax × CF280 first (degree-of-labelling tool). Compute ε for other proteins from sequence (e.g. ExPASy ProtParam).', 'callout g small');
  cu.value = +mgMlToUM(+cm.value, +cw.value).toPrecision(6);
  sources(host, [SRC.dylight, SRC.amine]);
}

// ---------------- 8. Tags and probes reference ----------------
function mountTags(host) {
  const t = out(host);
  table(t, ['Tag / probe', 'Size', 'Labelling chemistry', 'Typical ligands / dyes', 'Live cells', 'Fixed cells', 'Linkage error / notes', 'Sources'],
    TAGS.map(r => [`<b>${esc(r.name)}</b>`, esc(r.size) || '<span class="mute">—</span>', esc(r.chem), esc(r.ligands), esc(r.live) || '<span class="mute">—</span>', esc(r.fixed) || '<span class="mute">—</span>', esc(r.linkage) || '<span class="mute">—</span>', srcLinks(r.src)]));
  note(host, '“—” means the sources opened for this table did not state it; it is left blank rather than filled from memory. Linkage error is the distance between the dye and the target: it adds to localisation precision in SMLM, MINFLUX and DNA-PAINT, so small probes (nanobodies, self-labelling tags, Affimers) matter most there.', 'callout g small');
  sources(host, [...new Set(TAGS.flatMap(r => r.src))].map(k => ({ title: `[${Object.keys(SRC).indexOf(k) + 1}] ${SRC[k].title}`, url: SRC[k].url })));
}

// ---------------- 9. Fixation and permeabilisation guide ----------------
function mountFix(host) {
  const t = out(host);
  table(t, ['Reagent', 'Type', 'What it does / preserves / destroys', 'Typical conditions (starting points)', 'Super-resolution notes', 'Sources'],
    FIX.map(r => [`<b>${esc(r.name)}</b>`, esc(r.kind), esc(r.does), esc(r.conc), esc(r.sr) || '<span class="mute">—</span>', srcLinks(r.src)]));
  note(host, `${esc(FIX_GENERAL.text)} ${srcLinks([FIX_GENERAL.src])}<br>Rules of thumb from these sources: aldehydes for structure (add GA and quench with NaBH4 or glycine for microtubules and actin in SMLM); solvents (methanol, acetone) fix and permeabilise at once but extract lipids and soluble proteins and damage fluorescent proteins; saponin and digitonin permeabilise selectively (saponin reversibly, so keep it in later buffers); Triton X-100 opens all membranes. Optimise concentrations and times for your sample.`, 'callout g small');
  sources(host, [...new Set([...FIX.flatMap(r => r.src), FIX_GENERAL.src])].map(k => ({ title: `[${Object.keys(SRC).indexOf(k) + 1}] ${SRC[k].title}`, url: SRC[k].url })));
}

export const TOOLS = [
  { id: 'degree-of-labelling', group: G, title: 'Degree of labelling (DOL)', blurb: 'Dyes per protein and protein concentration from A280 and Amax, with sourced ε and CF280 for Alexa Fluor, DyLight and other dyes.', mount: mountDOL },
  { id: 'labelling-reaction', group: G, title: 'Labelling reaction planner', blurb: 'How much NHS-ester or maleimide dye stock to add for a chosen molar excess, with buffer and reduction checklists.', mount: mountReaction },
  { id: 'protein-absorbance', group: G, title: 'Protein concentration from A280', blurb: 'Beer–Lambert with molar ε, E0.1% or E1%, and mg/mL ↔ µM conversion.', mount: mountA280 },
  { id: 'tags-probes', group: G, title: 'Tags and probes reference', blurb: 'HaloTag, SNAP/CLIP, TMP-tag, FlAsH, nanobodies, Fab, Affimers, aptamers and DNA-PAINT: size, chemistry, ligands and linkage error, with sources.', mount: mountTags },
  { id: 'fixation-guide', group: G, title: 'Fixation and permeabilisation guide', blurb: 'PFA, glutaraldehyde, methanol, acetone, Triton, saponin and digitonin: what each preserves, starting conditions and super-resolution notes.', mount: mountFix },
];
