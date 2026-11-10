// Home page: hero, live counts, entry points and a family overview.
import { route, api, app, esc, list } from './core.js';
import { miniPath } from './lightpath.js';

const DOORS = [
  ['#/techniques', 'Techniques', 'Fifty-one imaging methods, from brightfield to MINFLUX and cryo-ET: principle, light path, resolution, pitfalls, landmark papers.', 'g'],
  ['#/sims', 'Simulations', 'Interactive models: PSF and NA, TIRF depth, confocal pinhole, STED, SMLM blinking, SIM in Fourier space, Nyquist, camera noise, FRET, FRAP, diffusion.', 'r'],
  ['#/systems', 'Microscope Systems', 'A sourced database of commercial, research, open-source and historical instruments, with filters and side-by-side comparison.', 'b'],
  ['#/fluorophores', 'Fluorophores and Spectra', 'Every fluorescent protein and dye in FPbase, with a spectra viewer for laser lines and filters.', 'y'],
  ['#/lab', 'Lab Tools', 'Calculators and planners for the microscope and the bench: Nyquist and TIRF setup, dye panels, antibodies, dilutions, buffers, FRAP and MSD fitting.', 'g'],
  ['#/table', 'Virtual Optical Table', 'Build microscopes from lasers, mirrors, dichroics, lenses and objectives on a virtual breadboard with live ray tracing, or load set-ups from landmark papers.', 'r'],
  ['#/papers', 'Papers', 'A searchable database of landmark papers, reviews, protocols and software, linked to the techniques.', 'b'],
  ['#/community', 'Community', 'Where microscopists learn and ask: societies, forums, software, data archives and open hardware.', 'y'],
  ['#/quiz', 'Quiz', 'Test yourself: questions generated from diagrams, equations and key numbers, plus flashcards with worked answers.', 'r'],
];

route('home', async () => {
  const s = await api('/stats', { fresh: true });
  app().innerHTML = `
  <section class="hero">
    <p class="kicker">Light · Electrons · Probes</p>
    <h1 class="glow">Microscope Atlas</h1>
    <p class="lead">How every major kind of microscope works, which instruments exist, and what each can and cannot show you.
    Built as a teaching tool, a refresher and a working reference for imaging scientists.</p>
    <a class="btn" href="#/techniques">Explore techniques</a><a class="btn alt" href="#/sims">Play with the physics</a>
  </section>
  <div class="tiles">
    <div class="tile"><b>${s.systems}</b><span>microscope systems</span></div>
    <div class="tile"><b>${s.manufacturers}</b><span>makers and labs</span></div>
    <div class="tile"><b>${s.techniques}</b><span>techniques</span></div>
    <div class="tile"><b>${s.simulations}</b><span>simulations</span></div>
    <div class="tile"><b>${s.fluorophores}</b><span>fluorophores</span></div>
    <div class="tile"><b>${s.papers}</b><span>papers</span></div>
  </div>
  <div class="grid wide">${list(DOORS, ([href, t, d, c]) => `<a class="card door ${c}" href="${href}"><b>${t}</b><span>${d}</span></a>`)}</div>
  <h2>Resolution ladder</h2>
  <p class="mute">Where each family of techniques sits, from the naked eye to atoms. Click a band to open the technique.</p>
  <div id="ladder"></div>
  <h2>Six light paths at a glance</h2>
  <div class="grid">${list(['widefield', 'confocal', 'tirf', 'light-sheet', 'sted', 'smlm'], id => `<a class="card" href="#/technique/${id}">${miniPath(id)}<b>${esc(id === 'smlm' ? 'PALM / STORM' : id.replace('-', ' '))}</b></a>`)}</div>`;
  ladder(document.getElementById('ladder'));
});

// Log-scale chart of resolution ranges (metres) for each technique family.
const BANDS = [
  ['Naked eye', 1e-4, 1e-1, null], ['Stereo / brightfield', 3e-7, 1e-3, 'brightfield'],
  ['Widefield / confocal', 1.8e-7, 1e-3, 'confocal'], ['Light-sheet', 2.5e-7, 1e-2, 'light-sheet'],
  ['SIM', 1e-7, 1e-4, 'sim'], ['STED', 3e-8, 1e-4, 'sted'], ['PALM / STORM / PAINT', 5e-9, 5e-5, 'smlm'],
  ['MINFLUX', 1e-9, 1e-6, 'minflux'], ['Expansion', 2.5e-8, 1e-4, 'expansion'], ['SEM', 1e-9, 1e-3, 'sem'],
  ['Cryo-ET', 3e-9, 1e-6, 'cryo-et'], ['AFM', 5e-10, 1e-4, 'afm'], ['Cryo-EM (SPA)', 1.2e-10, 1e-7, 'cryo-em'],
];
const OBJECTS = [['atom', 1e-10], ['protein', 5e-9], ['ribosome', 2.5e-8], ['virus', 1e-7], ['mitochondrion', 1e-6], ['cell', 2e-5], ['hair width', 8e-5], ['zebrafish larva', 3e-3]];

function ladder(host) {
  const W = 1000, rowH = 24, top = 30, H = top + BANDS.length * rowH + 40, L = 190, R = 20;
  const lo = -10.3, hi = -0.8;
  const x = m => L + (Math.log10(m) - lo) / (hi - lo) * (W - L - R);
  const cols = ['#4f9dff', '#3dff8f', '#ff3fa4', '#b77bff', '#ffd23f'];
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Resolution ranges of microscopy techniques">`;
  for (let e = -10; e <= -1; e++) {
    svg += `<line x1="${x(10 ** e)}" x2="${x(10 ** e)}" y1="${top - 8}" y2="${H - 34}" stroke="#1f2e4d"/>`;
    const lab = e >= -3 ? `${10 ** (e + 3)} mm` : e >= -6 ? `${10 ** (e + 6)} µm` : e >= -9 ? `${10 ** (e + 9)} nm` : `${10 ** (e + 10)} Å`;
    svg += `<text class="axisl" x="${x(10 ** e)}" y="${H - 18}" text-anchor="middle">${lab}</text>`;
  }
  BANDS.forEach(([name, a, b, id], i) => {
    const y = top + i * rowH, c = cols[i % cols.length];
    const bar = `<rect x="${x(a)}" y="${y}" width="${x(b) - x(a)}" height="${rowH - 8}" rx="8" fill="${c}" opacity=".75"><title>${name}: best ~${fmtLen(a)}</title></rect>
      <text class="axisl" x="${L - 10}" y="${y + 12}" text-anchor="end" fill="#e8f1ff">${name}</text>`;
    svg += id ? `<a href="#/technique/${id}">${bar}</a>` : bar;
  });
  OBJECTS.forEach(([n, m]) => {
    svg += `<line x1="${x(m)}" x2="${x(m)}" y1="${top - 14}" y2="${top - 4}" stroke="#ffd23f"/><text class="axisl" x="${x(m)}" y="${top - 18}" text-anchor="middle" fill="#ffd23f">${n}</text>`;
  });
  host.innerHTML = svg + '</svg>';
}

export function fmtLen(m) {
  if (m >= 1e-3) return +(m * 1e3).toPrecision(3) + ' mm';
  if (m >= 1e-6) return +(m * 1e6).toPrecision(3) + ' µm';
  if (m >= 1e-9) return +(m * 1e9).toPrecision(3) + ' nm';
  return +(m * 1e10).toPrecision(3) + ' Å';
}
