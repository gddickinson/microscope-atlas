// Photon budget (sim_engine_photon.js) against hand-calculated values.
import assert from 'node:assert/strict';
import { crossSection, photonFlux, powerDensity, excitationRate, emissionRate, collectionEfficiency, specAt, bandFraction, centralPixelFraction } from '../atlas/web/static/sim_engine.js';

const rel = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) <= tol, `${msg}: ${a} vs ${b}`);
rel(crossSection(55900), 2.137e-16, 1e-3, 'EGFP cross-section (3.82e-21 × ε)');
rel(photonFlux(1e6, 1, 488), 2.4566e21, 1e-3, '1 kW/cm² at 488 nm in photons/cm²/s'); // 1 kW = 1e6 mW
rel(powerDensity(10, 100), 0.12732, 1e-4, '10 mW over a 100 µm disc = 0.127 kW/cm²');
rel(excitationRate(55900, 1, 1e6, 1, 488), 5.25e5, 2e-3, 'EGFP at 1 kW/cm²');
rel(emissionRate(1e3, 0.6, 2.6), 600, 1e-5, 'linear regime: QY × k');
rel(emissionRate(1e15, 0.6, 2.6), 0.6 / 2.6e-9, 1e-5, 'saturation: QY / τ');
rel(collectionEfficiency(1.4, 1.518), 0.3068, 1e-3, 'NA 1.4 oil collects ~31%');
rel(collectionEfficiency(1.518, 1.518), 0.5, 1e-9, 'a half-space at most');
const spec = [[500, 0], [510, 1], [520, 1], [530, 0]];
rel(specAt(spec, 505), 0.5, 1e-12, 'interpolation'); assert.equal(specAt(spec, 600), 0);
rel(bandFraction(spec, 500, 530), 1, 1e-12, 'whole band'); rel(bandFraction(spec, 510, 520), 0.5, 1e-12, 'flat top is half the area');
rel(centralPixelFraction(1), 0.14659, 2e-3, 'σ = 1 px'); rel(centralPixelFraction(0.01), 1, 1e-6, 'tiny PSF');
console.log('sim_engine_photon: ok');
