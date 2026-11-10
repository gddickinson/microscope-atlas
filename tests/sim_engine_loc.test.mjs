// Spot detection and 2D Gaussian fitting (sim_engine_loc.js): exact recovery without noise, Thompson-level precision with it.
import assert from 'node:assert/strict';
import { rng, detectSpots, fitGaussian2D, localize, matchLocalizations, robustNoise, locPrecision } from '../atlas/web/static/sim_engine.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const N = 64;
function frame(spots, { A = 100, bg = 10, s = 1.3, rand = null } = {}) {
  const img = new Float64Array(N * N);
  for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) {
    let m = bg; for (const [x, y] of spots) m += A * Math.exp(-((u - x) ** 2 + (v - y) ** 2) / (2 * s * s));
    img[v * N + u] = rand ? rand.poisson(m) : m;
  }
  return img;
}

// noise-free: the fit returns the generating parameters
const truth = [[20.3, 15.7], [44.81, 40.2], [12.5, 50.05]];
const clean = frame(truth);
const det = detectSpots(clean, N, { sigma: 1.3, k: 5 });
assert.equal(det.length, 3, 'three spots found');
for (const [x, y] of truth) {
  const f = fitGaussian2D(clean, N, Math.round(x), Math.round(y), { r: 4 });
  near(f.x, x, 1e-5, 'x'); near(f.y, y, 1e-5, 'y'); near(f.A, 100, 1e-3, 'A'); near(f.bg, 10, 1e-3, 'bg'); near(f.sigma, 1.3, 1e-5, 'sigma');
  near(f.photons, 2 * Math.PI * 1.3 * 1.3 * 100, 0.1, 'photons');
}

// robust noise of Poisson(100) is about 10
const flat = Float64Array.from({ length: 128 * 128 }, (r => () => r.poisson(100))(rng(2)));
near(robustNoise(flat).sd, 10, 0.6, 'MAD noise');

// with shot noise: repeated frames, scatter of x close to the Thompson/Mortensen precision (pixel units)
const r = rng(7), xs = [];
for (let k = 0; k < 300; k++) {
  const x = 32 + r() - 0.5, y = 32 + r() - 0.5, img = frame([[x, y]], { A: 60, bg: 5, rand: r });
  const f = fitGaussian2D(img, N, 32, 32, { r: 4 });
  if (f.ok) xs.push(f.x - x);
}
const sd = Math.sqrt(xs.reduce((s, v) => s + v * v, 0) / xs.length);
const pred = locPrecision(1.3, 1, 2 * Math.PI * 1.3 * 1.3 * 60, 5); // pixel units
assert.ok(xs.length > 290, 'fits converge');
assert.ok(sd > 0.8 * pred && sd < 1.6 * pred, `precision ${sd.toFixed(3)} vs predicted ${pred.toFixed(3)} px`);

// localize + match on a noisy multi-spot frame
const noisy = frame(truth, { A: 80, bg: 8, rand: rng(11) });
const m = matchLocalizations(localize(noisy, N, { sigma: 1.3, k: 5, r: 4 }), truth);
assert.equal(m.matched, 3); assert.equal(m.extra, 0); assert.ok(m.rms < 0.2, `rms ${m.rms}`);
console.log(`sim_engine_loc: ok (precision ${sd.toFixed(3)} px vs Thompson ${pred.toFixed(3)} px)`);
