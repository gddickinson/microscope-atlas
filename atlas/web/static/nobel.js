// Nobel Prizes and microscopy (#/nobel): prizes for inventing or advancing microscopes, techniques and probes, and
// prizes whose work depended on microscopy. Content: data/content/nobel.json (official citations from nobelprize.org).
import { route, api, app, esc, list } from './core.js';

const REL = { contributed: ['Advanced microscopy', 'g'], used: ['Discovered with microscopy', 'b'], 'related imaging': ['Related imaging', 'y'] };

route('nobel', async (_a, query = {}) => {
  const [N, techs] = await Promise.all([api('/content/nobel'), api('/techniques')]);
  const tname = Object.fromEntries(techs.map(t => [t.id, t.name]));
  const prizes = N.prizes || [];
  const cats = [...new Set(prizes.map(p => p.category))].sort();
  const people = prizes.reduce((n, p) => n + p.laureates.length, 0);
  app().innerHTML = `<p class="kicker">Community</p><h1>Nobel Prizes and the microscope</h1>
    <p class="lead">${prizes.length} Nobel Prizes (${people} laureates) for building better microscopes, probes and methods, or for discoveries that
    could only be made by looking down one. Citations are the official ones from nobelprize.org.</p>
    <div class="row"><div><label for="nb-r">Kind</label><select id="nb-r"><option value="">All</option>${list(Object.entries(REL), ([k, [l]]) => `<option value="${k}" ${query.kind === k ? 'selected' : ''}>${l}</option>`)}</select></div>
    <div><label for="nb-c">Prize</label><select id="nb-c"><option value="">All prizes</option>${list(cats, c => `<option>${esc(c)}</option>`)}</select></div>
    <div><label for="nb-q">Search</label><input id="nb-q" type="search" placeholder="name, technique, word"></div></div>
    <div id="nb-list" class="nobel"></div>`;
  const draw = () => {
    const r = app().querySelector('#nb-r').value, c = app().querySelector('#nb-c').value, q = app().querySelector('#nb-q').value.toLowerCase();
    const shown = prizes.filter(p => (!r || p.relation === r) && (!c || p.category === c) && (!q || JSON.stringify(p).toLowerCase().includes(q)));
    app().querySelector('#nb-list').innerHTML = shown.length ? list(shown, p => {
      const [rl, cls] = REL[p.relation] || [p.relation, ''];
      return `<div class="card nb"><b class="nb-year">${p.year}</b><div>
        <b>${esc(p.laureates.join(', '))}</b> <span class="tag">${esc(p.category)}</span> <span class="tag ${cls}">${esc(rl)}</span>
        <p class="nb-cite">“${esc(p.motivation)}”</p>
        <p>${esc(p.microscopy)}</p>
        ${(p.shared_with || []).length ? `<p class="small mute">Shared with ${esc(p.shared_with.join(', '))} for other work.</p>` : ''}
        <p class="small">${list(p.techniques || [], t => `<a class="tag g" href="#/technique/${esc(t)}">${esc(tname[t] || t)}</a>`)}
        ${list(p.sources || [], (s, i) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">[${i + 1}]</a>`, ' ')}</p></div></div>`;
    }) : '<p class="mute">No prizes match.</p>';
  };
  for (const id of ['#nb-r', '#nb-c']) app().querySelector(id).onchange = draw;
  app().querySelector('#nb-q').oninput = draw;
  draw();
});
