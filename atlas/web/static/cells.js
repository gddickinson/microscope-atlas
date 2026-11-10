// Cells page (#/cells/<tab>): labelled diagrams of cell types, cell structures, cell types, an image database of
// freely licensed micrographs, and the cell identifier (cells_identify.js). Content: data/content/cells.json.
import { route, api, app, esc, list } from './core.js';
import { DIAGRAMS } from './cell_diagrams.js';
import { DIAGRAMS2 } from './cell_diagrams2.js';
import { figure, credit } from './images.js';
import { mountIdentify } from './cells_identify.js';

export const ALL_DIAGRAMS = { ...DIAGRAMS, ...DIAGRAMS2 };
const TABS = [['diagrams', 'Diagrams'], ['structures', 'Structures'], ['types', 'Cell types'], ['images', 'Image database'], ['identify', 'Identify a cell']];
const srcs = s => (s || []).length ? `Sources: ${list(s, (x, i) => `<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.title || 'source')}">[${i + 1}]</a>`, ' ')}` : '';

export const cellImages = async () => (await api('/images').catch(() => [])).filter(i => i.cell_type);

route('cells', async ([tab = 'diagrams', arg], query) => {
  if (!TABS.some(t => t[0] === tab)) tab = 'diagrams';
  const [C, imgs] = await Promise.all([api('/content/cells'), cellImages()]);
  const S = Object.fromEntries((C.structures || []).map(s => [s.id, s])), T = Object.fromEntries((C.cell_types || []).map(t => [t.id, t]));
  app().innerHTML = `<p class="kicker">Learn</p><h1>Cells</h1>
    ${tab === 'diagrams' && (C.intro || []).length ? `<p class="lead">${esc(C.intro[0])}</p><details class="fold"><summary>More: prokaryotes, eukaryotes and how microscopes found cells</summary>${list(C.intro.slice(1), p => `<p>${esc(p)}</p>`)}<p class="small mute">${srcs(C.intro_sources)}</p></details>` : ''}
    <div class="seg">${list(TABS, ([k, l]) => `<button class="${k === tab ? 'on' : ''}" onclick="location.hash='#/cells/${k}'">${l}</button>`)}</div>
    <div id="cells-body" style="margin-top:16px"></div>`;
  const body = app().querySelector('#cells-body');
  if (tab === 'diagrams') diagrams(body, S, T, arg);
  if (tab === 'structures') structures(body, C, S, arg);
  if (tab === 'types') types(body, C, imgs);
  if (tab === 'images') images(body, T, imgs, query);
  if (tab === 'identify') mountIdentify(body, T);
});

function structureCard(s) {
  return `<div class="card cell-s" id="s-${esc(s.id)}"><b>${esc(s.name)}</b><small>${esc((s.in || []).join(', '))}</small>
    <span><b>What it is.</b> ${esc(s.what || '')}</span><span><b>What it does.</b> ${esc(s.does || '')}</span>
    ${s.size ? `<span><b>Size.</b> ${esc(s.size)}</span>` : ''}${s.see_it ? `<span><b>Seeing it.</b> ${esc(s.see_it)}</span>` : ''}
    <small>${srcs(s.sources)}</small></div>`;
}

function diagrams(host, S, T, which) {
  const ids = Object.keys(ALL_DIAGRAMS), cur = ALL_DIAGRAMS[which] ? which : 'animal';
  host.innerHTML = `<div class="seg small">${list(ids, k => `<button class="${k === cur ? 'on' : ''}" onclick="location.hash='#/cells/diagrams/${k}'">${esc(ALL_DIAGRAMS[k].title)}</button>`)}</div>
    <div class="two cell-dia"><div><svg class="celld" viewBox="0 0 600 400" role="img" aria-label="${esc(ALL_DIAGRAMS[cur].title)} diagram">${ALL_DIAGRAMS[cur].svg()}</svg>
      <p class="small mute">${esc(ALL_DIAGRAMS[cur].note)} Hover over a part for its name; click it to read about it.</p>
      ${T[cur] ? `<p><a href="#/cells/types">About ${esc(T[cur].name)} cells →</a></p>` : ''}</div>
      <div id="cd-info"><p class="mute">Click a structure in the diagram.</p></div></div>`;
  const info = host.querySelector('#cd-info'), svg = host.querySelector('svg');
  svg.addEventListener('click', e => {
    const g = e.target.closest('.cd-part'); if (!g) return;
    svg.querySelectorAll('.cd-part').forEach(x => x.classList.toggle('on', x.dataset.s === g.dataset.s));
    const s = S[g.dataset.s];
    info.innerHTML = s ? structureCard(s) : `<div class="card"><b>${esc(g.querySelector('title').textContent.split(':')[0])}</b><span>${esc(g.querySelector('title').textContent)}</span></div>`;
  });
}

function structures(host, C, S, focus) {
  host.innerHTML = `${(C.numbers || []).length ? `<h2>Numbers worth knowing</h2><div class="kv">${list(C.numbers, n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)} <a href="${esc(n.url)}" target="_blank" rel="noopener">[src]</a></span></div>`)}</div>` : ''}
    <h2>Structures and organelles</h2><div class="grid wide">${list(C.structures || [], structureCard)}</div>`;
  if (focus && S[focus]) host.querySelector('#s-' + focus)?.scrollIntoView();
}

function types(host, C, imgs) {
  const groups = [...new Set((C.cell_types || []).map(t => t.group))];
  host.innerHTML = list(groups, g => `<h2>${esc(g)}</h2><div class="grid wide">${list(C.cell_types.filter(t => t.group === g), t => {
    const im = imgs.filter(i => i.cell_type === t.id);
    return `<div class="card" id="t-${esc(t.id)}">${im[0] ? `<a href="#/cells/images?type=${esc(t.id)}"><img class="thumb" src="${esc(im[0].url)}" alt="" loading="lazy"></a>` : ''}<b>${esc(t.name)}</b>
      ${t.size ? `<small>${esc(t.size)}</small>` : ''}<span>${esc(t.summary || '')}</span>
      ${(t.features || []).length ? `<ul class="small">${list(t.features, f => `<li>${esc(f)}</li>`)}</ul>` : ''}
      <small>${ALL_DIAGRAMS[t.id] ? `<a href="#/cells/diagrams/${esc(t.id)}">Diagram</a> · ` : ''}${im.length ? `<a href="#/cells/images?type=${esc(t.id)}">${im.length} image${im.length > 1 ? 's' : ''}</a> · ` : ''}${srcs(t.sources)}</small></div>`;
  })}</div>`);
}

function images(host, T, imgs, query = {}) {
  const typesPresent = [...new Set(imgs.map(i => i.cell_type))].sort((a, b) => (T[a]?.name || a).localeCompare(T[b]?.name || b));
  const techs = [...new Set(imgs.flatMap(i => i.techniques || []))].sort();
  host.innerHTML = `<p class="small mute">${imgs.length} freely licensed micrographs from Wikimedia Commons, each credited to its author with its licence. They are also the reference set for the identifier.</p>
    <div class="row"><div><label for="ci-t">Cell type</label><select id="ci-t"><option value="">All types</option>${list(typesPresent, t => `<option value="${esc(t)}" ${query.type === t ? 'selected' : ''}>${esc(T[t]?.name || t)}</option>`)}</select></div>
    <div><label for="ci-m">Technique</label><select id="ci-m"><option value="">All techniques</option>${list(techs, t => `<option>${esc(t)}</option>`)}</select></div></div><div id="ci-g"></div>`;
  const draw = () => {
    const t = host.querySelector('#ci-t').value, m = host.querySelector('#ci-m').value;
    const shown = imgs.filter(i => (!t || i.cell_type === t) && (!m || (i.techniques || []).includes(m)));
    host.querySelector('#ci-g').innerHTML = `<p class="small">${shown.length} images</p><div class="gallery compact">${list(shown, i => figure(i).replace('<figcaption>', `<figcaption><span class="tag g">${esc(T[i.cell_type]?.name || i.cell_type)}</span> `))}</div>`;
  };
  host.querySelector('#ci-t').onchange = draw; host.querySelector('#ci-m').onchange = draw;
  draw();
}


