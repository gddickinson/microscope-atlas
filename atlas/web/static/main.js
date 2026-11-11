// Entry point: background, search box, router. Page modules are loaded on demand: each entry below maps the routes a
// module registers (route(name, fn) in that module) to its file, so a visit downloads only the code that page needs.
import { background, start, route, lazy, app, go, $ } from './core.js';
import { loadLinks } from './links.js';

const PAGES = {
  'papers.js': ['papers', 'community'], 'images.js': ['gallery'], 'videos.js': ['videos'], 'table.js': ['table'],
  'home.js': ['home'], 'systems.js': ['systems', 'system', 'manufacturers'], 'systems_compare.js': ['compare'],
  'components.js': ['components'], 'techniques.js': ['techniques', 'technique'], 'fluor.js': ['fluorophores', 'spectra'],
  'sims.js': ['sims', 'sim'], 'learn.js': ['fundamentals', 'history', 'glossary', 'portfolio', 'about'], 'quiz.js': ['quiz'],
  'tools.js': ['chooser', 'calc'], 'lab.js': ['lab'], 'imagelab.js': ['imagelab'], 'builder.js': ['builder'], 'cells.js': ['cells'],
  'nobel.js': ['nobel'], 'matrix.js': ['matrix'],
};
lazy(Object.fromEntries(Object.entries(PAGES).flatMap(([file, names]) => names.map(n => [n, () => import('./' + file)]))));

route('notfound', () => { app().innerHTML = '<h1>Not found</h1><p><a href="#/">Back to the start</a></p>'; });

background($('#bg'));
$('#search').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#search input').value.trim();
  go('#/systems?q=' + encodeURIComponent(q));
});
loadLinks().finally(start);
