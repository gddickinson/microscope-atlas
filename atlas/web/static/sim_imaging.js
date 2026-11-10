// Simulations II (imaging): Richardson-Lucy deconvolution, wavefront aberrations and adaptive optics, FLIM phasors.
import { gaussBlur, richardsonLucy, aberratedPSF, marechal, ZERNIKE, phasorOf, phasorFromDecay, periodicDecay, phasorLifetimes, rng } from './sim_engine.js';
import { layout, addSlider, addButton, setReadout, canvas, heatmap, linePlot, div, CMAPS, fmt } from './sim_ui.js';

function figs(view, names, size = 220) {
  const wrap = div(view, 'canvases');
  return names.map(n => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, size, size); const cap = document.createElement('figcaption'); cap.textContent = n; f.appendChild(cap); return c; });
}

// Test specimen: filaments, close pairs of points and a ring on a dim background (64 x 64).
function phantom(N) {
  const a = new Float64Array(N * N).fill(2);
  const put = (x, y, v) => { const i = Math.round(y) * N + Math.round(x); if (x >= 0 && y >= 0 && x < N && y < N) a[i] += v; };
  for (let t = 0; t < 1; t += 0.004) { put(6 + 50 * t, 10 + 8 * t + 6 * Math.sin(6 * t), 60); put(8 + 20 * t, 50 - 38 * t, 60); }
  for (const [x, y, d] of [[40, 30, 3], [40, 40, 4], [52, 30, 5], [52, 40, 6]]) { put(x - d / 2, y, 300); put(x + d / 2, y, 300); }
  for (let t = 0; t < 2 * Math.PI; t += 0.05) put(22 + 7 * Math.cos(t), 44 + 7 * Math.sin(t), 40);
  return a;
}

function deconv(host) {
  const { controls, view, readout } = layout(host, 'A widefield image is the object blurred by the PSF plus photon noise. Richardson-Lucy deconvolution iterates u ← u · Hᵀ(d / Hu), the maximum-likelihood estimate for Poisson noise: it keeps the total signal, never goes negative and sharpens features step by step. With noise, too many iterations start fitting the noise itself, so the error against the truth has a minimum: that is why software stops early or adds regularisation.');
  const N = 64, truth = phantom(N);
  const st = { sigma: 2, photons: 400, iters: 30, seed: 1 };
  const [cT, cD, cR] = figs(view, ['Object (ground truth)', 'Recorded image (blur + noise)', 'Richardson-Lucy estimate']);
  const plot = div(view);
  const draw = () => {
    const rand = rng(st.seed), scale = st.photons / 300;
    const blurred = gaussBlur(truth, N, st.sigma), data = blurred.map(v => rand.poisson(v * scale) / scale);
    const tsum = truth.reduce((a, b) => a + b, 0);
    const err = u => Math.sqrt(u.reduce((s, v, i) => s + (v - truth[i]) ** 2, 0) / truth.reduce((s, v) => s + v * v, 0));
    let u = null; const curve = [[0, err(data)]];
    let best = [0, err(data)];
    for (let k = 1; k <= st.iters; k++) {
      u = richardsonLucy(data, N, st.sigma, 1, u);
      const e = err(u); curve.push([k, e]); if (e < best[1]) best = [k, e];
    }
    const vmax = Math.max(...truth);
    heatmap(cT, truth, N, N, CMAPS.hot, vmax * 0.6, 0.6);
    heatmap(cD, data, N, N, CMAPS.hot, null, 0.6);
    heatmap(cR, u || data, N, N, CMAPS.hot, null, 0.6);
    linePlot(plot, [{ pts: curve, color: '#3dff8f', label: 'relative error vs ground truth' }], { xlabel: 'iterations', ylabel: 'relative RMS error', ymin: 0, H: 220, marks: [{ x: best[0], label: `minimum at ${best[0]}` }] });
    const usum = (u || data).reduce((a, b) => a + b, 0);
    setReadout(readout, [['PSF FWHM', `${(2.355 * st.sigma).toFixed(1)} px`], ['Error of raw image', curve[0][1].toFixed(3)], [`Error after ${st.iters} iterations`, curve[curve.length - 1][1].toFixed(3)],
      ['Best iteration', `${best[0]} (${best[1].toFixed(3)})`], ['Total signal kept', `${(100 * usum / tsum).toFixed(1)}%`]]);
  };
  addSlider(controls, { id: 'dc-s', label: 'PSF width σ', min: 0.8, max: 4, step: 0.1, value: st.sigma, unit: ' px' }, v => { st.sigma = v; draw(); });
  addSlider(controls, { id: 'dc-p', label: 'Photons at a bright point', min: 5, max: 2000, step: 5, value: st.photons }, v => { st.photons = v; draw(); });
  addSlider(controls, { id: 'dc-i', label: 'Iterations', min: 1, max: 200, step: 1, value: st.iters }, v => { st.iters = v; draw(); });
  addButton(controls, 'New noise', () => { st.seed++; draw(); }, true);
  draw();
}

const MODES = [['defocus', 'Defocus Z4'], ['astigmatism', 'Astigmatism Z6'], ['coma', 'Coma Z8'], ['trefoil', 'Trefoil Z10'], ['spherical', 'Spherical Z11']];
const PRESETS = {
  Perfect: {}, 'Deep tissue': { spherical: 0.12, defocus: 0.05 }, 'Tilted coverslip': { coma: 0.08, astigmatism: 0.05 },
  'Wrong collar': { spherical: 0.07 }, 'After AO': { spherical: 0.01, coma: 0.01 },
};

function aberration(host) {
  const { controls, view, readout } = layout(host, 'A perfect lens turns a flat wavefront into a converging sphere. Errors in that wavefront, written as Zernike modes, spread light out of the focal spot: the Strehl ratio is the peak intensity relative to perfect. Maréchal: S ≈ exp(−(2πσ)²) for an rms error σ in waves, so λ/14 rms gives S = 0.8, the usual "diffraction-limited" line. Adaptive optics measures the wavefront (or optimises an image metric) and applies the opposite shape with a deformable mirror or spatial light modulator.');
  const st = Object.fromEntries(MODES.map(([k]) => [k, 0]));
  const [cP, cW] = figs(view, ['Focal spot (PSF, gamma 0.5)', 'Pupil phase (red +, blue −)'], 240);
  const plot = div(view);
  const N = 128, pupil = 16, crop = 40;
  const draw = () => {
    const { psf, strehl, rms } = aberratedPSF(N, st, pupil);
    const c = new Float64Array(crop * crop);
    for (let y = 0; y < crop; y++) for (let x = 0; x < crop; x++) c[y * crop + x] = psf[(y + N / 2 - crop / 2) * N + x + N / 2 - crop / 2];
    heatmap(cP, c, crop, crop, CMAPS.hot, 1, 0.5);
    const M = 64, ph = new Float64Array(M * M), ctx = cW, img = ctx.createImageData(M, M);
    let pmax = 1e-9;
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
      const dx = (x - M / 2 + 0.5) / (M / 2), dy = (y - M / 2 + 0.5) / (M / 2), r = Math.hypot(dx, dy);
      if (r > 1) { ph[y * M + x] = NaN; continue; }
      let v = 0; for (const [k] of MODES) if (st[k]) v += st[k] * ZERNIKE[k](r, Math.atan2(dy, dx));
      ph[y * M + x] = v; pmax = Math.max(pmax, Math.abs(v));
    }
    for (let i = 0; i < M * M; i++) {
      const v = ph[i], o = i * 4;
      if (Number.isNaN(v)) { img.data[o + 3] = 0; continue; }
      const t = v / pmax;
      img.data[o] = t > 0 ? 40 + 215 * t : 40; img.data[o + 1] = 40; img.data[o + 2] = t < 0 ? 40 - 215 * t : 40; img.data[o + 3] = 255;
    }
    const off = document.createElement('canvas'); off.width = M; off.height = M; off.getContext('2d').putImageData(img, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, ctx.canvas.width, ctx.canvas.height);
    const prof = [], ideal = aberratedPSF(N, {}, pupil).psf;
    for (let x = -crop / 2; x < crop / 2; x++) prof.push([x, psf[(N / 2) * N + N / 2 + x], ideal[(N / 2) * N + N / 2 + x]]);
    linePlot(plot, [{ pts: prof.map(p => [p[0], p[2]]), color: '#8fa3c8', dash: '4 3', label: 'perfect' }, { pts: prof.map(p => [p[0], p[1]]), color: '#ff3fa4', label: 'aberrated' }],
      { xlabel: 'position across the focus (pixels)', ylabel: 'intensity (perfect peak = 1)', ymin: 0, ymax: 1.05, H: 200 });
    setReadout(readout, [['rms wavefront error', `${rms.toFixed(3)} λ${rms ? ` (λ/${(1 / rms).toFixed(0)})` : ''}`], ['Strehl (computed)', strehl.toFixed(3)], ['Strehl (Maréchal)', marechal(rms).toFixed(3)],
      ['Verdict', strehl >= 0.8 ? 'diffraction-limited' : strehl >= 0.3 ? 'degraded: dimmer, blurrier focus' : 'badly aberrated']]);
  };
  const inputs = MODES.map(([k, l]) => addSlider(controls, { id: 'ab-' + k, label: l + ' (waves rms)', min: -0.3, max: 0.3, step: 0.005, value: 0 }, v => { st[k] = v; draw(); }));
  const set = p => { MODES.forEach(([k], i) => { st[k] = p[k] || 0; inputs[i].value = st[k]; inputs[i].dispatchEvent(new Event('input')); }); };
  const sel = document.createElement('div');
  sel.className = 'ctl';
  sel.innerHTML = `<label for="ab-scen">Scenario</label><select id="ab-scen">${Object.keys(PRESETS).map(k => `<option>${k}</option>`).join('')}</select>`;
  controls.appendChild(sel);
  sel.querySelector('select').onchange = e => set(PRESETS[e.target.value]);
  addButton(controls, 'Correct it (adaptive optics)', () => { sel.querySelector('select').value = 'Perfect'; set({}); });
  draw();
}

function phasor(host) {
  const { controls, view, readout } = layout(host, 'The phasor approach (Digman et al. 2008) turns each pixel\'s fluorescence decay into two numbers, g = ⟨cos ωt⟩ and s = ⟨sin ωt⟩, with no fitting. Every single-exponential lifetime lands on the universal semicircle; a mixture of two lifetimes lands on the straight line between them, at a position set by their intensity fractions. So FRET, metabolic states (free vs bound NADH) or two dyes show up as clouds you can read straight off the plot.');
  const st = { t1: 0.4, t2: 3.0, f: 0.5, mhz: 80, photons: 500 };
  const svg = div(view);
  const draw = () => {
    const T = 1000 / st.mhz, w = 2 * Math.PI / T, nb = 64;
    const p1 = phasorOf(st.t1, w), p2 = phasorOf(st.t2, w);
    const mix = { g: st.f * p1.g + (1 - st.f) * p2.g, s: st.f * p1.s + (1 - st.f) * p2.s };
    const d1 = periodicDecay(st.t1, T, nb), d2 = periodicDecay(st.t2, T, nb);
    const s1 = d1.reduce((a, b) => a + b), s2 = d2.reduce((a, b) => a + b);
    const shape = d1.map((v, i) => st.f * v / s1 + (1 - st.f) * d2[i] / s2), rand = rng(7), cloud = [];
    for (let k = 0; k < 250; k++) { const ph = phasorFromDecay(shape.map(v => rand.poisson(v * st.photons) + 1e-9), T); cloud.push(ph); }
    const W = 640, H = 360, X = g => 50 + g * 540, Y = s => 320 - s * 540;
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}"><line x1="${X(0)}" x2="${X(1)}" y1="${Y(0)}" y2="${Y(0)}" stroke="#4a5a7a"/>`;
    s += `<path d="M${X(0)} ${Y(0)} A270 270 0 0 1 ${X(1)} ${Y(0)}" fill="none" stroke="#c6d4ee" stroke-width="1.5"/>`;
    for (const t of [0.5, 1, 2, 4, 8]) { const p = phasorOf(t, w); s += `<circle cx="${X(p.g)}" cy="${Y(p.s)}" r="2.5" fill="#8fa3c8"/><text class="axisl" x="${X(p.g) + 4}" y="${Y(p.s) - 6}">${t} ns</text>`; }
    for (const c of cloud) s += `<circle cx="${X(c.g).toFixed(1)}" cy="${Y(c.s).toFixed(1)}" r="1.6" fill="#3dff8f" opacity="0.45"/>`;
    s += `<line x1="${X(p1.g)}" y1="${Y(p1.s)}" x2="${X(p2.g)}" y2="${Y(p2.s)}" stroke="#ffd23f" stroke-dasharray="4 3"/>`;
    s += `<circle cx="${X(p1.g)}" cy="${Y(p1.s)}" r="6" fill="#4f9dff"/><circle cx="${X(p2.g)}" cy="${Y(p2.s)}" r="6" fill="#ff3fa4"/><circle cx="${X(mix.g)}" cy="${Y(mix.s)}" r="5" fill="none" stroke="#ffd23f" stroke-width="2"/>`;
    s += `<text class="axisl" x="${X(0.5)}" y="${H - 8}" text-anchor="middle">g</text><text class="axisl" x="20" y="${Y(0.3)}">s</text>`;
    svg.innerHTML = s + `<text class="axisl" x="${W - 20}" y="24" text-anchor="end" fill="#4f9dff">τ1 = ${st.t1} ns</text><text class="axisl" x="${W - 20}" y="40" text-anchor="end" fill="#ff3fa4">τ2 = ${st.t2} ns</text><text class="axisl" x="${W - 20}" y="56" text-anchor="end" fill="#3dff8f">pixels, ${st.photons} photons each</text></svg>`;
    const L = phasorLifetimes(mix, w);
    const sd = Math.sqrt(cloud.reduce((a, c) => a + (c.g - mix.g) ** 2 + (c.s - mix.s) ** 2, 0) / cloud.length);
    setReadout(readout, [['Modulation frequency', `${st.mhz} MHz (ω = ${fmt(w)} rad/ns)`], ['Mixture phasor (g, s)', `${mix.g.toFixed(3)}, ${mix.s.toFixed(3)}`],
      ['Phase lifetime τφ', `${L.tauPhase.toFixed(2)} ns`], ['Modulation lifetime τm', `${L.tauMod.toFixed(2)} ns`], ['Spread of pixel cloud', fmt(sd)],
      ['Reading', Math.abs(L.tauPhase - L.tauMod) > 0.05 ? 'τφ ≠ τm: more than one lifetime present' : 'τφ ≈ τm: looks single-exponential']]);
  };
  addSlider(controls, { id: 'ph-1', label: 'Short lifetime τ1', min: 0.1, max: 3, step: 0.05, value: st.t1, unit: ' ns' }, v => { st.t1 = v; draw(); });
  addSlider(controls, { id: 'ph-2', label: 'Long lifetime τ2', min: 1, max: 10, step: 0.1, value: st.t2, unit: ' ns' }, v => { st.t2 = v; draw(); });
  addSlider(controls, { id: 'ph-f', label: 'Fraction of photons from τ1', min: 0, max: 1, step: 0.01, value: st.f }, v => { st.f = v; draw(); });
  addSlider(controls, { id: 'ph-m', label: 'Laser repetition / modulation', min: 20, max: 160, step: 1, value: st.mhz, unit: ' MHz' }, v => { st.mhz = v; draw(); });
  addSlider(controls, { id: 'ph-n', label: 'Photons per pixel', min: 50, max: 10000, step: 50, value: st.photons }, v => { st.photons = v; draw(); });
  draw();
}

export const IMAGING = { deconv, aberration, phasor };
