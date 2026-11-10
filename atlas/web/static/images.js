// Freely licensed images (Wikimedia Commons): credited figures, a filterable gallery, and lookups for other pages.
import { route, api, app, esc, list } from './core.js';

export function credit(i) {
  return `<span class="credit">${esc(i.author || 'Unknown author')} · <a href="${esc(i.licence_url || i.source_url)}" target="_blank" rel="noopener">${esc(i.licence)}</a> · <a href="${esc(i.source_url)}" target="_blank" rel="noopener">Wikimedia Commons</a></span>`;
}

export function figure(i, { link = true } = {}) {
  return `<figure class="cfig"><a href="${link ? esc(i.source_url) : 'javascript:void 0'}" target="_blank" rel="noopener"><img src="${esc(i.url)}" alt="${esc(i.title)}" loading="lazy"></a>
    <figcaption><b>${esc(i.title)}</b><br>${esc(i.caption || '')}<br>${credit(i)}</figcaption></figure>`;
}

export function gallery(imgs, max = 12) {
  return imgs.length ? `<div class="gallery">${list(imgs.slice(0, max), i => figure(i))}</div>` : '';
}

let byTech = null, bySys = null;
export async function imageIndex() {
  if (!byTech) {
    const all = await api('/images').catch(() => []);
    byTech = {}; bySys = {};
    for (const i of all) {
      if (i.system) (bySys[i.system] ||= []).push(i);
      for (const t of i.techniques || []) (byTech[t] ||= []).push(i);
    }
  }
  return { byTech, bySys };
}

route('gallery', async (_a, query) => {
  const [imgs, techs] = await Promise.all([api('/images').catch(() => []), api('/techniques')]);
  const tname = Object.fromEntries(techs.map(t => [t.id, t.name]));
  app().innerHTML = `<p class="kicker">Database</p><h1>Image gallery</h1>
    <p class="lead">${imgs.length} freely licensed images from Wikimedia Commons: instruments and example micrographs, each credited to its author under its licence. Click an image for its source page.</p>
    <div class="row"><div><label for="gk">Kind</label><select id="gk"><option value="">All</option><option value="instrument">Instruments</option><option value="micrograph">Micrographs</option></select></div>
    <div><label for="gt">Technique</label><select id="gt"><option value="">All</option>${list(techs.filter(t => imgs.some(i => (i.techniques || []).includes(t.id))), t => `<option value="${t.id}" ${t.id === query.technique ? 'selected' : ''}>${esc(t.name)}</option>`)}</select></div>
    <div><label for="gq">Search</label><input id="gq" type="search"></div></div>
    <div id="gg"></div>`;
  const draw = () => {
    const k = document.getElementById('gk').value, t = document.getElementById('gt').value, q = document.getElementById('gq').value.toLowerCase();
    const shown = imgs.filter(i => (!k || i.kind === k) && (!t || (i.techniques || []).includes(t)) && (!q || `${i.title} ${i.caption} ${i.author}`.toLowerCase().includes(q)));
    document.getElementById('gg').innerHTML = shown.length ? `<p class="small mute">${shown.length} shown</p><div class="gallery">${list(shown, i => figure(i).replace('</figcaption>', `<br>${list(i.techniques || [], x => `<a class="tag g" href="#/technique/${x}">${esc(tname[x] || x)}</a>`)}${i.system ? ` <a class="tag b" href="#/system/${esc(i.system)}">instrument page</a>` : ''}</figcaption>`))}</div>` : '<p class="mute">No images yet.</p>';
  };
  ['gk', 'gt', 'gq'].forEach(id => document.getElementById(id).addEventListener('input', draw));
  draw();
});
