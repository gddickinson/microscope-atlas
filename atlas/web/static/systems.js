// Microscope systems: filterable browser, detail pages, manufacturers.
import { route, api, app, esc, list, tags, sourceLinks, go } from './core.js';
import { miniPath } from './lightpath.js';
import { figure, imageIndex } from './images.js';

export const picked = {
  get() { try { return JSON.parse(localStorage.getItem('cmp') || '[]'); } catch { return []; } },
  set(v) { try { localStorage.setItem('cmp', JSON.stringify(v.slice(0, 6))); } catch { /* storage unavailable */ } },
  toggle(id) { const v = this.get(); const i = v.indexOf(id); i >= 0 ? v.splice(i, 1) : v.push(id); this.set(v); return v; },
};

const KINDS = { commercial: 'Commercial', research: 'Research landmark', 'open-source': 'Open source', historical: 'Historical' };

function opts(counts, current, names = {}) {
  return `<option value="">All</option>` + list(Object.entries(counts), ([k, n]) =>
    `<option value="${esc(k)}" ${k === current ? 'selected' : ''}>${esc(names[k] || k)} (${n})</option>`);
}

route('systems', async (_args, query) => {
  const [facets, techs, idx] = await Promise.all([api('/systems/facets'), api('/techniques'), imageIndex()]);
  thumbs = idx.bySys;
  const tname = Object.fromEntries(techs.map(t => [t.id, t.name]));
  app().innerHTML = `
    <p class="kicker">Database</p><h1>Microscope systems</h1>
    <p class="lead">${facets.total} instruments: commercial systems, landmark research builds, open hardware and museum pieces.
    Every entry cites the sources its facts came from, with the date they were read.</p>
    <div class="filters panel">
      <div><label for="f-q">Search</label><input id="f-q" type="search" placeholder="e.g. Airyscan, 500 fps, cryo, Nikon" value="${esc(query.q || '')}"></div>
      <div><label for="f-family">Family</label><select id="f-family">${opts(facets.family, query.family)}</select></div>
      <div><label for="f-technique">Technique</label><select id="f-technique">${opts(facets.technique, query.technique, tname)}</select></div>
      <div><label for="f-kind">Kind</label><select id="f-kind">${opts(facets.kind, query.kind, KINDS)}</select></div>
      <div><label for="f-manufacturer">Maker / lab</label><select id="f-manufacturer">${opts(facets.manufacturer, query.manufacturer)}</select></div>
    </div>
    <p id="count" class="mute small"></p>
    <div id="results" class="grid"></div>
    <div id="cmpbar"></div>`;
  const ids = ['q', 'family', 'technique', 'kind', 'manufacturer'];
  const read = () => Object.fromEntries(ids.map(k => [k, document.getElementById('f-' + k).value]));
  async function refresh() {
    const f = read();
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    history.replaceState(null, '', '#/systems' + (qs ? '?' + qs : ''));
    const rows = await api('/systems?' + qs);
    document.getElementById('count').textContent = `${rows.length} shown`;
    document.getElementById('results').innerHTML = list(rows, s => card(s, tname));
    bar();
  }
  ids.forEach(k => document.getElementById('f-' + k).addEventListener(k === 'q' ? 'input' : 'change', refresh));
  document.getElementById('results').addEventListener('click', e => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    e.preventDefault();
    picked.toggle(b.dataset.pick);
    b.textContent = picked.get().includes(b.dataset.pick) ? '✓ compare' : '+ compare';
    bar();
  });
  await refresh();
});

let thumbs = {};
function card(s, tname) {
  const on = picked.get().includes(s.id);
  const im = (thumbs[s.id] || [])[0];
  return `<a class="card sys-card" href="#/system/${esc(s.id)}">${im ? `<img class="thumb" src="${esc(im.url)}" alt="" loading="lazy">` : ''}
    <button class="alt pick" data-pick="${esc(s.id)}">${on ? '✓ compare' : '+ compare'}</button>
    <small>${esc(s.manufacturer)}</small><b>${esc(s.name)}</b>
    <div class="tagline">${esc(trim(s.summary, 150))}</div>
    <div>${tags((s.techniques || []).slice(0, 3).map(t => tname[t] || t))}</div>
    <div class="meta"><span class="kind-${esc(s.kind)}">${esc(KINDS[s.kind] || s.kind)}</span><span>${s.year || ''} ${s.status && s.status !== 'current' ? '· ' + esc(s.status) : ''}</span></div></a>`;
}

function bar() {
  const v = picked.get();
  const host = document.getElementById('cmpbar');
  if (!host) return;
  host.innerHTML = v.length ? `<div class="compare-bar"><span>${v.length} selected for comparison</span>
    <a class="btn" href="#/compare/${v.map(encodeURIComponent).join(',')}">Compare</a>
    <button class="alt" id="cmpclear">Clear</button></div>` : '';
  const c = document.getElementById('cmpclear');
  if (c) c.onclick = () => { picked.set([]); go('#/systems?keep=1'); location.reload(); };
}

export function trim(s, n) { s = s || ''; return s.length > n ? s.slice(0, n - 1) + '…' : s; }

route('system', async ([id]) => {
  const s = await api('/systems/' + encodeURIComponent(id));
  const res = s.resolution || {};
  const primary = (s.techniques || [])[0];
  app().innerHTML = `
    <p class="kicker"><a href="#/systems">Systems</a> / ${esc(s.manufacturer)}</p>
    <h1>${esc(s.name)}</h1>
    <p class="lead">${esc(s.summary)}</p>
    ${(s.images || []).length ? `<div class="gallery" style="margin-bottom:18px">${list(s.images.slice(0, 3), i => figure(i))}</div>` : ''}
    <div class="tech-head">
      <div>
        <div class="kv">
          <div><b>${esc(s.manufacturer)}</b><span>maker / lab</span></div>
          <div><b class="kind-${esc(s.kind)}">${esc(KINDS[s.kind] || s.kind)}</b><span>kind</span></div>
          <div><b>${s.year || '—'}</b><span>introduced / published</span></div>
          <div><b>${esc(s.status || '—')}</b><span>status</span></div>
          ${res.xy_nm != null ? `<div><b>${res.xy_nm} nm</b><span>lateral resolution</span></div>` : ''}
          ${res.z_nm != null ? `<div><b>${res.z_nm} nm</b><span>axial resolution</span></div>` : ''}
        </div>
        ${res.note ? `<p class="small mute">Resolution: ${esc(res.note)}</p>` : ''}
        <h3>Techniques</h3>
        <p>${list(s.techniques, t => `<a class="tag g" href="#/technique/${esc(t)}">${esc(s.technique_names[t])}</a>`)}</p>
        ${s.specs && Object.keys(s.specs).length ? `<h3>Specifications</h3><table>${list(Object.entries(s.specs), ([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)}</table>` : ''}
        ${s.applications && s.applications.length ? `<h3>Typical applications</h3><p>${tags(s.applications, 'b')}</p>` : ''}
        <h3>Sources</h3><ul class="small">${sourceLinks(s.sources)}</ul>
        <p class="small mute">Sources read ${esc(s.checked || 'unknown')}. Specifications change between configurations; check with the maker before relying on a number.</p>
        <button id="cmp">${picked.get().includes(s.id) ? '✓ In comparison' : '+ Add to comparison'}</button>
        <a class="btn alt" href="#/systems?technique=${esc(primary)}">Similar systems</a>
      </div>
      <a href="#/technique/${esc(primary)}" title="How ${esc(primary)} works">${miniPath(primary) || ''}<span class="small">How this technique works →</span></a>
    </div>`;
  document.getElementById('cmp').onclick = e => { picked.toggle(s.id); e.target.textContent = picked.get().includes(s.id) ? '✓ In comparison' : '+ Add to comparison'; };
});

route('manufacturers', async () => {
  const rows = await api('/manufacturers');
  const max = Math.max(...rows.map(r => r.count));
  app().innerHTML = `<p class="kicker">Database</p><h1>Manufacturers and labs</h1>
    <p class="lead">${rows.length} companies, labs and projects behind the instruments in the atlas.</p>
    <div class="panel">${list(rows.slice(0, 20), r => `<div class="bar-row"><a href="#/systems?manufacturer=${encodeURIComponent(r.name)}">${esc(r.name)}</a><i style="width:${100 * r.count / max}%"></i><span>${r.count}</span></div>`)}</div>
    <div class="scroll"><table><tr><th>Maker / lab</th><th>Systems</th><th>Main techniques</th><th>Years</th></tr>
    ${list(rows, r => `<tr class="click" onclick="location.hash='#/systems?manufacturer=${encodeURIComponent(r.name).replace(/'/g, '%27')}'"><td>${esc(r.name)}</td><td>${r.count}</td><td>${tags(r.techniques)}</td><td>${r.first ? r.first + (r.last !== r.first ? '–' + r.last : '') : ''}</td></tr>`)}</table></div>`;
});
