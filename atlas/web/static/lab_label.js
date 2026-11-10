// Lab Tools, 'Labelling and probes' (part 1): multicolour panel designer, fluorescent protein picker, antibody dilution,
// secondary antibody planner. Part 2 (DOL, reactions, A280, tags, fixation) is in lab_label2.js; TOOLS covers both.
// Pure calculations: lab_label_calc.js (re-exported here). Reference data with sources: lab_label_data.js.
import { api, esc, waveColor } from './core.js';
import { num, select, row, panel, results, out, table, note, sources, fmt } from './lab_ui.js';
import { designPanels, filterFPs, COLOUR_BANDS, antibodyDilution, totalVolume, antibodyCost, planSecondaries, assignChannels } from './lab_label_calc.js';
import { SRC, AGG, SWITCH, PANEL_EXCLUDE, HOSTS, ISOTYPES, CONJUGATES } from './lab_label_data.js';
import { TOOLS as TOOLS2 } from './lab_label2.js';

export * from './lab_label_calc.js';
const G = 'Labelling and probes';
const LASERS = [405, 445, 488, 514, 532, 561, 594, 640, 685, 730];
const SWITCHERS = ['PA', 'PC', 'PS', 'MP'];
const CAP = s => s.replace(/\b\w/g, c => c.toUpperCase());
const fpLink = r => `<a href="https://www.fpbase.org/${r.kind === 'dye' ? 'dye' : 'protein'}/${esc(String(r.slug || '').replace(/-default$/, ''))}/" target="_blank" rel="noopener">${esc(r.name)}</a>`;

// Checkbox group of laser lines; returns a getter for the checked values.
function laserBoxes(host, id, on) {
  const d = document.createElement('div');
  d.innerHTML = `<label>Laser lines (nm)</label><div id="${id}">${LASERS.map(l => `<label style="display:inline-flex;gap:4px;margin-right:10px"><input type="checkbox" value="${l}" ${on.includes(l) ? 'checked' : ''}> <span style="color:${waveColor(l)}">${l}</span></label>`).join('')}</div>`;
  host.appendChild(d);
  return () => [...d.querySelectorAll('input:checked')].map(i => +i.value);
}
function onChange(el, fn) { el.addEventListener('change', fn); el.addEventListener('input', fn); }

// ---------------- 1. Multicolour panel designer ----------------
async function mountPanel(host) {
  const p = panel(host, 'Microscope and labels');
  const getLasers = laserBoxes(p, 'pdl', [405, 488, 561, 640]);
  const r = row(p);
  const nSel = select(r, { id: 'pdn', label: 'Channels', options: [2, 3, 4, 5].map(v => [v, `${v} colours`]), value: 4 });
  const kind = select(r, { id: 'pdk', label: 'Label type', options: [['dye', 'Dyes'], ['protein', 'Fluorescent proteins'], ['both', 'Both']], value: 'dye' });
  const acq = select(r, { id: 'pda', label: 'Acquisition', options: [['seq', 'Sequential (one laser per channel)'], ['sim', 'Simultaneous (all lasers on)']], value: 'seq' });
  const minEx = num(r, { id: 'pdx', label: 'Minimum excitation at its laser', value: 0.5, step: 0.05, min: 0.1, max: 1, help: 'Fraction of peak excitation (0.5 = 50 %).' });
  const sw = document.createElement('label');
  sw.innerHTML = '<input type="checkbox" id="pdsw"> include photoswitchable / photoconvertible proteins';
  p.appendChild(sw);
  const res = out(host);
  res.innerHTML = '<p class="mute">Loading spectra...</p>';
  const [spec, rows] = await Promise.all([api('/spectra'), api('/fluorophores?limit=5000')]);
  const byName = Object.fromEntries(rows.map(r => [r.name, r]));
  const draw = () => {
    const lasers = getLasers(), n = +nSel.value, k = kind.value, allowSw = sw.querySelector('input').checked;
    const fl = Object.keys(spec).filter(name => {
      const r = byName[name];
      return r && !PANEL_EXCLUDE[name] && (k === 'both' || r.kind === k) && (allowSw || !SWITCHERS.includes(String(r.switch || '').toUpperCase()));
    }).map(name => ({ name, kind: byName[name].kind, brightness: byName[name].brightness, ex: spec[name].ex, em: spec[name].em, row: byName[name] }));
    const t0 = performance.now();
    const top = designPanels(fl, lasers, n, { minEx: +minEx.value || 0.5, simultaneous: acq.value === 'sim' });
    const ms = performance.now() - t0;
    if (!top.length) {
      res.innerHTML = `<div class="callout">No ${n}-colour panel found from ${fl.length} candidates with these lasers. Add laser lines, lower the minimum excitation, reduce the number of channels or allow both dyes and proteins.</div>`;
      return;
    }
    res.innerHTML = top.map((pn, idx) => {
      const names = pn.members.map(m => m.f.name);
      const tab = `<div class="scroll"><table><tr><th>Ch</th><th>Fluorophore</th><th>Laser</th><th>Excitation</th><th>Detection band</th><th>Brightness</th><th>Relative signal</th></tr>${pn.members.map((m, i) => `<tr><td>${i + 1}</td><td><span style="color:${waveColor(m.f.peak)}">●</span> ${fpLink(m.f.row)} <span class="small mute">${esc(m.f.kind)}</span></td><td style="color:${waveColor(m.laser)}">${m.laser} nm</td><td>${(100 * m.exEff).toFixed(0)}%</td><td>${pn.bands[i][0]}–${pn.bands[i][1]} nm</td><td>${m.f.guessedB ? `<span class="tag y" title="FPbase has no brightness; median of the candidates used">≈${fmt(m.f.B, 3)} (unknown)</span>` : fmt(m.f.B, 3)}</td><td>${fmt(pn.signal[i], 3)}</td></tr>`).join('')}</table></div>`;
      const xt = `<div class="scroll"><table><tr><th>Channel ↓ / dye →</th>${names.map(nm => `<th>${esc(nm)}</th>`).join('')}</tr>${pn.X.map((rw, i) => `<tr><th>Ch ${i + 1} (${pn.members[i].laser} nm, ${pn.bands[i][0]}–${pn.bands[i][1]})</th>${rw.map((v, j) => i === j ? '<td>100%</td>' : `<td style="background:rgba(255,63,164,${Math.min(0.6, v * 3).toFixed(2)})">${(100 * v).toFixed(1)}%</td>`).join('')}</tr>`).join('')}</table></div>`;
      return `<div class="panel"><h3 style="margin-top:0">Panel ${idx + 1}: ${names.map(esc).join(' · ')}</h3>
        <p class="small">Score <b>${fmt(pn.score, 3)}</b> = signal ${fmt(pn.geo, 3)} × (1 − worst crosstalk ${(100 * pn.maxX).toFixed(1)}%)²</p>${tab}
        <h4>Crosstalk matrix (signal of each dye in each channel, relative to that channel's own dye)</h4>${xt}
        <p class="small"><a href="#/spectra">Open the spectra viewer</a> and add ${names.map(esc).join(', ')} with lasers ${pn.members.map(m => m.laser).join(', ')} and bands ${pn.bands.map(b => b.join('-')).join(', ')} to inspect the curves.</p></div>`;
    }).join('') + `<p class="small mute">${fl.length} candidate fluorophores with spectra searched in ${ms.toFixed(0)} ms.</p>`;
  };
  [nSel, kind, acq, minEx, sw.querySelector('input'), p.querySelector('#pdl')].forEach(el => onChange(el, draw));
  draw();
  note(host, `<b>How the score works.</b> Candidates are the atlas fluorophores with FPbase spectra (${Object.keys(PANEL_EXCLUDE).map(esc).join(', ')} are left out as non-general labels). Each fluorophore can use any selected laser that excites it at ≥ the minimum fraction of its peak and lies below its emission peak. Panels are built in order of emission peak (peaks ≥ 15 nm apart) by a beam search that keeps the best 150 partial panels at each step.
    <br>Bands: each detection band runs from the midpoint with the previous dye's emission peak to the midpoint with the next (first band starts 25 nm below its peak, last ends 60 nm above), and always starts ≥ 8 nm above its own laser.
    <br>Equal labelling density is assumed. <b>Sequential</b> acquisition (one laser per channel): S<sub>ij</sub> = brightness<sub>j</sub> × excitation<sub>j</sub>(laser<sub>i</sub>) × fraction of j's emission in band i. <b>Simultaneous</b> (all panel lasers on at equal power, as in fast live imaging): the excitation term is the sum over all panel lasers, so crosstalk is much higher. Crosstalk X<sub>ij</sub> = S<sub>ij</sub>/S<sub>ii</sub>.
    <br><b>Score = (geometric mean of S<sub>ii</sub>) × (1 − max off-diagonal X)²</b>: bright, well-excited dyes win, and any single bad bleed-through is penalised hard. Brightness = ε × QY / 1000 from FPbase; it ignores photostability, camera QE and filter edges, and real filter sets have steeper or shallower edges than these ideal bands.`, 'callout g small');
  sources(host, [SRC.fpbase]);
}

// ---------------- 2. Fluorescent protein picker ----------------
async function mountFP(host) {
  const p = panel(host);
  const r1 = row(p);
  const colour = select(r1, { id: 'fpc', label: 'Colour (emission peak)', options: [['', 'Any'], ...COLOUR_BANDS.map(([c, a, b]) => [c, `${c} (${a}–${b < 2000 ? b : '…'} nm)`])], value: '' });
  const sw = select(r1, { id: 'fps', label: 'Switching type', options: [['', 'Any'], ...Object.entries(SWITCH).map(([k, v]) => [k, v])], value: '' });
  const r2 = row(p);
  const mat = num(r2, { id: 'fpm', label: 'Maturation under', unit: 'min', value: '', help: 'Blank = no limit. Proteins without a value are excluded when set.' });
  const pka = num(r2, { id: 'fpk', label: 'pKa under', value: '', help: 'Lower pKa = less quenching in acidic compartments.' });
  const mono = document.createElement('label');
  mono.innerHTML = '<input type="checkbox" id="fpmo" checked> monomeric only (FPbase oligomerisation = monomer)';
  p.appendChild(mono);
  const res = out(host);
  res.innerHTML = '<p class="mute">Loading FPbase proteins...</p>';
  const rows = await api('/fluorophores?kind=protein&limit=5000');
  const val = i => (i.value === '' ? null : +i.value);
  const draw = () => {
    const hits = filterFPs(rows, { colour: colour.value, monomer: mono.querySelector('input').checked, maxMaturation: val(mat), maxPka: val(pka), switchType: sw.value });
    const head = `<p class="small mute">${hits.length} of ${rows.length} proteins match${hits.length > 200 ? ' (first 200 shown)' : ''}, sorted by brightness.</p>`;
    res.innerHTML = head;
    const t = out(res);
    table(t, ['Protein', 'Ex / Em (nm)', 'Brightness', 'EC (M⁻¹cm⁻¹)', 'QY', 'pKa', 'Maturation (min)', 'Lifetime (ns)', 'Oligomer', 'Switching', 'Ref.'],
      hits.slice(0, 200).map(r => [`<span style="color:${waveColor(r.em)}">●</span> ${fpLink(r)}`, `${r.ex} / ${r.em}`, r.brightness ? r.brightness.toFixed(1) : '', r.ec ? r.ec.toLocaleString() : '', r.qy ?? '', r.pka ?? '', r.maturation ?? '', r.lifetime ?? '',
        esc(AGG[String(r.agg || '').toUpperCase()] || r.agg || ''), esc(SWITCH[String(r.switch || '').toUpperCase()] || r.switch || ''), r.doi ? `<a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener">${esc(r.year || 'doi')}</a>` : '']));
  };
  [colour, sw, mat, pka, mono.querySelector('input')].forEach(el => onChange(el, draw));
  draw();
  note(host, 'All values come from FPbase. Brightness is relative to the molecule (ε × QY / 1000), not expression or photostability in your cells: check the FPbase page and the original paper before committing to a construct.', 'callout g small');
  sources(host, [SRC.fpbase]);
}

// ---------------- 3. Antibody dilution ----------------
function mountAntibody(host) {
  const p = panel(host, 'Dilution');
  const r1 = row(p);
  const mode = select(r1, { id: 'abm', label: 'Target given as', options: [['ratio', 'Dilution 1:X'], ['conc', 'Working concentration (µg/mL)']], value: 'ratio' }, () => draw());
  const stock = num(r1, { id: 'abs', label: 'Stock concentration', unit: 'mg/mL', value: 1, help: 'From the datasheet; needed for µg/mL and µg-based vial sizes.' }, () => draw());
  const ratio = num(r1, { id: 'abr', label: 'Dilution 1:', value: 500 }, () => draw());
  const target = num(r1, { id: 'abt', label: 'Working concentration', unit: 'µg/mL', value: 2 }, () => draw());
  const p2 = panel(host, 'Volume');
  const r2 = row(p2);
  const vmode = select(r2, { id: 'abv', label: 'Volume from', options: [['final', 'Final volume'], ['wells', 'Number of coverslips / wells']], value: 'final' }, () => draw());
  const fin = num(r2, { id: 'abf', label: 'Final volume', unit: 'µL', value: 1000 }, () => draw());
  const nW = num(r2, { id: 'abn', label: 'Coverslips / wells', value: 12, step: 1 }, () => draw());
  const per = num(r2, { id: 'abp', label: 'Volume each', unit: 'µL', value: 50 }, () => draw());
  const over = num(r2, { id: 'abo', label: 'Overage', unit: '%', value: 10 }, () => draw());
  const p3 = panel(host, 'Cost (optional)');
  const r3 = row(p3);
  const price = num(r3, { id: 'abc', label: 'Vial price', value: '', unit: 'any currency' }, () => draw());
  const vial = num(r3, { id: 'abvs', label: 'Vial size', value: 100 }, () => draw());
  const vunit = select(r3, { id: 'abvu', label: 'Vial size unit', options: [['ul', 'µL'], ['ug', 'µg']], value: 'ul' }, () => draw());
  const res = out(host);
  function draw() {
    const isRatio = mode.value === 'ratio', isWells = vmode.value === 'wells';
    ratio.parentElement.style.display = isRatio ? '' : 'none';
    target.parentElement.style.display = isRatio ? 'none' : '';
    fin.parentElement.style.display = isWells ? 'none' : '';
    [nW, per, over].forEach(i => { i.parentElement.style.display = isWells ? '' : 'none'; });
    const finalUl = isWells ? totalVolume(Math.round(+nW.value), +per.value, +over.value) : +fin.value;
    const d = antibodyDilution(isRatio ? { ratio: +ratio.value, finalUl, stockMgMl: +stock.value || null } : { stockMgMl: +stock.value, targetUgMl: +target.value, finalUl });
    if (!Number.isFinite(d.abUl)) { res.className = 'callout'; res.textContent = 'Check the inputs: the working concentration must be below the stock and volumes positive.'; return; }
    const rows = [['Antibody stock', `${fmt(d.abUl, 3)} µL`, d.abUl < 1 ? 'under 1 µL: make an intermediate dilution first' : ''], ['Diluent (blocking buffer)', `${fmt(d.diluentUl, 4)} µL`], ['Total', `${fmt(finalUl, 4)} µL`, isWells ? `${Math.round(+nW.value)} × ${+per.value} µL + ${+over.value}%` : ''],
      ['Dilution', `1:${fmt(d.factor, 4)}`], ['Working concentration', Number.isFinite(d.workingUgMl) ? `${fmt(d.workingUgMl, 3)} µg/mL` : '—', Number.isFinite(d.workingUgMl) ? '' : 'enter the stock concentration']];
    if (+price.value > 0) {
      const c = antibodyCost({ abUl: d.abUl, price: +price.value, vialUl: vunit.value === 'ul' ? +vial.value : null, vialUg: vunit.value === 'ug' ? +vial.value : null, stockMgMl: +stock.value });
      rows.push(['Cost of this antibody mix', fmt(c.cost, 3)], ['Mixes per vial', fmt(c.experimentsPerVial, 3)]);
      if (isWells) rows.push(['Cost per coverslip / well', fmt(c.cost / Math.round(+nW.value), 3)]);
    }
    results(res, rows);
  }
  draw();
  note(host, 'Arithmetic: dilution factor = stock (µg/mL) / working (µg/mL); antibody volume = final volume / factor; 1 mg/mL = 1 µg/µL. Datasheet dilutions are starting points: titrate for your sample.', 'callout g small');
}

// ---------------- 4. Secondary antibody planner ----------------
async function mountSecondary(host) {
  const state = { prim: [{ host: 'rabbit', isotype: '', target: 'target A', abundance: 'medium' }, { host: 'mouse', isotype: '', target: 'target B', abundance: 'low' }, { host: 'goat', isotype: '', target: 'target C', abundance: 'high' }] };
  const p = panel(host, 'Primary antibodies');
  const list = document.createElement('div');
  p.appendChild(list);
  const add = document.createElement('button');
  add.className = 'alt'; add.textContent = '+ primary';
  p.appendChild(add);
  const r = row(p);
  const sample = select(r, { id: 'sps', label: 'Sample species (for endogenous Ig)', options: [['', 'Not specified / not animal'], ...HOSTS.map(h => [h, CAP(h)])], value: '' }, () => draw());
  const getLasers = laserBoxes(p, 'spl', [405, 488, 561, 640]);
  const res = out(host);
  let bright = {};
  try { (await api('/fluorophores?q=alexa&kind=dye&limit=100')).forEach(f => { bright[f.name] = f.brightness; }); } catch (e) { bright = {}; }
  const sel = (k, i, opts, v) => `<select data-k="${k}" data-i="${i}">${opts.map(([a, b]) => `<option value="${esc(a)}" ${a === v ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  const drawList = () => {
    list.innerHTML = state.prim.map((pr, i) => `<div class="row" style="margin-bottom:6px">
      <div><label>Primary ${i + 1} host</label>${sel('host', i, HOSTS.map(h => [h, CAP(h)]), pr.host)}</div>
      <div><label>Isotype</label>${sel('isotype', i, ISOTYPES.map(t => [t, t || 'not known / polyclonal']), pr.isotype)}</div>
      <div><label>Target</label><input data-k="target" data-i="${i}" value="${esc(pr.target)}"></div>
      <div><label>Abundance</label>${sel('abundance', i, [['low', 'low'], ['medium', 'medium'], ['high', 'high']], pr.abundance)}</div>
      <div style="flex:0 0 auto"><button class="alt" data-rm="${i}" ${state.prim.length < 2 ? 'disabled' : ''}>remove</button></div></div>`).join('');
  };
  list.addEventListener('input', e => { const { k, i } = e.target.dataset; if (k) { state.prim[+i][k] = e.target.value; draw(); } });
  list.addEventListener('change', e => { const { k, i } = e.target.dataset; if (k) { state.prim[+i][k] = e.target.value; draw(); } });
  list.addEventListener('click', e => { if (e.target.dataset.rm) { state.prim.splice(+e.target.dataset.rm, 1); drawList(); draw(); } });
  add.addEventListener('click', () => { if (state.prim.length < 6) { state.prim.push({ host: 'rat', isotype: '', target: `target ${String.fromCharCode(65 + state.prim.length)}`, abundance: 'medium' }); drawList(); draw(); } });
  onChange(p.querySelector('#spl'), () => draw());
  function draw() {
    const plan = planSecondaries(state.prim, { sample: sample.value });
    const chans = getLasers().filter(l => CONJUGATES[l]).map(l => ({ laser: l, dye: CONJUGATES[l], brightness: bright[CONJUGATES[l]] || 0 }));
    const asg = assignChannels(state.prim, chans);
    const issues = plan.issues.map(i => `<div class="callout${i.level === 'error' ? '' : ' g'}"><b>${i.level === 'error' ? 'Conflict' : 'Note'}:</b> ${esc(i.text)}</div>`).join('');
    res.innerHTML = `<div class="panel"><h3 style="margin-top:0">${plan.host ? `All secondaries from ${esc(CAP(plan.host))}` : 'No single secondary host works'}</h3>${issues}<div id="sptab"></div>
      ${chans.length < state.prim.length ? `<p class="small">Only ${chans.length} conjugate channel(s) for ${state.prim.length} primaries: add laser lines.</p>` : ''}</div>
      <h3>Rules applied</h3><ul>${plan.rules.map(r => `<li>${esc(r.text)} <a class="small" href="${esc(SRC[r.src].url)}" target="_blank" rel="noopener">[source]</a></li>`).join('')}</ul>`;
    table(res.querySelector('#sptab'), ['Primary', 'Target', 'Proposed secondary', 'Cross-adsorbed against (min X)', 'Conjugate'],
      state.prim.map((pr, i) => {
        const s = plan.secondaries[i], c = asg[i];
        return [`${esc(CAP(pr.host))}${pr.isotype ? ' ' + esc(pr.isotype) : ''}`, esc(pr.target), s.name ? esc(s.name) : '<span class="mute">—</span>', s.minX.length ? esc(s.minX.map(CAP).join(', ')) : '<span class="mute">not needed</span>',
          c ? `<span style="color:${waveColor(c.laser)}">${esc(c.dye)}</span> <span class="small mute">(${c.laser} nm${c.brightness ? `, brightness ${c.brightness.toFixed(0)}` : ''})</span>` : '<span class="mute">no channel</span>'];
      }));
  }
  drawList();
  draw();
  note(host, 'Channel assignment: the brightest conjugate (FPbase brightness) goes to the least abundant target. Check that each secondary exists with the adsorptions listed (supplier catalogues), and run single-stain and secondary-only controls.', 'callout g small');
  sources(host, [SRC.jirMulti, SRC.jirAdsorb, SRC.jirSub, SRC.jirFaq]);
}

export const TOOLS = [
  { id: 'panel-designer', group: G, title: 'Multicolour panel designer', blurb: 'Pick the best 2–5 colour dye or FP combination for your laser lines, with detection bands and a crosstalk matrix.', mount: mountPanel },
  { id: 'fp-picker', group: G, title: 'Fluorescent protein picker', blurb: 'Filter FPbase proteins by colour, monomeric state, maturation time, pKa and switching type; sorted by brightness.', mount: mountFP },
  { id: 'antibody-dilution', group: G, title: 'Antibody dilution calculator', blurb: 'Antibody and diluent volumes from a 1:X dilution or µg/mL target, for a volume or N coverslips, with cost per experiment.', mount: mountAntibody },
  { id: 'secondary-planner', group: G, title: 'Secondary antibody planner', blurb: 'Compatible secondaries for your primaries’ host species and isotypes, conflict checks and channel assignment, rule by rule.', mount: mountSecondary },
  ...TOOLS2,
];
