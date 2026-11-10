// Virtual Optical Table: pure 2D geometric ray tracer (no DOM; tested by tests/table_engine.test.mjs).
// trace(layout, opts) -> { segments, readouts, events, warnings, nRays }
//   layout = { components: [{ id, type, x, y, rot, params }] }   (mm, degrees; defaults from table_parts.js)
//   opts   = { spectra: {name: {ex: [[nm, v]], em: [[nm, v]]}}, maxBounces = 60, minPower = 1e-6 (mW), maxRays = 6000 }
// Rays carry origin o, direction d, wavelength l (nm), power p (mW), kind (excitation | emission | scattered),
// polarization pol (degrees from the table plane, or 'u' / 'c'), medium index n, optical path length opl and the path of
// component ids. Each ray is intersected with every face; the nearest face's handler (table_optics.js ACT) returns the
// rays that leave it. Fibre outputs in 'coupled' mode are fed by a first pass that measures what the couplers collect.
import { withDefaults, DETECTOR_TYPES } from './table_parts.js';
import { facesOf, intersect, add, mul, unit } from './table_geom.js';
import { ACT, emit } from './table_optics.js';

const FAR = 4000;

// Approximate peaks used only when spectra are not loaded (excitation, emission maxima in nm).
const FALLBACK = { EGFP: [488, 507], mCherry: [587, 610], 'Alexa Fluor 488': [490, 525], 'Alexa Fluor 647': [650, 671], DAPI: [358, 461], Cy3: [550, 570], 'ATTO 647N': [646, 664], 'abberior STAR RED': [638, 655] };

export function makeDyes(spectra = {}) {
  const cache = {};
  return name => {
    if (!name || name === 'none') return null;
    if (cache[name]) return cache[name];
    const s = spectra[name];
    let dye;
    if (s && s.ex && s.em && s.ex.length && s.em.length) {
      const exMax = Math.max(...s.ex.map(p => p[1])) || 1;
      const emPeak = s.em.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      const ex = nm => interp(s.ex, nm) / exMax;
      dye = { name, ex, emPeak, exPeak: s.ex.reduce((a, b) => (b[1] > a[1] ? b : a))[0], approx: false };
    } else {
      const [x, m] = FALLBACK[name] || FALLBACK.EGFP;
      dye = { name: FALLBACK[name] ? name : 'EGFP', ex: nm => Math.exp(-(((nm - x) / 30) ** 2)), emPeak: m, exPeak: x, approx: true };
    }
    return (cache[name] = dye);
  };
}

function interp(pts, x) {
  if (x <= pts[0][0] || x >= pts[pts.length - 1][0]) return 0;
  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m][0] <= x) lo = m; else hi = m; }
  const [x0, y0] = pts[lo], [x1, y1] = pts[hi];
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0 || 1);
}

function traceOnce(comps, faces, opts, feed) {
  const { maxBounces = 60, minPower = 1e-6, maxRays = 6000 } = opts;
  const segments = [], recs = {}, events = [], warnings = [];
  const ctx = {
    dye: opts.dyes,
    rec: c => (recs[c.id] = recs[c.id] || { type: c.type }),
    link: (a, b, ray, k = 1) => segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, l: ray.l, p: ray.p * k, k: ray.kind }),
    event: e => { if (events.length < 200) events.push(e); },
  };
  const stack = [];
  for (const c of comps) for (const r of emit(c, feed)) stack.push({ ...r, b: 0 });
  const pmax = Math.max(1e-12, ...stack.map(r => r.p));
  const floor = Math.max(minPower, pmax * 1e-7);
  let n = 0;
  while (stack.length) {
    const ray = stack.pop();
    if (++n > maxRays) { warnings.push('Ray limit reached: the drawing is incomplete.'); break; }
    let best = null, bs = Infinity;
    for (const f of faces) {
      if (f === ray.skip || (ray.skipComp && f.comp === ray.skipComp)) continue;
      const s = intersect(ray.o, ray.d, f);
      if (s !== null && s < bs) { bs = s; best = f; }
    }
    const end = best ? add(ray.o, mul(ray.d, bs)) : add(ray.o, mul(ray.d, FAR));
    segments.push({ x1: ray.o.x, y1: ray.o.y, x2: end.x, y2: end.y, l: ray.l, p: ray.p, k: ray.kind });
    if (!best) continue;
    const opl = ray.opl + (best ? bs : FAR) * (ray.n || 1);
    if (ray.b >= maxBounces) { warnings.push('A ray reached the bounce limit (' + maxBounces + ').'); continue; }
    const handler = ACT[best.kind];
    if (!handler) continue;
    const kids = handler({ ...ray, opl }, { p: end, s: bs }, best, ctx);
    for (const k of kids) {
      const child = { ...ray, d: ray.d, skip: best, skipComp: null, ...k, opl, b: ray.b + 1, path: ray.path.concat(best.comp.id) };
      child.d = unit(child.d);
      if (child.p >= floor) stack.push(child);
    }
  }
  return { segments, recs, events, warnings: [...new Set(warnings)], nRays: n };
}

export function normalize(layout) {
  return (layout.components || []).map((c, i) => withDefaults({ ...c, id: c.id || c.type + '-' + i }));
}

export function trace(layout, opts = {}) {
  const comps = normalize(layout);
  const faces = comps.flatMap(c => facesOf(c));
  const o = { ...opts, dyes: opts.dyes || makeDyes(opts.spectra) };
  let feed = null;
  if (comps.some(c => c.type === 'fibre_out' && c.params.mode === 'coupled')) {
    const first = traceOnce(comps.filter(c => !(c.type === 'fibre_out' && c.params.mode === 'coupled')), faces, o, null);
    const byL = {};
    for (const r of Object.values(first.recs)) if (r.byLambda) for (const [l, p] of Object.entries(r.byLambda)) byL[l] = (byL[l] || 0) + p * 0.8;
    feed = Object.entries(byL).map(([l, p]) => [+l, p]);
  }
  const res = traceOnce(comps, faces, o, feed);
  const readouts = {};
  for (const c of comps) readouts[c.id] = summarize(c, res.recs[c.id] || { type: c.type });
  if (feed && !feed.length) res.warnings.push('A fibre output is set to use coupled light, but no light is coupled into a fibre.');
  return { segments: res.segments, readouts, events: res.events, warnings: res.warnings, nRays: res.nRays, components: comps };
}

const wmean = (xs, ws) => { const W = ws.reduce((a, b) => a + b, 0); return W ? xs.reduce((s, x, i) => s + x * ws[i], 0) / W : NaN; };

// Per-component readout: detector power by wavelength and kind, centroid and RMS size of the hits, angles, path lengths.
export function summarize(c, r) {
  const out = { type: c.type, ...r };
  if (r.hits) {
    const hits = r.hits, ws = hits.map(h => h.p);
    const power = ws.reduce((a, b) => a + b, 0), cen = wmean(hits.map(h => h.h), ws);
    const byLambda = {}, byKind = {};
    for (const h of hits) { byLambda[h.l] = (byLambda[h.l] || 0) + h.p; byKind[h.kind] = (byKind[h.kind] || 0) + h.p; }
    const opls = hits.map(h => h.opl);
    const best = hits.reduce((a, b) => (b.p > a.p ? b : a));
    Object.assign(out, {
      power, n: hits.length, byLambda, byKind, centroid: cen,
      rms: Math.sqrt(Math.max(0, wmean(hits.map(h => (h.h - cen) ** 2), ws))),
      aoi: wmean(hits.map(h => Math.abs(h.aoi)), ws), extent: [Math.min(...hits.map(h => h.h)), Math.max(...hits.map(h => h.h))], oplMin: Math.min(...opls), oplMax: Math.max(...opls),
      paths: [...new Set(hits.filter(h => h.p >= power * 0.01).map(h => h.path.join('>')))].slice(0, 6), mainPath: best.path,
      tags: [...new Set(hits.map(h => h.tag).filter(Boolean))],
    });
    delete out.hits;
  } else if (DETECTOR_TYPES.includes(c.type)) {
    Object.assign(out, { power: 0, n: 0, byLambda: {}, byKind: {} });
  }
  if (r.ex) {
    out.exPower = r.ex.reduce((s, e) => s + e.p, 0);
    const angs = r.ex.map(e => e.ang);
    out.exAngles = [Math.min(...angs), Math.max(...angs)];
    out.exLambdas = [...new Set(r.ex.map(e => e.l))];
    out.exByLambda = {};
    for (const e of r.ex) out.exByLambda[e.l] = (out.exByLambda[e.l] || 0) + e.p;
    out.exTags = [...new Set(r.ex.map(e => e.tag).filter(Boolean))];
    out.exSpread = [Math.min(...r.ex.map(e => e.h)), Math.max(...r.ex.map(e => e.h))];
    delete out.ex;
  }
  return out;
}

// True if any ray reached a detector of the layout (used by tests and the page).
export function reachedDetectors(result) {
  return result.components.filter(c => DETECTOR_TYPES.includes(c.type)).map(c => ({ id: c.id, type: c.type, power: result.readouts[c.id].power || 0 }));
}

