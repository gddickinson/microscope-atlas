// Papers database (searchable, sortable, linked to techniques) and the community/resources page.
import { route, api, app, esc, list } from './core.js';

route('papers', async (_a, query) => {
  const [rows, techs] = await Promise.all([api('/papers'), api('/techniques')]);
  const tname = Object.fromEntries(techs.map(t => [t.id, t.name]));
  const cats = [...new Set(rows.map(r => r.category))].sort();
  const years = rows.map(r => r.year).filter(Boolean);
  app().innerHTML = `<p class="kicker">Community</p><h1>Papers</h1>
    <p class="lead">${rows.length} papers: the landmark papers behind every technique page, plus methods papers and protocols, reviews, analysis
    benchmarks, software and guides to rigorous imaging. Metadata and citation counts from Crossref; each links to its DOI.</p>
    <div class="filters panel">
      <div><label for="pq">Search title, author, journal</label><input id="pq" type="search" value="${esc(query.q || '')}" placeholder="e.g. localization, Betzig, Nature Methods"></div>
      <div><label for="pc">Category</label><select id="pc"><option value="">All</option>${list(cats, c => `<option ${c === query.cat ? 'selected' : ''}>${esc(c)}</option>`)}</select></div>
      <div><label for="pt">Technique</label><select id="pt"><option value="">All</option>${list(techs, t => `<option value="${t.id}" ${t.id === query.technique ? 'selected' : ''}>${esc(t.name)}</option>`)}</select></div>
      <div><label for="ps">Sort</label><select id="ps"><option value="year">Newest</option><option value="old">Oldest</option><option value="cites">Most cited</option></select></div>
      <div><label for="py">From year</label><input id="py" type="number" min="${Math.min(...years)}" max="${Math.max(...years)}" value="${Math.min(...years)}"></div>
    </div>
    <div id="pchart"></div><p id="pcount" class="small mute"></p><div id="plist"></div>`;
  const $ = id => document.getElementById(id);
  const draw = () => {
    const q = $('pq').value.toLowerCase(), c = $('pc').value, t = $('pt').value, y0 = +$('py').value, s = $('ps').value;
    let shown = rows.filter(r => (!c || r.category === c) && (!t || r.techniques.includes(t)) && (r.year || 0) >= y0 &&
      (!q || `${r.title} ${r.authors.join(' ')} ${r.journal} ${r.note}`.toLowerCase().includes(q)));
    shown = [...shown].sort(s === 'cites' ? (a, b) => b.citations - a.citations : s === 'old' ? (a, b) => (a.year || 0) - (b.year || 0) : (a, b) => (b.year || 0) - (a.year || 0));
    $('pcount').textContent = `${shown.length} shown`;
    $('plist').innerHTML = list(shown, r => `<div class="paper"><a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener"><b>${esc(r.title)}</b></a>
      <div class="small">${esc(r.authors.join(', '))} (${r.year || '?'}) <i>${esc(r.journal)}</i>${r.volume ? ' ' + esc(r.volume) : ''}${r.pages ? ':' + esc(r.pages) : ''}</div>
      <div class="small mute">${esc(r.note)}</div>
      <div>${r.category ? `<span class="tag y">${esc(r.category)}</span>` : ''}<span class="tag">${r.citations.toLocaleString()} citations</span>${list(r.techniques, x => `<a class="tag g" href="#/technique/${x}">${esc(tname[x] || x)}</a>`)}</div></div>`);
    chart(shown);
  };
  ['pq', 'pc', 'pt', 'ps', 'py'].forEach(id => $(id).addEventListener('input', draw));
  draw();
});

// Papers per decade, as a quick sense of the field's history.
function chart(rows) {
  const by = {};
  rows.forEach(r => { if (r.year) { const d = Math.floor(r.year / 10) * 10; by[d] = (by[d] || 0) + 1; } });
  const ds = Object.keys(by).map(Number).sort((a, b) => a - b);
  if (!ds.length) { document.getElementById('pchart').innerHTML = ''; return; }
  const max = Math.max(...Object.values(by)), W = 900, H = 130, bw = (W - 40) / ds.length;
  document.getElementById('pchart').innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}">${ds.map((d, i) => {
    const h = by[d] / max * (H - 40);
    return `<rect x="${20 + i * bw}" y="${H - 22 - h}" width="${bw - 4}" height="${h}" fill="#ff3fa4" opacity=".7"><title>${d}s: ${by[d]}</title></rect><text class="axisl" x="${20 + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${d}s</text>`;
  }).join('')}</svg>`;
}

route('community', async () => {
  const groups = await api('/content/community');
  app().innerHTML = `<p class="kicker">Community</p><h1>Community and resources</h1>
    <p class="lead">Where microscopists learn, ask questions, find software and data, and build their own instruments. Every link is checked automatically.</p>
    <div class="toc">${list(groups, (g, i) => `<a href="javascript:void 0" data-jump="${i}">${esc(g.group)}</a>`)}</div>
    ${list(groups, (g, i) => `<h2 id="cg-${i}">${esc(g.group)}</h2><div class="grid">${list(g.links, l => `<a class="card" href="${esc(l.url)}" target="_blank" rel="noopener"><b>${esc(l.name)} ↗</b><span>${esc(l.about)}</span><small>${esc(new URL(l.url).hostname)}</small></a>`)}</div>`)}
    <h2>In this atlas</h2><p>See also the <a href="#/papers">papers database</a>, the <a href="#/glossary">glossary</a> and the instrument makers in the <a href="#/manufacturers">manufacturers</a> list.</p>`;
  app().querySelector('.toc').addEventListener('click', e => {
    const k = e.target.dataset.jump;
    if (k !== undefined) document.getElementById('cg-' + k).scrollIntoView({ behavior: 'smooth' });
  });
});
