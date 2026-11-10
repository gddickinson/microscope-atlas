// Node tests for the Simulations II physics in sim_engine.js.
import assert from 'node:assert/strict';
import * as E from '../atlas/web/static/sim_engine.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// FFT: a delta transforms to a constant; forward then inverse returns the input.
{
  const re = new Float64Array(16), im = new Float64Array(16); re[0] = 1;
  E.fft(re, im); assert.ok(re.every(v => Math.abs(v - 1) < 1e-12));
  const x = Float64Array.from({ length: 64 }, (_, i) => Math.sin(i) + 0.3 * i), y = new Float64Array(64), x0 = Float64Array.from(x);
  E.fft(x, y); E.fft(x, y, true);
  x.forEach((v, i) => close(v, x0[i], 1e-9, 'FFT round trip'));
  // a cosine with 3 cycles puts half its amplitude in bins 3 and N-3
  const c = Float64Array.from({ length: 32 }, (_, i) => Math.cos(2 * Math.PI * 3 * i / 32)), ci = new Float64Array(32);
  E.fft(c, ci); close(c[3], 16, 1e-9, 'cosine bin'); close(c[29], 16, 1e-9, 'cosine mirror bin');
}
// Aberrations: no aberration -> Strehl 1; small defocus follows Maréchal exp(-(2πσ)²).
{
  close(E.aberratedPSF(64, {}).strehl, 1, 1e-12, 'perfect pupil');
  const s = E.aberratedPSF(128, { defocus: 0.05 }, 16).strehl;
  close(s, E.marechal(0.05), 0.02, 'Strehl vs Maréchal at λ/20 rms');
  close(E.marechal(0.0745), 0.8, 0.005, 'λ/14 rms gives Strehl 0.8');
  assert.ok(E.aberratedPSF(64, { spherical: 0.15 }).strehl < 0.5, 'large spherical aberration');
}
// Richardson-Lucy: flux is preserved and the estimate moves towards the truth.
{
  const N = 32, truth = new Float64Array(N * N);
  truth[16 * N + 13] = 100; truth[16 * N + 19] = 100;
  for (let i = 0; i < N * N; i++) truth[i] += 1;
  const data = E.gaussBlur(truth, N, 2);
  const err = u => u.reduce((s, v, i) => s + (v - truth[i]) ** 2, 0);
  const u10 = E.richardsonLucy(data, N, 2, 10), u100 = E.richardsonLucy(data, N, 2, 100);
  const sum = a => a.reduce((x, y) => x + y, 0);
  close(sum(u100) / sum(data), 1, 0.01, 'RL preserves flux');
  assert.ok(err(u100) < err(u10) && err(u10) < err(data), 'RL error falls with iterations');
}
// FLIM phasor: numerical phasor of a sampled decay lies on the semicircle at the analytic point.
{
  const T = 12.5, w = 2 * Math.PI / T; // 80 MHz laser
  const p = E.phasorFromDecay(E.periodicDecay(2.5, T, 4096), T), a = E.phasorOf(2.5, w);
  close(p.g, a.g, 2e-3, 'phasor g'); close(p.s, a.s, 2e-3, 'phasor s');
  close((a.g - 0.5) ** 2 + a.s ** 2, 0.25, 1e-12, 'universal semicircle');
  const L = E.phasorLifetimes(a, w); close(L.tauPhase, 2.5, 1e-9, 'phase lifetime'); close(L.tauMod, 2.5, 1e-9, 'modulation lifetime');
  // a 50:50 intensity mixture lies on the chord, inside the circle, and τφ < τm
  const m = { g: (E.phasorOf(1, w).g + E.phasorOf(4, w).g) / 2, s: (E.phasorOf(1, w).s + E.phasorOf(4, w).s) / 2 };
  assert.ok((m.g - 0.5) ** 2 + m.s ** 2 < 0.25); const Lm = E.phasorLifetimes(m, w); assert.ok(Lm.tauPhase < Lm.tauMod);
}
// CTF: with Cs = 0 and no amplitude contrast the first zero is at k = 1/√(λΔf).
{
  const lam = E.electronWavelength(300) / 100, k0 = 1 / Math.sqrt(lam * 1e4);
  close(E.ctf(k0, { kV: 300, defocusUm: 1, csMm: 0, amp: 0 }), 0, 1e-9, 'first CTF zero');
  close(E.ctf(0, { amp: 0.07 }), -0.07, 1e-12, 'amplitude contrast at k = 0');
  // Scherzer at 200 kV, Cs 1 mm: about 2.3 Å point resolution
  close(E.scherzer(200, 1).resolution, 2.3, 0.1, 'Scherzer resolution');
}
// Missing wedge: ±60° gives 1.55 elongation (Radermacher 1988); ±90° gives none; a full range reconstructs exactly.
{
  close(E.wedgeElongation(60), 1.55, 0.005, 'elongation at ±60°');
  close(E.wedgeElongation(89.999), 1, 1e-3, 'no wedge');
  const N = 32, img = Float64Array.from({ length: N * N }, (_, i) => ((i % N) - 16) ** 2 + ((i / N | 0) - 16) ** 2 < 20 ? 1 : 0);
  E.missingWedge(img, N, 90).forEach((v, i) => close(v, img[i], 1e-9, 'full tilt range'));
  const r = E.missingWedge(img, N, 45);
  assert.ok(r.some((v, i) => Math.abs(v - img[i]) > 0.05), 'wedge removes information');
}
console.log('sim_engine2: all tests passed');
