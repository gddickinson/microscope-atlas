// Technique comparison matrix (#/matrix): every technique side by side, with resolution, speed and depth exactly as
// its teaching page states them (GET /api/techniques/matrix), a log-scale bar of the first stated lateral
// resolution, and database counts. Columns sort; rows filter by family and text.
import { route, api, app, esc, list } from './core.js';
import { firstLength, lateralLength, logPos, fmtLength, byKey } from './matrix_calc.js';

const TICKS = [0.1, 10, 1e3, 1e5];
const COLS = [
  ['name', 'Technique', r => r.name],
  ['family', 'Family', r => r.family],
  ['xy', 'Lateral resolution', r => r.xyLen?.lo ?? null],
  ['z', 'Axial resolution', r => r.zLen?.lo ?? null],
  ['speed', 'Speed', r => r.speed[0]?.value || null],
  ['depth', 'Depth', r => r.depthLen?.lo ?? null],
  ['systems', 'Systems', r => r.systems],
  ['sims', 'Sims', r => r.sims],
  ['papers', 'Papers', r => r.papers],
];

const kn = ks => list(ks, k => `<div><span class="mute">${esc(k.label)}:</span> ${esc(k.value)}</div>`);

function bar(len) {
  if (!len) return '';
  const a = logPos(len.lo), b = logPos(len.hi);
  return `<div class="mx-bar" title="${esc(fmtLength(len.lo))}${len.hi > len.lo ? ' to ' + esc(fmtLength(len.hi)) : ''}">
    <span style="left:${(a * 100).toFixed(1)}%;width:${Math.max(1.2, (b - a) * 100).toFixed(1)}%"></span></div>`;
}

route('matrix', async (_a, query = {}) => {
  const raw = await api('/techniques/matrix');
  const rows = raw.map(r => ({ ...r, xyLen: lateralLength(r.xy), zLen: firstLength(r.z),
    depthLen: r.depth.length ? firstLength(r.depth[0].value) : null }));
  const fams = [...new Set(rows.map(r => r.family))];
  app().innerHTML = `<p class="kicker">Learn</p><h1>Technique comparison matrix</h1>
    <p class="lead">All ${rows.length} techniques side by side. Resolution, speed and depth are quoted from each technique's page
    (where the page's papers support them); an empty cell means the page gives no number. The bar shows the lateral
    resolution the page states first, on a log scale from 0.1 nm to 100 µm. Click a column heading to sort.</p>
    <div class="row"><div><label for="mx-f">Family</label><select id="mx-f"><option value="">All families</option>
      ${list(fams, f => `<option ${query.family === f ? 'selected' : ''}>${esc(f)}</option>`)}</select></div>
    <div><label for="mx-q">Search</label><input id="mx-q" type="search" placeholder="technique, number, word"></div>
    <div><label for="mx-n">Only rows with</label><select id="mx-n"><option value="">anything</option><option value="speed">a speed</option><option value="depth">a depth</option></select></div></div>
    <p id="mx-count" class="small mute" aria-live="polite"></p>
    <div class="scroll"><table class="mx" id="mx-t"></table></div>
    <p class="small mute">Speeds and depths are the page's own key numbers (frame, volume or scan rates; imaging or penetration depth).
    Systems: entries in the systems database tagged with the technique. Sims: interactive simulations on the technique.</p>`;
  let sortKey = 'xy', dir = 1;
  const $ = s => app().querySelector(s);
  const draw = () => {
    const f = $('#mx-f').value, q = $('#mx-q').value.toLowerCase(), need = $('#mx-n').value;
    const shown = rows.filter(r => (!f || r.family === f) && (!need || r[need].length) && (!q || JSON.stringify(r).toLowerCase().includes(q)));
    const col = COLS.find(c => c[0] === sortKey);
    shown.sort(byKey(col[2], dir));
    $('#mx-count').textContent = `${shown.length} of ${rows.length} techniques, sorted by ${col[1].toLowerCase()}${dir < 0 ? ' (descending)' : ''}`;
    const scale = `<div class="mx-scale">${list(TICKS, t => `<span style="left:${(logPos(t) * 100).toFixed(1)}%">${fmtLength(t).replace(' ', '&nbsp;')}</span>`)}</div>`;
    $('#mx-t').innerHTML = `<thead><tr>${list(COLS, ([k, l]) => `<th aria-sort="${k === sortKey ? (dir > 0 ? 'ascending' : 'descending') : 'none'}">
      <button class="mx-sort" data-k="${k}">${l}${k === sortKey ? (dir > 0 ? ' ▲' : ' ▼') : ''}</button>${k === 'xy' ? scale : ''}</th>`)}</tr></thead><tbody>` +
      list(shown, r => `<tr>
        <td><a href="#/technique/${esc(r.id)}"><b>${esc(r.name)}</b></a></td>
        <td class="small">${esc(r.family)}</td>
        <td class="mx-xy">${bar(r.xyLen)}<div class="small">${esc(r.xy)}</div></td>
        <td class="small">${esc(r.z)}</td>
        <td class="small">${kn(r.speed)}</td>
        <td class="small">${kn(r.depth)}</td>
        <td>${r.systems ? `<a href="#/systems?technique=${esc(r.id)}">${r.systems}</a>` : '0'}</td>
        <td>${r.sims}</td><td>${r.papers}</td></tr>`) + '</tbody>';
  };
  $('#mx-t').addEventListener('click', e => {
    const k = e.target.closest('.mx-sort')?.dataset.k;
    if (!k) return;
    dir = k === sortKey ? -dir : (['systems', 'sims', 'papers'].includes(k) ? -1 : 1);
    sortKey = k; draw();
    $(`.mx-sort[data-k="${k}"]`)?.focus();
  });
  for (const id of ['#mx-f', '#mx-n']) $(id).onchange = draw;
  $('#mx-q').oninput = draw;
  draw();
});
