// Every technique in the index has its own light-path diagram, and every diagram renders cleanly.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lightPath, hasDiagram } from '../atlas/web/static/lightpath.js';

const idx = JSON.parse(readFileSync(new URL('../data/technique_index.json', import.meta.url)));
const ids = (idx.techniques || idx).map(t => t.id);
for (const id of ids) {
  assert.ok(hasDiagram(id), `no diagram for ${id}`);
  const svg = lightPath(id);
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), id);
  assert.ok(!/NaN|undefined/.test(svg), `${id} renders NaN/undefined`);
  assert.ok(!svg.includes('closest family diagram'), id);
}
console.log(`lightpath: ${ids.length} diagrams render`);

// Step-through: technique `light_path` steps are linked to diagram parts.
import { readdirSync } from 'node:fs';
import { partsOf, matchSteps } from '../atlas/web/static/lightpath_steps.js';
const conf = partsOf(lightPath('confocal'));
const named = steps => matchSteps(steps, conf)[0].map(i => conf[i].cls);
assert.deepEqual(named(['Point detectors: PMT or HyD'], ['lp-det']), ['lp-det']);
assert.ok(named(['Emission passes the dichroic and the pinhole']).includes('lp-pin'));
assert.ok(named(['Objective focuses a spot; the pinhole is conjugate']).every(c => c === 'lp-obj'), 'only the main clause counts');
const dir = new URL('../data/content/techniques/', import.meta.url);
let tot = 0, hit = 0;
for (const f of readdirSync(dir)) for (const t of JSON.parse(readFileSync(new URL(f, dir)))) {
  const steps = t.light_path || [], parts = partsOf(lightPath(t.id)), m = matchSteps(steps, parts);
  tot += steps.length; hit += m.filter(x => x.length).length;
  m.forEach(x => x.forEach(i => assert.ok(i >= 0 && i < parts.length)));
}
assert.ok(hit / tot > 0.75, `step coverage ${hit}/${tot}`);
console.log(`lightpath steps: ${hit} of ${tot} steps linked to diagram parts`);
