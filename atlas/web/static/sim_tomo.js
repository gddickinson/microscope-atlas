// Simulations II (electron): cryo-EM contrast transfer function and the tomography missing wedge.
import { ctf, scherzer, electronWavelength, wedgeElongation, missingWedge } from './sim_engine.js';
import { layout, addSlider, addSeg, setReadout, canvas, heatmap, linePlot, div, CMAPS } from './sim_ui.js';

function ctfSim(host) {
  const { controls, view, readout } = layout(host, 'Biological specimens in vitreous ice are weak phase objects: they barely absorb electrons, they only shift their phase. Defocus and spherical aberration (Cs) turn that phase shift into contrast, but with a sign that oscillates with spatial frequency: the contrast transfer function, CTF = −[√(1−A²) sin χ + A cos χ] with χ = πλΔf k² − ½πCsλ³k⁴. Its zeros are the Thon rings seen in the power spectrum. More defocus gives strong low-resolution contrast (easy particle picking) but packs the zeros closer, so cryo-EM collects a range of defoci and corrects each image\'s CTF.');
  const st = { kV: 300, df: 1.5, cs: 2.7, amp: 0.07, B: 50 };
  const plot = div(view);
  const wrap = div(view, 'canvases');
  const mk = cap => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 240, 240); const fc = document.createElement('figcaption'); fc.textContent = cap; f.appendChild(fc); return c; };
  const cTh = mk('Power spectrum, CTF² (Thon rings), edge = 4 Å'), cSign = mk('CTF sign, edge = 4 Å: white = positive, dark = negative');
  const kmax = 0.5; // Å⁻¹ (2 Å)
  const draw = () => {
    const o = { kV: st.kV, defocusUm: st.df, csMm: st.cs, amp: st.amp, bfactor: st.B };
    const pts = [], env = [];
    let zero = null;
    for (let i = 0; i <= 600; i++) {
      const k = kmax * i / 600, v = ctf(k, o);
      pts.push([k, v]); env.push([k, Math.exp(-st.B * k * k / 4)]);
      if (zero === null && i > 0 && Math.sign(v) !== Math.sign(pts[i - 1][1]) && Math.sign(pts[i - 1][1]) !== 0) zero = k;
    }
    linePlot(plot, [{ pts, color: '#3dff8f', label: 'CTF' }, { pts: env, color: '#8fa3c8', dash: '4 3', label: 'envelope (B-factor)' }, { pts: env.map(p => [p[0], -p[1]]), color: '#8fa3c8', dash: '4 3' }],
      { xlabel: 'spatial frequency k (1/Å)', ylabel: 'contrast transfer', ymin: -1.05, ymax: 1.05, xmin: 0, xmax: kmax, H: 240, marks: zero ? [{ x: zero, label: `first zero ${(1 / zero).toFixed(1)} Å` }] : [] });
    const N = 240, th = new Float32Array(N * N), sg = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = Math.hypot(x - N / 2, y - N / 2) / (N / 2) * 0.25, v = ctf(k, o);
      th[y * N + x] = v * v; sg[y * N + x] = v > 0 ? 1 : 0.12;
    }
    heatmap(cTh, th, N, N, CMAPS.gray, 1, 0.8);
    heatmap(cSign, sg, N, N, CMAPS.gray, 1);
    const sch = scherzer(st.kV, st.cs);
    setReadout(readout, [['Electron wavelength', `${(electronWavelength(st.kV) / 100).toFixed(4)} Å`], ['First CTF zero', zero ? `${(1 / zero).toFixed(1)} Å` : 'beyond 2 Å'],
      ['Scherzer defocus √(1.5 Cs λ)', `${(sch.defocusUm * 1000).toFixed(0)} nm`], ['Scherzer point resolution', `${sch.resolution.toFixed(2)} Å`],
      ['Information limit (envelope 1/e²)', st.B > 0 ? `${(1 / Math.sqrt(8 / st.B)).toFixed(1)} Å` : 'no damping']]);
  };
  addSeg(controls, 'Accelerating voltage', [['120', '120 kV'], ['200', '200 kV'], ['300', '300 kV']], '300', v => { st.kV = +v; draw(); });
  addSlider(controls, { id: 'ctf-df', label: 'Defocus (underfocus)', min: 0.1, max: 4, step: 0.05, value: st.df, unit: ' µm' }, v => { st.df = v; draw(); });
  addSlider(controls, { id: 'ctf-cs', label: 'Spherical aberration Cs', min: 0, max: 4, step: 0.01, value: st.cs, unit: ' mm' }, v => { st.cs = v; draw(); });
  addSlider(controls, { id: 'ctf-a', label: 'Amplitude contrast', min: 0, max: 0.3, step: 0.01, value: st.amp }, v => { st.amp = v; draw(); });
  addSlider(controls, { id: 'ctf-b', label: 'B-factor (damping)', min: 0, max: 300, step: 5, value: st.B, unit: ' Å²' }, v => { st.B = v; draw(); });
  draw();
}

// Slice through a tomogram (x across, z = beam direction down): vesicles, a membrane and a filament.
function slab(N) {
  const a = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    for (const [cx, cy, r] of [[30, 40, 12], [70, 36, 9], [52, 80, 14], [96, 88, 8]]) if (Math.abs(Math.hypot(x - cx, y - cy) - r) < 1.6) v = 1;
    if (Math.abs(y - (104 + 6 * Math.sin(x / 14))) < 1.4) v = 1;
    if (Math.abs((x - 92) - 0.9 * (y - 30)) < 1.8 && y > 14 && y < 64) v = 1;
    if (Math.hypot(x - 100, y - 20) < 3) v = 1;
    a[y * N + x] = v;
  }
  return a;
}

function wedge(host) {
  const { controls, view, readout } = layout(host, 'In electron tomography the specimen is tilted, typically to about ±60°, and imaged at each angle. Each projection fills one central slice of the object\'s Fourier transform (projection-slice theorem), so the slices you cannot record leave a missing wedge of information. In the reconstruction, structures stretch along the beam axis (by √[(α + sinα cosα)/(α − sinα cosα)], 1.55 at ±60°), and membranes perpendicular to the beam fade away. Dual-axis tilting turns the wedge into a smaller pyramid; subtomogram averaging fills it by combining particles in many orientations.');
  const N = 128, obj = slab(N);
  const st = { a: 60 };
  const wrap = div(view, 'canvases');
  const mk = cap => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 256, 256); const fc = document.createElement('figcaption'); fc.textContent = cap; f.appendChild(fc); return c; };
  const cO = mk('Object: x-z slice (beam travels down)'), cR = mk('Reconstruction from the tilt range'), cF = mk('Fourier coverage (dark = missing wedge)');
  const plot = div(view);
  heatmap(cO, obj, N, N, CMAPS.gray, 1);
  const draw = () => {
    const rec = missingWedge(obj, N, st.a);
    let lo = Infinity, hi = -Infinity; for (const v of rec) { if (v < lo) lo = v; if (v > hi) hi = v; }
    heatmap(cR, rec.map(v => v - lo), N, N, CMAPS.gray, hi - lo);
    const M = 64, m = new Float32Array(M * M), t = Math.tan(st.a * Math.PI / 180);
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { const kx = x - M / 2, kz = y - M / 2; m[y * M + x] = st.a >= 90 || Math.abs(kz) <= t * Math.abs(kx) || (!kx && !kz) ? 1 : 0.08; }
    heatmap(cF, m, M, M, CMAPS.blue, 1);
    const pts = []; for (let a = 30; a <= 89; a++) pts.push([a, wedgeElongation(a)]);
    linePlot(plot, [{ pts, color: '#3dff8f', label: 'elongation along the beam' }], { xlabel: 'maximum tilt ±α (degrees)', ylabel: 'elongation factor', xmin: 30, xmax: 90, ymin: 1, H: 200, marks: [{ x: st.a, label: `±${st.a}°` }] });
    setReadout(readout, [['Tilt range', `±${st.a}°`], ['Missing Fourier space', `${((90 - st.a) / 90 * 100).toFixed(0)}% of directions`],
      ['Elongation along z', st.a >= 90 ? 'none' : `${wedgeElongation(st.a).toFixed(2)}×`], ['Why not tilt to 90°', 'the slab gets thicker (t / cos α), the grid bars block the beam and dose builds up']]);
  };
  addSlider(controls, { id: 'mw-a', label: 'Maximum tilt ±α', min: 20, max: 90, step: 1, value: st.a, unit: '°' }, v => { st.a = v; draw(); });
  draw();
}

export const TOMO = { ctf: ctfSim, wedge };
