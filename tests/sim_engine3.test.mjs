// Node tests for Simulations II, part 2 (Köhler/Abbe, DIC, FCS, AFM, spinning disk, expansion).
import assert from 'node:assert/strict';
import * as E from '../atlas/web/static/sim_engine.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const xs = Array.from({ length: 200 }, (_, i) => i * 5); // nm

// Abbe: coherent (NAc = 0) cut-off at P = λ/NAo; opening the condenser extends it to λ/(NAo + NAc).
{
  const lam = 550, NAo = 0.5;
  assert.ok(E.michelsonContrast(E.abbeImage(xs, 1200, lam, NAo, 0)) > 0.5, 'coarse grating resolved coherently');
  close(E.michelsonContrast(E.abbeImage(xs, 1000, lam, NAo, 0)), 0, 1e-9, 'below λ/NA: no contrast coherently');
  assert.ok(E.michelsonContrast(E.abbeImage(xs, 1000, lam, NAo, 0.5, 1, 201)) > 0.01, 'oblique light resolves it');
  close(E.michelsonContrast(E.abbeImage(xs, 540, lam, NAo, 0.5)), 0, 1e-9, 'below λ/2NA nothing passes');
  close(E.partialCoherenceLimit(550, 0.5, 0.5), 550, 1e-9, 'λ/(NAo+NAc)');
  // full coherent image of m = 1 grating: I = (1 + cos)^2 → mean 1.5
  const I = E.abbeImage(xs.slice(0, 200), 1000, lam, 0.9, 0);
  close(I.reduce((a, b) => a + b) / I.length, 1.5, 0.01, 'coherent mean intensity');
}
// DIC: flat phase gives a uniform field sin²(b/2); bias 0 is extinction; a ramp gives a uniform offset.
{
  const N = 16, flat = new Float64Array(N * N);
  E.dicImage(flat, N, 2, 0, 0).forEach(v => close(v, 0, 1e-12, 'extinction'));
  E.dicImage(flat, N, 2, 0, Math.PI / 2).forEach(v => close(v, 0.5, 1e-12, 'quarter-wave bias'));
  const ramp = Float64Array.from({ length: N * N }, (_, i) => 0.1 * (i % N));
  close(E.dicImage(ramp, N, 2, 0, Math.PI / 2)[8 * N + 8], Math.sin((0.2 + Math.PI / 2) / 2) ** 2, 1e-9, 'gradient along shear');
  close(E.dicImage(ramp, N, 2, 90, Math.PI / 2)[8 * N + 8], 0.5, 1e-9, 'no contrast across shear');
}
// FCS: simulated trace recovers G(0) ≈ 1/(c π w²) and the half-decay at τD = w²/4D.
{
  const rand = E.rng(11), L = 4, n = 80, w = 0.3, D = 1, dt = 0.0005;
  const tr = E.fcsTrace(n, L, w, D, dt, 60000, rand);
  const tauD = w * w / (4 * D), lagD = Math.round(tauD / dt);
  const G = E.autocorrelation(tr, [1, lagD]), N = n / (L * L) * Math.PI * w * w;
  close(G[0] * N, 1, 0.2, 'G(0)·N');
  close(G[1] / G[0], 0.5, 0.12, 'G(τD)/G(0)');
  close(E.fcsG2D(0.01, 2, 0.01), 0.25, 1e-12, '2D model at τD');
  close(E.fcsConcentration(1, 0.2, 5), 7.46, 0.02, '1 molecule in 0.22 fL ≈ 7.5 nM');
}
// AFM: a sphere of radius r imaged by a spherical tip of radius R appears 4√(Rr) wide; heights are preserved.
{
  const dx = 0.05, r = 5, R = 10, h = Array.from({ length: 1601 }, (_, i) => { const x = (i - 800) * dx; return Math.abs(x) < r ? r + Math.sqrt(r * r - x * x) : 0; });
  const img = E.afmImage(h, dx, R, 0.01);
  const width = img.filter(v => v > 1e-3).length * dx;
  close(width, E.afmApparentWidth(R, r), 0.3, 'apparent width 4√(Rr)');
  close(Math.max(...img), 2 * r, 1e-9, 'height preserved');
  close(E.tipShape(0, 10, 20), 0, 1e-12, 'apex at 0');
}
// Spinning disk: in focus everything returns; far from focus the disk levels off at the fill factor.
{
  const d0 = E.diskSectioning(0, 0.25, 1.25, 1.4, 1.518), far = E.diskSectioning(50, 0.25, 1.25, 1.4, 1.518);
  close(d0.disk, 1, 1e-12, 'in focus'); close(far.disk, far.fill, 1e-12, 'crosstalk floor');
  assert.ok(far.single < far.fill, 'single pinhole rejects more');
  close(E.expansionResolution(250, 4, 0), 62.5, 1e-9, 'ExM without linkage');
  close(E.expansionResolution(250, 1e6, 10), 10, 1e-6, 'linkage limit');
}
console.log('sim_engine3: all tests passed');
