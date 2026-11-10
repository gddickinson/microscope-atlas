// Simulation index and page router. Each sim module exports an object id -> mount(host) returning an optional cleanup.
import { route, api, app, esc, list, onLeave } from './core.js';
import { OPTICS } from './sim_optics.js';
import { SECTION } from './sim_section.js';
import { SUPER } from './sim_super.js';
import { DYNAMIC } from './sim_dynamic.js';
import { IMAGING } from './sim_imaging.js';
import { TOMO } from './sim_tomo.js';
import { OPTICS2 } from './sim_optics2.js';
import { FUNCTION } from './sim_function.js';

const ALL = { ...OPTICS, ...SECTION, ...SUPER, ...DYNAMIC, ...IMAGING, ...TOMO, ...OPTICS2, ...FUNCTION };
const GROUP_COLOR = { Optics: 'g', Sectioning: 'b', 'Super-resolution': 'r', Fluorescence: 'y', Detection: 'b', Dynamics: 'g', Electron: 'y', 'Image processing': 'r' };

route('sims', async () => {
  const sims = await api('/content/simulations');
  const groups = [...new Set(sims.map(s => s.group))];
  app().innerHTML = `<p class="kicker">Learn</p><h1>Simulations</h1>
    <p class="lead">${sims.length} interactive models of the physics behind microscopy. Each runs the real equations in your browser;
    the formulas are on the technique pages.</p>
    ${list(groups, g => `<h2>${esc(g)}</h2><div class="grid">${list(sims.filter(s => s.group === g), s => `<a class="card door ${GROUP_COLOR[g] || 'g'}" href="#/sim/${s.id}"><b>${esc(s.title)}</b><span>${esc(s.blurb)}</span></a>`)}</div>`)}`;
});

route('sim', async ([id]) => {
  const sims = await api('/content/simulations');
  const meta = sims.find(s => s.id === id);
  const i = sims.indexOf(meta);
  if (!meta || !ALL[id]) { app().innerHTML = '<h1>Unknown simulation</h1><p><a href="#/sims">All simulations</a></p>'; return; }
  const prev = sims[(i - 1 + sims.length) % sims.length], next = sims[(i + 1) % sims.length];
  app().innerHTML = `<p class="kicker"><a href="#/sims">Simulations</a> / ${esc(meta.group)}</p><h1>${esc(meta.title)}</h1>
    <div id="simhost"></div>
    <p class="small" style="margin-top:24px">Related techniques: ${list(meta.techniques, t => `<a class="tag g" href="#/technique/${t}">${t}</a>`)}</p>
    <p><a href="#/sim/${prev.id}">← ${esc(prev.title)}</a> · <a href="#/sim/${next.id}">${esc(next.title)} →</a></p>`;
  const stop = ALL[id](document.getElementById('simhost'));
  if (typeof stop === 'function') onLeave(stop);
});
