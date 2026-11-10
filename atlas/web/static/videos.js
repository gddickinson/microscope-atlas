// Video tutorials: a filterable page, and cards reused on technique pages.
import { route, api, app, esc, list } from './core.js';

const ytId = url => (url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/) || [])[1];

export function videoCard(v) {
  const id = ytId(v.url);
  const thumb = id ? `<img class="thumb" src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="" decoding="async">` : '';
  return `<a class="card vcard" href="${esc(v.url)}" target="_blank" rel="noopener">${thumb}<b>▶ ${esc(v.title)}</b>
    <small>${esc(v.source || '')}${v.minutes ? ` · ${v.minutes} min` : ''}</small><span>${esc(v.about || '')}</span></a>`;
}

route('videos', async (_a, query) => {
  const [vids, techs] = await Promise.all([api('/content/videos').catch(() => []), api('/techniques')]);
  const used = techs.filter(t => vids.some(v => (v.techniques || []).includes(t.id)));
  const sources = [...new Set(vids.map(v => v.source).filter(Boolean))].sort();
  app().innerHTML = `<p class="kicker">Learn</p><h1>Video tutorials</h1>
    <p class="lead">${vids.length} lectures and how-to videos from iBiology, Microcourses, microscope makers and imaging facilities, sorted by technique. Each opens on its own site.</p>
    <div class="row"><div><label for="vt">Technique</label><select id="vt"><option value="">All</option>${list(used, t => `<option value="${t.id}" ${t.id === query.technique ? 'selected' : ''}>${esc(t.name)}</option>`)}</select></div>
    <div><label for="vs">Source</label><select id="vs"><option value="">All</option>${list(sources, s => `<option>${esc(s)}</option>`)}</select></div>
    <div><label for="vq">Search</label><input id="vq" type="search"></div></div><div id="vl"></div>`;
  const draw = () => {
    const t = document.getElementById('vt').value, s = document.getElementById('vs').value, q = document.getElementById('vq').value.toLowerCase();
    const shown = vids.filter(v => (!t || (v.techniques || []).includes(t)) && (!s || v.source === s) && (!q || `${v.title} ${v.about}`.toLowerCase().includes(q)));
    document.getElementById('vl').innerHTML = shown.length ? `<p class="small mute">${shown.length} shown</p><div class="grid">${list(shown, videoCard)}</div>` : '<p class="mute">No videos yet.</p>';
  };
  ['vt', 'vs', 'vq'].forEach(id => document.getElementById(id).addEventListener('input', draw));
  draw();
});
