// Fluorescence, detection, dynamics and electron simulations: Jablonski, FRET, camera noise, FRAP, SPT/MSD, electron wavelength.
import { fretEfficiency, cameraSNR, rng, randomWalk, msd, fitMSD, electronWavelength } from './sim_engine.js';
import { layout, addSlider, addSeg, addButton, setReadout, canvas, heatmap, linePlot, div, animate, CMAPS, fmt, arrMax } from './sim_ui.js';

function jablonski(host) {
  const { controls, view, readout } = layout(host, 'A fluorophore absorbs a photon (femtoseconds), relaxes to the bottom of the excited state (picoseconds), then emits a longer-wavelength photon after a nanosecond-scale lifetime. Competing paths, non-radiative decay and intersystem crossing to the triplet state, lower the quantum yield; the triplet state drives blinking and photobleaching.');
  const st = { tau: 4, qy: 0.8, isc: 0.01 };
  const svg = div(view), plot = div(view);
  svg.innerHTML = `<svg class="plot" viewBox="0 0 640 300">
    <style>.lv{stroke:#e8f1ff;stroke-width:3}.vb{stroke:#4a5a7a;stroke-width:1}.jt{fill:#c6d4ee;font:12px ui-monospace,monospace}
      @keyframes up{from{transform:translateY(0)}to{transform:translateY(-190px)}} .ph{animation:pulse 2.4s infinite} @keyframes pulse{0%,100%{opacity:.25}50%{opacity:1}}</style>
    ${[250, 236, 222, 208].map((y, i) => `<line class="${i ? 'vb' : 'lv'}" x1="60" x2="300" y1="${y}" y2="${y}"/>`).join('')}
    ${[70, 56, 42].map((y, i) => `<line class="${i ? 'vb' : 'lv'}" x1="60" x2="300" y1="${y}" y2="${y}"/>`).join('')}
    ${[130, 118].map((y, i) => `<line class="${i ? 'vb' : 'lv'}" x1="380" x2="560" y1="${y}" y2="${y}"/>`).join('')}
    <text class="jt" x="20" y="254">S0</text><text class="jt" x="20" y="74">S1</text><text class="jt" x="570" y="134">T1</text>
    <line x1="100" y1="250" x2="100" y2="42" stroke="#4f9dff" stroke-width="4" class="ph"/><text class="jt" x="70" y="290" fill="#4f9dff">absorption ~fs</text>
    <path d="M140 42 q8 8 0 14" stroke="#ffd23f" fill="none" stroke-width="2"/><text class="jt" x="120" y="30">vibrational relaxation ~ps</text>
    <line x1="180" y1="70" x2="180" y2="236" stroke="#3dff8f" stroke-width="4" class="ph" style="animation-delay:.6s"/><text class="jt" x="160" y="290" fill="#3dff8f">fluorescence ~ns</text>
    <path d="M240 70 q12 40 0 80 q-12 40 0 98" stroke="#8fa3c8" fill="none" stroke-dasharray="3 3" stroke-width="2"/><text class="jt" x="230" y="280">non-radiative</text>
    <line x1="300" y1="70" x2="400" y2="130" stroke="#ff3fa4" stroke-width="2" stroke-dasharray="5 4"/><text class="jt" x="310" y="90" fill="#ff3fa4">intersystem crossing</text>
    <line x1="470" y1="130" x2="470" y2="250" stroke="#b77bff" stroke-width="2"/><line x1="300" y1="250" x2="470" y2="250" stroke="#b77bff" stroke-width="1"/><text class="jt" x="480" y="200" fill="#b77bff">phosphorescence / dark state µs-s</text>
    <text class="jt" x="380" y="160" fill="#ff5c7a">T1 + O2 → reactive oxygen → bleaching</text></svg>`;
  const draw = () => {
    const kr = st.qy / st.tau, knr = (1 - st.qy) / st.tau;
    const pts = [];
    for (let t = 0; t <= 20; t += 0.1) pts.push([t, Math.exp(-t / st.tau)]);
    const half = []; for (let t = 0; t <= 20; t += 0.1) half.push([t, Math.exp(-t / (st.tau / 2))]);
    linePlot(plot, [{ pts, color: '#3dff8f', label: `decay, τ = ${st.tau} ns` }, { pts: half, color: '#ff3fa4', dash: '4 3', label: 'quenched (e.g. FRET), τ/2' }], { xlabel: 'time after pulse (ns)', ylabel: 'fluorescence', ymin: 0, ymax: 1.05, H: 220 });
    setReadout(readout, [['Radiative rate kr = Φ/τ', `${fmt(kr)} ns⁻¹`], ['Non-radiative knr', `${fmt(knr)} ns⁻¹`], ['Natural lifetime 1/kr', `${(1 / kr).toFixed(1)} ns`],
      ['Photons before bleaching (Φ/Φbleach)', st.isc > 0 ? `~${fmt(st.qy / (st.isc * 1e-3))}` : '∞'], ['Max emission rate ~1/τ', `${fmt(1e9 / st.tau)} s⁻¹`]]);
  };
  addSlider(controls, { id: 'tau', label: 'Lifetime τ', min: 0.5, max: 10, step: 0.1, value: st.tau, unit: ' ns' }, v => { st.tau = v; draw(); });
  addSlider(controls, { id: 'qy', label: 'Quantum yield Φ', min: 0.05, max: 1, step: 0.01, value: st.qy }, v => { st.qy = v; draw(); });
  addSlider(controls, { id: 'isc', label: 'Bleach probability per 1000 cycles', min: 0.001, max: 0.1, step: 0.001, value: st.isc }, v => { st.isc = v; draw(); });
  draw();
}

const PAIRS = { 'CFP-YFP': 4.9, 'EGFP-mCherry': 5.1, 'Cy3-Cy5': 5.4, 'Alexa 488-Alexa 594': 6.0, 'Alexa 488-Alexa 555': 7.0 };

function fret(host) {
  const { controls, view, readout } = layout(host, 'FRET transfers excitation from a donor to a nearby acceptor without a photon, with efficiency E = 1/(1 + (r/R0)⁶). The steep sixth-power dependence makes it a molecular ruler between roughly 0.5 R0 and 1.5 R0 (about 2-10 nm). R0 values below are typical literature figures and depend on orientation (κ²) and the medium.');
  const st = { pair: 'EGFP-mCherry', r: 5, tauD: 2.6 };
  const plot = div(view);
  const draw = () => {
    const series = Object.entries(PAIRS).map(([k, R0], i) => ({ pts: Array.from({ length: 121 }, (_, j) => [j / 10, fretEfficiency(j / 10, R0)]), color: ['#4f9dff', '#3dff8f', '#ff3fa4', '#ffd23f', '#b77bff'][i], width: k === st.pair ? 3.5 : 1.3, label: `${k} (R0 ${R0} nm)` }));
    const R0 = PAIRS[st.pair], E = fretEfficiency(st.r, R0);
    linePlot(plot, series, { xlabel: 'donor-acceptor distance r (nm)', ylabel: 'FRET efficiency E', ymin: 0, ymax: 1.05, xmin: 0, xmax: 12, marks: [{ x: st.r, label: `r = ${st.r} nm` }], hmarks: [{ y: 0.5, label: 'E = 0.5 at r = R0', color: '#8fa3c8' }] });
    setReadout(readout, [['Efficiency E', E.toFixed(2)], ['Donor lifetime with acceptor', `${(st.tauD * (1 - E)).toFixed(2)} ns`], ['Sensitive range (E 0.1-0.9)', `${(R0 * Math.pow(1 / 0.9 - 1, 1 / 6)).toFixed(1)}-${(R0 * Math.pow(9, 1 / 6)).toFixed(1)} nm`],
      ['Measured by', 'acceptor sensitization, donor dequenching after acceptor bleach, or FLIM']]);
  };
  addSeg(controls, 'Pair', Object.keys(PAIRS).map(k => [k, k]), st.pair, v => { st.pair = v; draw(); });
  addSlider(controls, { id: 'r', label: 'Distance r', min: 1, max: 12, step: 0.1, value: st.r, unit: ' nm' }, v => { st.r = v; draw(); });
  addSlider(controls, { id: 'td', label: 'Donor lifetime alone', min: 1, max: 5, step: 0.1, value: st.tauD, unit: ' ns' }, v => { st.tauD = v; draw(); });
  draw();
}

const CAMS = {
  CCD: { qe: 0.6, read: 6, F: 1, gain: 1, color: '#8fa3c8' },
  EMCCD: { qe: 0.95, read: 50, F: Math.SQRT2, gain: 300, color: '#ff3fa4' },
  sCMOS: { qe: 0.82, read: 1.2, F: 1, gain: 1, color: '#3dff8f' },
  qCMOS: { qe: 0.85, read: 0.3, F: 1, gain: 1, color: '#ffd23f' },
};

function noise(host) {
  const { controls, view, readout } = layout(host, 'Every image carries photon shot noise (√N). Cameras add read noise per pixel per frame; EMCCDs multiply electrons before readout, making read noise negligible but adding excess noise (factor √2, like halving QE). At a few photons per pixel the EMCCD or a low-noise qCMOS wins; above ~10-20 photons modern sCMOS matches or beats it.');
  const st = { S: 5, bg: 1 };
  const wrap = div(view, 'canvases');
  const ctxs = Object.keys(CAMS).map(k => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 220, 220); const cap = document.createElement('figcaption'); cap.textContent = k; f.appendChild(cap); return [k, c]; });
  const plot = div(view);
  const N = 64, rand = rng(3);
  const scene = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const r = Math.hypot(i - 32, j - 30);
    scene[j * N + i] = (r < 24 ? 0.3 : 0) + (Math.abs(r - 18) < 1.5 ? 0.7 : 0) + Math.exp(-((i - 26) ** 2 + (j - 26) ** 2) / 8) + Math.exp(-((i - 38) ** 2 + (j - 35) ** 2) / 8);
  }
  const draw = () => {
    for (const [k, ctx] of ctxs) {
      const cam = CAMS[k], img = new Float32Array(N * N);
      for (let p = 0; p < N * N; p++) {
        const e = rand.poisson(cam.qe * (scene[p] * st.S + st.bg));
        const amp = cam.F > 1 ? e + Math.sqrt(e) * rand.normal() : e;
        img[p] = Math.max(0, amp + (cam.read / cam.gain) * rand.normal());
      }
      heatmap(ctx, img, N, N, CMAPS.gray, arrMax(img) * 0.9);
    }
    const series = Object.entries(CAMS).map(([k, c]) => ({ pts: Array.from({ length: 60 }, (_, i) => { const S = 0.1 * 10 ** (i / 20); return [S, cameraSNR(S, c)]; }), color: c.color, label: k }));
    series.push({ pts: Array.from({ length: 60 }, (_, i) => { const S = 0.1 * 10 ** (i / 20); return [S, Math.sqrt(S)]; }), color: '#e8f1ff', dash: '3 3', label: 'ideal (shot noise only)' });
    linePlot(plot, series, { xlabel: 'photons per pixel', ylabel: 'SNR', logx: true, xmin: 0.1, xmax: 100, ymin: 0, marks: [{ x: st.S, label: 'now' }], H: 240 });
    setReadout(readout, Object.entries(CAMS).map(([k, c]) => [`${k} SNR at ${st.S} photons`, cameraSNR(st.S, c).toFixed(2)]));
  };
  addSlider(controls, { id: 'S', label: 'Peak signal (photons/pixel)', min: 0.5, max: 100, step: 0.5, value: st.S }, v => { st.S = v; draw(); });
  addSlider(controls, { id: 'nbg', label: 'Background (photons/pixel)', min: 0, max: 20, step: 0.5, value: st.bg }, v => { st.bg = v; draw(); });
  addButton(controls, 'New noise', draw, true);
  draw();
}

function frap(host) {
  const { controls, view, readout } = layout(host, 'Bleach the fluorescence in a spot and watch unbleached molecules diffuse back in. The half-time of recovery gives the diffusion coefficient (Soumpasis: D ≈ 0.224 w²/t½ for a circular spot of radius w), and the plateau gives the mobile fraction.');
  const st = { D: 1, mobile: 0.8, w: 1.0 };
  const N = 80, dx = 0.1; // µm per pixel, 8 µm field
  const c = canvas(view, 320, 320, 'Fluorescence (8 µm field)');
  const plot = div(view);
  let grid, fixed, t, curve, pre;
  const bleach = () => {
    grid = new Float32Array(N * N).fill(st.mobile); fixed = new Float32Array(N * N).fill(1 - st.mobile);
    const r = st.w / dx;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (Math.hypot(i - N / 2, j - N / 2) <= r) { grid[j * N + i] *= 0.05; fixed[j * N + i] *= 0.05; }
    t = 0; curve = []; pre = 1;
  };
  const spot = () => {
    let s = 0, k = 0; const r = st.w / dx;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (Math.hypot(i - N / 2, j - N / 2) <= r) { s += grid[j * N + i] + fixed[j * N + i]; k++; }
    return s / k;
  };
  bleach();
  const step = () => {
    const dt = 0.2 * dx * dx / st.D;
    for (let rep = 0; rep < 4; rep++) {
      const g2 = new Float32Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const q = j * N + i, l = j * N + Math.max(0, i - 1), rr = j * N + Math.min(N - 1, i + 1), u = Math.max(0, j - 1) * N + i, d = Math.min(N - 1, j + 1) * N + i;
        g2[q] = grid[q] + st.D * dt / (dx * dx) * (grid[l] + grid[rr] + grid[u] + grid[d] - 4 * grid[q]);
      }
      grid = g2; t += dt;
    }
    curve.push([t, spot()]);
    const img = new Float32Array(N * N); for (let p = 0; p < N * N; p++) img[p] = grid[p] + fixed[p];
    heatmap(c, img, N, N, CMAPS.green, 1);
    const f0 = curve[0][1], fe = curve[curve.length - 1][1];
    const half = curve.find(p => p[1] >= f0 + (fe - f0) / 2);
    linePlot(plot, [{ pts: curve, color: '#3dff8f', label: 'mean intensity in bleached spot' }], { xlabel: 'time (s)', ylabel: 'normalised intensity', ymin: 0, ymax: 1.05, H: 220, hmarks: [{ y: pre, label: 'pre-bleach', color: '#8fa3c8' }] });
    const est = half && half[0] > 0 ? 0.224 * st.w * st.w / half[0] : null;
    setReadout(readout, [['Time', `${t.toFixed(1)} s`], ['Recovery so far', `${(100 * (fe - f0) / (pre - f0)).toFixed(0)}% of pre-bleach`], ['Expected plateau (mobile fraction)', `${(st.mobile * 100).toFixed(0)}%`],
      ['t½ (from curve so far)', half ? `${half[0].toFixed(2)} s` : '—'], ['D estimate 0.224w²/t½', est ? `${est.toFixed(2)} µm²/s` : '—']]);
  };
  addSlider(controls, { id: 'fd', label: 'Diffusion coefficient D', min: 0.05, max: 10, step: 0.05, value: st.D, unit: ' µm²/s' }, v => { st.D = v; bleach(); });
  addSlider(controls, { id: 'fm', label: 'Mobile fraction', min: 0, max: 1, step: 0.05, value: st.mobile }, v => { st.mobile = v; bleach(); });
  addSlider(controls, { id: 'fw', label: 'Bleach spot radius w', min: 0.4, max: 2.5, step: 0.1, value: st.w, unit: ' µm' }, v => { st.w = v; bleach(); });
  addButton(controls, 'Bleach again', bleach);
  return animate(() => { if (t < 60 * st.w * st.w / st.D) step(); });
}

function spt(host) {
  const { controls, view, readout } = layout(host, 'Track a single molecule frame by frame. The mean squared displacement against time lag reveals how it moves: a straight line for free diffusion (MSD = 4Dt in 2D), a plateau for confinement, upward curvature for directed transport. Localization error adds a constant offset 4σ², which is why fitting only the first few lags matters.');
  const st = { mode: 'free', D: 0.1, sig: 0.03, R: 0.3, v: 0.5, n: 300, seed: 1 };
  const svg = div(view), plot = div(view);
  const dt = 0.05;
  const draw = () => {
    const rand = rng(st.seed);
    let tr = randomWalk(st.n, st.D, dt, rand, { confine: st.mode === 'confined' ? st.R : 0 });
    if (st.mode === 'directed') tr = tr.map((p, i) => [p[0] + st.v * dt * i, p[1]]);
    tr = tr.map(p => [p[0] + st.sig * rand.normal(), p[1] + st.sig * rand.normal()]);
    const xs = tr.map(p => p[0]), ys = tr.map(p => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), span = Math.max(maxx - minx, maxy - miny) || 1;
    const X = v => 20 + (v - minx) / span * 300, Y = v => 20 + (v - miny) / span * 300;
    let s = `<svg class="plot" viewBox="0 0 340 340" style="max-width:360px;display:inline-block"><polyline points="${tr.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="#3dff8f" stroke-width="1.2" opacity=".85"/>`;
    s += `<circle cx="${X(tr[0][0])}" cy="${Y(tr[0][1])}" r="4" fill="#4f9dff"/><circle cx="${X(tr[tr.length - 1][0])}" cy="${Y(tr[tr.length - 1][1])}" r="4" fill="#ff3fa4"/>`;
    s += `<line x1="20" x2="${20 + 300 * 0.5 / span}" y1="330" y2="330" stroke="#e8f1ff" stroke-width="2"/><text class="axisl" x="20" y="324">0.5 µm</text></svg>`;
    svg.innerHTML = s;
    const m = msd(tr, 30), fit = fitMSD(m, dt, 4);
    const pts = m.map((v, i) => [(i + 1) * dt, v]);
    linePlot(plot, [{ pts, color: '#3dff8f', dots: true, label: 'MSD' }, { pts: pts.map(p => [p[0], 4 * fit.D * p[0] + fit.offset]), color: '#ffd23f', dash: '4 3', label: 'fit to first 4 lags' }, { pts: pts.map(p => [p[0], 4 * st.D * p[0]]), color: '#8fa3c8', dash: '2 3', label: 'true 4Dt (no error)' }],
      { xlabel: 'time lag (s)', ylabel: 'MSD (µm²)', ymin: 0, H: 240 });
    setReadout(readout, [['True D', `${st.D} µm²/s`], ['Fitted D', `${fit.D.toFixed(3)} µm²/s`], ['Fitted offset', `${fit.offset.toFixed(4)} µm²`], ['Expected 4σ²', `${(4 * st.sig * st.sig).toFixed(4)} µm²`],
      ['Track', `${st.n} frames at ${dt * 1000} ms`]]);
  };
  addSeg(controls, 'Motion', [['free', 'free'], ['confined', 'confined'], ['directed', 'directed']], st.mode, v => { st.mode = v; draw(); });
  addSlider(controls, { id: 'sd', label: 'D', min: 0.005, max: 1, step: 0.005, value: st.D, unit: ' µm²/s' }, v => { st.D = v; draw(); });
  addSlider(controls, { id: 'ss', label: 'Localization error σ', min: 0, max: 0.1, step: 0.002, value: st.sig, unit: ' µm' }, v => { st.sig = v; draw(); });
  addSlider(controls, { id: 'sR', label: 'Confinement radius', min: 0.05, max: 1, step: 0.01, value: st.R, unit: ' µm' }, v => { st.R = v; draw(); });
  addSlider(controls, { id: 'sv', label: 'Drift velocity', min: 0, max: 2, step: 0.05, value: st.v, unit: ' µm/s' }, v => { st.v = v; draw(); });
  addButton(controls, 'New track', () => { st.seed++; draw(); }, true);
  draw();
}

function electron(host) {
  const { controls, view, readout } = layout(host, 'Electrons accelerated through V volts have a de Broglie wavelength of picometres: λ = h / √(2meV(1 + eV/2mc²)). Yet TEM resolution is ~0.1-0.2 nm, not ~0.002 nm, because magnetic lenses have large spherical aberration (Cs) that forces small apertures. Aberration correctors and, for cryo-EM, dose limits and specimen motion set the practical limits.');
  const st = { kV: 300, Cs: 2.7, alpha: 10 };
  const plot = div(view);
  const draw = () => {
    const rel = [], non = [];
    for (let v = 10; v <= 400; v += 5) {
      rel.push([v, electronWavelength(v)]);
      non.push([v, 1e12 * 6.62607015e-34 / Math.sqrt(2 * 9.1093837e-31 * 1.602176634e-19 * v * 1e3)]);
    }
    linePlot(plot, [{ pts: rel, color: '#ffd23f', label: 'relativistic' }, { pts: non, color: '#8fa3c8', dash: '4 3', label: 'non-relativistic' }], { xlabel: 'accelerating voltage (kV)', ylabel: 'wavelength (pm)', ymin: 0, marks: [{ x: st.kV, label: `${st.kV} kV` }], H: 260 });
    const lam = electronWavelength(st.kV) * 1e-3; // nm
    const diff = 0.61 * lam / (st.alpha * 1e-3), sph = 0.91 * Math.pow(st.Cs * 1e6 * lam ** 3, 0.25);
    setReadout(readout, [['Wavelength λ', `${(lam * 1000).toFixed(2)} pm`], ['Diffraction limit 0.61λ/α', `${diff.toFixed(3)} nm`], ['Scherzer limit 0.91(Cs λ³)^¼', `${sph.toFixed(3)} nm`],
      ['Light at 500 nm, for scale', `${(500 / lam).toFixed(0)}× longer wavelength`]]);
  };
  addSlider(controls, { id: 'kv', label: 'Accelerating voltage', min: 10, max: 400, step: 5, value: st.kV, unit: ' kV' }, v => { st.kV = v; draw(); });
  addSlider(controls, { id: 'cs', label: 'Spherical aberration Cs', min: 0.001, max: 5, step: 0.001, value: st.Cs, unit: ' mm' }, v => { st.Cs = v; draw(); });
  addSlider(controls, { id: 'al', label: 'Aperture semi-angle α', min: 1, max: 30, step: 0.5, value: st.alpha, unit: ' mrad' }, v => { st.alpha = v; draw(); });
  draw();
}

export const DYNAMIC = { jablonski, fret, noise, frap, spt, electron };
