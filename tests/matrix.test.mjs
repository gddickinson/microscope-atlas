// Technique comparison matrix: length parsing from teaching text, log axis, formatting and sorting.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { firstLength, lateralLength, logPos, fmtLength, byKey } from '../atlas/web/static/matrix_calc.js';

assert.deepEqual(firstLength('~200-250 nm at NA 1.4 (0.61λ/NA)'), { lo: 200, hi: 250 });
assert.deepEqual(firstLength('~1.2-4 Å for well-behaved complexes'), { lo: 0.12, hi: 0.4 });
assert.deepEqual(firstLength('micro-CT ~1-50 µm; nano-CT ~50-500 nm'), { lo: 1000, hi: 50000 });
assert.deepEqual(firstLength('~30-80 nm routinely; <20 nm under ideal'), { lo: 30, hi: 80 });
assert.deepEqual(firstLength('~120-160 nm (about 1.4-1.7× better)'), { lo: 120, hi: 160 });
assert.deepEqual(firstLength('Observation spot ω0 ≈ 0.2-0.3 µm'), { lo: 200, hi: 300 });
assert.deepEqual(firstLength('~100 µm'), { lo: 100000, hi: 100000 });
assert.deepEqual(firstLength('1 to 2 mm'), { lo: 1e6, hi: 2e6 });
assert.equal(firstLength('As for the underlying microscope'), null);
assert.equal(firstLength('5 nmol'), null);   // a unit must end the number, not start a longer word

assert.deepEqual(lateralLength("~0.25 µm/pixel at 40×, ~0.5 µm/pixel at 20×; optical resolution ~0.4-0.6 µm"), { lo: 400, hi: 600 });
assert.equal(lateralLength('Bleach spots typically ~0.5-2 µm diameter; imaging at confocal resolution'), null);
assert.equal(lateralLength('EM resolution for structure; correlation precision ~10-100 nm'), null);
assert.deepEqual(lateralLength('~200-250 nm (diffraction limit), localisation precision 5-30 nm'), { lo: 200, hi: 250 });
assert.deepEqual(lateralLength('Imaging resolution of the underlying microscope (~200-300 nm)'), { lo: 200, hi: 300 });

assert.equal(logPos(0.1), 0); assert.equal(logPos(1e5), 1); assert.equal(logPos(1e5 * 10), 1);
assert.ok(Math.abs(logPos(100) - 0.5) < 1e-12);   // 100 nm is half-way (in decades) between 0.1 nm and 100 µm

assert.equal(fmtLength(0.12), '0.12 nm'); assert.equal(fmtLength(250), '250 nm');
assert.equal(fmtLength(1500), '1.5 µm'); assert.equal(fmtLength(2e6), '2 mm');

const rows = [{ v: 3 }, { v: null }, { v: 1 }, { v: 2 }];
assert.deepEqual([...rows].sort(byKey(r => r.v)).map(r => r.v), [1, 2, 3, null]);
assert.deepEqual([...rows].sort(byKey(r => r.v, -1)).map(r => r.v), [3, 2, 1, null]);

// every technique page's lateral resolution either parses or says it depends on the underlying microscope
const dir = new URL('../data/content/techniques/', import.meta.url);
const pages = readdirSync(dir).flatMap(f => JSON.parse(readFileSync(new URL(f, dir))));
const unparsed = pages.filter(p => !firstLength(p.resolution.xy)).map(p => p.id);
assert.ok(unparsed.length <= 6, `unparsed lateral resolutions: ${unparsed}`);
const conf = pages.find(p => p.id === 'confocal');
assert.deepEqual(firstLength(conf.resolution.xy), { lo: 180, hi: 250 });
console.log(`matrix: ${pages.length - unparsed.length}/${pages.length} lateral resolutions parsed; not parsed: ${unparsed.join(', ')}`);

// curated ratings: ranks, and every entry's reference names a real page statement whose words support the rating
import { LIVE_RANK, COST_RANK, rank } from '../atlas/web/static/matrix_calc.js';
assert.equal(rank(LIVE_RANK, 'yes'), 0); assert.equal(rank(LIVE_RANK, 'no'), 2); assert.equal(rank(LIVE_RANK, ''), null);
assert.equal(rank(COST_RANK, 'high'), 2);
const ratings = JSON.parse(readFileSync(new URL('../data/content/technique_matrix.json', import.meta.url)));
const byId = Object.fromEntries(pages.map(p => [p.id, p]));
const stmt = (p, ref) => {
  const [r, sent] = ref.split('@'); const [field, i] = r.split('.');
  let v = i === undefined ? p[field] : p[field][+i];
  if (sent !== undefined) v = v.split(/(?<=[.!?])\s+(?=[A-Z(])/)[+sent];
  return v;
};
const WORDS = { live: /\blive\b|living|in vivo|freely moving|fixed|fixation|frozen|vacuum|phototox|zebrafish|small-animal/i,
                cost: /cheap|inexpensive|expensive|\bcost/i };
for (const r of ratings) {
  assert.ok(byId[r.id], `rating for unknown technique ${r.id}`);
  for (const k of ['live', 'cost']) {
    if (!r[k]) continue;
    assert.ok(k === 'live' ? r[k] in LIVE_RANK : r[k] in COST_RANK, `${r.id} ${k}=${r[k]}`);
    const s = stmt(byId[r.id], r[k + '_ref']);
    assert.ok(typeof s === 'string' && s.length > 10, `${r.id} ${k}_ref ${r[k + '_ref']} does not resolve`);
    assert.match(s, WORDS[k], `${r.id}: "${s}" does not speak to ${k}`);
  }
}
assert.equal(ratings.length, pages.length);
console.log(`ratings: ${ratings.filter(r => r.live).length} live, ${ratings.filter(r => r.cost).length} cost, each tied to a page statement`);
