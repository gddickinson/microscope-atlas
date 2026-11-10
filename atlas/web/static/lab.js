// Lab Tools hub and router. Tool modules register through their TOOLS arrays.
import { route, app, esc, list, onLeave } from './core.js';

// Tool groups load independently, so one unfinished or broken module never hides the others.
const MODULES = ['./lab_setup.js', './lab_label.js', './lab_bench.js', './lab_analysis.js'];
const loaded = Promise.all(MODULES.map(m => import(m).then(x => x.TOOLS || []).catch(e => { console.warn('lab tools not loaded:', m, e.message); return []; })))
  .then(groups => { ALL.unshift(...groups.flat()); return ALL; });

export const ALL = [
  { id: 'table', group: 'Microscope setup', title: 'Virtual optical table', blurb: 'Prototype microscope and laser set-ups on a breadboard with live ray tracing: 43 part types, 33 presets including set-ups from landmark papers.', href: '#/table' },
  { id: 'imagelab', group: 'Analysis', title: 'Image Lab', blurb: 'Load your own image (TIFF, PNG, JPEG) or a test specimen and image it through a simulated microscope: PSF blur, pixel size, photon and read noise, Richardson-Lucy deconvolution and power spectra.', href: '#/imagelab' },
  { id: 'builder', group: 'Microscope setup', title: 'Microscope builder', blurb: 'Combine an objective and camera from the database with a fluorophore, laser line and filter: resolution, Nyquist sampling, field of view, photons per molecule, SNR and localization precision.', href: '#/builder' },
  { id: 'chooser', group: 'Planning', title: 'Technique chooser', blurb: 'Rank imaging techniques for your sample, scale, speed and depth, with reasons.', href: '#/chooser' },
  { id: 'calc', group: 'Microscope setup', title: 'Optics calculator', blurb: 'Resolution, Airy unit, Nyquist pixel, field of view, brightness and more from λ, NA and magnification.', href: '#/calc' },
  { id: 'spectra', group: 'Labelling and probes', title: 'Spectra viewer', blurb: 'Overlay dye spectra, laser lines and emission bands; see crosstalk as numbers.', href: '#/spectra' },
];
const GROUPS = ['Microscope setup', 'Planning', 'Labelling and probes', 'Bench calculators', 'Analysis'];
export const isStatic = () => Boolean(window.ATLAS_STATIC);

route('lab', async ([id]) => {
  await loaded;
  if (!id) {
    const groups = [...GROUPS, ...new Set(ALL.map(t => t.group).filter(g => !GROUPS.includes(g)))];
    app().innerHTML = `<p class="kicker">Lab tools</p><h1>Lab tools</h1>
      <p class="lead">${ALL.length} calculators, planners and references for people at the microscope and the bench: setting up the scope, choosing dyes and antibodies, making solutions and checking numbers.</p>
      <input id="lq" type="search" aria-label="Find a tool" placeholder="Find a tool (e.g. antibody, Nyquist, PBS, laser power)">
      <div id="lhub"></div>`;
    const draw = () => {
      const q = document.getElementById('lq').value.toLowerCase();
      document.getElementById('lhub').innerHTML = list(groups, g => {
        const ts = ALL.filter(t => t.group === g && (!q || (t.title + t.blurb).toLowerCase().includes(q)));
        return ts.length ? `<h2>${esc(g)}</h2><div class="grid">${list(ts, t => `<a class="card" href="${t.href || '#/lab/' + t.id}"><b>${esc(t.title)}</b><span>${esc(t.blurb)}</span>${t.python ? '<small>full app (Python)</small>' : ''}</a>`)}</div>` : '';
      });
    };
    document.getElementById('lq').oninput = draw;
    draw();
    return;
  }
  const t = ALL.find(x => x.id === id);
  if (!t || !t.mount) { app().innerHTML = '<h1>Unknown tool</h1><p><a href="#/lab">All lab tools</a></p>'; return; }
  app().innerHTML = `<p class="kicker"><a href="#/lab">Lab tools</a> / ${esc(t.group)}</p><h1>${esc(t.title)}</h1><p class="lead">${esc(t.blurb)}</p><div id="toolhost"></div>`;
  const host = document.getElementById('toolhost');
  if (t.python && isStatic()) {
    host.innerHTML = '<div class="callout">This tool runs Python on the server, so it is only available in the full app. See the README for how to run it locally.</div>';
    return;
  }
  const stop = t.mount(host);
  if (typeof stop === 'function') onLeave(stop);
});
