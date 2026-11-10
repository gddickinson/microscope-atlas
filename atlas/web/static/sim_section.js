// Sectioning simulations: TIRF depth, confocal pinhole, two-photon confinement, light-sheet beam optics.
import { criticalAngle, penetrationDepth, sectioningFWHM, encircledEnergy, gaussianSheet, besselJ0, fwhmLateral } from './sim_engine.js';
import { layout, addSlider, addSeg, setReadout, canvas, heatmap, linePlot, div, CMAPS, fmt } from './sim_ui.js';
import { waveColor } from './core.js';

function tirf(host) {
  const { controls, view, readout } = layout(host, 'Above the critical angle the excitation beam is totally reflected at the glass-cell interface, but an evanescent field leaks into the cell and decays exponentially. Only fluorophores within ~100-200 nm of the coverslip are excited: membranes, adhesions and single channels stand out against no background.');
  const st = { theta: 66, lam: 488, n2: 1.37 };
  const n1 = 1.518;
  const svg = div(view), plot = div(view);
  const draw = () => {
    const tc = criticalAngle(n1, st.n2), d = penetrationDepth(st.lam, n1, st.n2, st.theta), tir = st.theta > tc;
    const W = 640, H = 300, yI = 170, cx = 320, th = st.theta * Math.PI / 180;
    const col = waveColor(st.lam);
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}">`;
    s += `<rect x="0" y="${yI}" width="${W}" height="${H - yI}" fill="rgba(140,200,255,.15)"/><text class="axisl" x="10" y="${H - 10}">glass coverslip (n = ${n1})</text><text class="axisl" x="10" y="20">cell / medium (n = ${st.n2})</text>`;
    // cell with fluorophores at different heights
    s += `<path d="M 60 ${yI} Q 320 ${yI - 210} 580 ${yI}" fill="rgba(255,63,164,.06)" stroke="#ff3fa4" stroke-dasharray="4 3"/>`;
    const dots = [[150, 5], [210, 40], [270, 90], [330, 150], [390, 60], [450, 15], [500, 120], [250, 200], [360, 300], [420, 250]];
    if (tir) {
      const g = `<defs><linearGradient id="ev" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${col}" stop-opacity=".8"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>`;
      const hpx = Math.min(140, d / 2.2);
      s += g + `<rect x="0" y="${yI - hpx * 2.5}" width="${W}" height="${hpx * 2.5}" fill="url(#ev)"/>`;
    }
    dots.forEach(([x, z]) => {
      const exc = tir ? Math.exp(-z / d) : 1;
      s += `<circle cx="${x}" cy="${yI - z / 2.2 - 3}" r="${3 + 5 * exc}" fill="#3dff8f" opacity="${0.15 + 0.85 * exc}"><title>${z} nm above glass: excitation ${(exc * 100).toFixed(0)}%</title></circle>`;
    });
    const L = 160;
    const x0 = cx - Math.sin(th) * L, y0 = yI + Math.cos(th) * L;
    s += `<line x1="${x0}" y1="${y0}" x2="${cx}" y2="${yI}" stroke="${col}" stroke-width="4"/>`;
    if (tir) s += `<line x1="${cx}" y1="${yI}" x2="${cx + Math.sin(th) * L}" y2="${y0}" stroke="${col}" stroke-width="3" opacity=".6"/>`;
    else {
      const t2 = Math.asin(n1 * Math.sin(th) / st.n2);
      s += `<line x1="${cx}" y1="${yI}" x2="${cx + Math.sin(t2) * 200}" y2="${yI - Math.cos(t2) * 200}" stroke="${col}" stroke-width="4" opacity=".8"/>`;
      s += `<line x1="${cx}" y1="${yI}" x2="${cx + Math.sin(th) * 80}" y2="${yI + Math.cos(th) * 80}" stroke="${col}" stroke-width="2" opacity=".3"/>`;
    }
    s += `<path d="M ${cx} ${yI + 50} A 50 50 0 0 0 ${cx - Math.sin(th) * 50} ${yI + Math.cos(th) * 50}" fill="none" stroke="#ffd23f"/><text class="axisl" x="${cx - 30}" y="${yI + 72}" fill="#ffd23f">θ = ${st.theta}°</text>`;
    s += `<line x1="${cx}" y1="${yI - 10}" x2="${cx}" y2="${H}" stroke="#8fa3c8" stroke-dasharray="3 3"/>`;
    svg.innerHTML = s + '</svg>';
    const pts = [], epi = [];
    for (let z = 0; z <= 600; z += 5) { pts.push([z, tir ? Math.exp(-z / d) : 1]); epi.push([z, 1]); }
    linePlot(plot, [{ pts, color: col, label: tir ? `evanescent, d = ${d.toFixed(0)} nm` : 'beam transmitted (epi/HILO)' }, { pts: epi, color: '#8fa3c8', dash: '4 3', label: 'epi-illumination' }],
      { xlabel: 'height above coverslip z (nm)', ylabel: 'relative excitation', ymin: 0, ymax: 1.05, H: 220, hmarks: [{ y: 1 / Math.E, label: '1/e', color: '#8fa3c8' }] });
    setReadout(readout, [['Critical angle', `${tc.toFixed(1)}°`], ['Penetration depth d (1/e)', tir ? `${d.toFixed(0)} nm` : 'none (not TIR)'], ['Minimum NA for TIRF', (n1 * Math.sin(tc * Math.PI / 180)).toFixed(2)],
      ['Mode', tir ? 'TIRF' : st.theta > tc - 6 ? 'HILO-like (highly inclined)' : 'epi / oblique']]);
  };
  addSlider(controls, { id: 'th', label: 'Incidence angle θ', min: 0, max: 78, step: 0.5, value: st.theta, unit: '°' }, v => { st.theta = v; draw(); });
  addSlider(controls, { id: 'lam', label: 'Wavelength', min: 405, max: 640, step: 1, value: st.lam, unit: ' nm' }, v => { st.lam = v; draw(); });
  addSlider(controls, { id: 'n2', label: 'Refractive index of cell', min: 1.33, max: 1.42, step: 0.005, value: st.n2 }, v => { st.n2 = v; draw(); });
  draw();
}

function pinhole(host) {
  const { controls, view, readout } = layout(host, 'The pinhole sits in an image plane: light from the focal plane passes, light from above and below is defocused and mostly blocked. Closing it thins the optical section and slightly sharpens the image, but throws away signal. One Airy unit (AU) is the usual compromise.');
  const st = { au: 1, NA: 1.4, n: 1.518, lam: 520 };
  const p1 = div(view), p2 = div(view);
  const draw = () => {
    const f = sectioningFWHM(st.lam, st.NA, st.n, st.au);
    const curve = [], wf = [];
    for (let z = -3000; z <= 3000; z += 20) curve.push([z, 1 / (1 + (2 * z / f) ** 2)]);
    for (let z = -3000; z <= 3000; z += 20) wf.push([z, 1]);
    linePlot(p1, [{ pts: curve, color: '#3dff8f', label: `confocal, ${st.au} AU: FWHM ${f.toFixed(0)} nm` }, { pts: wf, color: '#8fa3c8', dash: '4 3', label: 'widefield: a thin plane never "disappears"' }],
      { xlabel: 'defocus of a thin fluorescent plane z (nm)', ylabel: 'detected signal', ymin: 0, ymax: 1.1, H: 240 });
    const fw = [], sig = [];
    for (let a = 0.1; a <= 4; a += 0.05) { fw.push([a, sectioningFWHM(st.lam, st.NA, st.n, a) / 1000]); sig.push([a, encircledEnergy(a) * 2]); }
    linePlot(p2, [{ pts: fw, color: '#ff3fa4', label: 'section thickness (µm)' }, { pts: sig, color: '#ffd23f', label: 'in-focus signal (×2, of max 2)' }],
      { xlabel: 'pinhole diameter (Airy units)', ylabel: '', ymin: 0, H: 240, marks: [{ x: st.au, label: 'now' }] });
    const lat = fwhmLateral(st.lam, st.NA) * (st.au <= 0.25 ? 0.72 : st.au < 1 ? 0.72 + 0.28 * (st.au - 0.25) / 0.75 : 1);
    setReadout(readout, [['Optical section (FWHM)', `${f.toFixed(0)} nm`], ['In-focus light passing', `${(encircledEnergy(st.au) * 100).toFixed(0)}%`], ['Lateral FWHM (approx.)', `${lat.toFixed(0)} nm`],
      ['1 AU in the sample', `${(1.22 * st.lam / st.NA).toFixed(0)} nm`], ['Tip', st.au < 0.6 ? 'sharper but photon-starved' : st.au > 1.6 ? 'bright but thick sections' : 'good compromise']]);
  };
  addSlider(controls, { id: 'au', label: 'Pinhole', min: 0.1, max: 4, step: 0.05, value: st.au, unit: ' AU' }, v => { st.au = v; draw(); });
  addSlider(controls, { id: 'pna', label: 'NA', min: 0.4, max: 1.45, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  addSeg(controls, 'Immersion', [['1.518', 'oil'], ['1.333', 'water'], ['1.406', 'silicone']], '1.518', v => { st.n = +v; if (st.NA >= st.n) st.NA = st.n - 0.05; draw(); });
  draw();
}

function twophoton(host) {
  const { controls, view, readout } = layout(host, 'A focused beam spreads its photons over a cone. With one-photon excitation every plane of the cone absorbs the same total power, so fluorescence comes from the whole cone. Two-photon absorption scales with intensity squared, so only the tight focus fluoresces: no pinhole needed, and scattered emission light still counts.');
  const st = { NA: 0.8, lam: 920 };
  const c1 = canvas(view, 300, 300, '1-photon: fluorescence ∝ I'), c2 = canvas(view, 300, 300, '2-photon: fluorescence ∝ I²');
  view.querySelectorAll('figure').forEach(f => { f.style.display = 'inline-block'; f.style.width = '48%'; f.style.marginRight = '2%'; });
  const plot = div(view);
  const draw = () => {
    const n = 1.33, w0 = st.lam / (Math.PI * st.NA) * 1.0, zR = Math.PI * w0 * w0 * n / st.lam;
    const N = 120, X = 6 * w0 + 1500, Z = 12 * zR + 4000;
    const a = new Float32Array(N * N), b = new Float32Array(N * N);
    const per1 = [], per2 = [];
    for (let j = 0; j < N; j++) {
      const z = (j / (N - 1) - 0.5) * Z, w = w0 * Math.sqrt(1 + (z / zR) ** 2);
      let s1 = 0, s2 = 0;
      for (let i = 0; i < N; i++) {
        const r = (i / (N - 1) - 0.5) * X, I = (w0 / w) ** 2 * Math.exp(-2 * r * r / (w * w));
        a[j * N + i] = I; b[j * N + i] = I * I; s1 += I * Math.abs(r); s2 += I * I * Math.abs(r);
      }
      per1.push([z / 1000, s1]); per2.push([z / 1000, s2]);
    }
    heatmap(c1, a, N, N, CMAPS.blue, null, 0.5);
    heatmap(c2, b, N, N, CMAPS.hot, null, 0.5);
    const m1 = Math.max(...per1.map(p => p[1])), m2 = Math.max(...per2.map(p => p[1]));
    linePlot(plot, [{ pts: per1.map(p => [p[0], p[1] / m1]), color: '#4f9dff', label: '1-photon: total signal per plane' }, { pts: per2.map(p => [p[0], p[1] / m2]), color: '#ff3fa4', label: '2-photon: total signal per plane' }],
      { xlabel: 'distance from focus (µm)', ylabel: 'relative fluorescence', ymin: 0, ymax: 1.1, H: 220 });
    const fw = per2.filter(p => p[1] / m2 >= 0.5);
    setReadout(readout, [['Beam waist w0', `${w0.toFixed(0)} nm`], ['Rayleigh range zR', `${(zR / 1000).toFixed(2)} µm`], ['2P axial extent (FWHM)', `${(fw[fw.length - 1][0] - fw[0][0]).toFixed(2)} µm`], ['Why near-IR', 'less scattering and absorption in tissue']]);
  };
  addSlider(controls, { id: 'tna', label: 'Effective NA', min: 0.3, max: 1.1, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  addSlider(controls, { id: 'tl', label: 'Laser wavelength', min: 700, max: 1300, step: 10, value: st.lam, unit: ' nm' }, v => { st.lam = v; draw(); });
  draw();
}

function lightsheet(host) {
  const { controls, view, readout } = layout(host, 'A Gaussian light sheet is thinnest at its waist and widens over the Rayleigh range. A thinner sheet (higher illumination NA) sections better but covers a shorter field of view: w0 = λ/(πNA), field ≈ 2zR = 2πw0²n/λ. Bessel and lattice beams beat this trade-off with long, thin cores at the cost of side lobes, which lattices suppress.');
  const st = { NA: 0.08, lam: 488, mode: 'gauss' };
  const c = canvas(view, 640, 260, 'Sheet seen from the side: light travels left to right, the detection objective looks down');
  const plot = div(view);
  const draw = () => {
    const n = 1.33, g = gaussianSheet(st.lam, st.NA, n);
    const W = 160, H = 64, Lx = Math.max(4 * g.zR, 60000), Lz = Math.max(12 * g.w0, 12000);
    const img = new Float32Array(W * H);
    const kr = 2 * Math.PI * st.NA * n / st.lam / n * 1.0, bessL = 10 * g.zR;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = (i / (W - 1) - 0.5) * Lx, z = (j / (H - 1) - 0.5) * Lz;
      let I;
      if (st.mode === 'gauss') { const w = g.w0 * Math.sqrt(1 + (x / g.zR) ** 2); I = (g.w0 / w) * Math.exp(-2 * z * z / (w * w)); }
      else { const env = Math.exp(-((x / bessL) ** 2)); const b = besselJ0(kr * z * 0.9) ** 2; I = env * (st.mode === 'bessel' ? b : b * Math.exp(-((z / (2.5 * g.w0)) ** 2)) * 0.8 + 0.06 * env * Math.exp(-((z / (3 * g.w0)) ** 2))); }
      img[j * W + i] = I;
    }
    heatmap(c, img, W, H, (v => { const [r, gg, b] = waveColor(st.lam).match(/\d+/g).map(Number); return [r * v, gg * v, b * v]; }), null, 0.7);
    const pts = [];
    for (let x = -Lx / 2; x <= Lx / 2; x += Lx / 200) pts.push([x / 1000, 2 * g.w0 * Math.sqrt(1 + (x / g.zR) ** 2) / 1000]);
    linePlot(plot, [{ pts, color: '#3dff8f', label: 'Gaussian sheet thickness 2w(x)' }], { xlabel: 'position along the sheet (µm)', ylabel: 'thickness (µm)', ymin: 0, H: 210, marks: [{ x: -g.zR / 1000, label: '-zR', color: '#ff3fa4' }, { x: g.zR / 1000, label: '+zR', color: '#ff3fa4' }] });
    setReadout(readout, [['Sheet thickness 2w0', `${fmt(g.thickness / 1000)} µm`], ['Usable field 2zR', `${fmt(g.fov / 1000)} µm`], ['Illumination NA', st.NA.toFixed(3)],
      ['Mode', { gauss: 'Gaussian', bessel: 'Bessel: long core, strong side lobes', lattice: 'Lattice-like: side lobes suppressed' }[st.mode]]]);
  };
  addSlider(controls, { id: 'lna', label: 'Illumination NA', min: 0.02, max: 0.5, step: 0.005, value: st.NA }, v => { st.NA = v; draw(); });
  addSlider(controls, { id: 'll', label: 'Wavelength', min: 405, max: 640, step: 1, value: st.lam, unit: ' nm' }, v => { st.lam = v; draw(); });
  addSeg(controls, 'Beam', [['gauss', 'Gaussian'], ['bessel', 'Bessel'], ['lattice', 'Lattice']], st.mode, v => { st.mode = v; draw(); });
  draw();
}

export const SECTION = { tirf, pinhole, twophoton, lightsheet };
