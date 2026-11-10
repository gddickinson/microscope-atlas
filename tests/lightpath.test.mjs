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
