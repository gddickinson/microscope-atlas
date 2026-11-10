// Image Lab physics (sim_engine_image.js via sim_engine.js) and the PackBits decoder in imagelab_io.js.
import assert from 'node:assert/strict';
import { rng, psfSigmaPx, binImage, cameraImage, imageStats, toSquare, powerSpectrum, blurPSF, rmsError, pearson } from '../atlas/web/static/sim_engine.js';
import { unpackBits } from '../atlas/web/static/imagelab_io.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// σ of the Gaussian PSF: FWHM 0.51 λ/NA → 520 nm, NA 1.4 → 189 nm FWHM, σ = 80.4 nm = 0.804 px at 100 nm pixels
near(psfSigmaPx(520, 1.4, 100), 0.51 * 520 / 1.4 / 2.3548 / 100, 1e-12, 'psf sigma');
near(psfSigmaPx(520, 1.4, 100), 0.8045, 1e-3, 'psf sigma value');

// binning conserves total signal
const N = 64, img = Float64Array.from({ length: N * N }, (_, i) => (i * 7919) % 13);
const sum = a => a.reduce((s, v) => s + v, 0);
near(sum(binImage(img, N, 4)), sum(img), 1e-9, 'binning conserves signal');
assert.equal(binImage(img, N, 4).length, 16 * 16);

// blur conserves signal (edges clamped, flat image stays flat)
const flat = new Float64Array(N * N).fill(5);
near(imageStats(blurPSF(flat, N, 520, 1.4, 50)).sd, 0, 1e-9, 'flat stays flat');

// camera noise: a flat field of 100 photons has mean 100 and variance 100 (shot noise); read noise adds in quadrature
const r = rng(3), cam = cameraImage(new Float64Array(128 * 128).fill(1), { photons: 100, bg: 0, read: 0, rand: r });
const st = imageStats(cam);
near(st.mean, 100, 0.5, 'Poisson mean'); near(st.sd ** 2, 100, 5, 'Poisson variance');
const cam2 = imageStats(cameraImage(new Float64Array(128 * 128).fill(1), { photons: 100, bg: 20, read: 5, rand: rng(4) }));
near(cam2.mean, 120, 0.5, 'background adds'); near(cam2.sd ** 2, 120 + 25, 7, 'read noise variance adds');

// resampling a constant gives the constant; a square onto itself is the identity
near(imageStats(toSquare(new Float64Array(30 * 20).fill(7), 30, 20, 16)).max, 7, 1e-12, 'resample constant');
assert.deepEqual(Array.from(toSquare(img, N, N, N)), Array.from(img));

// power spectrum of a cosine with 8 periods across 64 px peaks 8 px from the centre
const cosI = Float64Array.from({ length: N * N }, (_, i) => Math.cos(2 * Math.PI * 8 * (i % N) / N));
const P = powerSpectrum(cosI, N); let k = 0; for (let i = 1; i < P.length; i++) if (P[i] > P[k]) k = i;
assert.equal(Math.abs((k % N) - N / 2), 8); assert.equal(Math.floor(k / N), N / 2);

near(rmsError(img, img.map(v => 2 * v)), 0, 1e-9, 'rms error ignores scale');
near(pearson(img, img.map(v => 3 * v + 1)), 1, 1e-12, 'pearson ignores scale and offset');
near(pearson(img, img.map(v => -v)), -1, 1e-12, 'pearson anticorrelated');

// PackBits (Apple TN1023 example)
const packed = Uint8Array.from([0xFE, 0xAA, 0x02, 0x80, 0x00, 0x2A, 0xFD, 0xAA, 0x03, 0x80, 0x00, 0x2A, 0x22, 0xF7, 0xAA]);
const want = [0xAA, 0xAA, 0xAA, 0x80, 0x00, 0x2A, 0xAA, 0xAA, 0xAA, 0xAA, 0x80, 0x00, 0x2A, 0x22, ...Array(10).fill(0xAA)];
assert.deepEqual(Array.from(unpackBits(packed, want.length)), want);
console.log('sim_engine_image: ok');
