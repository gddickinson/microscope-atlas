// Learn pages: optics fundamentals, history timeline, glossary, portfolio, about.
import { route, api, app, esc, list, bullets, tags, doiLink } from './core.js';
import { linkify } from './links.js';

route('fundamentals', async () => {
  const secs = await api('/content/fundamentals');
  const seen = new Set();
  app().innerHTML = `<p class="kicker">Learn</p><h1>Optics fundamentals</h1>
    <p class="lead">The physics every technique builds on, from refraction to the optical transfer function. Each section links to a simulation you can play with.</p>
    <div class="toc">${list(secs, (s, i) => `<a href="javascript:void 0" data-jump="${i}">${esc(s.title)}</a>`)}</div>
    ${list(secs, (s, i) => `<section id="f-${i}" class="panel"><h2 style="margin-top:4px">${esc(s.title)}</h2>
      ${list(s.paragraphs, p => `<p>${linkify(p, seen)}</p>`)}
      ${list(s.equations || [], e => `<div><span class="eq">${esc(e.formula)}</span> <span class="small mute">${esc(e.meaning)}</span></div>`)}
      ${s.points ? bullets(s.points) : ''}
      ${s.sim ? `<p><a class="btn alt" href="#/sim/${esc(s.sim)}">Open the simulation →</a></p>` : ''}</section>`)}`;
  app().querySelector('.toc').addEventListener('click', e => {
    const k = e.target.dataset.jump;
    if (k !== undefined) document.getElementById('f-' + k).scrollIntoView({ behavior: 'smooth' });
  });
});

route('history', async () => {
  const techs = await api('/techniques');
  const pages = await Promise.all(techs.filter(t => t.has_page).map(t => api('/techniques/' + t.id)));
  const systems = await api('/systems?kind=historical');
  const events = [];
  pages.forEach(p => (p.history || []).forEach(h => events.push({ year: h.year, text: h.event, tag: p.name, href: '#/technique/' + p.id })));
  systems.forEach(s => { if (s.year) events.push({ year: s.year, text: `${s.name}: ${s.summary}`, tag: s.manufacturer, href: '#/system/' + s.id, inst: true }); });
  const seen = new Set();
  const uniq = events.filter(e => { const k = e.year + e.text.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.year - b.year);
  const eras = [[0, 1800, 'The first microscopes'], [1800, 1900, 'Optics becomes a science'], [1900, 1950, 'Phase, fluorescence and electrons'], [1950, 1990, 'Lasers, confocal and cameras'], [1990, 2010, 'Breaking the diffraction limit'], [2010, 2100, 'Gentle, fast, deep and molecular']];
  app().innerHTML = `<p class="kicker">Learn</p><h1>History of microscopy</h1>
    <p class="lead">${uniq.length} events gathered from the technique pages and the historical instruments in the database.</p>
    <div id="hchart"></div>
    <div class="row"><div><label for="hq">Filter</label><input id="hq" type="search" placeholder="e.g. Zeiss, STED, Nobel"></div></div>
    <div id="hlist"></div>`;
  const draw = () => {
    const q = document.getElementById('hq').value.toLowerCase();
    const shown = uniq.filter(e => !q || (e.text + e.tag).toLowerCase().includes(q));
    document.getElementById('hlist').innerHTML = list(eras, ([a, b, title]) => {
      const es = shown.filter(e => e.year >= a && e.year < b);
      return es.length ? `<h2>${title}</h2><div class="timeline">${list(es, e => `<div><b>${e.year}</b>${esc(e.text)} <a class="tag ${e.inst ? 'y' : 'g'}" href="${e.href}">${esc(e.tag)}</a></div>`)}</div>` : '';
    });
  };
  document.getElementById('hq').addEventListener('input', draw);
  draw();
  // events per decade since 1850
  const counts = {};
  uniq.filter(e => e.year >= 1850).forEach(e => { const d = Math.floor(e.year / 10) * 10; counts[d] = (counts[d] || 0) + 1; });
  const ds = Object.keys(counts).map(Number).sort((a, b) => a - b), max = Math.max(...Object.values(counts));
  const W = 900, H = 160, bw = (W - 60) / ((2030 - 1850) / 10);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}"><text class="axisl" x="40" y="16">events per decade</text>`;
  ds.forEach(d => { const h = counts[d] / max * (H - 50); const x = 40 + (d - 1850) / 10 * bw; s += `<rect x="${x}" y="${H - 28 - h}" width="${bw - 3}" height="${h}" fill="#3dff8f" opacity=".75"><title>${d}s: ${counts[d]}</title></rect>`; });
  for (let d = 1850; d <= 2020; d += 20) s += `<text class="axisl" x="${40 + (d - 1850) / 10 * bw}" y="${H - 10}">${d}</text>`;
  document.getElementById('hchart').innerHTML = s + '</svg>';
});

route('glossary', async (_a, query) => {
  const terms = (await api('/content/glossary')).sort((a, b) => a.term.localeCompare(b.term));
  app().innerHTML = `<p class="kicker">Learn</p><h1>Glossary</h1><p class="lead">${terms.length} terms.</p>
    <input id="gq" type="search" placeholder="Filter terms" value="${esc(query.q || '')}"><div id="gl"></div>`;
  const draw = () => {
    const q = document.getElementById('gq').value.toLowerCase();
    document.getElementById('gl').innerHTML = `<table>${list(terms.filter(t => !q || (t.term + t.def).toLowerCase().includes(q)), t => `<tr><th style="width:220px">${esc(t.term)}</th><td>${esc(t.def)}${t.see ? ` <a class="tag g" href="#/technique/${esc(t.see)}">${esc(t.see)}</a>` : ''}</td></tr>`)}</table>`;
  };
  document.getElementById('gq').addEventListener('input', draw);
  draw();
});

route('portfolio', async ([id]) => {
  const [p, imgs] = await Promise.all([api('/content/portfolio'), api('/portfolio/images').catch(() => [])]);
  // local-only projects (unpublished archive images) are hidden wherever their images are not available, e.g. the public site
  const projects = (p.projects || []).filter(x => !x.local_only || imgs.some(i => i.project === x.id));
  if (id) return projectPage(p, projects.find(x => x.id === id), imgs.filter(i => i.project === id));
  const imgFor = (pid, techs = []) => imgs.find(i => i.project === pid && techs.includes(i.technique)) || imgs.find(i => i.project === pid);
  const cardImg = (pid, techs) => { const i = pid && imgFor(pid, techs); return i ? `<img class="thumb" src="${esc(i.url)}" alt="" loading="lazy">` : ''; };
  const local = imgs.some(i => !i.public) ? ' Images marked "local preview" appear only in your local copy of the app, not on the public site.' : '';
  const gallery = imgs.length ? `<h2>From the microscope</h2>
    <p class="small mute">Images from the experiments behind the papers. Click an image for the story of that work.${local}</p>
    <div class="gallery">${list(imgs, i => `<figure><a href="${i.project ? '#/portfolio/' + esc(i.project) : esc(i.url)}"><img src="${esc(i.url)}" alt="${esc(i.title)}" loading="lazy"></a>
      <figcaption><b>${esc(i.title)}</b>${i.public ? '' : ' <span class="tag r">local preview</span>'}<br>${esc(i.caption)}<br>
      <a class="tag g" href="#/technique/${esc(i.technique)}">${esc(i.technique)}</a> ${i.project ? `<a class="small" href="#/portfolio/${esc(i.project)}">About this work →</a>` : ''}</figcaption></figure>`)}</div>` : '';
  app().innerHTML = `<p class="kicker">About</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.intro)}</p>
    <div class="grid wide">${list(p.highlights, h => `<a class="card hl" href="${h.project ? '#/portfolio/' + esc(h.project) : 'javascript:void 0'}">${cardImg(h.project, h.techniques)}<b>${esc(h.title)}</b><span>${esc(h.text)}</span>${h.techniques ? `<div style="margin-top:8px">${list(h.techniques, t => `<span class="tag g">${t}</span>`)}</div>` : ''}${h.project ? '<small>Read more →</small>' : ''}</a>`)}</div>
    ${gallery}
    ${projects.length ? `<h2>Projects</h2><div class="grid">${list(projects, x => `<a class="card" href="#/portfolio/${esc(x.id)}">${cardImg(x.id)}<b>${esc(x.title)}</b><small>${esc(x.paper?.cite || '')}</small><span>${esc(x.why_it_matters || '')}</span></a>`)}</div>` : ''}
    ${p.labs ? `<h2>People and labs</h2><p class="small mute">The scientists I have worked with, and where to find their work.</p>
      <div class="grid wide">${list(p.labs, b => `<div class="card"><b>${esc(b.name)}</b><small>${esc(b.pi)} · ${esc(b.where)} · ${esc(b.years)}</small>
      <span>${esc(b.work)}</span><span class="mute">${esc(b.offers)}</span><div style="margin-top:8px">${list(b.links, k => `<a class="tag b" href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.title)} ↗</a>`)}</div></div>`)}</div>` : ''}
    ${p.code ? `<h2>Code and data</h2><div class="grid">${list(p.code, c => `<a class="card" href="${esc(c.url)}" target="_blank" rel="noopener"><b>${esc(c.title)} ↗</b><span>${esc(c.about)}</span><small>${esc(new URL(c.url).hostname)}</small></a>`)}</div>
      ${p.code_papers ? `<ul>${list(p.code_papers, x => `<li>${doiLink(x)}<br><span class="small mute">${esc(x.note)}</span></li>`)}</ul>` : ''}` : ''}
    <h2>Instruments used</h2><div class="scroll"><table><tr><th>Technique</th><th>Instrument</th><th>Work</th></tr>${list(p.instruments, i => `<tr><td><a href="#/technique/${esc(i.technique)}">${esc(i.technique)}</a></td><td>${esc(i.instrument)}</td><td>${esc(i.work)}</td></tr>`)}</table></div>
    <h2>Selected papers</h2><ul>${list(p.papers, x => `<li>${doiLink(x)}<br><span class="small mute">${esc(x.note || '')}</span></li>`)}</ul>
    <h2>Software</h2>${bullets(p.software)}
    <p class="small mute">${esc(p.footnote || '')}</p>`;
});

function projectPage(p, x, imgs) {
  if (!x) { app().innerHTML = '<h1>Project not found</h1><p><a href="#/portfolio">Back to My Microscopy</a></p>'; return; }
  const seen = new Set();
  app().innerHTML = `<p class="kicker"><a href="#/portfolio">My microscopy</a> / ${esc(x.year || '')}</p><h1>${esc(x.title)}</h1>
    <p class="lead">${x.paper ? doiLink(x.paper) : ''}</p>
    ${imgs.length ? `<div class="gallery">${list(imgs, i => `<figure><a href="${esc(i.url)}" target="_blank" rel="noopener"><img src="${esc(i.url)}" alt="${esc(i.title)}"></a><figcaption><b>${esc(i.title)}</b>${i.public ? '' : ' <span class="tag r">local preview</span>'}<br>${esc(i.caption)}${i.licence ? `<br><span class="small mute">${esc(i.licence)}</span>` : ''}</figcaption></figure>`)}</div>` : ''}
    <div class="two" style="margin-top:18px"><div>
      ${x.question ? `<h2>The question</h2><p>${linkify(x.question, seen)}</p>` : ''}
      ${x.approach ? `<h2>The approach</h2>${list([].concat(x.approach), a => `<p>${linkify(a, seen)}</p>`)}` : ''}
    </div><div>
      ${x.findings ? `<h2>What we found</h2><ul>${list(x.findings, f => `<li>${linkify(f, seen)}</li>`)}</ul>` : ''}
      ${x.role ? `<h2>Contribution</h2><p>${esc(x.role)}</p>` : ''}
      ${x.why_it_matters ? `<div class="callout g">${esc(x.why_it_matters)}</div>` : ''}
      ${x.techniques ? `<h3>Techniques</h3><p>${list(x.techniques, t => `<a class="tag g" href="#/technique/${esc(t)}">${esc(t)}</a>`)}</p>` : ''}
      ${x.people ? `<h3>People</h3><p>${esc([].concat(x.people).join(', '))}</p>` : ''}
      ${x.links ? `<h3>Links</h3><ul>${list(x.links, k => `<li><a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.title)} ↗</a></li>`)}</ul>` : ''}
    </div></div>
    <p><a href="#/portfolio">← All projects</a></p>`;
}

route('about', async () => {
  const s = await api('/stats', { fresh: true });
  app().innerHTML = `<p class="kicker">About</p><h1>About this atlas</h1>
    <p class="lead">Microscope Atlas is a local web app (FastAPI and plain JavaScript) for learning and revising microscopy.</p>
    <div class="tiles"><div class="tile"><b>${s.systems}</b><span>systems</span></div><div class="tile"><b>${s.pages}</b><span>technique pages</span></div><div class="tile"><b>${s.simulations}</b><span>simulations</span></div><div class="tile"><b>${s.fluorophores}</b><span>fluorophores</span></div><div class="tile"><b>${s.spectra}</b><span>spectra</span></div></div>
    <h2>How the data were gathered</h2>
    <p>Instrument entries were researched from manufacturer pages, datasheets, facility pages, papers and museum pages, and every entry lists its sources and the date they were read.
    Specifications that could not be confirmed were left out rather than guessed. Some entries rest on search-result summaries of the cited pages; these are being re-checked against the full pages.</p>
    <p>Teaching pages cite landmark papers with DOIs checked against Crossref. Fluorophore properties and spectra come from FPbase (CC BY-SA 4.0).</p>
    <h2>Composition</h2><p>${tags(Object.entries(s.kind).map(([k, v]) => `${k}: ${v}`), 'b')}</p><p>${tags(Object.entries(s.family).map(([k, v]) => `${k}: ${v}`), 'g')}</p>
    <h2>Corrections</h2><p>Spot an error? The data live as JSON under <code>data/</code> in the repository; each record can be fixed and re-validated with <code>scripts/validate_data.py</code>.</p>`;
});
