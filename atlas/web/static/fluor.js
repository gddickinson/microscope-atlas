// Fluorophore table (FPbase) and an interactive spectra viewer with laser lines, emission bands and bleed-through.
import { route, api, app, esc, list, waveColor, waveText } from './core.js';

route('fluorophores', async (_a, query) => {
  app().innerHTML = `<p class="kicker">Database</p><h1>Fluorophores</h1>
    <p class="lead">Fluorescent proteins and dyes from <a href="https://www.fpbase.org" target="_blank" rel="noopener">FPbase</a>.
    Brightness = extinction coefficient × quantum yield / 1000. Rows marked ◉ have spectra in the <a href="#/spectra">viewer</a>.</p>
    <div class="row"><div><label for="fq">Name</label><input id="fq" type="search" value="${esc(query.q || '')}" placeholder="e.g. mScarlet, Alexa, JF"></div>
    <div><label for="fk">Kind</label><select id="fk"><option value="">Both</option><option value="protein">Proteins</option><option value="dye">Dyes</option></select></div>
    <div><label for="fr">Excitation band</label><select id="fr"><option value="0-2000">Any</option><option value="300-430">UV / violet</option><option value="430-500">Blue</option><option value="500-540">Green</option><option value="540-600">Yellow / orange</option><option value="600-660">Red</option><option value="660-2000">Far-red / NIR</option></select></div></div>
    <div id="fplot"></div><p id="fcount" class="small mute"></p><div class="scroll"><table id="ftab"></table></div>`;
  const draw = async () => {
    const [a, b] = document.getElementById('fr').value.split('-');
    const q = new URLSearchParams({ q: document.getElementById('fq').value, kind: document.getElementById('fk').value, ex_min: a, ex_max: b, limit: 400 });
    const rows = await api('/fluorophores?' + q);
    document.getElementById('fcount').textContent = `${rows.length} shown (sorted by brightness)`;
    document.getElementById('ftab').innerHTML = `<tr><th>Name</th><th>Kind</th><th>Ex (nm)</th><th>Em (nm)</th><th>EC (M⁻¹cm⁻¹)</th><th>QY</th><th>Brightness</th><th>pKa</th><th>Lifetime (ns)</th><th>Maturation (min)</th><th>Ref.</th></tr>` +
      list(rows, r => `<tr><td><span aria-hidden="true" style="color:${waveColor(r.em)}">●</span> <a href="https://www.fpbase.org/${r.kind === 'dye' ? 'dye' : 'protein'}/${esc(r.slug.replace(/-default$/, ''))}/" target="_blank" rel="noopener">${esc(r.name)}</a>${r.spectrum ? ' ◉' : ''}${r.switch && r.switch !== 'b' && r.switch !== 'B' ? ` <span class="tag r">switch ${esc(r.switch)}</span>` : ''}</td><td>${r.kind}</td><td>${r.ex}</td><td>${r.em}</td><td>${r.ec ? r.ec.toLocaleString() : ''}</td><td>${r.qy ?? ''}</td><td>${r.brightness ? r.brightness.toFixed(1) : ''}</td><td>${r.pka ?? ''}</td><td>${r.lifetime ?? ''}</td><td>${r.maturation ?? ''}</td><td>${r.doi ? `<a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener">${r.year || 'doi'}</a>` : ''}</td></tr>`);
    scatter(document.getElementById('fplot'), rows);
  };
  ['fq', 'fk', 'fr'].forEach(id => document.getElementById(id).addEventListener('input', draw));
  await draw();
});

// Stokes plot: excitation vs emission peak, size by brightness.
function scatter(host, rows) {
  const W = 900, H = 300, L = 50, B = 40;
  const x = v => L + (v - 330) / (800 - 330) * (W - L - 20), y = v => H - B - (v - 380) / (850 - 380) * (H - B - 15);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}"><text class="axisl" x="${W / 2}" y="${H - 6}" text-anchor="middle">excitation peak (nm)</text><text class="axisl" x="12" y="${H / 2}" transform="rotate(-90 12 ${H / 2})" text-anchor="middle">emission peak (nm)</text>`;
  for (let v = 350; v <= 800; v += 50) s += `<text class="axisl" x="${x(v)}" y="${H - B + 14}" text-anchor="middle">${v}</text>`;
  for (let v = 400; v <= 850; v += 50) s += `<text class="axisl" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  s += `<line x1="${x(380)}" y1="${y(380)}" x2="${x(800)}" y2="${y(800)}" stroke="#1f2e4d" stroke-dasharray="4 4"/>`;
  rows.filter(r => r.ex >= 330 && r.ex <= 800 && r.em <= 850).forEach(r => {
    const rad = 2 + Math.sqrt(r.brightness || 4) * 0.9;
    s += `<circle cx="${x(r.ex)}" cy="${y(r.em)}" r="${rad}" fill="${waveColor(r.em, 0.55)}" stroke="${waveColor(r.em)}"><title>${esc(r.name)}: ${r.ex}/${r.em} nm, brightness ${r.brightness ?? '?'}</title></circle>`;
  });
  host.innerHTML = s + '</svg>';
}

// ---------------- spectra viewer ----------------
const LASERS = [405, 445, 488, 514, 532, 561, 594, 640, 685, 730];
const PRESETS = {
  'Classic 4-colour': ['DAPI', 'Alexa Fluor 488', 'Alexa Fluor 568', 'Alexa Fluor 647'],
  'Live FPs': ['mTurquoise2', 'EGFP', 'mScarlet', 'miRFP670'],
  'SMLM dyes': ['Alexa Fluor 647', 'Cy3B', 'ATTO 655'],
  'GFP vs YFP (hard)': ['EGFP', 'EYFP'],
};

route('spectra', async () => {
  const spec = await api('/spectra');
  const names = Object.keys(spec).sort();
  const state = { on: new Set(PRESETS['Classic 4-colour'].filter(n => spec[n])), lasers: new Set([405, 488, 561, 640]), bands: [[430, 480], [500, 550], [580, 630], [660, 720]] };
  app().innerHTML = `<p class="kicker">Tools</p><h1>Spectra viewer</h1>
    <p class="lead">Choose fluorophores, laser lines and emission bands. The table shows how much each dye is excited by each laser and how much of its emission lands in each band: off-diagonal numbers are crosstalk.</p>
    <div class="sim"><div class="controls">
      <label>Presets</label><div>${list(Object.keys(PRESETS), p => `<button class="alt" data-preset="${esc(p)}">${esc(p)}</button>`)}</div>
      <label>Lasers</label><div id="lz">${list(LASERS, l => `<label style="display:inline-flex;gap:4px;margin-right:10px"><input type="checkbox" value="${l}"> <span style="color:${waveText(l)}">${l}</span></label>`)}</div>
      <label for="bands">Emission bands (nm, "lo-hi" comma separated)</label><input id="bands">
      <label for="addf">Add fluorophore</label><div class="row" style="gap:6px;flex-wrap:nowrap"><select id="addf" aria-describedby="addf-help"><option value="">choose...</option>${list(names, n => `<option>${esc(n)}</option>`)}</select><button class="alt" id="addf-go" type="button">Add</button></div><span id="addf-help" class="small mute">Pick with the mouse, or choose with the keys and press Enter</span>
      <div id="chips" style="margin-top:8px"></div></div>
      <div><svg id="splot" class="plot" viewBox="0 0 900 360"></svg><div id="xtab" class="scroll"></div></div></div>`;
  const $id = id => document.getElementById(id);
  const sync = () => {
    $id('lz').querySelectorAll('input').forEach(i => { i.checked = state.lasers.has(+i.value); });
    $id('bands').value = state.bands.map(b => b.join('-')).join(', ');
    $id('chips').innerHTML = list([...state.on], n => `<span class="tag" style="color:${waveText(peak(spec[n].em))}">${esc(n)} <a href="javascript:void 0" data-rm="${esc(n)}">✕</a></span>`);
    plot(); table();
  };
  const plot = () => {
    const W = 900, H = 360, L = 40, B = 30, x = nm => L + (nm - 350) / 450 * (W - L - 10), y = v => H - B - v * (H - B - 20);
    let s = '';
    state.bands.forEach(([a, b]) => { s += `<rect x="${x(a)}" y="20" width="${x(b) - x(a)}" height="${H - B - 20}" fill="${waveColor((a + b) / 2, 0.12)}" stroke="${waveColor((a + b) / 2, 0.5)}" stroke-dasharray="3 3"/>`; });
    for (let nm = 350; nm <= 800; nm += 50) s += `<text class="axisl" x="${x(nm)}" y="${H - 10}" text-anchor="middle">${nm}</text><line x1="${x(nm)}" x2="${x(nm)}" y1="20" y2="${H - B}" stroke="#101a30"/>`;
    for (const n of state.on) {
      const c = waveColor(peak(spec[n].em));
      for (const [k, dash] of [['ex', '5 4'], ['em', '']]) {
        const pts = (spec[n][k] || []).filter(p => p[0] >= 350 && p[0] <= 800);
        if (!pts.length) continue;
        const d = pts.map(p => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
        if (k === 'em') s += `<polygon points="${x(pts[0][0])},${y(0)} ${d} ${x(pts[pts.length - 1][0])},${y(0)}" fill="${c}" opacity=".18"/>`;
        s += `<polyline points="${d}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${dash}"><title>${esc(n)} ${k === 'ex' ? 'excitation' : 'emission'}</title></polyline>`;
      }
    }
    state.lasers.forEach(l => { s += `<line x1="${x(l)}" x2="${x(l)}" y1="14" y2="${H - B}" stroke="${waveColor(l)}" stroke-width="3"/><text class="axisl" x="${x(l)}" y="12" text-anchor="middle">${l}</text>`; });
    s += `<text class="axisl" x="${W - 12}" y="34" text-anchor="end">dashed: excitation · solid: emission · shaded: detection bands</text>`;
    $id('splot').innerHTML = s;
  };
  const table = () => {
    const on = [...state.on];
    const lz = [...state.lasers].sort((a, b) => a - b);
    const cell = v => `<td style="background:rgba(61,255,143,${(v * 0.5).toFixed(2)})">${(100 * v).toFixed(0)}%</td>`;
    $id('xtab').innerHTML = `<h3>Excitation efficiency at each laser (relative to peak)</h3><table><tr><th></th>${list(lz, l => `<th>${l} nm</th>`)}</tr>${list(on, n => `<tr><th>${esc(n)}</th>${list(lz, l => cell(at(spec[n].ex, l)))}</tr>`)}</table>
      <h3>Fraction of emission collected in each band</h3><table><tr><th></th>${list(state.bands, b => `<th>${b[0]}-${b[1]}</th>`)}</tr>${list(on, n => `<tr><th>${esc(n)}</th>${list(state.bands, b => cell(bandFrac(spec[n].em, b)))}</tr>`)}</table>`;
  };
  app().addEventListener('click', e => {
    const p = e.target.dataset.preset, rm = e.target.dataset.rm;
    if (p) { state.on = new Set(PRESETS[p].filter(n => spec[n])); sync(); }
    if (rm) { state.on.delete(rm); sync(); }
  });
  $id('lz').addEventListener('change', e => { const v = +e.target.value; e.target.checked ? state.lasers.add(v) : state.lasers.delete(v); plot(); table(); });
  $id('bands').addEventListener('change', e => { state.bands = e.target.value.split(',').map(t => t.trim().split('-').map(Number)).filter(b => b.length === 2 && b[0] < b[1]); plot(); table(); });
  // a mouse pick adds at once; with the keyboard (where each key press changes the value) confirm with Enter or Add
  const addSel = $id('addf'), addNow = () => { if (addSel.value) { state.on.add(addSel.value); addSel.value = ''; sync(); addSel.focus(); } };
  let pointer = false;
  addSel.addEventListener('pointerdown', () => { pointer = true; });
  addSel.addEventListener('keydown', e => { pointer = false; if (e.key === 'Enter') { e.preventDefault(); addNow(); } });
  addSel.addEventListener('change', () => { if (pointer) addNow(); });
  $id('addf-go').addEventListener('click', addNow);
  sync();
});

export const peak = c => (c && c.length ? c.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : 550);
export function at(curve, nm) {
  if (!curve) return 0;
  const p = curve.find(q => q[0] >= nm);
  return p && Math.abs(p[0] - nm) <= 2 ? p[1] : 0;
}
export function bandFrac(curve, [a, b]) {
  if (!curve) return 0;
  const tot = curve.reduce((s, p) => s + p[1], 0) || 1;
  return curve.filter(p => p[0] >= a && p[0] <= b).reduce((s, p) => s + p[1], 0) / tot;
}
