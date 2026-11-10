// Simulations II (functional, part 2): FCS from a simulated photon trace, spinning-disk pinhole crosstalk, expansion factor.
import { fcsTrace, autocorrelation, fcsG2D, fcsConcentration, diskSectioning, expansionResolution, gaussBlur, rng } from './sim_engine.js';
import { layout, addSlider, addButton, setReadout, canvas, heatmap, linePlot, div, CMAPS, fmt } from './sim_ui.js';

function fcs(host) {
  const { controls, view, readout } = layout(host, 'Fluorescence correlation spectroscopy watches the intensity from a tiny focal spot flicker as molecules diffuse in and out. The autocorrelation G(τ) of that trace has an amplitude 1/N (fewer molecules, bigger relative fluctuations) and decays on the diffusion time τD = w²/4D. So one measurement gives concentration and mobility. Here molecules are simulated diffusing in a membrane-like 2D sheet through a Gaussian spot, and the curve from the simulated trace is compared with the 2D model G(τ) = (1/N)/(1 + τ/τD). Solution FCS uses the 3D form with the extra axial term.');
  const st = { n: 60, D: 1, w: 0.3, seed: 1 };
  const plot = div(view), trace = div(view);
  const L = 4, dt = 0.0005, steps = 40000;
  const draw = () => {
    const tr = fcsTrace(st.n, L, st.w, st.D, dt, steps, rng(st.seed));
    const lags = []; for (let k = 1; k < 4000; k = Math.max(k + 1, Math.round(k * 1.25))) lags.push(k);
    const G = autocorrelation(tr, lags), N = st.n / (L * L) * Math.PI * st.w * st.w, tauD = st.w * st.w / (4 * st.D);
    linePlot(plot, [{ pts: lags.map((k, i) => [k * dt * 1000, G[i]]), color: '#3dff8f', dots: true, label: 'G(τ) from the simulated trace' },
      { pts: lags.map(k => [k * dt * 1000, fcsG2D(k * dt, N, tauD)]), color: '#ff3fa4', label: 'model (1/N)/(1 + τ/τD)' }],
      { xlabel: 'lag τ (ms, log scale)', ylabel: 'G(τ)', logx: true, xmin: dt * 1000, xmax: 4000 * dt * 1000, ymin: 0, H: 260, marks: [{ x: tauD * 1000, label: 'τD' }] });
    let half = NaN;
    for (let i = 1; i < G.length; i++) if (G[i] <= G[0] / 2) { const f = (G[i - 1] - G[0] / 2) / (G[i - 1] - G[i]); half = (lags[i - 1] + f * (lags[i] - lags[i - 1])) * dt; break; }
    const seg = Array.from(tr.slice(0, 4000), (v, i) => [i * dt * 1000, v]);
    linePlot(trace, [{ pts: seg, color: '#4f9dff', width: 1, label: 'intensity trace (first 2 s)' }], { xlabel: 'time (ms)', ylabel: 'intensity', ymin: 0, H: 170 });
    setReadout(readout, [['Mean molecules in spot N = c·πw²', N.toFixed(2)], ['1/G(0) from the trace', (1 / G[0]).toFixed(2)], ['Diffusion time τD = w²/4D', `${(tauD * 1000).toFixed(1)} ms`],
      ['τ½ measured (G falls to half)', `${(half * 1000).toFixed(1)} ms`], ['D = w²/(4 τ½) from the trace', `${(st.w * st.w / (4 * half)).toFixed(2)} µm²/s (set: ${st.D})`], ['Same N in a 3D confocal spot (w, z = 5w)', `${fcsConcentration(N, st.w, 5).toFixed(1)} nM`],
      ['Rule of thumb', 'FCS works best at N ≈ 0.1-100: about nM concentrations']]);
  };
  addSlider(controls, { id: 'f-n', label: 'Molecules in the 4 × 4 µm sheet', min: 5, max: 400, step: 5, value: st.n }, v => { st.n = v; draw(); });
  addSlider(controls, { id: 'f-d', label: 'Diffusion coefficient D', min: 0.1, max: 5, step: 0.1, value: st.D, unit: ' µm²/s' }, v => { st.D = v; draw(); });
  addSlider(controls, { id: 'f-w', label: 'Spot radius w (1/e²)', min: 0.15, max: 0.6, step: 0.01, value: st.w, unit: ' µm' }, v => { st.w = v; draw(); });
  addButton(controls, 'New measurement', () => { st.seed++; draw(); }, true);
  draw();
}

function disk(host) {
  const { controls, view, readout } = layout(host, 'A spinning-disk confocal scans thousands of pinholes at once. In focus each pinhole sees its own spot. Out of focus the light from one pinhole spreads into a blur disc that grows with depth (radius z·tan α), and a single pinhole lets back only (a/r)² of it. With a whole array, defocused light also comes back through the neighbouring pinholes, so rejection levels off at the fill factor πa²/p² (pinhole area over the area per pinhole). In thick, densely labelled samples that floor becomes haze; widely spaced pinholes (and pinhole-to-pinhole spacings large compared with the blur) reduce it at the cost of fewer pinholes and slower full-field coverage.');
  const st = { d: 0.5, p: 2.5, NA: 1.4, T: 30 };
  const plot = div(view);
  const draw = () => {
    const n = 1.518, a = st.d / 2;
    const zs = []; for (let z = 0; z <= 6; z += 0.02) zs.push(z);
    const rows = zs.map(z => diskSectioning(z, a, st.p, st.NA, n));
    linePlot(plot, [{ pts: zs.map(z => [z, 1]), color: '#8fa3c8', dash: '4 3', label: 'widefield: every plane counts fully' },
      { pts: zs.map((z, i) => [z, rows[i].single]), color: '#3dff8f', label: 'single pinhole (point-scanning confocal)' },
      { pts: zs.map((z, i) => [z, rows[i].disk]), color: '#ff3fa4', label: 'pinhole array (spinning disk)' }],
      { xlabel: 'distance from focus z (µm, sample space)', ylabel: 'light returned from a thin layer', ymin: 0, ymax: 1.05, H: 280, hmarks: [{ y: rows[0].fill, label: 'fill factor', color: '#ff3fa4' }] });
    // a uniformly labelled thick sample: background from planes beyond ±0.5 µm relative to a 1 µm in-focus slab
    const integ = key => { let s = 0; for (let z = 0.5; z <= st.T / 2; z += 0.05) s += 2 * 0.05 * diskSectioning(z, a, st.p, st.NA, n)[key]; return s; };
    const sb = key => 1 / Math.max(1e-9, integ(key));
    setReadout(readout, [['Fill factor πa²/p²', `${(rows[0].fill * 100).toFixed(1)}%`], ['Crosstalk floor reached at z ≈', `${(a / Math.sqrt(rows[0].fill) / Math.tan(Math.asin(st.NA / n))).toFixed(1)} µm`],
      [`Signal/background, ${st.T} µm thick sample: widefield`, fmt(1 / Math.max(1e-9, st.T - 1))], ['…single pinhole', fmt(sb('single'))], ['…spinning disk', fmt(sb('disk'))]]);
  };
  addSlider(controls, { id: 'sd-d', label: 'Pinhole diameter (sample space)', min: 0.2, max: 2, step: 0.05, value: st.d, unit: ' µm' }, v => { st.d = v; draw(); });
  addSlider(controls, { id: 'sd-p', label: 'Pinhole pitch (sample space)', min: 1, max: 8, step: 0.1, value: st.p, unit: ' µm' }, v => { st.p = v; draw(); });
  addSlider(controls, { id: 'sd-n', label: 'Objective NA (oil)', min: 0.3, max: 1.45, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  addSlider(controls, { id: 'sd-t', label: 'Sample thickness', min: 2, max: 100, step: 1, value: st.T, unit: ' µm' }, v => { st.T = v; draw(); });
  draw();
}

// Ground-truth label sites (nm, pre-expansion): an eightfold ring 100 nm across and two filaments 40 nm apart.
function sites() {
  const s = [];
  for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; for (let j = 0; j < 3; j++) s.push([-90 + 50 * Math.cos(t), 50 * Math.sin(t)]); }
  for (let y = -180; y <= 180; y += 6) { s.push([70, y]); s.push([110, y]); }
  return s;
}

function expansion(host) {
  const { controls, view, readout } = layout(host, 'Expansion microscopy anchors the labels (or the proteins) into a swellable hydrogel, digests or denatures the specimen and swells the gel in water. Everything moves apart by the linear expansion factor E, so an ordinary diffraction-limited microscope resolves d/E in the original units. Two things limit the gain: the label sits some distance from its target (a primary plus secondary antibody adds roughly 10-20 nm, and that offset expands too), and the fluorophores are diluted by E³ in volume, so images get dimmer. Gel distortions are checked by imaging the same cells before and after expansion.');
  const st = { E: 4, link: 10, d: 250 };
  const S = sites(), N = 128, fov = 400, px = fov / N;
  const wrap = div(view, 'canvases');
  const mk = cap => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 256, 256); const fc = document.createElement('figcaption'); fc.textContent = cap; f.appendChild(fc); return c; };
  const cT = mk('Label sites (400 nm field)'), cI = mk('Image, in pre-expansion units');
  const plot = div(view);
  const draw = () => {
    const rand = rng(5), truth = new Float64Array(N * N), lab = new Float64Array(N * N);
    const put = (a, x, y) => { const i = Math.round(x / px + N / 2), j = Math.round(y / px + N / 2); if (i >= 0 && j >= 0 && i < N && j < N) a[j * N + i] += 1; };
    for (const [x, y] of S) { put(truth, x, y); const t = rand() * 2 * Math.PI, r = st.link * Math.abs(rand.normal()); put(lab, x + r * Math.cos(t), y + r * Math.sin(t)); }
    heatmap(cT, gaussBlur(truth, N, 0.7), N, N, CMAPS.green);
    const res = st.d / st.E;
    heatmap(cI, gaussBlur(lab, N, res / 2.355 / px), N, N, CMAPS.green);
    const pts = []; for (let E = 1; E <= 25; E += 0.25) pts.push([E, expansionResolution(st.d, E, st.link)]);
    linePlot(plot, [{ pts, color: '#3dff8f', label: 'effective resolution √((d/E)² + ℓ²)' }, { pts: pts.map(p => [p[0], st.d / p[0]]), color: '#8fa3c8', dash: '4 3', label: 'd/E (labels on target)' }],
      { xlabel: 'linear expansion factor E', ylabel: 'resolution (nm, original units)', ymin: 0, xmin: 1, xmax: 25, H: 220, marks: [{ x: st.E, label: `E = ${st.E}` }] });
    setReadout(readout, [['Optical resolution d / E', `${res.toFixed(0)} nm`], ['With label displacement ℓ', `${expansionResolution(st.d, st.E, st.link).toFixed(0)} nm`],
      ['Label density after expansion', `1/${fmt(st.E ** 3)} per volume`], ['Gel size for a 1 mm sample', `${st.E} mm across`],
      ['Ring (100 nm) resolved?', expansionResolution(st.d, st.E, st.link) < 50 ? 'yes' : 'not yet']]);
  };
  addSlider(controls, { id: 'e-e', label: 'Expansion factor E', min: 1, max: 20, step: 0.5, value: st.E, unit: '×' }, v => { st.E = v; draw(); });
  addSlider(controls, { id: 'e-l', label: 'Label displacement ℓ', min: 0, max: 25, step: 1, value: st.link, unit: ' nm' }, v => { st.link = v; draw(); });
  addSlider(controls, { id: 'e-d', label: 'Microscope resolution d', min: 120, max: 400, step: 5, value: st.d, unit: ' nm' }, v => { st.d = v; draw(); });
  draw();
}

export const FUNCTION = { fcs, disk, expansion };
