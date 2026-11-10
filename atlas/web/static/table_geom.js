// Virtual Optical Table: 2D vector helpers and the optical "faces" of each component. Pure, node-testable.
// A component sits at (x, y) mm with rotation rot (degrees, SVG sense: y points down). Its local axis n = (cos rot, sin rot)
// is the optical axis (sources emit along +n; detectors accept light travelling along +n); t is the in-plane transverse axis.
// A face is a line segment (or, for an objective's front, an arc) with a kind that table_optics.js knows how to handle.

export const D2R = Math.PI / 180;
export const vec = (x, y) => ({ x, y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a, k) => ({ x: a.x * k, y: a.y * k });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const len = a => Math.hypot(a.x, a.y);
export const unit = a => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
export const rotate = (a, deg) => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return { x: a.x * c - a.y * s, y: a.x * s + a.y * c }; };
export const reflect = (d, n) => sub(d, mul(n, 2 * dot(d, n)));
export const angleOf = d => Math.atan2(d.y, d.x) / D2R;

export function frameOf(c, extraRot = 0) {
  const a = ((c.rot || 0) + extraRot) * D2R;
  return { o: vec(c.x, c.y), n: vec(Math.cos(a), Math.sin(a)), t: vec(-Math.sin(a), Math.cos(a)) };
}
export const toWorld = (F, u, v) => ({ x: F.o.x + F.n.x * u + F.t.x * v, y: F.o.y + F.n.y * u + F.t.y * v });

// Refraction of unit direction d at a surface with unit normal nrm (either orientation), n1 -> n2. null = total internal reflection.
export function refract(d, nrm, n1, n2) {
  let N = nrm, cosi = -dot(d, N);
  if (cosi < 0) { N = mul(N, -1); cosi = -cosi; }
  const eta = n1 / n2, k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  return unit(add(mul(d, eta), mul(N, eta * cosi - Math.sqrt(k))));
}

// BK7-like dispersion (Cauchy, B = 0.0042 µm²) around the index given at 589.3 nm.
export const cauchy = (nd, nm) => nd + 0.0042 * (1 / (nm / 1000) ** 2 - 1 / 0.5893 ** 2);

// --- faces ------------------------------------------------------------------------------------
function seg(comp, F, u, v0, v1, kind, extra = {}) {
  return { comp, kind, a: toWorld(F, u, v0), b: toWorld(F, u, v1), c: toWorld(F, u, 0), n: F.n, t: F.t, ...extra };
}
// A closed polygon (local points [u, v]); each edge gets an outward normal.
function poly(comp, F, pts, kind, extra = {}, skipEdge = -1) {
  const W = pts.map(([u, v]) => toWorld(F, u, v));
  const cen = mul(W.reduce((s, p) => add(s, p), vec(0, 0)), 1 / W.length);
  const out = [];
  W.forEach((a, i) => {
    if (i === skipEdge) return;
    const b = W[(i + 1) % W.length], t = unit(sub(b, a));
    let nn = vec(t.y, -t.x);
    const mid = mul(add(a, b), 0.5);
    if (dot(nn, sub(mid, cen)) < 0) nn = mul(nn, -1);
    out.push({ comp, kind, a, b, c: mid, n: nn, t, edge: i, ...extra });
  });
  return out;
}
const blades = (comp, F, open, outer) => [seg(comp, F, 0, open / 2, outer / 2, 'block'), seg(comp, F, 0, -outer / 2, -open / 2, 'block')];

export const objectiveOptics = p => {
  const f = p.ftl / p.mag, n = p.nimm || 1;
  return { f, n, df: n * f, back: f * p.na, maxAng: Math.asin(Math.min(0.9999, p.na / n)) };
};

export function expanderLenses(p) {
  const f1 = p.kind === 'galileo' ? -Math.abs(p.f1) : Math.abs(p.f1), f2 = Math.abs(p.f2);
  const L = f1 + f2;
  return [{ u: -L / 2, f: f1 }, { u: L / 2, f: f2 }];
}

// Local outline of the prisms (shared with the drawings).
export function prismPoints(c) {
  const p = c.params;
  if (c.type === 'raprism') { const L = p.leg; return [[-L / 3, -L / 3], [2 * L / 3, -L / 3], [-L / 3, 2 * L / 3]]; }
  const half = p.apex * D2R / 2, s = p.side, h = s * Math.cos(half), w = s * Math.sin(half);
  // apex points along -t (up when rot = 0); the base (last edge) along +t
  return [[0, -2 * h / 3], [w, h / 3], [-w, h / 3]];
}

export function facesOf(c) {
  const p = c.params, F = frameOf(c), t = c.type;
  switch (t) {
    case 'laser': case 'led': case 'lamp': case 'fibre_out': return [seg(c, F, -2, -6, 6, 'block')];
    case 'mirror': case 'dm': return [seg(c, F, 0, -p.diam / 2, p.diam / 2, 'mirror', { R: p.R / 100 })];
    case 'pickoff': return [seg(c, F, 0, 0, p.diam / 2, 'mirror', { R: p.R / 100 })];
    case 'galvo': return [seg(c, frameOf(c, p.scan), 0, -p.diam / 2, p.diam / 2, 'mirror', { R: p.R / 100 })];
    case 'slm': return [seg(c, F, 0, -p.diam / 2, p.diam / 2, 'slm')];
    case 'dmd': return [seg(c, frameOf(c, p.state === 'off' ? -p.tilt : p.tilt), 0, -p.diam / 2, p.diam / 2, 'mirror', { R: 0.88, flat: F })];
    case 'periscope': return [];
    case 'dichroic': case 'bs': case 'pbs': case 'hwp': case 'qwp': case 'polarizer':
    case 'bandpass': case 'longpass': case 'shortpass': case 'nd': case 'aotf': case 'aom':
      return [seg(c, F, 0, -p.diam / 2, p.diam / 2, t)];
    case 'iris': return blades(c, F, Math.min(p.open, p.diam), p.diam);
    case 'pinhole': return blades(c, F, p.size / 1000, p.diam);
    case 'slit': return blades(c, F, Math.min(p.width, p.diam), p.diam);
    case 'annulus': return [seg(c, F, 0, -p.stop / 2, p.stop / 2, 'block'), ...blades(c, F, p.diam, p.diam + 10)];
    case 'pinhole_array': return [seg(c, F, 0, -p.diam / 2, p.diam / 2, 'pinarray')];
    case 'dump': return [seg(c, F, 0, -p.size / 2, p.size / 2, 'dump')];
    case 'lens': case 'achromat': case 'tube':
      return [seg(c, F, 0, -p.diam / 2, p.diam / 2, 'lens', { f: p.f, chromatic: t === 'lens' && p.chromatic === 'yes' })];
    case 'cyl': return [seg(c, F, 0, -p.diam / 2, p.diam / 2, p.axis === 'out' ? 'pass' : 'lens', { f: p.f })];
    case 'mla': return [seg(c, F, 0, -p.diam / 2, p.diam / 2, 'mla')];
    case 'expander': return expanderLenses(p).map(L => seg(c, F, L.u, -p.diam / 2, p.diam / 2, 'lens', { f: L.f }));
    case 'objective': {
      const O = objectiveOptics(p), barrel = Math.max(O.back, 6) + 3;
      const back = seg(c, F, 0, -barrel, barrel, 'obj_back', { O });
      const front = { comp: c, kind: 'obj_front', O, c: F.o, n: F.n, t: F.t, arc: { C: toWorld(F, O.df, 0), R: O.df, axis: mul(F.n, -1), cosMax: Math.cos(Math.min(O.maxAng + 4 * D2R, 89 * D2R)) } };
      return [back, front];
    }
    case 'prism': return poly(c, F, prismPoints(c), 'refract', { nd: p.n, disp: p.disp === 'yes' }, p.base === 'matched' ? 1 : -1);
    case 'raprism': return poly(c, F, prismPoints(c), 'refract', { nd: p.n, disp: false });
    case 'fibre_in': return [seg(c, F, 0, -5, 5, 'coupler')];
    case 'sample': return [seg(c, F, 0, -p.width / 2, p.width / 2, 'fluor')];
    case 'scatter': return [seg(c, F, 0, -p.width / 2, p.width / 2, 'scatter')];
    case 'tirf': return [seg(c, F, 0, -p.width / 2, p.width / 2, 'tir')];
    case 'camera': case 'pmt': case 'powermeter': case 'eyepiece': case 'profiler':
      return [seg(c, F, 0, -p.size / 2, p.size / 2, 'det')];
    default: return [];
  }
}

// Nearest intersection (distance s > eps) of the ray p + s d with a face, or null.
export function intersect(p, d, f) {
  if (f.arc) {
    const { C, R, axis, cosMax } = f.arc, m = sub(p, C), b = dot(m, d), cc = dot(m, m) - R * R, disc = b * b - cc;
    if (disc < 0) return null;
    const r = Math.sqrt(disc);
    for (const s of [-b - r, -b + r]) {
      if (s <= 1e-7) continue;
      const q = add(p, mul(d, s));
      if (dot(unit(sub(q, C)), axis) >= cosMax) return s;
    }
    return null;
  }
  const e = sub(f.b, f.a), den = cross(d, e);
  if (Math.abs(den) < 1e-12) return null;
  const w = sub(f.a, p), s = cross(w, e) / den, u = cross(w, d) / den;
  return s > 1e-7 && u >= -1e-9 && u <= 1 + 1e-9 ? s : null;
}
