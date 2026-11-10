// Technique index (grouped by family) and the technique teaching page.
import { route, api, app, esc, list, bullets, doiLink, tags } from './core.js';
import { lightPath, miniPath } from './lightpath.js';
import { stepper, stepperHtml } from './lightpath_steps.js';
import { linkify } from './links.js';
import { gallery } from './images.js';
import { videoCard } from './videos.js';

const FAMILY_BLURB = {
  'Transmitted light': 'Contrast from how the specimen absorbs, scatters, delays or rotates light passing through it.',
  Fluorescence: 'Label the molecule you care about and image only its emission.',
  'Optical sectioning': 'Reject or avoid out-of-focus light to see thin planes in thick samples.',
  'Super-resolution': 'Ways around the diffraction limit: patterned light, switching molecules on and off, or making the sample bigger.',
  'Functional and spectroscopic': 'Measure lifetimes, distances, mobility and spectra, not just where things are.',
  'Label-free': 'Contrast from the sample\'s own chemistry, structure or refractive index.',
  'Electron and probe': 'Electrons, X-rays and sharp tips reach from nanometres down to atoms.',
  'Systems and formats': 'How microscopes are packaged for screening, pathology, living animals and labs on a budget.',
};

route('techniques', async () => {
  const rows = await api('/techniques');
  const fams = [...new Set(rows.map(r => r.family))];
  app().innerHTML = `<p class="kicker">Learn</p><h1>Techniques</h1>
    <p class="lead">${rows.length} imaging methods in ${fams.length} families. Each page explains the physics, walks the light path,
    gives the numbers worth remembering and the artefacts to watch for, and lists the instruments that use it.</p>
    <div class="toc">${list(fams, f => `<a href="#/techniques" data-jump="${esc(f)}">${esc(f)}</a>`)}</div>
    ${list(fams, f => `<section class="family" id="fam-${slug(f)}"><div class="fam-head"><h2>${esc(f)}</h2></div><p class="mute">${esc(FAMILY_BLURB[f] || '')}</p>
      <div class="grid">${list(rows.filter(r => r.family === f), t => `<a class="card" href="#/technique/${t.id}">
        ${miniPath(t.id)}<b>${esc(t.name)}</b><span>${esc(t.tagline)}</span>
        <small>${t.systems ? t.systems + ' systems in the database' : ''}${t.has_page ? '' : ' · page in preparation'}</small></a>`)}</div></section>`)}`;
  app().querySelector('.toc').addEventListener('click', e => {
    const f = e.target.dataset.jump;
    if (f) { e.preventDefault(); document.getElementById('fam-' + slug(f)).scrollIntoView({ behavior: 'smooth' }); }
  });
});

const TABLE_PRESETS = {
  widefield: ['widefield'], tirf: ['tirf-objective', 'tirf-prism', 'lit-axelrod-1981', 'lit-parker-tirf', 'lit-gibbs-2018'], hilo: ['hilo', 'lit-tokunaga-2008'],
  confocal: ['confocal', 'lit-minsky-1961'], 'spinning-disk': ['spinning-disk'], multiphoton: ['two-photon', 'lit-denk-1990', 'lit-parker-2p'],
  'light-sheet': ['light-sheet', 'lit-huisken-2004', 'lit-openspim-2013'], 'oblique-plane': ['opm', 'lit-dunsby-2008'], sted: ['sted', 'lit-hell-1994'],
  sim: ['sim', 'lit-gustafsson-2000'], brightfield: ['kohler'], darkfield: ['darkfield'], polarization: ['pol-attenuator'], 'open-hardware': ['lit-openspim-2013', 'lit-gibbs-2018', 'lit-parker-2p'],
  qpi: ['mach-zehnder'], oct: ['michelson'], smlm: ['tirf-objective', 'hilo'], 'dna-paint': ['tirf-objective'], spt: ['tirf-objective', 'hilo'],
};

const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-');

route('technique', async ([id]) => {
  const t = await api('/techniques/' + encodeURIComponent(id));
  const all = await api('/techniques');
  const name = Object.fromEntries(all.map(x => [x.id, x.name]));
  const res = t.resolution || {};
  const seen = new Set(), L = x => linkify(x, seen, t.id);
  const bl = items => (items && items.length ? `<ul>${list(items, i => `<li>${L(i)}</li>`)}</ul>` : '');
  const sections = [
    ['principle', 'Principle'], ['path', 'Light path'], ['numbers', 'Key numbers'], ['pros', 'Strengths and limits'],
    ['practice', 'In practice'], ['history', 'History'], ['papers', 'Papers'], ['methods', 'Methods'], ['videos', 'Videos'], ['systems', 'Instruments'], ['quiz', 'Test yourself'],
  ];
  app().innerHTML = `
    <p class="kicker"><a href="#/techniques">Techniques</a> / ${esc(t.family)}</p>
    <h1>${esc(t.name)}</h1>
    <p class="lead">${esc(t.tagline || t.short)}</p>
    <div class="toc">${list(sections, ([k, l]) => `<a href="javascript:void 0" data-jump="${k}">${l}</a>`)}</div>
    <div class="tech-head" style="margin-top:18px">
      <div>
        ${!t.has_page ? '<div class="callout">The full teaching page for this technique is being written. The diagram, simulations and instrument list below are already live.</div>' : ''}
        <section id="s-principle">${list(t.principle, p => `<p>${L(p)}</p>`)}</section>
        ${t.equations && t.equations.length ? `<h3>Equations</h3>${list(t.equations, e => `<div><span class="eq">${esc(e.formula)}</span><p class="small"><b>${esc(e.name)}.</b> ${esc(e.meaning)}</p></div>`)}` : ''}
        ${res.xy || res.z ? `<h3>Resolution</h3><div class="kv"><div><b>${esc(res.xy || '—')}</b><span>lateral</span></div><div><b>${esc(res.z || '—')}</b><span>axial</span></div></div><p class="small mute">${esc(res.why || '')}</p>` : ''}
      </div>
      <div><div class="lp-wrap">${lightPath(t.id, { family: t.family })}
        ${(t.light_path || []).length ? stepperHtml() : ''}
        <p class="small mute">Hover over a component for what it does. Moving dashes show the direction light travels.</p></div>
        ${(TABLE_PRESETS[t.id] || []).length ? `<h3>Build it on the optical table</h3><p>${list(TABLE_PRESETS[t.id], p => `<a class="tag r" href="#/table/${p}">${p.replace(/^lit-/, 'paper: ')}</a>`)}</p>` : ''}
        ${t.sims.length ? `<h3>Try it</h3>${list(t.sims, s => `<a class="card" href="#/sim/${s.id}" style="margin:6px 0"><b>${esc(s.title)}</b><span>${esc(s.blurb)}</span></a>`)}` : ''}
      </div>
    </div>
    ${(t.images || []).length ? `<section id="s-images"><h2>Images</h2><p class="small mute">Freely licensed instruments and example micrographs; see the <a href="#/gallery?technique=${esc(t.id)}">gallery</a> for more.</p>${gallery(t.images, 6)}</section>` : ''}
    <section id="s-path">${t.light_path && t.light_path.length ? `<h2>Following the light</h2><ol class="steps">${list(t.light_path, s => `<li>${L(s)}</li>`)}</ol>` : ''}</section>
    <section id="s-numbers">${t.key_numbers && t.key_numbers.length ? `<h2>Numbers worth remembering</h2><div class="kv">${list(t.key_numbers, k => `<div><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`)}</div>` : ''}</section>
    <section id="s-pros">${t.strengths ? `<h2>Strengths and limits</h2><div class="two"><div><h3>Strengths</h3><ul class="pro">${list(t.strengths, s => `<li>${esc(s)}</li>`)}</ul></div><div><h3>Limitations</h3><ul class="con">${list(t.limitations, s => `<li>${esc(s)}</li>`)}</ul></div></div>` : ''}
      ${t.best_for ? `<h3>Best for</h3>${tags(t.best_for, 'b')}` : ''}</section>
    <section id="s-practice">${t.tips || t.pitfalls ? `<h2>In practice</h2>
      ${t.sample_prep ? `<h3>Sample preparation</h3><p>${L(t.sample_prep)}</p>` : ''}
      <div class="two"><div><h3>Bench tips</h3>${bl(t.tips)}</div><div><h3>Artefacts and pitfalls</h3>${bl(t.pitfalls)}</div></div>` : ''}</section>
    <section id="s-history">${t.history && t.history.length ? `<h2>History</h2><div class="timeline">${list([...t.history].sort((a, b) => a.year - b.year), h => `<div><b>${h.year}</b>${esc(h.event)}</div>`)}</div>` : ''}</section>
    <section id="s-papers">${t.papers && t.papers.length ? `<h2>Landmark papers</h2><ul>${list(t.papers, p => `<li>${doiLink(p)}<br><span class="small mute">${esc(p.note || '')}</span></li>`)}</ul>` : ''}</section>
    <section id="s-methods">${(t.methods || []).length ? `<h2>Methods and protocols</h2><p class="small mute">Practical guides, protocols and primers for doing this well. All ${t.methods.length} are in the <a href="#/papers?technique=${esc(t.id)}">papers database</a>.</p>
      <ul>${list(t.methods, p => `<li><a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">${esc(p.title)}</a><br><span class="small">${esc(p.authors.join(', '))} (${p.year || '?'}) <i>${esc(p.journal)}</i></span><br><span class="small mute">${esc(p.note || '')}</span></li>`)}</ul>` : ''}</section>
    <section id="s-videos">${(t.videos || []).length ? `<h2>Video tutorials</h2><div class="grid">${list(t.videos, videoCard)}</div><p class="small"><a href="#/videos?technique=${esc(t.id)}">All video tutorials →</a></p>` : ''}</section>
    <section id="s-systems"><h2>Instruments in the database (${t.systems.length})</h2>
      ${t.systems.length ? `<div class="grid">${list(t.systems.slice(0, 24), s => `<a class="card" href="#/system/${esc(s.id)}"><small>${esc(s.manufacturer)}</small><b>${esc(s.name)}</b><small class="kind-${esc(s.kind)}">${esc(s.kind)}${s.year ? ' · ' + s.year : ''}</small></a>`)}</div>
      ${t.systems.length > 24 ? `<p><a href="#/systems?technique=${esc(t.id)}">All ${t.systems.length} →</a></p>` : ''}` : '<p class="mute">None yet.</p>'}</section>
    <section id="s-quiz">${t.quiz && t.quiz.length ? `<h2>Test yourself</h2><p class="small mute">Think of your answer, then open the card. More in the <a href="#/quiz">quiz</a>.</p><div class="qa">${list(t.quiz, q => `<details><summary>${esc(q.q)}</summary><p>${L(q.a)}</p></details>`)}</div>` : ''}</section>
    ${t.related && t.related.length ? `<h2>Related techniques</h2><p>${list(t.related, r => `<a class="tag g" href="#/technique/${esc(r)}">${esc(name[r] || r)}</a>`)}</p>` : ''}`;
  app().querySelector('.toc').addEventListener('click', e => {
    const k = e.target.dataset.jump;
    const el = k && document.getElementById('s-' + k);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
  });
  stepper(app(), t.light_path);
});
