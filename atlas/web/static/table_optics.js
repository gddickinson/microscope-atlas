// Virtual Optical Table: what each face does to a ray (ACT[kind]) and how sources emit rays (emit). Pure, node-testable.
// A handler gets (ray, hit, face, ctx) and returns the rays that leave the face: partial objects merged into a copy of
// the incoming ray by the engine. Returning [] absorbs the ray. ctx records readouts (ctx.rec), drawn links and events.
import { add, sub, mul, dot, unit, rotate, reflect, refract, cauchy, frameOf, toWorld, D2R } from './table_geom.js';
import { criticalAngle, penetrationDepth } from './sim_engine.js';

// Thin-lens refraction in 2D: the slope tan(angle) along the face tangent changes by -h/f.
export function lensBend(d, n, t, h, f) {
  const dn = dot(d, n);
  if (Math.abs(dn) < 1e-9 || !f) return d;
  const N = dn > 0 ? n : mul(n, -1);
  const u = dot(d, t) / Math.abs(dn) - h / f;
  return unit(add(N, mul(t, u)));
}
const NBK7 = 1.5168;
const chromaticF = (f, nm) => f * (cauchy(NBK7, 550) - 1) / (cauchy(NBK7, nm) - 1);
const hOf = (H, f) => dot(sub(H.p, f.c), f.t);
const pass = H => [{ o: H.p }];
const sigmoid = x => 1 / (1 + Math.exp(-x));
const normPol = a => { let x = ((a + 90) % 180 + 180) % 180 - 90; return Math.abs(x) < 1e-9 ? 0 : x; };

function split(H, ray, f, T, extra = {}) {
  const out = [];
  if (T > 1e-4) out.push({ o: H.p, p: ray.p * T, ...(extra.t || {}) });
  if (1 - T > 1e-4) out.push({ o: H.p, d: reflect(ray.d, f.n), p: ray.p * (1 - T), ...(extra.r || {}) });
  return out;
}

// Fresnel reflectance for unpolarized light.
function fresnel(cosi, n1, n2) {
  const sint = n1 / n2 * Math.sqrt(Math.max(0, 1 - cosi * cosi));
  if (sint >= 1) return 1;
  const cost = Math.sqrt(1 - sint * sint);
  const rs = (n1 * cosi - n2 * cost) / (n1 * cosi + n2 * cost), rp = (n2 * cosi - n1 * cost) / (n2 * cosi + n1 * cost);
  return (rs * rs + rp * rp) / 2;
}

// Fluorescence or scattering: rays fanned around axis. 'all' = 360°, otherwise a cone of half-angle cone (deg).
// Power per ray follows the 3D solid-angle fraction of the cone, (1 − cos φ)/2, for an isotropic emitter.
export function fan(at, axes, total, P, base) {
  const N = Math.max(2, Math.round(P.rays)), out = [];
  if (axes === 'all') {
    for (let i = 0; i < N; i++) out.push({ ...base, o: at, d: rotate({ x: 1, y: 0 }, i * 360 / N + 7), p: total / N });
    return out;
  }
  const phi = Math.min(90, P.cone), frac = (1 - Math.cos(phi * D2R)) / 2;
  for (const ax of axes) for (let i = 0; i < N; i++) {
    out.push({ ...base, o: at, d: rotate(ax, -phi + 2 * phi * i / (N - 1)), p: total * frac / N });
  }
  return out;
}

function fluoresce(ctx, H, f, ray, P, dyeName, axes, factor = 1, nMedium = 1) {
  const dye = ctx.dye(dyeName);
  if (!dye) return [];
  const lam = P.photon === '2' ? ray.l / 2 : ray.l;
  const a = Math.min(1, (P.absorb / 100) * dye.ex(lam)) * factor;
  const pAbs = ray.p * a, rec = ctx.rec(f.comp);
  rec.absorbed = (rec.absorbed || 0) + pAbs;
  rec.emPeak = dye.emPeak;
  rec.dye = dye.name;
  if (pAbs <= 0) return [];
  return fan(H.p, axes, pAbs * P.qy / 100, P, { kind: 'emission', l: dye.emPeak, pol: 'u', tag: '', n: nMedium, src: f.comp.id });
}

function excitation(ctx, f, ray, H) {
  const rec = ctx.rec(f.comp), ang = Math.acos(Math.min(1, Math.abs(dot(ray.d, f.n)))) / D2R;
  const side = dot(ray.d, f.t) >= 0 ? 1 : -1;
  (rec.ex = rec.ex || []).push({ l: ray.l, p: ray.p, ang: side * ang, tag: ray.tag || '', h: hOf(H, f) });
}

export const ACT = {
  block: () => [],
  dump: (ray, H, f, ctx) => { const r = ctx.rec(f.comp); r.power = (r.power || 0) + ray.p; return []; },
  pass: (ray, H) => pass(H),
  mirror: (ray, H, f) => [{ o: H.p, d: reflect(ray.d, f.n), p: ray.p * (f.R ?? 1) }],
  slm(ray, H, f) {
    const P = f.comp.params, R = P.R / 100, d = reflect(ray.d, f.n);
    if (P.pattern === 'grating') {
      return [{ o: H.p, d, p: ray.p * R * 0.1 }, { o: H.p, d: rotate(d, P.angle), p: ray.p * R * 0.4, tag: '+1' }, { o: H.p, d: rotate(d, -P.angle), p: ray.p * R * 0.4, tag: '-1' }];
    }
    return [{ o: H.p, d, p: ray.p * R, tag: P.pattern === 'vortex' ? 'vortex' : ray.tag }];
  },
  dichroic(ray, H, f) {
    const P = f.comp.params, x = (ray.l - P.cut) / Math.max(0.1, P.edge / 4.4);
    return split(H, ray, f, P.mode === 'sp' ? sigmoid(-x) : sigmoid(x));
  },
  bs: (ray, H, f) => split(H, ray, f, 1 - f.comp.params.R / 100),
  pbs(ray, H, f) {
    const T = typeof ray.pol === 'number' ? Math.cos(ray.pol * D2R) ** 2 : 0.5;
    return split(H, ray, f, T, { t: { pol: 0 }, r: { pol: 90 } });
  },
  hwp(ray, H, f) {
    const ax = f.comp.params.axis;
    return [{ o: H.p, pol: typeof ray.pol === 'number' ? normPol(2 * ax - ray.pol) : ray.pol }];
  },
  qwp(ray, H, f) {
    const ax = f.comp.params.axis;
    if (ray.pol === 'c') return [{ o: H.p, pol: normPol(ax + 45) }];
    if (typeof ray.pol !== 'number') return pass(H);
    const s = Math.abs(Math.sin(2 * (ray.pol - ax) * D2R));
    return [{ o: H.p, pol: s > 0.97 ? 'c' : ray.pol }];
  },
  polarizer(ray, H, f) {
    const ax = f.comp.params.axis, T = typeof ray.pol === 'number' ? Math.cos((ray.pol - ax) * D2R) ** 2 : 0.5;
    return T > 1e-4 ? [{ o: H.p, p: ray.p * T, pol: normPol(ax) }] : [];
  },
  bandpass(ray, H, f) { const P = f.comp.params; return Math.abs(ray.l - P.center) <= P.width / 2 ? [{ o: H.p, p: ray.p * 0.95 }] : []; },
  longpass: (ray, H, f) => (ray.l >= f.comp.params.cut ? [{ o: H.p, p: ray.p * 0.95 }] : []),
  shortpass: (ray, H, f) => (ray.l <= f.comp.params.cut ? [{ o: H.p, p: ray.p * 0.95 }] : []),
  nd: (ray, H, f) => [{ o: H.p, p: ray.p * 10 ** -f.comp.params.od }],
  pinarray(ray, H, f) {
    const P = f.comp.params, h = hOf(H, f), hl = h - P.pitch * Math.round(h / P.pitch);
    return Math.abs(hl) <= P.size / 2000 ? pass(H) : [];
  },
  lens(ray, H, f) {
    const F = f.chromatic ? chromaticF(f.f, ray.l) : f.f;
    return [{ o: H.p, d: lensBend(ray.d, f.n, f.t, hOf(H, f), F) }];
  },
  mla(ray, H, f) {
    const P = f.comp.params, h = hOf(H, f), hl = h - P.pitch * Math.round(h / P.pitch);
    return [{ o: H.p, d: lensBend(ray.d, f.n, f.t, hl, P.f) }];
  },
  aotf(ray, H, f) {
    const P = f.comp.params, eta = Math.abs(ray.l - P.lambda) <= P.bw / 2 ? P.eff / 100 : 0;
    const out = [];
    if (eta > 0) out.push({ o: H.p, d: rotate(ray.d, P.angle), p: ray.p * eta });
    if (1 - eta > 1e-4) out.push({ o: H.p, p: ray.p * (1 - eta) });
    return out;
  },
  aom(ray, H, f) {
    const P = f.comp.params, eta = P.eff / 100;
    return [{ o: H.p, d: rotate(ray.d, P.angle), p: ray.p * eta }, { o: H.p, p: ray.p * (1 - eta) }].filter(r => r.p > 1e-9);
  },
  // Ideal (aplanatic) objective: back side = plane at the component origin, front side = principal sphere of radius
  // n f centred on the focal point. Pupil height h maps to a direction n sin θ = −h/f; field angle maps to focal-plane position.
  obj_back(ray, H, f, ctx) {
    const { O } = f, dn = dot(ray.d, f.n), h = hOf(H, f);
    if (dn <= 0) return [];
    if (Math.abs(h) > O.back + 1e-9) { const r = ctx.rec(f.comp); r.clipped = (r.clipped || 0) + ray.p; return []; }
    const tanA = dot(ray.d, f.t) / dn, sinT = -h / (O.f * O.n), cosT = Math.sqrt(1 - sinT * sinT);
    const Q = add(add(f.c, mul(f.n, O.df)), mul(f.t, O.f * tanA));
    const D = add(mul(f.n, cosT), mul(f.t, sinT)), S = sub(Q, mul(D, O.df));
    ctx.link(H.p, S, ray);
    return [{ o: S, d: D, n: O.n, skipComp: f.comp }];
  },
  obj_front(ray, H, f, ctx) {
    const { O } = f, dn = dot(ray.d, f.n), P = f.comp.params;
    if (dn >= 0) return [];
    const sinT = -dot(ray.d, f.t);
    if (Math.abs(O.n * sinT) > P.na + 1e-9) { const r = ctx.rec(f.comp); r.outsideNA = (r.outsideNA || 0) + ray.p; return []; }
    const k = (O.df - dot(sub(H.p, f.c), f.n)) / dn, Q = add(H.p, mul(ray.d, k)), y = dot(sub(Q, f.c), f.t);
    const B = add(f.c, mul(f.t, -O.df * sinT)), d = unit(mul(add(f.n, mul(f.t, y / O.f)), -1));
    ctx.link(H.p, B, ray);
    const r = ctx.rec(f.comp);
    r.collected = (r.collected || 0) + ray.p;
    return [{ o: B, d, n: 1, skipComp: f.comp }];
  },
  refract(ray, H, f, ctx) {
    const leaving = dot(ray.d, f.n) > 0, ng = f.disp ? cauchy(f.nd, ray.l) : f.nd;
    const n1 = leaving ? ng : 1, n2 = leaving ? 1 : ng, r = refract(ray.d, f.n, n1, n2);
    if (!r) { ctx.event({ type: 'tir', comp: f.comp.id, at: H.p }); return [{ o: H.p, d: reflect(ray.d, f.n), n: n1 }]; }
    return [{ o: H.p, d: r, n: n2 }];
  },
  tir(ray, H, f, ctx) {
    const P = f.comp.params, dn = dot(ray.d, f.n), fromGlass = dn > 0;
    const n1 = fromGlass ? P.n1 : P.n2, n2 = fromGlass ? P.n2 : P.n1, cosi = Math.abs(dn);
    const theta = Math.acos(Math.min(1, cosi)) / D2R, r = refract(ray.d, f.n, n1, n2);
    const rec = ctx.rec(f.comp), out = [];
    rec.crit = criticalAngle(Math.max(P.n1, P.n2), Math.min(P.n1, P.n2));
    if (!r) {
      const depth = penetrationDepth(ray.l, n1, n2, theta);
      (rec.tir = rec.tir || []).push({ l: ray.l, p: ray.p, ang: theta, depth });
      out.push({ o: H.p, d: reflect(ray.d, f.n) });
    } else {
      const R = fresnel(cosi, n1, n2);
      (rec.through = rec.through || []).push({ l: ray.l, p: ray.p, ang: theta, out: Math.acos(Math.abs(dot(r, f.n))) / D2R });
      if (R > 1e-3) out.push({ o: H.p, d: reflect(ray.d, f.n), p: ray.p * R });
      out.push({ o: H.p, d: r, p: ray.p * (1 - R), n: n2 });
    }
    if (ray.kind === 'excitation' && fromGlass && P.dye && P.dye !== 'none') {
      excitation(ctx, f, ray, H);
      const toGlass = P.collect !== 'sample', axis = mul(f.n, toGlass ? -1 : 1);
      out.push(...fluoresce(ctx, H, f, ray, P, P.dye, [axis], 1, toGlass ? P.n1 : P.n2));
    }
    return out;
  },
  fluor(ray, H, f, ctx) {
    if (ray.kind !== 'excitation') return pass(H);
    const P = f.comp.params, dye = ctx.dye(P.dye);
    excitation(ctx, f, ray, H);
    if (!dye) return pass(H);
    const back = dot(ray.d, f.n) > 0 ? mul(f.n, -1) : f.n, fwd = mul(back, -1);
    const axes = P.emit === 'all' ? 'all' : P.emit === 'forward' ? [fwd] : P.emit === 'both' ? [back, fwd] : [back];
    const em = fluoresce(ctx, H, f, ray, P, P.dye, axes, 1, ray.n);
    const a = Math.min(1, (P.absorb / 100) * dye.ex(P.photon === '2' ? ray.l / 2 : ray.l));
    return [{ o: H.p, p: ray.p * (1 - a) }, ...em];
  },
  scatter(ray, H, f, ctx) {
    if (ray.kind === 'emission') return pass(H);
    const P = f.comp.params, fr = P.frac / 100;
    excitation(ctx, f, ray, H);
    const back = dot(ray.d, f.n) > 0 ? mul(f.n, -1) : f.n, fwd = mul(back, -1);
    const axes = P.emit === 'all' ? [back, fwd] : P.emit === 'forward' ? [fwd] : [back];
    const rec = ctx.rec(f.comp);
    rec.scattered = (rec.scattered || 0) + ray.p * fr;
    const sc = fan(H.p, axes, ray.p * fr * (P.emit === 'all' ? 1 : 2), P, { kind: 'scattered', tag: '' });
    return [{ o: H.p, p: ray.p * (1 - fr) }, ...sc];
  },
  coupler(ray, H, f, ctx) {
    const P = f.comp.params, dn = dot(ray.d, f.n);
    if (dn <= 0) return [];
    const h = hOf(H, f), u = dot(ray.d, f.t) / dn, u2 = u - h / P.f, y = h + P.f * u2;
    const ok = Math.abs(y) <= P.core / 2000 && Math.abs(Math.atan(u2)) <= Math.asin(Math.min(1, P.na));
    const rec = ctx.rec(f.comp);
    rec.incident = (rec.incident || 0) + ray.p;
    if (ok) { rec.coupled = (rec.coupled || 0) + ray.p; rec.byLambda = rec.byLambda || {}; rec.byLambda[ray.l] = (rec.byLambda[ray.l] || 0) + ray.p; }
    ctx.link(H.p, toWorld(frameOf(f.comp), P.f, y), ray, ok ? 1 : 0.2);
    return [];
  },
  det(ray, H, f, ctx) {
    const dn = dot(ray.d, f.n);
    if (dn <= 0) return [];
    const r = ctx.rec(f.comp);
    (r.hits = r.hits || []).push({ l: ray.l, p: ray.p, kind: ray.kind, h: hOf(H, f), aoi: Math.acos(Math.min(1, dn)) / D2R * Math.sign(dot(ray.d, f.t) || 1), opl: ray.opl, pol: ray.pol, tag: ray.tag, path: ray.path });
    return [];
  },
};

// --- sources --------------------------------------------------------------------------------------
const POL = { p: 0, s: 90, 45: 45, u: 'u', c: 'c' };
function bundle(c, lams, { diam, fullAngle, rays, power, pol = 'u', point = false }) {
  const F = frameOf(c), N = Math.max(1, Math.round(rays)), out = [];
  const totalW = lams.reduce((s, [, w]) => s + w, 0);
  for (const [l, w] of lams) {
    for (let i = 0; i < N; i++) {
      const fr = N > 1 ? i / (N - 1) - 0.5 : 0;
      out.push({ o: toWorld(F, 0, point ? 0 : fr * diam), d: rotate(F.n, fr * fullAngle), l, p: power * w / totalW / N,
        kind: 'excitation', pol, n: 1, opl: 0, path: [c.id], src: c.id, tag: '' });
    }
  }
  return out;
}

export function emit(c, feed) {
  const P = c.params;
  switch (c.type) {
    case 'laser': return bundle(c, [[P.lambda, 1]], { diam: P.diam, fullAngle: P.div * 1e-3 / D2R, rays: P.rays, power: P.power, pol: POL[P.pol] ?? 0 });
    case 'led': return bundle(c, [[P.lambda - P.fwhm / 2, 0.25], [P.lambda, 0.5], [P.lambda + P.fwhm / 2, 0.25]], { diam: P.diam, fullAngle: 2 * P.spread, rays: P.rays, power: P.power });
    case 'lamp': return bundle(c, [440, 495, 550, 605, 660].map(l => [l, 1]), { diam: P.diam, fullAngle: 2 * P.spread, rays: P.rays, power: P.power });
    case 'fibre_out': {
      const lams = P.mode === 'coupled' ? (feed || []) : [[P.lambda, P.power]];
      const total = lams.reduce((s, [, w]) => s + w, 0);
      if (!total) return [];
      return bundle(c, lams, { fullAngle: 2 * Math.asin(Math.min(1, P.na)) / D2R, rays: P.rays, power: total, point: true });
    }
    default: return [];
  }
}
