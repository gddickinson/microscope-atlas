// Node tests for the Virtual Optical Table ray tracer: run with `node tests/table_engine.test.mjs`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { trace, reachedDetectors } from '../atlas/web/static/table_engine.js';
import { PARTS, CATS } from '../atlas/web/static/table_parts.js';
import { PRESETS } from '../atlas/web/static/table_presets.js';
import { analyze } from '../atlas/web/static/table_analysis.js';
import { encodeLayout, decodeLayout, cleanLayout } from '../atlas/web/static/table_store.js';
import { criticalAngle } from '../atlas/web/static/sim_engine.js';

const root = new URL('../', import.meta.url);
const json = p => JSON.parse(fs.readFileSync(new URL(p, root)));
const spectra = json('data/spectra.json');
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const deg = s => Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180 / Math.PI;
const comps = list => ({ components: list.map((c, i) => ({ id: c.id || 'c' + i, rot: 0, ...c })) });
const segsFrom = (r, x, y, tol = 1e-6) => r.segments.filter(s => Math.abs(s.x1 - x) < tol && Math.abs(s.y1 - y) < tol);

// 1. Mirror: angle of incidence equals angle of reflection about the mirror normal.
{
  const r = trace(comps([{ type: 'laser', x: 0, y: 0, params: { div: 0, rays: 1 } }, { type: 'mirror', x: 100, y: 0, rot: 160 }, { id: 'D', type: 'powermeter', x: 100 + 100 * Math.cos(140 * Math.PI / 180), y: 100 * Math.sin(140 * Math.PI / 180), rot: 140 }]));
  const out = segsFrom(r, 100, 0, 1e-3)[0];
  close(deg(out), 140, 1e-6, 'reflected beam at 20° from the normal (160°) on the other side: 160 − 20');
  close(r.readouts.D.power, 49.5, 1e-6, 'mirror reflectance 99%');
}

// 2. Thin lens: a collimated beam crosses the axis at the focal length (within 1%).
{
  const r = trace(comps([{ type: 'laser', x: 0, y: 0, params: { div: 0, diam: 10, rays: 7 } }, { type: 'lens', x: 50, y: 0, params: { f: 100 } }]));
  for (const s of r.segments.filter(k => Math.abs(k.x1 - 50) < 1e-6 && Math.abs(k.y1) > 0.1)) {
    const xCross = s.x1 - s.y1 * (s.x2 - s.x1) / (s.y2 - s.y1);
    assert.ok(Math.abs(xCross - 150) / 100 < 0.01, `focus at ${xCross}`);
  }
}

// 3. 4f relay: a point 5 mm off axis is imaged 10 mm off axis on the other side (magnification −f2/f1 = −2).
{
  const r = trace(comps([{ type: 'fibre_out', x: 0, y: 5, params: { na: 0.03 } }, { type: 'lens', x: 100, y: 0, params: { f: 100 } },
    { type: 'lens', x: 400, y: 0, params: { f: 200, diam: 50 } }, { id: 'C', type: 'camera', x: 600, y: 0, params: { size: 40 } }]));
  close(r.readouts.C.centroid, -10, 1e-6, '4f image height');
  assert.ok(r.readouts.C.rms < 1e-6, 'image is a point');
}

// 4. Keplerian expander: output beam diameter ratio = f2 / f1, and the beam leaves collimated.
{
  const r = trace(comps([{ type: 'laser', x: 0, y: 0, params: { div: 0, diam: 2, rays: 5 } }, { type: 'lens', x: 100, y: 0, params: { f: 50 } },
    { type: 'lens', x: 300, y: 0, params: { f: 150 } }, { id: 'P', type: 'profiler', x: 500, y: 0, params: { size: 20 } }]));
  const e = r.readouts.P.extent;
  close((e[1] - e[0]) / 2, 3, 1e-9, 'Keplerian expansion f2/f1 = 3');
  close(r.readouts.P.aoi, 0, 1e-9, 'collimated output');
  const g = trace(comps([{ type: 'laser', x: 0, y: 0, params: { div: 0, diam: 2 } }, { type: 'expander', x: 150, y: 0, params: { kind: 'galileo', f1: 25, f2: 100 } }, { id: 'P', type: 'profiler', x: 400, y: 0, params: { size: 20 } }]));
  close((g.readouts.P.extent[1] - g.readouts.P.extent[0]) / 2, 4, 1e-9, 'Galilean expander 4×');
}

// 5. Dichroic: 488 nm reflected to one detector, 640 nm transmitted to the other.
{
  const r = trace(comps([{ type: 'laser', x: 0, y: 0, params: { lambda: 488, div: 0, rays: 1 } },
    { type: 'dichroic', x: 100, y: 0, rot: -45, params: { cut: 560 } }, { id: 'R', type: 'powermeter', x: 100, y: 100, rot: 90 }, { id: 'T', type: 'powermeter', x: 200, y: 0 }]));
  assert.ok(r.readouts.R.byLambda[488] > 49 && !(r.readouts.T.power > 0.01), '488 nm reflected');
  const t = trace(comps([{ type: 'laser', x: 0, y: 0, params: { lambda: 640, div: 0, rays: 1 } }, { type: 'dichroic', x: 100, y: 0, rot: -45, params: { cut: 560 } },
    { id: 'R', type: 'powermeter', x: 100, y: 100, rot: 90 }, { id: 'T', type: 'powermeter', x: 200, y: 0 }]));
  assert.ok(t.readouts.T.byLambda[640] > 49 && !(t.readouts.R.power > 0.01), '640 nm transmitted');
}

// 6. Beam splitter: R:T = 30:70.
{
  const r = trace(comps([{ type: 'laser', x: 0, y: 0, params: { power: 100, div: 0, rays: 3 } }, { type: 'bs', x: 100, y: 0, rot: -45, params: { R: 30 } },
    { id: 'R', type: 'powermeter', x: 100, y: 100, rot: 90 }, { id: 'T', type: 'powermeter', x: 200, y: 0 }]));
  close(r.readouts.R.power, 30, 1e-9, 'reflected power');
  close(r.readouts.T.power, 70, 1e-9, 'transmitted power');
}

// 7. Snell refraction entering a prism: 30° incidence, n = 1.5 -> 19.47° inside, i.e. 10.53° below the horizontal.
{
  const r = trace(comps([{ type: 'laser', x: 0, y: -2, params: { div: 0, rays: 1 } }, { type: 'prism', x: 100, y: 0, params: { side: 40, n: 1.5, disp: 'no' } }]));
  const inside = r.segments[1];
  close(deg(inside), 30 - Math.asin(Math.sin(30 * Math.PI / 180) / 1.5) * 180 / Math.PI, 1e-6, 'refracted direction in the prism');
  const d = trace(comps([{ type: 'lamp', x: 0, y: -2, params: { diam: 0.1, spread: 0, rays: 1 } }, { type: 'prism', x: 100, y: 0, params: { side: 40, n: 1.5 } }]));
  const exits = d.segments.filter(s => s.x1 > 105 && s.x2 > 1000);
  const blue = exits.find(s => s.l === 440), red = exits.find(s => s.l === 660);
  assert.ok(deg(blue) > deg(red), 'dispersion: blue is deviated more than red');
}

// 8. TIR at a glass/water interface above the critical angle, refraction below it (with Snell's law).
{
  const crit = criticalAngle(1.518, 1.33);
  const at = th => trace(comps([{ type: 'laser', x: -100 * Math.cos(th * Math.PI / 180), y: -100 * Math.sin(th * Math.PI / 180), rot: th, params: { div: 0, rays: 1 } }, { id: 'I', type: 'tirf', x: 0, y: 0 }]));
  const a = at(70).readouts.I;
  assert.ok(a.tir && a.tir.length === 1 && !a.through, 'TIR at 70°');
  close(a.tir[0].ang, 70, 1e-6, 'angle of incidence');
  assert.ok(a.tir[0].depth > 50 && a.tir[0].depth < 150, 'evanescent depth ~100 nm');
  const b = at(crit - 5).readouts.I;
  assert.ok(b.through && !b.tir, 'refraction below the critical angle');
  close(b.through[0].out, Math.asin(1.518 * Math.sin((crit - 5) * Math.PI / 180) / 1.33) * 180 / Math.PI, 1e-6, 'Snell at the interface');
}

// 9. Objective: collimated light focuses at n f in front; light from the focus returns collimated through a tube lens to a point.
{
  const r = trace(comps([{ type: 'laser', x: 0, y: 100, rot: -90, params: { div: 0, diam: 6 } }, { type: 'dichroic', x: 0, y: 0, rot: 45, params: { cut: 500 } },
    { type: 'objective', x: 60, y: 0, rot: 0, params: { mag: 60, na: 1.4, nimm: 1.518, ftl: 200 } }, { id: 'S', type: 'sample', x: 60 + 1.518 * 200 / 60, y: 0 },
    { type: 'tube', x: -60, y: 0, rot: 180, params: { f: 200 } }, { id: 'C', type: 'camera', x: -260, y: 0, rot: 180 }]), { spectra });
  close(r.readouts.S.exSpread[1] - r.readouts.S.exSpread[0], 0, 1e-9, 'excitation focused to a point');
  assert.ok(r.readouts.C.power > 0 && r.readouts.C.rms < 1e-6, 'emission imaged to a point');
  const a = analyze(r).find(x => x.id === 'C').rows;
  assert.ok(a.some(([k, v]) => k === 'System magnification' && v === '60×'), 'magnification 60×');
}

// 10. Every preset traces without exceptions, reaches a detector, and its metadata is valid.
const techIds = new Set(json('data/technique_index.json').map(t => t.id));
const suppliers = new Set(json('data/content/community.json').flatMap(g => g.links.map(l => l.name)));
assert.ok(PRESETS.filter(p => p.group === 'basic').length >= 20, 'at least 20 basic presets');
assert.ok(PRESETS.filter(p => p.group === 'literature').length >= 6, 'at least 6 literature presets');
assert.equal(new Set(PRESETS.map(p => p.id)).size, PRESETS.length, 'unique preset ids');
for (const p of PRESETS) {
  const r = trace(p, { spectra });
  const det = reachedDetectors(r);
  assert.ok(det.length && det.some(d => d.power > 0), `${p.id}: light reaches a detector`);
  assert.equal(r.warnings.length, 0, `${p.id}: ${r.warnings.join('; ')}`);
  analyze(r);
  for (const t of p.tech || []) assert.ok(techIds.has(t), `${p.id}: technique ${t}`);
  if (p.group === 'literature') assert.ok(p.cite && (p.doi || p.url) && p.simplified, `${p.id}: citation and simplification note`);
  for (const c of p.components) assert.ok(PARTS[c.type], `${p.id}: part ${c.type}`);
}

// 11. Catalogue: every part has a category, note and schema; technique ids and supplier names exist.
const cats = new Set(CATS.map(c => c[0]));
for (const [k, p] of Object.entries(PARTS)) {
  assert.ok(cats.has(p.cat) && p.note && p.label && Array.isArray(p.schema), `part ${k}`);
  for (const s of p.schema) assert.ok(s.k in p.params, `${k}: schema key ${s.k} has a default`);
  for (const t of p.tech) assert.ok(techIds.has(t), `${k}: technique ${t}`);
  for (const s of p.sup) assert.ok(suppliers.has(s), `${k}: supplier ${s} is in the community list`);
}

// 12. Share links round-trip; bad layouts are rejected.
{
  const p = PRESETS.find(x => x.id === 'confocal');
  const back = await decodeLayout(await encodeLayout(cleanLayout(p)));
  assert.equal(back.components.length, p.components.length);
  close(back.components[3].x, p.components[3].x, 1e-3, 'position survives');
  assert.deepEqual(trace(back, { spectra }).readouts.pmt12.power, trace(p, { spectra }).readouts.pmt12.power);
  assert.throws(() => cleanLayout({ nope: 1 }));
  assert.equal(cleanLayout({ components: [{ type: 'unknown' }, { type: 'mirror', x: 'a' }] }).components.length, 1);
}

console.log('table_engine tests passed');
