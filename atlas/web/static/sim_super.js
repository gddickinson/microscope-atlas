// Super-resolution simulations: STED depletion, single-molecule localization, SIM in Fourier space.
import { fwhmLateral, stedResolution, locPrecision, rng } from './sim_engine.js';
import { layout, addSlider, addSeg, addButton, setReadout, canvas, heatmap, linePlot, div, animate, CMAPS } from './sim_ui.js';

function sted(host) {
  const { controls, view, readout } = layout(host, 'A red-shifted STED beam with a zero at its centre (a doughnut) forces excited molecules back to the ground state by stimulated emission everywhere except the very middle. Only molecules near the zero can still fluoresce, so the effective PSF shrinks as the depletion intensity rises: d ≈ λ / (2NA·√(1 + I/Is)).');
  const st = { zeta: 20, NA: 1.4, lam: 640 };
  const c = canvas(view, 300, 300, 'Effective PSF (left half: confocal, right half: STED)');
  const plot = div(view);
  const draw = () => {
    const f = fwhmLateral(st.lam, st.NA), s = f / 2.355;
    const exc = r => Math.exp(-r * r / (2 * s * s));
    const ds = 1.6 * s; // doughnut maximum radius ~ 1.6σ
    const dough = r => (r * r / (ds * ds)) * Math.exp(1 - r * r / (ds * ds));
    const eff = r => exc(r) * Math.exp(-Math.LN2 * st.zeta * dough(r) * 1.0);
    const pts = [], pe = [], pd = [];
    for (let x = -600; x <= 600; x += 4) { pe.push([x, exc(x)]); pd.push([x, Math.min(1.2, dough(x))]); pts.push([x, eff(x) / eff(0)]); }
    linePlot(plot, [{ pts: pe, color: '#3dff8f', dash: '4 3', label: 'excitation (confocal PSF)' }, { pts: pd, color: '#ff4d4d', label: 'STED doughnut (normalised)' }, { pts, color: '#ffd23f', width: 3, label: 'effective PSF' }],
      { xlabel: 'position (nm)', ylabel: 'relative intensity', ymin: 0, ymax: 1.25, H: 240 });
    const N = 120, field = 1000, img = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i - N / 2) * field / N, y = (j - N / 2) * field / N, r = Math.hypot(x, y);
      img[j * N + i] = i < N / 2 ? exc(r) : eff(r) / eff(0);
    }
    heatmap(c, img, N, N, CMAPS.hot, 1, 0.8);
    const half = pts.filter(p => p[1] >= 0.5);
    const meas = half.length ? half[half.length - 1][0] - half[0][0] : 0;
    setReadout(readout, [['Confocal FWHM', `${f.toFixed(0)} nm`], ['STED FWHM (simulated)', `${meas.toFixed(0)} nm`], ['Formula λ/(2NA√(1+I/Is))', `${stedResolution(st.lam, st.NA, st.zeta).toFixed(0)} nm`],
      ['Saturation factor I/Is', st.zeta], ['Cost', st.zeta > 60 ? 'high power: bleaching and heating' : 'moderate']]);
  };
  addSlider(controls, { id: 'z', label: 'Depletion I / Is', min: 0, max: 150, step: 1, value: st.zeta }, v => { st.zeta = v; draw(); });
  addSlider(controls, { id: 'sna', label: 'NA', min: 1.0, max: 1.49, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  draw();
}

// Ground truth for SMLM: nuclear-pore-like rings (8 sites, r = 55 nm) and two filaments 70 nm apart.
function truth(rand) {
  const pts = [];
  [[500, 500], [1100, 450], [800, 1150], [1450, 1250], [450, 1500]].forEach(([cx, cy]) => {
    const rot = rand() * Math.PI;
    for (let k = 0; k < 8; k++) { const a = rot + k * Math.PI / 4; pts.push([cx + 55 * Math.cos(a), cy + 55 * Math.sin(a)]); }
  });
  for (let t = 0; t < 1900; t += 12) { pts.push([100 + t, 1800 - t * 0.55]); pts.push([100 + t, 1870 - t * 0.55]); }
  return pts;
}

function smlm(host) {
  const { controls, view, readout } = layout(host, 'In a widefield image, closely packed molecules blur together. If only a few are switched on in each camera frame, each appears as an isolated spot whose centre can be found far more precisely than its width, σ ≈ s/√N. Thousands of frames of localizations build an image at ~10-30 nm resolution.');
  const st = { photons: 1500, density: 6, bg: 10, running: true };
  const rand = rng(7);
  const T = truth(rand);
  const field = 2000, NR = 400, ND = 20;
  const wrap = div(view, 'canvases');
  const fig = (cap) => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 300, 300); const fc = document.createElement('figcaption'); fc.textContent = cap; f.appendChild(fc); return c; };
  const cFrame = fig('Current camera frame (100 nm pixels)'), cRecon = fig('Reconstruction from localizations'), cWide = fig('Widefield (all molecules on)'), cTrue = fig('Ground truth');
  const recon = new Float32Array(NR * NR);
  let frames = 0, locs = 0;
  const s = 110; // PSF sigma, nm
  const splat = (img, n, x, y, sig, w = 1) => {
    const px = field / n, r = Math.ceil(3 * sig / px), ci = Math.floor(x / px), cj = Math.floor(y / px);
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (i < 0 || j < 0 || i >= n || j >= n) continue;
      const dx = (i + 0.5) * px - x, dy = (j + 0.5) * px - y;
      img[j * n + i] += w * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
    }
  };
  const wide = new Float32Array(100 * 100), tr = new Float32Array(NR * NR);
  T.forEach(([x, y]) => { splat(wide, 100, x, y, s); splat(tr, NR, x, y, 4); });
  heatmap(cWide, wide, 100, 100, CMAPS.green);
  heatmap(cTrue, tr, NR, NR, CMAPS.gray);
  const resetRecon = () => { recon.fill(0); frames = 0; locs = 0; };
  const step = () => {
    if (!st.running) return;
    const frame = new Float32Array(ND * ND).fill(st.bg);
    const p = st.density / T.length;
    const prec = locPrecision(s, 100, st.photons, st.bg);
    for (let k = 0; k < 3; k++) {
      for (const [x, y] of T) {
        if (rand() > p) continue;
        if (k === 0) splat(frame, ND, x, y, s, st.photons / (2 * Math.PI * (s / 100) ** 2));
        splat(recon, NR, x + prec * rand.normal(), y + prec * rand.normal(), 5);
        locs++;
      }
      frames++;
    }
    for (let i = 0; i < frame.length; i++) frame[i] = rand.poisson(frame[i]);
    heatmap(cFrame, frame, ND, ND, CMAPS.hot);
    heatmap(cRecon, recon, NR, NR, CMAPS.hot, null, 0.6);
    setReadout(readout, [['Frames', frames], ['Localizations', locs], ['Precision σ (Thompson)', `${prec.toFixed(1)} nm`], ['Resolution ≈ 2.35σ', `${(2.35 * prec).toFixed(0)} nm`],
      ['Ring diameter to resolve', '110 nm'], ['Filament spacing', '70 nm']]);
  };
  addSlider(controls, { id: 'ph', label: 'Photons per localization', min: 100, max: 8000, step: 50, value: st.photons }, v => { st.photons = v; resetRecon(); });
  addSlider(controls, { id: 'dn', label: 'Molecules on per frame', min: 1, max: 40, step: 1, value: st.density }, v => { st.density = v; });
  addSlider(controls, { id: 'bg', label: 'Background (photons/pixel)', min: 0, max: 100, step: 1, value: st.bg }, v => { st.bg = v; resetRecon(); });
  addButton(controls, 'Pause / play', () => { st.running = !st.running; }, true);
  addButton(controls, 'Reset', resetRecon, true);
  const p = div(controls, 'small mute');
  p.textContent = 'Too many molecules per frame overlap and would be mislocalized in a real experiment (this model localizes them perfectly, so watch the frame image to judge sparsity).';
  let t = 0;
  return animate(() => { if (++t % 3 === 0) step(); });
}

function simk(host) {
  const { controls, view, readout } = layout(host, 'The objective transmits spatial frequencies only up to a cutoff kc (its OTF support, a disc). Multiplying the sample by a striped pattern of frequency k0 shifts sample information by ±k0, so frequencies up to kc + k0 can reach the camera as moiré fringes. Repeat with several stripe angles and phases, unmix and reassemble: the support grows to about 2kc, doubling resolution.');
  const st = { k0: 0.9, angles: 3, theta: 20 };
  const c = canvas(view, 300, 300, 'Fine sample × stripes = coarse moiré');
  const svg = div(view);
  const draw = () => {
    const N = 200, img = new Float32Array(N * N), th = st.theta * Math.PI / 180;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i - N / 2, y = j - N / 2;
      const sample = 0.5 + 0.5 * Math.cos(2 * Math.PI * (x * 0.205 + y * 0.03));
      const ill = 0.5 + 0.5 * Math.cos(2 * Math.PI * st.k0 * 0.2 * (x * Math.cos(th) + y * Math.sin(th)));
      img[j * N + i] = sample * ill;
    }
    heatmap(c, img, N, N, CMAPS.green, 1);
    const W = 360, H = 360, cx = 180, cy = 180, R = 70;
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" style="max-width:420px">`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R * (1 + st.k0)}" fill="none" stroke="#ffd23f" stroke-dasharray="4 4"/>`;
    for (let a = 0; a < st.angles; a++) {
      const ang = th + a * Math.PI / st.angles;
      for (const sgn of [-1, 1]) {
        const x = cx + sgn * R * st.k0 * Math.cos(ang), y = cy + sgn * R * st.k0 * Math.sin(ang);
        s += `<circle cx="${x}" cy="${y}" r="${R}" fill="rgba(255,63,164,.12)" stroke="#ff3fa4"/>`;
        s += `<circle cx="${x}" cy="${y}" r="3" fill="#ff3fa4"/>`;
      }
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(61,255,143,.25)" stroke="#3dff8f" stroke-width="2"/>`;
    s += `<text class="axisl" x="10" y="18" fill="#3dff8f">widefield OTF support (radius kc)</text><text class="axisl" x="10" y="34" fill="#ff3fa4">shifted copies (±k0)</text><text class="axisl" x="10" y="50" fill="#ffd23f">extended support kc + k0</text>`;
    svg.innerHTML = s + '</svg>';
    setReadout(readout, [['Pattern frequency k0 / kc', st.k0.toFixed(2)], ['Resolution gain', `${(1 + st.k0).toFixed(2)}×`], ['Raw images (5 phases × angles)', st.angles * (st.angles > 1 ? 5 : 3)],
      ['Coverage', st.angles >= 3 ? 'near-isotropic' : 'anisotropic: gaps between angles']]);
  };
  addSlider(controls, { id: 'k0', label: 'Stripe frequency k0 / kc', min: 0, max: 1, step: 0.01, value: st.k0 }, v => { st.k0 = v; draw(); });
  addSlider(controls, { id: 'ang', label: 'Number of orientations', min: 1, max: 5, step: 1, value: st.angles }, v => { st.angles = v; draw(); });
  addSlider(controls, { id: 'th', label: 'First orientation', min: 0, max: 180, step: 1, value: st.theta, unit: '°' }, v => { st.theta = v; draw(); });
  draw();
}

export const SUPER = { sted, smlm, simk };
