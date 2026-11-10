// Entry point: background, page modules (each registers its routes), search box, router.
import { background, start, route, app, go, $ } from './core.js';
import { loadLinks } from './links.js';
import './papers.js';
import './images.js';
import './videos.js';
import './table.js';
import './home.js';
import './systems.js';
import './systems_compare.js';
import './components.js';
import './techniques.js';
import './fluor.js';
import './sims.js';
import './learn.js';
import './quiz.js';
import './tools.js';
import './lab.js';
import './imagelab.js';
import './builder.js';
import './cells.js';
import './nobel.js';

route('notfound', () => { app().innerHTML = '<h1>Not found</h1><p><a href="#/">Back to the start</a></p>'; });

background($('#bg'));
$('#search').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#search input').value.trim();
  go('#/systems?q=' + encodeURIComponent(q));
});
loadLinks().finally(start);
