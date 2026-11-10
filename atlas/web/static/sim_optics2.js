// Simulations II (optics, part 2): Köhler/Abbe imaging with a condenser aperture, DIC shear and bias, AFM tip convolution.
import { abbeImage, partialCoherenceLimit, michelsonContrast, dicImage, afmImage, afmApparentWidth, tipShape } from './sim_engine.js';
import { layout, addSlider, setReadout, canvas, heatmap, linePlot, div, CMAPS } from './sim_ui.js';

function kohler(host) {
  const { controls, view, readout } = layout(host, 'In Köhler illumination the lamp is imaged into the condenser aperture (front focal plane) and the field diaphragm into the specimen, so the field is evenly lit and the condenser aperture sets the range of illumination angles. Abbe\'s view of image formation: a grating of period P diffracts light into orders at sin θ = kλ/P, and the image only shows the grating if the objective collects at least two orders. With axial (coherent) light that needs P > λ/NAobj; oblique rays from a wider condenser aperture let a 0 and a ±1 order through together, down to P = λ/(NAobj + NAcond). Closing the aperture raises contrast and depth of field but costs resolution. Set it up on a real microscope with the Köhler lab tool.');
  const st = { lam: 550, NAo: 0.65, NAc: 0.45, P: 700 };
  const bfp = div(view), plot = div(view);
  const draw = () => {
    const xs = Array.from({ length: 301 }, (_, i) => i * 3 * st.P / 300);
    const I0 = abbeImage(xs, st.P, st.lam, st.NAo, 0);
    const series = [{ pts: xs.map((x, i) => [x / 1000, I0[i]]), color: '#8fa3c8', dash: '4 3', label: 'condenser closed (coherent)' }];
    const I = abbeImage(xs, st.P, st.lam, st.NAo, st.NAc, 1, 61);
    series.push({ pts: xs.map((x, i) => [x / 1000, I[i]]), color: '#3dff8f', label: `condenser NA ${st.NAc}` });
    linePlot(plot, series, { xlabel: 'position (µm), 3 grating periods', ylabel: 'image intensity', ymin: 0, H: 220 });
    // back focal plane: objective pupil (radius NAo) and the condenser disc around each diffraction order
    const W = 640, H = 200, S = 80, cx = W / 2, cy = H / 2;
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}"><circle cx="${cx}" cy="${cy}" r="${S * st.NAo}" fill="#0d2a1c" stroke="#3dff8f"/>`;
    for (let k = -3; k <= 3; k++) {
      const x = cx + S * k * st.lam / st.P;
      if (x < -60 || x > W + 60) continue;
      s += `<circle cx="${x}" cy="${cy}" r="${Math.max(2, S * st.NAc)}" fill="${k ? '#ff3fa4' : '#ffd23f'}" fill-opacity="0.25" stroke="${k ? '#ff3fa4' : '#ffd23f'}"/><text class="axisl" x="${x}" y="${cy + S * st.NAc + 14}" text-anchor="middle">${k > 0 ? '+' + k : k}</text>`;
    }
    bfp.innerHTML = s + `<text class="axisl" x="10" y="16">Objective back focal plane: green = pupil (NA ${st.NAo}); discs = image of the condenser aperture in each diffraction order</text></svg>`;
    const lim = partialCoherenceLimit(st.lam, st.NAo, st.NAc), c = michelsonContrast(I);
    setReadout(readout, [['Coherent limit λ/NAobj', `${(st.lam / st.NAo).toFixed(0)} nm`], ['Limit λ/(NAobj + NAcond)', `${lim.toFixed(0)} nm`],
      ['Coherence ratio σ = NAcond/NAobj', (st.NAc / st.NAo).toFixed(2)], ['Grating contrast', c.toFixed(2)],
      ['Verdict', c < 0.005 ? 'not resolved' : c < 0.2 ? 'resolved, low contrast' : 'resolved']]);
  };
  addSlider(controls, { id: 'k-l', label: 'Wavelength', min: 400, max: 700, step: 5, value: st.lam, unit: ' nm' }, v => { st.lam = v; draw(); });
  addSlider(controls, { id: 'k-o', label: 'Objective NA', min: 0.1, max: 1.4, step: 0.01, value: st.NAo }, v => { st.NAo = v; draw(); });
  addSlider(controls, { id: 'k-c', label: 'Condenser aperture NA', min: 0, max: 1.4, step: 0.01, value: st.NAc }, v => { st.NAc = v; draw(); });
  addSlider(controls, { id: 'k-p', label: 'Grating period P', min: 200, max: 2000, step: 10, value: st.P, unit: ' nm' }, v => { st.P = v; draw(); });
  draw();
}

// Phase map (radians) of a flat cell: body, nucleus, nucleolus and a few vesicles.
function cellPhase(N) {
  const p = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x - 64) / 52, v = (y - 62) / 38, body = 1 - u * u - v * v;
    let ph = body > 0 ? 1.2 * Math.sqrt(body) : 0;
    const n = 1 - ((x - 58) ** 2 + (y - 60) ** 2) / 400; if (n > 0) ph += 0.8 * Math.sqrt(n);
    const nu = 1 - ((x - 54) ** 2 + (y - 56) ** 2) / 25; if (nu > 0) ph += 0.5 * Math.sqrt(nu);
    for (const [vx, vy] of [[92, 50], [88, 74], [30, 70], [40, 46], [100, 64]]) { const q = 1 - ((x - vx) ** 2 + (y - vy) ** 2) / 12; if (q > 0) ph += 0.6 * Math.sqrt(q); }
    p[y * N + x] = ph;
  }
  return p;
}

function dic(host) {
  const { controls, view, readout } = layout(host, 'A Nomarski prism splits polarised light into two beams sheared by less than the resolution limit. They pass through neighbouring points of the specimen, are recombined by a second prism and interfere at the analyser: I ∝ sin²((Δφ + b)/2), where Δφ is the phase difference between the two points and b the bias set by moving a prism. The image therefore shows the phase gradient along the shear direction, which looks like oblique lighting ("shadow-cast relief"); edges parallel to the shear vanish. With no bias the background is black and both slopes brighten equally; a bias of a quarter wave gives grey background with one side bright and the other dark.');
  const N = 128, phase = cellPhase(N);
  const st = { shear: 1.5, angle: 45, bias: 0.5 };
  const wrap = div(view, 'canvases');
  const mk = cap => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 256, 256); const fc = document.createElement('figcaption'); fc.textContent = cap; f.appendChild(fc); return c; };
  const cP = mk('Optical path (phase) of a flat cell'), cD = mk('DIC image');
  heatmap(cP, phase, N, N, CMAPS.blue);
  const draw = () => {
    const b = st.bias * Math.PI;
    const I = dicImage(phase, N, st.shear, st.angle, b);
    heatmap(cD, I, N, N, CMAPS.gray, 1);
    setReadout(readout, [['Shear', `${st.shear} px along ${st.angle}°`], ['Bias', `${st.bias.toFixed(2)}π rad (${(st.bias / 2).toFixed(2)} λ)`],
      ['Background', `${(Math.sin(b / 2) ** 2 * 100).toFixed(0)}% of maximum`], ['Look for', 'relief along the shear; edges parallel to it disappear: rotate the specimen or shear']]);
  };
  addSlider(controls, { id: 'd-s', label: 'Shear', min: 0.5, max: 6, step: 0.1, value: st.shear, unit: ' px' }, v => { st.shear = v; draw(); });
  addSlider(controls, { id: 'd-a', label: 'Shear direction', min: 0, max: 180, step: 5, value: st.angle, unit: '°' }, v => { st.angle = v; draw(); });
  addSlider(controls, { id: 'd-b', label: 'Bias retardation (× π)', min: 0, max: 1, step: 0.01, value: st.bias }, v => { st.bias = v; draw(); });
  draw();
}

// Surface profile (nm): a DNA strand, a 20 nm particle, a narrow 6 nm trench and a 4 nm step.
function surface(dx, n) {
  return Array.from({ length: n }, (_, i) => {
    const x = i * dx;
    let h = x > 260 ? 4 : 0;
    if (Math.abs(x - 40) < 1) h = Math.max(h, 1 + Math.sqrt(1 - (x - 40) ** 2));
    if (Math.abs(x - 120) < 10) h = Math.max(h, 10 + Math.sqrt(100 - (x - 120) ** 2));
    if (x > 197 && x < 203) h = -15;
    return h;
  });
}

function afm(host) {
  const { controls, view, readout } = layout(host, 'An AFM image is not the surface itself but the surface "dilated" by the tip: at each position the tip rests on whatever it touches first, so the image is max over the tip of (height − tip shape). Heights survive; widths do not. A sphere of radius r imaged with a spherical tip of radius R appears 4√(Rr) wide, so a 2 nm DNA strand looks 10-20 nm wide with an ordinary tip, and narrow trenches look shallow. Sharper tips (smaller R, smaller cone angle) and deconvolution of a characterised tip shape recover lateral detail.');
  const dx = 0.25, n = 1400, h = surface(dx, n);
  const st = { R: 8, cone: 20 };
  const plot = div(view);
  const draw = () => {
    const img = afmImage(h, dx, st.R, st.cone);
    const xs = h.map((_, i) => i * dx);
    const tipX = 120, tip = []; for (let u = -40; u <= 40; u += 0.5) tip.push([tipX + u, img[Math.round(tipX / dx)] + tipShape(u, st.R, st.cone)]);
    linePlot(plot, [{ pts: xs.map((x, i) => [x, h[i]]), color: '#8fa3c8', label: 'true surface' }, { pts: xs.map((x, i) => [x, img[i]]), color: '#3dff8f', label: 'AFM image' }, { pts: tip, color: '#ffd23f', dash: '3 3', label: 'tip resting on the particle' }],
      { xlabel: 'position (nm)', ylabel: 'height (nm)', ymin: -16, ymax: 30, xmin: 0, xmax: n * dx, H: 300 });
    const width = (lo, hi, base) => { let k = 0; for (let i = Math.round(lo / dx); i < Math.round(hi / dx); i++) if (img[i] > base + 0.05) k++; return k * dx; };
    const trench = Math.min(...img.slice(Math.round(190 / dx), Math.round(210 / dx)));
    setReadout(readout, [['DNA (2 nm) apparent width', `${width(0, 80, 0).toFixed(1)} nm (4√(Rr) = ${afmApparentWidth(st.R, 1).toFixed(1)})`],
      ['20 nm particle apparent width', `${width(80, 190, 0).toFixed(1)} nm (4√(Rr) = ${afmApparentWidth(st.R, 10).toFixed(1)})`],
      ['Heights', 'preserved (2 nm and 20 nm)'], ['6 nm × 15 nm trench depth reached', `${(-trench).toFixed(1)} nm of 15`]]);
  };
  addSlider(controls, { id: 'a-r', label: 'Tip radius R', min: 1, max: 40, step: 0.5, value: st.R, unit: ' nm' }, v => { st.R = v; draw(); });
  addSlider(controls, { id: 'a-c', label: 'Cone half-angle', min: 5, max: 45, step: 1, value: st.cone, unit: '°' }, v => { st.cone = v; draw(); });
  draw();
}

export const OPTICS2 = { kohler, dic, afm };
