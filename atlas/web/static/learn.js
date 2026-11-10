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

const GROUPS = ['Calcium signals', 'Super-resolution', '3D views', 'Cells'];
// Movies (.mp4) play as looping, muted videos with a poster frame (<name>_poster.jpg beside them); other files are images.
const isVid = i => /\.mp4$/i.test(i.url);
const posterOf = i => (i.poster ? i.url.replace(/[^/]+$/, i.poster) : i.url.replace(/\.mp4$/i, '_poster.jpg'));
// Start muted looping videos that are on screen (autoplay is not reliable for markup set via innerHTML).
function playVisible(root) {
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; v.muted = true; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.2 });
  root.querySelectorAll('video').forEach(v => io.observe(v));
}
const still = i => (isVid(i) ? posterOf(i) : i.url);
const media = (i, lazy = true) => (isVid(i)
  ? `<video src="${esc(i.url)}" poster="${esc(still(i))}" autoplay loop muted playsinline preload="metadata" aria-label="${esc(i.title)}"></video>`
  : `<img src="${esc(i.url)}" alt="${esc(i.title)}"${lazy ? ' loading="lazy"' : ''}>`);
const fold = (title, body) => (body ? `<details class="fold"><summary>${title}</summary>${body}</details>` : '');

// Calcium signalling section: background (sourced, DOI-checked), how the group's projects fit, and the lab's calcium movies.
function calciumSection(c, raw, projects, extra = []) {
  if (!c) return '';
  const cite = refs => (refs || []).map(r => c.papers[r] ? `<a href="${esc(c.papers[r].url)}" target="_blank" rel="noopener" title="${esc(c.papers[r].authors + ' (' + c.papers[r].year + ') ' + c.papers[r].title)}">[${r + 1}]</a>` : '').join('');
  const [first, ...rest] = c.paragraphs;
  const names = Object.fromEntries(projects.map(x => [x.id, x.title]));
  const fig = i => `<figure><a href="${i.project ? '#/portfolio/' + esc(i.project) : esc(i.source_url || i.url)}" title="${esc(i.caption)}">${media(i)}</a><figcaption><b>${esc(i.title)}</b>${i.public === false ? ' <span class="tag r">local preview</span>' : ''}<br><span class="small">${esc(i.caption)}</span>${i.author ? `<br>${esc(i.author)} · ${esc(i.licence)}` : ''}</figcaption></figure>`;
  const lab = raw.filter(i => i.group === 'Calcium signals');
  return `<h2 id="calcium">${esc(c.title)}</h2><p class="lead">${esc(first.text)} ${cite(first.refs)}</p>
    ${fold('The calcium toolkit, elementary events and how we see them', list(rest, q => `<h3>${esc(q.heading)}</h3><p>${esc(q.text)} ${cite(q.refs)}</p>`) +
      `<h3>Terms</h3><dl class="small">${list(c.glossary, g => `<dt><b>${esc(g.term)}</b></dt><dd>${esc(g.def)}</dd>`)}</dl>` +
      `<h3>References</h3><ol class="small">${list(c.papers, x => `<li>${esc(x.authors)} (${x.year}) <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>. <i>${esc(x.journal)}</i></li>`)}</ol>`)}
    <h3>${esc(c.ours.heading)}</h3><p>${esc(c.ours.text)} ${cite(c.ours.refs)}</p>
    <p>${list(c.ours.projects.filter(i => names[i]), i => `<a class="tag g" href="#/portfolio/${esc(i)}">${esc(names[i])}</a>`)}</p>
    ${lab.length ? `<h3>Calcium events from the lab</h3><div class="gallery compact">${list(lab, fig)}</div>` : ''}
    ${extra.length ? `<h3>Calcium signalling across biology</h3><p class="small mute">Freely licensed images from other labs, via Wikimedia Commons.</p><div class="gallery compact">${list(extra, fig)}</div>` : ''}`;
}

route('portfolio', async ([id]) => {
  const [p, imgs] = await Promise.all([api('/content/portfolio'), api('/portfolio/images').catch(() => [])]);
  // local-only projects (unpublished archive images) are hidden wherever their images are not available, e.g. the public site
  const projects = (p.projects || []).filter(x => !x.local_only || imgs.some(i => i.project === x.id));
  if (id) return projectPage(p, projects.find(x => x.id === id), imgs.filter(i => i.project === id));
  // This page shows raw microscope images only; plots, traces, analysis maps and paper figures stay on the project pages.
  const raw = imgs.filter(i => i.kind === 'image');
  const thumb = (pid, techs = []) => { const i = raw.find(r => r.project === pid && techs.includes(r.technique)) || raw.find(r => r.project === pid); return i ? `<img class="thumb" src="${esc(still(i))}" alt="" loading="lazy">` : ''; };
  const local = raw.some(i => !i.public) ? ' Images marked "local preview" appear only in your local copy of the app, not on the public site.' : '';
  const groups = [...GROUPS, ...new Set(raw.map(i => i.group).filter(g => g && !GROUPS.includes(g)))].filter(g => g !== 'Calcium signals').map(g => [g, raw.filter(i => (i.group || 'Other') === g)]).filter(([, a]) => a.length);
  const calImgs = (await api('/images').catch(() => [])).filter(i => i.topic === 'calcium');
  const gallery = raw.length ? `<h2>From the microscope</h2>
    <p class="small mute">Raw images from the experiments behind the papers, grouped by subject. Click one for the story of that work, with the figures and analysis.${local}</p>
    ${list(groups, ([g, a]) => `<h3>${esc(g)} <span class="mute small">(${a.length})</span></h3><div class="gallery compact">${list(a, i => `<figure><a href="#/portfolio/${esc(i.project)}" title="${esc(i.caption)}">${media(i)}</a>
      <figcaption><b>${esc(i.title)}</b>${i.public ? '' : ' <span class="tag r">local preview</span>'}<br><a class="tag g" href="#/technique/${esc(i.technique)}">${esc(i.technique)}</a></figcaption></figure>`)}</div>`)}` : '';
  const labs = p.labs ? `<p class="small mute">The scientists I have worked with, and where to find their work.</p><div class="grid wide">${list(p.labs, b => `<div class="card"><b>${esc(b.name)}</b><small>${esc(b.pi)} · ${esc(b.where)} · ${esc(b.years)}</small>
      <span>${esc(b.work)}</span><span class="mute">${esc(b.offers)}</span><div style="margin-top:8px">${list(b.links, k => `<a class="tag b" href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.title)} ↗</a>`)}</div></div>`)}</div>` : '';
  const code = p.code ? `<div class="grid">${list(p.code, c => `<a class="card" href="${esc(c.url)}" target="_blank" rel="noopener"><b>${esc(c.title)} ↗</b><span>${esc(c.about)}</span><small>${esc(new URL(c.url).hostname)}</small></a>`)}</div>
      ${p.code_papers ? `<ul>${list(p.code_papers, x => `<li>${doiLink(x)}<br><span class="small mute">${esc(x.note)}</span></li>`)}</ul>` : ''}` : '';
  app().innerHTML = `<p class="kicker">About</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.intro)}</p>
    ${gallery}
    ${calciumSection(p.calcium, raw, projects, calImgs)}
    <h2>Research themes</h2>
    <div class="grid wide">${list(p.highlights, h => `<a class="card hl" href="${h.project ? '#/portfolio/' + esc(h.project) : 'javascript:void 0'}">${thumb(h.project, h.techniques)}<b>${esc(h.title)}</b><span>${esc(h.text)}</span>${h.techniques ? `<div style="margin-top:8px">${list(h.techniques, t => `<span class="tag g">${t}</span>`)}</div>` : ''}${h.project ? '<small>Read more →</small>' : ''}</a>`)}</div>
    ${projects.length ? `<h2>All projects (${projects.length})</h2><div class="grid">${list(projects, x => `<a class="card" href="#/portfolio/${esc(x.id)}"><b>${esc(x.title)}</b><small>${esc([x.year, x.paper?.journal].filter(Boolean).join(' · '))}</small></a>`)}</div>` : ''}
    <h2>More about the work</h2>
    ${fold('People and labs', labs)}
    ${fold('Code and data', code)}
    ${fold('Instruments used', `<div class="scroll"><table><tr><th>Technique</th><th>Instrument</th><th>Work</th></tr>${list(p.instruments, i => `<tr><td><a href="#/technique/${esc(i.technique)}">${esc(i.technique)}</a></td><td>${esc(i.instrument)}</td><td>${esc(i.work)}</td></tr>`)}</table></div>`)}
    ${fold('Selected papers', `<ul>${list(p.papers, x => `<li>${doiLink(x)}<br><span class="small mute">${esc(x.note || '')}</span></li>`)}</ul>`)}
    ${fold('Software', bullets(p.software))}
    <p class="small mute">${esc(p.footnote || '')}</p>`;
  playVisible(app());
});

function projectPage(p, x, imgs) {
  if (!x) { app().innerHTML = '<h1>Project not found</h1><p><a href="#/portfolio">Back to My Microscopy</a></p>'; return; }
  const seen = new Set();
  app().innerHTML = `<p class="kicker"><a href="#/portfolio">My microscopy</a> / ${esc(x.year || '')}</p><h1>${esc(x.title)}</h1>
    <p class="lead">${x.paper ? doiLink(x.paper) : ''}</p>
    ${list([['Images', imgs.filter(i => i.kind === 'image')], ['Figures and analysis', imgs.filter(i => i.kind !== 'image')]].filter(([, a]) => a.length), ([h, a], k, all) => `${all.length > 1 ? `<h2>${h}</h2>` : ''}<div class="gallery">${list(a, i => `<figure><a href="${esc(i.url)}" target="_blank" rel="noopener">${media(i, false)}</a><figcaption><b>${esc(i.title)}</b>${i.public ? '' : ' <span class="tag r">local preview</span>'}<br>${esc(i.caption)}${i.licence ? `<br><span class="small mute">${esc(i.licence)}</span>` : ''}</figcaption></figure>`)}</div>`)}
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
  playVisible(app());
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
