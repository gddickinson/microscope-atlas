// Cells page: every diagram renders cleanly, its parts carry titles, and clickable parts use content ids.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIAGRAMS } from '../atlas/web/static/cell_diagrams.js';
import { DIAGRAMS2 } from '../atlas/web/static/cell_diagrams2.js';

const C = JSON.parse(readFileSync(new URL('../data/content/cells.json', import.meta.url)));
const S = new Set(C.structures.map(s => s.id)), T = new Set(C.cell_types.map(t => t.id));
// parts specific to one diagram that have their own tooltip but no structure entry
const LOCAL = new Set(['acrosome', 'axon', 'basement-membrane', 'bud-scar', 'cytoskeleton', 'dendrite', 'granule', 'haemoglobin', 'junction', 'microvilli', 'myelin', 'pili', 'plasmodesmata', 'sarcomere', 'synapse']);
const all = { ...DIAGRAMS, ...DIAGRAMS2 };
let linked = 0;
for (const [k, d] of Object.entries(all)) {
  const svg = d.svg();
  assert.ok(!/NaN|undefined/.test(svg), `${k} renders NaN/undefined`);
  assert.ok(d.title && d.note, k);
  const ids = [...svg.matchAll(/data-s="([a-z-]+)"><title>[^<]+<\/title>/g)].map(m => m[1]);
  assert.ok(ids.length >= 3, `${k}: ${ids.length} parts`);
  for (const id of ids) { assert.ok(S.has(id) || LOCAL.has(id), `${k}: unknown part id ${id}`); if (S.has(id)) linked++; }
  if (!['animal', 'plant'].includes(k)) assert.ok(T.has(k), `diagram ${k} is not a cell type id`);
}
assert.equal(C.cell_types.length, 34);
for (const x of [...C.structures, ...C.cell_types]) assert.ok(x.sources.length && x.sources.every(s => s.url.startsWith('https://')), x.id);
for (const n of C.numbers) assert.ok(n.url.startsWith('https://') && n.value, n.label);
console.log(`cells: ${Object.keys(all).length} diagrams, ${linked} parts linked to ${S.size} structures, ${T.size} cell types`);
