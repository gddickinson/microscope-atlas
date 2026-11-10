// Tools: technique chooser (rule-based scoring with reasons) and the optics calculator.
import { route, app, esc, list, api } from './core.js';
import { rayleigh, abbe, axialWidefield, nyquistPixel, criticalAngle, electronWavelength } from './sim_engine.js';

// res: best practical resolution (nm); depth: useful depth (µm); speed 0-3 (fixed only .. ms); live 0-2; label: fluor|none|either
const P = {
  widefield: { res: 250, depth: 10, speed: 3, live: 2, label: 'fluor', samples: ['fixed', 'live', 'invitro'], goals: ['structure', 'dynamics', 'screening'] },
  tirf: { res: 250, depth: 0.2, speed: 3, live: 2, label: 'fluor', samples: ['live', 'fixed', 'invitro'], goals: ['dynamics', 'single', 'membrane'] },
  confocal: { res: 200, depth: 80, speed: 1, live: 1, label: 'fluor', samples: ['fixed', 'live', 'tissue'], goals: ['structure', '3d', 'interaction'] },
  'spinning-disk': { res: 220, depth: 40, speed: 3, live: 2, label: 'fluor', samples: ['live', 'fixed'], goals: ['dynamics', '3d'] },
  ism: { res: 140, depth: 60, speed: 1, live: 1, label: 'fluor', samples: ['fixed', 'live', 'tissue'], goals: ['structure', '3d'] },
  multiphoton: { res: 350, depth: 800, speed: 2, live: 2, label: 'fluor', samples: ['tissue', 'animal'], goals: ['dynamics', '3d', 'deep'] },
  'light-sheet': { res: 400, depth: 3000, speed: 3, live: 2, label: 'fluor', samples: ['organism', 'cleared', 'tissue'], goals: ['dynamics', '3d', 'deep'] },
  'lattice-light-sheet': { res: 250, depth: 50, speed: 3, live: 2, label: 'fluor', samples: ['live', 'organism'], goals: ['dynamics', '3d'] },
  sim: { res: 110, depth: 15, speed: 2, live: 2, label: 'fluor', samples: ['fixed', 'live'], goals: ['structure', 'dynamics'] },
  sted: { res: 40, depth: 20, speed: 1, live: 1, label: 'fluor', samples: ['fixed', 'live'], goals: ['structure', 'interaction'] },
  smlm: { res: 20, depth: 1, speed: 0, live: 0, label: 'fluor', samples: ['fixed', 'invitro'], goals: ['structure', 'counting', 'single'] },
  'dna-paint': { res: 5, depth: 1, speed: 0, live: 0, label: 'fluor', samples: ['fixed', 'invitro'], goals: ['structure', 'counting', 'multiplex'] },
  minflux: { res: 3, depth: 1, speed: 1, live: 1, label: 'fluor', samples: ['fixed', 'invitro', 'live'], goals: ['structure', 'single', 'dynamics'] },
  expansion: { res: 25, depth: 100, speed: 0, live: 0, label: 'fluor', samples: ['fixed', 'tissue'], goals: ['structure', 'multiplex'] },
  spt: { res: 30, depth: 1, speed: 3, live: 2, label: 'fluor', samples: ['live', 'invitro'], goals: ['dynamics', 'single'] },
  fret: { res: 5, depth: 20, speed: 2, live: 2, label: 'fluor', samples: ['live', 'fixed', 'invitro'], goals: ['interaction'] },
  flim: { res: 250, depth: 100, speed: 1, live: 2, label: 'fluor', samples: ['live', 'tissue', 'fixed'], goals: ['interaction', 'chemistry'] },
  fcs: { res: 250, depth: 20, speed: 3, live: 2, label: 'fluor', samples: ['live', 'invitro'], goals: ['dynamics', 'interaction'] },
  frap: { res: 300, depth: 20, speed: 2, live: 2, label: 'fluor', samples: ['live'], goals: ['dynamics'] },
  'phase-contrast': { res: 300, depth: 10, speed: 3, live: 2, label: 'none', samples: ['live', 'fixed'], goals: ['structure', 'dynamics', 'screening'] },
  dic: { res: 250, depth: 20, speed: 3, live: 2, label: 'none', samples: ['live', 'fixed', 'tissue'], goals: ['structure', 'dynamics'] },
  qpi: { res: 300, depth: 30, speed: 3, live: 2, label: 'none', samples: ['live', 'fixed'], goals: ['structure', 'dynamics', 'screening'] },
  iscat: { res: 250, depth: 0.2, speed: 3, live: 1, label: 'none', samples: ['invitro'], goals: ['single', 'dynamics'] },
  raman: { res: 300, depth: 50, speed: 0, live: 1, label: 'none', samples: ['fixed', 'tissue', 'materials'], goals: ['chemistry'] },
  'cars-srs': { res: 350, depth: 200, speed: 2, live: 2, label: 'none', samples: ['tissue', 'live'], goals: ['chemistry'] },
  shg: { res: 400, depth: 500, speed: 2, live: 2, label: 'none', samples: ['tissue', 'animal'], goals: ['structure', 'deep'] },
  oct: { res: 3000, depth: 2000, speed: 3, live: 2, label: 'none', samples: ['tissue', 'animal'], goals: ['structure', 'deep'] },
  photoacoustic: { res: 50000, depth: 20000, speed: 2, live: 2, label: 'either', samples: ['animal'], goals: ['deep', 'chemistry'] },
  tem: { res: 0.5, depth: 0.1, speed: 0, live: 0, label: 'none', samples: ['fixed', 'materials'], goals: ['structure', 'ultra'] },
  sem: { res: 2, depth: 0.01, speed: 0, live: 0, label: 'none', samples: ['fixed', 'materials'], goals: ['structure', 'surface'] },
  'cryo-em': { res: 0.2, depth: 0.05, speed: 0, live: 0, label: 'none', samples: ['invitro'], goals: ['structure', 'ultra'] },
  'cryo-et': { res: 3, depth: 0.3, speed: 0, live: 0, label: 'none', samples: ['fixed', 'live'], goals: ['structure', 'ultra', '3d'] },
  'volume-em': { res: 5, depth: 500, speed: 0, live: 0, label: 'none', samples: ['tissue', 'fixed'], goals: ['structure', '3d', 'ultra'] },
  afm: { res: 1, depth: 0.01, speed: 1, live: 1, label: 'none', samples: ['invitro', 'materials', 'live'], goals: ['structure', 'surface', 'mechanics'] },
  clem: { res: 2, depth: 1, speed: 0, live: 0, label: 'fluor', samples: ['fixed'], goals: ['structure', 'ultra'] },
  'high-content': { res: 400, depth: 20, speed: 2, live: 1, label: 'either', samples: ['fixed', 'live'], goals: ['screening'] },
  intravital: { res: 400, depth: 800, speed: 2, live: 2, label: 'fluor', samples: ['animal'], goals: ['dynamics', 'deep'] },
  miniscope: { res: 2000, depth: 300, speed: 2, live: 2, label: 'fluor', samples: ['animal'], goals: ['dynamics', 'behaviour'] },
};

const Q = [
  ['sample', 'What is the sample?', [['fixed', 'Fixed cells'], ['live', 'Live cells'], ['tissue', 'Thick tissue / organoid'], ['organism', 'Embryo / small organism'], ['cleared', 'Cleared organ'], ['animal', 'Living animal'], ['invitro', 'Purified molecules'], ['materials', 'Material surface']]],
  ['res', 'Finest detail you need?', [['2000', '> 1 µm (cells, tissue)'], ['300', '~250 nm (organelles)'], ['120', '~100 nm'], ['30', '~20-50 nm (complexes)'], ['5', '< 5 nm (molecular)']]],
  ['speed', 'How fast do things change?', [['0', 'Fixed / static'], ['1', 'Minutes'], ['2', 'Seconds'], ['3', 'Milliseconds']]],
  ['depth', 'How deep must you image?', [['0.2', 'At the coverslip'], ['10', 'Through a cell'], ['100', 'Tens of µm'], ['1000', 'Hundreds of µm or more']]],
  ['label', 'Labels?', [['fluor', 'Fluorescent labels fine'], ['none', 'Must be label-free'], ['either', 'Either']]],
  ['goal', 'Main goal', [['structure', 'Structure / localization'], ['dynamics', 'Dynamics'], ['interaction', 'Molecular interactions'], ['single', 'Single molecules'], ['counting', 'Counting copies'], ['screening', 'Screening many samples'], ['chemistry', 'Chemical composition'], ['ultra', 'Ultrastructure']]],
];

function score(id, a) {
  const p = P[id], why = [], bad = [];
  let s = 0;
  if (p.samples.includes(a.sample) || (a.sample === 'organism' && p.samples.includes('tissue'))) { s += 3; why.push('suits this sample'); } else { s -= 2; bad.push('not usual for this sample'); }
  const res = +a.res;
  if (p.res <= res) { s += 3; why.push(`reaches ~${p.res} nm`); } else if (p.res <= res * 2) { s += 1; bad.push(`resolution ~${p.res} nm is borderline`); } else { s -= 3; bad.push(`resolution ~${p.res} nm too coarse`); }
  if (res >= 2000 && p.res < 50) { s -= 1; bad.push('overkill for this scale'); }
  const sp = +a.speed;
  if (p.speed >= sp) { s += 2; if (sp >= 2) why.push('fast enough'); } else { s -= 2 * (sp - p.speed); bad.push('too slow'); }
  if (sp >= 1 && p.live === 0) { s -= 4; bad.push('needs fixed or frozen samples'); } else if (sp >= 1 && p.live === 2) { s += 1; why.push('gentle on live samples'); }
  const d = +a.depth;
  if (p.depth >= d) { s += 2; if (d >= 100) why.push(`works at depth (~${p.depth} µm)`); } else { s -= 3; bad.push(`limited to ~${p.depth} µm depth`); }
  if (a.label !== 'either' && p.label !== 'either' && p.label !== a.label) { s -= 4; bad.push(a.label === 'none' ? 'needs labels' : 'label-free method'); }
  if (p.goals.includes(a.goal)) { s += 3; why.push(`good for ${a.goal}`); }
  return { id, s, why, bad };
}

route('chooser', async () => {
  const names = Object.fromEntries((await api('/techniques')).map(t => [t.id, t.name]));
  const a = { sample: 'live', res: '300', speed: '2', depth: '10', label: 'fluor', goal: 'dynamics' };
  app().innerHTML = `<p class="kicker">Tools</p><h1>Technique chooser</h1>
    <p class="lead">Describe the experiment; the atlas ranks techniques by a transparent set of rules and explains each score. It is a starting point for a conversation with your imaging core, not a verdict.</p>
    <div class="two"><div>${list(Q, ([k, label, opts]) => `<label>${label}</label><div class="seg" data-q="${k}" style="flex-wrap:wrap">${list(opts, ([v, l]) => `<button data-v="${v}" class="${a[k] === v ? 'on' : ''}">${esc(l)}</button>`)}</div>`)}</div>
    <div id="rank"></div></div>`;
  const draw = () => {
    const r = Object.keys(P).map(id => score(id, a)).sort((x, y) => y.s - x.s);
    const max = r[0].s;
    document.getElementById('rank').innerHTML = `<h3>Best matches</h3>` + list(r.slice(0, 8), (x, i) => `<a class="card" href="#/technique/${x.id}" style="margin:8px 0">
      <b>${i + 1}. ${esc(names[x.id] || x.id)}</b> <span class="tag ${x.s >= max - 2 ? 'g' : 'b'}">score ${x.s}</span>
      <span class="ok small">${esc(x.why.join(' · '))}</span>${x.bad.length ? `<span class="err small">${esc(x.bad.join(' · '))}</span>` : ''}</a>`) +
      `<p class="small mute">Lowest: ${list(r.slice(-4), x => esc(names[x.id] || x.id), ', ')}.</p>`;
  };
  app().addEventListener('click', e => {
    const b = e.target.closest('.seg button');
    if (!b) return;
    const seg = b.parentElement;
    seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    a[seg.dataset.q] = b.dataset.v;
    draw();
  });
  draw();
});

route('calc', async () => {
  const f = { lam: 520, NA: 1.4, n: 1.518, M: 100, pix: 6.5, sensor: 13.3, kV: 300 };
  const field = (k, label, step) => `<div><label for="c-${k}">${label}</label><input id="c-${k}" type="number" step="${step}" value="${f[k]}"></div>`;
  app().innerHTML = `<p class="kicker">Tools</p><h1>Optics calculator</h1>
    <p class="lead">The numbers you reach for when setting up an experiment or checking a result.</p>
    <div class="panel"><div class="row">${field('lam', 'Emission wavelength (nm)', 1)}${field('NA', 'Numerical aperture', 0.01)}${field('n', 'Immersion index', 0.001)}${field('M', 'Total magnification', 1)}${field('pix', 'Camera pixel (µm)', 0.1)}${field('sensor', 'Sensor width (mm)', 0.1)}${field('kV', 'Electron voltage (kV)', 10)}</div></div>
    <div id="cout" class="kv"></div>`;
  const draw = () => {
    for (const k of Object.keys(f)) f[k] = +document.getElementById('c-' + k).value;
    const px = f.pix * 1000 / f.M, ny = nyquistPixel(f.lam, f.NA), tc = criticalAngle(1.518, 1.33);
    const out = [
      ['Rayleigh 0.61λ/NA', `${rayleigh(f.lam, f.NA).toFixed(0)} nm`], ['Abbe λ/2NA', `${abbe(f.lam, f.NA).toFixed(0)} nm`],
      ['Axial (widefield) 2nλ/NA²', `${axialWidefield(f.lam, f.NA, f.n).toFixed(0)} nm`], ['Airy unit 1.22λ/NA (sample)', `${(1.22 * f.lam / f.NA).toFixed(0)} nm`],
      ['Pixel at sample', `${px.toFixed(1)} nm`], ['Nyquist pixel λ/4NA', `${ny.toFixed(0)} nm`],
      ['Sampling', px <= ny * 1.05 ? 'Nyquist OK' : `under-sampled ×${(px / ny).toFixed(1)}`], ['Field of view (width)', `${(f.sensor * 1000 / f.M).toFixed(0)} µm`],
      ['Max half-angle', f.NA < f.n ? `${(Math.asin(f.NA / f.n) * 180 / Math.PI).toFixed(1)}°` : 'NA ≥ n: impossible'], ['Relative brightness NA⁴/M²', `${(1e4 * f.NA ** 4 / f.M ** 2).toFixed(2)}`],
      ['TIRF possible (needs NA > 1.33-1.38)', f.NA > 1.38 ? 'yes' : 'no'], ['Glass/water critical angle', `${tc.toFixed(1)}°`],
      ['Electron λ at kV', `${electronWavelength(f.kV).toFixed(2)} pm`], ['Photon energy', `${(1239.84 / f.lam).toFixed(2)} eV`],
    ];
    document.getElementById('cout').innerHTML = list(out, ([l, v]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`);
  };
  app().querySelectorAll('input').forEach(i => i.addEventListener('input', draw));
  draw();
});
