// Virtual Optical Table: test specimens for the simulated camera image (pure, no DOM; tested by tests/table_imaging.test.mjs).
// makeSpecimen(id, { fov, seed }) -> { id, label, fov, focus, emitters: Float32Array [x, y, z, w, ...], n, desc, note }
// x, y in nm across a square field of side fov (origin top-left), z in nm above the coverslip, w = number of fluorophores
// (or scattering strength) at that point. Structures are drawn as point emitters, so any optics can image them.
// All randomness comes from the seeded generator in sim_engine.js, so the same seed gives the same specimen.
import { rng } from './sim_engine.js';

const TAU = 2 * Math.PI;

function sink() {
  const a = [];
  return { a, add: (x, y, z, w) => a.push(x, y, Math.max(0, z), w) };
}
// Points every `step` nm along a straight segment.
function line(E, x0, y0, z0, x1, y1, z1, step, w) {
  const L = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.max(1, Math.round(L / step));
  for (let i = 0; i <= n; i++) { const t = i / n; E.add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, w); }
}
// Filled rectangle on a grid of pitch p; weight scaled so the fluorophore density (per µm²) is `dens`.
function rect(E, x, y, wd, ht, z, p, dens) {
  const w = dens * (p / 1000) ** 2;
  for (let yy = y + p / 2; yy < y + ht; yy += p) for (let xx = x + p / 2; xx < x + wd; xx += p) E.add(xx, yy, z, w);
}
// Points at least `minD` apart, uniformly in [m, fov - m]².
function scatterPts(R, n, fov, minD, m = 0) {
  const pts = [];
  for (let tries = 0; pts.length < n && tries < n * 60; tries++) {
    const x = m + R() * (fov - 2 * m), y = m + R() * (fov - 2 * m);
    if (pts.every(([a, b]) => (a - x) ** 2 + (b - y) ** 2 >= minD * minD)) pts.push([x, y]);
  }
  return pts;
}

// A flat, adherent cell: elliptical outline, dome-shaped height h(x, y) = H (1 − ρ²) with ρ the elliptical radius.
function cellShape(fov, R, H = 5000) {
  const cx = fov / 2, cy = fov / 2, a = 0.44 * fov, b = 0.32 * fov, th = (R() - 0.5) * 0.8, c = Math.cos(th), s = Math.sin(th);
  const rho = (x, y) => { const u = (x - cx) * c + (y - cy) * s, v = -(x - cx) * s + (y - cy) * c; return Math.hypot(u / a, v / b); };
  return { cx, cy, a, b, c, s, rho, h: (x, y) => 300 + Math.max(0, H * (1 - rho(x, y) ** 2)),
    pt: (u, v) => [cx + u * a * c - v * b * s, cy + u * a * s + v * b * c] };
}
// Persistent random walk from (x, y) with heading th; calls f(x, y) at each step; stops when keep(x, y) is false.
function walk(R, x, y, th, step, n, bend, keep, f) {
  for (let i = 0; i < n; i++) {
    th += bend * R.normal();
    const nx = x + step * Math.cos(th), ny = y + step * Math.sin(th);
    if (!keep(nx, ny)) break;
    x = nx; y = ny; f(x, y, i);
  }
}
function diffuse(E, R, cell, n, w) {
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(R()), t = R() * TAU, [x, y] = cell.pt(r * Math.cos(t), r * Math.sin(t));
    E.add(x, y, R() * cell.h(x, y), w);
  }
}

const GEN = {
  usaf(E, fov) {
    // Three horizontal and three vertical bars per element (bar width w, length 5w, gap w), widths shrinking by 2^(-1/3).
    let x = 0.04 * fov, y = 0.04 * fov, rowH = 0;
    for (let i = 0, w = fov / 22; i < 14 && w >= 30; i++, w *= 2 ** (-1 / 3)) {
      const W = 11 * w, H = 5 * w, p = Math.max(4, w / 5);
      if (x + W > 0.96 * fov) { x = 0.04 * fov; y += rowH + 0.06 * fov; rowH = 0; }
      if (y + H > 0.96 * fov) break;
      for (let k = 0; k < 3; k++) { rect(E, x, y + 2 * k * w, H, w, 0, p, 800); rect(E, x + 6 * w + 2 * k * w, y, w, H, 0, p, 800); }
      x += W + 0.05 * fov; rowH = Math.max(rowH, H);
    }
  },
  siemens(E, fov) {
    const R0 = 0.45 * fov, cx = fov / 2, cy = fov / 2, spokes = 18, p = Math.max(10, fov / 600), w = 800 * (p / 1000) ** 2;
    for (let y = cy - R0; y < cy + R0; y += p) for (let x = cx - R0; x < cx + R0; x += p) {
      const r = Math.hypot(x - cx, y - cy);
      if (r < R0 && r > 30 && Math.sin(spokes * Math.atan2(y - cy, x - cx)) > 0) E.add(x, y, 0, w);
    }
  },
  beadpairs(E, fov) {
    const seps = [50, 100, 150, 200, 250, 300, 400, 500, 600], dirs = [0, Math.PI / 2, Math.PI / 4];
    const dx = fov / (seps.length + 1), dy = fov / (dirs.length + 1);
    seps.forEach((s, i) => dirs.forEach((a, j) => {
      const x = dx * (i + 1), y = dy * (j + 1), ux = Math.cos(a) * s / 2, uy = Math.sin(a) * s / 2;
      E.add(x - ux, y - uy, 0, 40); E.add(x + ux, y + uy, 0, 40);
    }));
  },
  beads(E, fov, R) {
    for (const [x, y] of scatterPts(R, Math.round(fov * fov / 2.5e6), fov, 400, 200)) E.add(x, y, R() * 6000, 40);
  },
  microtubules(E, fov, R) {
    const cell = cellShape(fov, R), [mx, my] = cell.pt(0.12, 0.08), inside = (x, y) => cell.rho(x, y) < 0.97;
    for (let f = 0; f < 70; f++) {
      const frac = 0.08 + 0.75 * R(), th = R() * TAU;
      walk(R, mx + 600 * Math.cos(th), my + 600 * Math.sin(th), th, 16, 4000, 0.025, inside, (x, y) => E.add(x, y, frac * cell.h(x, y), 2));
    }
    diffuse(E, R, cell, 6000, 0.6);
  },
  actin(E, fov, R) {
    const cell = cellShape(fov, R), inside = (x, y) => cell.rho(x, y) < 0.98;
    for (let f = 0; f < 28; f++) {
      const v0 = (R() - 0.5) * 1.6, th = Math.atan2(cell.s, cell.c) + (R() - 0.5) * 0.5, [x0, y0] = cell.pt(-1, v0), z = 40 + 100 * R();
      let started = false;
      for (let t = 0; t < 2.2 * cell.a; t += 15) {
        const x = x0 + t * Math.cos(th), y = y0 + t * Math.sin(th);
        if (!inside(x, y)) { if (started) break; continue; }
        started = true;
        for (const o of [-40, 0, 40]) E.add(x - o * Math.sin(th), y + o * Math.cos(th), z, 1.5);
      }
    }
    for (let k = 0; k < 500; k++) { // cortical mesh on the dorsal (top) surface
      const r = Math.sqrt(R()) * 0.95, t = R() * TAU, [x, y] = cell.pt(r * Math.cos(t), r * Math.sin(t));
      walk(R, x, y, R() * TAU, 20, 60 + R() * 60, 0.15, inside, (a, b) => E.add(a, b, 0.97 * cell.h(a, b), 1));
    }
    diffuse(E, R, cell, 4000, 0.5);
  },
  mitochondria(E, fov, R) {
    const cell = cellShape(fov, R, 4000), inside = (x, y) => cell.rho(x, y) < 0.95;
    for (let m = 0; m < 60; m++) {
      const r = 0.3 + 0.65 * Math.sqrt(R()), t = R() * TAU, [x, y] = cell.pt(r * Math.cos(t), r * Math.sin(t));
      const frac = 0.1 + 0.4 * R(), n = Math.round(80 + R() * 220);
      walk(R, x, y, R() * TAU, 20, n, 0.12, inside, (a, b) => {
        for (let k = 0; k < 4; k++) E.add(a + 60 * R.normal(), b + 60 * R.normal(), frac * cell.h(a, b) + 60 * R.normal(), 1);
      });
    }
    diffuse(E, R, cell, 3000, 0.4);
  },
  npc(E, fov, R) {
    // Nuclear pores: 8 corners on a ring of 107 nm diameter; two rings (cytoplasmic and nuclear) 50 nm apart in z.
    for (const [x, y] of scatterPts(R, Math.round(fov * fov / 1.2e5), fov, 250, 100)) {
      const rot = R() * TAU;
      for (let k = 0; k < 8; k++) {
        const a = rot + k * TAU / 8, px = x + 53.5 * Math.cos(a), py = y + 53.5 * Math.sin(a);
        E.add(px, py, 30, 4); E.add(px, py, 80, 4);
      }
    }
  },
  single(E, fov, R) {
    for (const [x, y] of scatterPts(R, Math.round(fov * fov / 1.5e6), fov, 500, 200)) E.add(x, y, 5 + 20 * R(), 1);
    for (let i = 0, n = Math.round(fov * fov / 2e5); i < n; i++) E.add(R() * fov, R() * fov, 300 + R() * 5000, 1);
  },
  origami(E, fov, R) {
    // 4 × 3 grids of docking sites 20 nm apart, each with one dye (a DNA-PAINT style test structure).
    for (const [x, y] of scatterPts(R, Math.round(fov * fov / 6e5), fov, 450, 150)) {
      const rot = R() * TAU, c = Math.cos(rot), s = Math.sin(rot);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const u = (i - 1.5) * 20, v = (j - 1) * 20;
        E.add(x + u * c - v * s, y + u * s + v * c, 5, 1);
      }
    }
  },
  puffs(E, fov, R) {
    const cell = cellShape(fov, R, 4000);
    diffuse(E, R, cell, 30000, 0.3);
    for (let k = 0; k < 7; k++) {
      const r = 0.2 + 0.6 * Math.sqrt(R()), t = R() * TAU, [x, y] = cell.pt(r * Math.cos(t), r * Math.sin(t)), z = 100 + 600 * R();
      const sz = 250 + 250 * R(), amp = 0.5 + R();
      for (let i = 0; i < 900; i++) E.add(x + sz * R.normal(), y + sz * R.normal(), z + 150 * R.normal(), amp);
    }
  },
};

export const SPECIMENS = {
  usaf: { label: 'USAF-1951-style bar target', fov: 12000, focus: 0, gen: GEN.usaf,
    desc: 'Elements of three horizontal and three vertical bars, each 2^(1/3) finer than the last (14 elements, the widest bar 1/22 of the field), printed flat on the coverslip.',
    note: 'Read off the finest element whose three bars are still separate: that bar width is the half-period the optics can resolve (about λ/(2NA) for incoherent widefield imaging).' },
  siemens: { label: 'Siemens star', fov: 10000, focus: 0, gen: GEN.siemens,
    desc: 'Eighteen bright spokes radiating from a centre: the spacing shrinks continuously towards the middle.',
    note: 'The spokes blur into grey at the radius where their period falls below the resolution limit; with too-large pixels a false pattern (aliasing) appears instead.' },
  beadpairs: { label: 'Bead pairs (50–600 nm apart)', fov: 12000, focus: 0, gen: GEN.beadpairs,
    desc: 'Pairs of bright sub-resolution beads, separations increasing from left to right: 50, 100, 150, 200, 250, 300, 400, 500 and 600 nm; rows are horizontal, vertical and diagonal pairs.',
    note: 'Two points are just resolved at the Rayleigh distance 0.61 λ/NA. Lower the NA or raise the wavelength and watch more pairs merge into single spots.' },
  beads: { label: 'Random beads in 3D', fov: 20000, focus: 1500, gen: GEN.beads,
    desc: 'Sub-resolution beads scattered through a 6 µm thick gel.',
    note: 'Beads away from the focal plane spread into wide discs in widefield; sectioning methods (confocal, light sheet, two-photon) drop them instead.' },
  microtubules: { label: 'Cell with microtubules', fov: 30000, focus: 400, gen: GEN.microtubules,
    desc: 'A flat cell (up to ~5 µm tall over the nucleus) whose microtubules radiate from the centrosome at different heights, plus some free tubulin in the cytoplasm.',
    note: 'In widefield, filaments above and below focus add a haze that lowers contrast near the nucleus; confocal and light-sheet images keep only the in-focus filaments.' },
  actin: { label: 'Cell with actin stress fibres', fov: 30000, focus: 150, gen: GEN.actin,
    desc: 'Straight stress-fibre bundles at the cell base (40–140 nm above the glass) and a cortical actin mesh on the top surface.',
    note: 'TIRF shows only the stress fibres at the glass; widefield adds the out-of-focus cortex on top as a diffuse background.' },
  mitochondria: { label: 'Mitochondrial network', fov: 25000, focus: 500, gen: GEN.mitochondria,
    desc: 'Tubular mitochondria about 250 nm wide, curving through the lower 2 µm of a cell.',
    note: 'Tubules close to the resolution limit: their apparent width is set by the PSF, not by the organelle.' },
  npc: { label: 'Nuclear pores (rings of 8, 107 nm)', fov: 4000, focus: 55, gen: GEN.npc,
    desc: 'Nuclear pore complexes on a nuclear envelope spread on the glass: eight protein corners on a ring 107 nm across (Nup96-like labelling, two rings 50 nm apart in z).',
    note: 'The ring is far below the diffraction limit: widefield and confocal show a blob, STED (at high depletion) and single-molecule localization show the ring.' },
  single: { label: 'Single molecules', fov: 12000, focus: 15, gen: GEN.single,
    desc: 'Sparse single dye molecules bound to the coverslip, plus freely diffusing molecules in the 5 µm of solution above.',
    note: 'TIRF excites only the surface-bound molecules, so each appears as a diffraction-limited spot on a dark background; in widefield the molecules in solution add background.' },
  origami: { label: 'DNA-origami grids (20 nm)', fov: 3000, focus: 5, gen: GEN.origami,
    desc: 'DNA-origami tiles carrying a 4 × 3 grid of single dyes 20 nm apart, scattered on the glass.',
    note: 'Each tile is a single diffraction-limited spot: resolving the grid needs DNA-PAINT or another localization method with nanometre precision.' },
  puffs: { label: 'Ca²⁺ puff sites', fov: 30000, focus: 300, gen: GEN.puffs,
    desc: 'A cell loaded with a calcium dye: a dim cytosolic background and a few local puffs of Ca²⁺ released by clusters of IP₃ receptors near the plasma membrane.',
    note: 'Puffs are a few hundred nanometres to a micrometre across and last tens of milliseconds; TIRF and fast cameras catch them near the membrane with little background.' },
};

export const SPECIMEN_OPTIONS = [['auto', 'automatic (suits the set-up)'], ...Object.entries(SPECIMENS).map(([k, s]) => [k, s.label])];

// Default specimen for an imaging mode (and dye).
export function autoSpecimen(mode, dye = '') {
  if (/fluo-|cal-|oregon|gcamp/i.test(dye)) return 'puffs';
  return { tirf: 'single', hilo: 'single', sted: 'npc', 'light-sheet': 'beads', brightfield: 'usaf', darkfield: 'siemens' }[mode] || 'microtubules';
}

export function makeSpecimen(id, { fov, seed = 1 } = {}) {
  const S = SPECIMENS[id] || SPECIMENS.microtubules, key = SPECIMENS[id] ? id : 'microtubules', F = fov || S.fov;
  const E = sink();
  S.gen(E, F, rng(seed * 7919 + key.length));
  const emitters = Float32Array.from(E.a);
  return { id: key, label: S.label, fov: F, focus: S.focus, emitters, n: emitters.length / 4, desc: S.desc, note: S.note };
}
