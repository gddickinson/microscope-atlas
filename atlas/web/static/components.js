// Detectors and objectives: sortable tables with sources.
import { route, api, app, esc, list } from './core.js';

const KEYS = {
  detectors: ['Pixels', 'Pixel size', 'Peak QE', 'Read noise', 'Max frame rate', 'Bit depth'],
  objectives: ['Magnification', 'NA', 'Immersion', 'Working distance', 'Correction'],
};

route('components', async ([kind = 'detectors']) => {
  if (!KEYS[kind]) kind = 'detectors';
  const rows = await api('/components/' + kind);
  const types = [...new Set(rows.map(r => r.type))].sort();
  app().innerHTML = `<p class="kicker">Database</p><h1>${kind === 'detectors' ? 'Detectors' : 'Objective lenses'}</h1>
    <div class="seg"><button class="${kind === 'detectors' ? 'on' : ''}" onclick="location.hash='#/components/detectors'">Detectors</button><button class="${kind === 'objectives' ? 'on' : ''}" onclick="location.hash='#/components/objectives'">Objectives</button></div>
    <p class="lead">${kind === 'detectors'
      ? 'Cameras and point detectors: what limits sensitivity is quantum efficiency, read noise and (for EMCCDs) excess noise. See the <a href="#/sim/noise">camera noise simulation</a>.'
      : 'Objectives set resolution (NA), brightness (∝ NA⁴/M² in epifluorescence) and how deep you can image without aberrations. See the <a href="#/sim/psf">PSF simulation</a>.'}</p>
    <div class="row"><div><label for="ct">Type</label><select id="ct"><option value="">All (${rows.length})</option>${list(types, t => `<option>${esc(t)}</option>`)}</select></div><div><label for="cq">Search</label><input id="cq" type="search"></div></div>
    <div class="scroll"><table id="ctab"></table></div>`;
  let sortKey = 'name', dir = 1;
  const draw = () => {
    const t = document.getElementById('ct').value, q = document.getElementById('cq').value.toLowerCase();
    const shown = rows.filter(r => (!t || r.type === t) && (!q || JSON.stringify(r).toLowerCase().includes(q)));
    const val = (r, k) => k === 'name' ? r.name : k === 'manufacturer' ? r.manufacturer : k === 'type' ? r.type : (r.specs || {})[k] || '';
    shown.sort((a, b) => dir * String(val(a, sortKey)).localeCompare(String(val(b, sortKey)), undefined, { numeric: true }));
    const cols = ['name', 'manufacturer', 'type', ...KEYS[kind]];
    document.getElementById('ctab').innerHTML = `<tr>${list(cols, c => `<th><a href="javascript:void 0" data-k="${c}">${c[0].toUpperCase() + c.slice(1)}</a></th>`)}<th>Notes</th></tr>` +
      list(shown, r => `<tr><td><b>${esc(r.name)}</b>${r.status === 'discontinued' ? ' <span class="tag">discontinued</span>' : ''}</td><td>${esc(r.manufacturer)}</td><td>${esc(r.type)}</td>${list(KEYS[kind], k => `<td>${esc((r.specs || {})[k] || '')}</td>`)}<td class="small">${esc(r.summary)} ${list(r.sources, s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">[src]</a>`, ' ')}</td></tr>`);
  };
  document.getElementById('ctab').addEventListener('click', e => { const k = e.target.dataset.k; if (k) { dir = k === sortKey ? -dir : 1; sortKey = k; draw(); } });
  document.getElementById('ct').onchange = draw; document.getElementById('cq').oninput = draw;
  draw();
});
