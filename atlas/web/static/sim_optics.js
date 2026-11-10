// Optics simulations: PSF/Rayleigh, numerical aperture, infinity optics, Nyquist sampling, phase contrast.
import { airy, rayleigh, abbe, fwhmLateral, axialWidefield, halfAngle, criticalAngle, nyquistPixel } from './sim_engine.js';
import { layout, addSlider, addSeg, setReadout, canvas, heatmap, linePlot, div, CMAPS } from './sim_ui.js';
import { waveColor } from './core.js';

const nm = v => `${Math.round(v)} nm`;

function psf(host) {
  const { controls, view, readout } = layout(host, 'Each point of light is imaged as an Airy pattern whose size depends only on wavelength and NA. Two points are "just resolved" by the Rayleigh criterion when one\'s peak sits on the other\'s first dark ring (a 26% dip).');
  const st = { NA: 1.4, lam: 520, d: 300, cmap: 'green' };
  const ctx = canvas(view, 360, 360, 'Image of two point sources (2 µm field, gamma 0.6 to show the rings)');
  const prof = div(view);
  const N = 160, field = 2000;
  const draw = () => {
    const img = new Float32Array(N * N);
    const px = field / N;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i - N / 2) * px, y = (j - N / 2) * px;
      img[j * N + i] = airy(Math.hypot(x + st.d / 2, y), st.NA, st.lam) + airy(Math.hypot(x - st.d / 2, y), st.NA, st.lam);
    }
    heatmap(ctx, img, N, N, (v => { const c = waveColor(st.lam); const [r, g, b] = c.match(/\d+/g).map(Number); return [r * v, g * v, b * v]; }), null, 0.6);
    const pts = [], one = [];
    for (let x = -800; x <= 800; x += 5) {
      pts.push([x, airy(Math.abs(x + st.d / 2), st.NA, st.lam) + airy(Math.abs(x - st.d / 2), st.NA, st.lam)]);
      one.push([x, airy(Math.abs(x + st.d / 2), st.NA, st.lam)]);
    }
    const mid = airy(st.d / 2, st.NA, st.lam) * 2, peak = Math.max(...pts.map(p => p[1]));
    linePlot(prof, [{ pts, color: '#3dff8f', label: 'sum (what you see)' }, { pts: one, color: '#ff3fa4', dash: '4 3', label: 'one source' }],
      { xlabel: 'position (nm)', ylabel: 'intensity', marks: [{ x: -st.d / 2, label: '', color: '#8fa3c8' }, { x: st.d / 2, label: '', color: '#8fa3c8' }] });
    const R = rayleigh(st.lam, st.NA), dip = 1 - mid / peak;
    setReadout(readout, [['Rayleigh 0.61λ/NA', nm(R)], ['Abbe λ/2NA', nm(abbe(st.lam, st.NA))], ['PSF FWHM 0.51λ/NA', nm(fwhmLateral(st.lam, st.NA))],
      ['Axial (n=1.518)', nm(axialWidefield(st.lam, st.NA, 1.518))], ['Dip between peaks', `${Math.max(0, dip * 100).toFixed(0)}%`], ['Verdict', st.d >= R ? 'resolved' : dip > 0.01 ? 'barely' : 'not resolved']]);
  };
  addSlider(controls, { id: 'na', label: 'Numerical aperture', min: 0.1, max: 1.49, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  addSlider(controls, { id: 'lam', label: 'Emission wavelength', min: 400, max: 700, step: 5, value: st.lam, unit: ' nm' }, v => { st.lam = v; draw(); });
  addSlider(controls, { id: 'd', label: 'Separation', min: 40, max: 800, step: 5, value: st.d, unit: ' nm' }, v => { st.d = v; draw(); });
  draw();
}

const MEDIA = { air: 1.0, water: 1.333, silicone: 1.406, glycerol: 1.47, oil: 1.518 };

function na(host) {
  const { controls, view, readout } = layout(host, 'NA = n·sin θ: the refractive index of the immersion medium times the sine of the half-angle of the light cone. With an air gap, rays steeper than the critical angle are trapped in the coverslip by total internal reflection, so NA can never exceed 1.');
  const st = { medium: 'oil', theta: 67 };
  const svg = div(view);
  const draw = () => {
    const n = MEDIA[st.medium], th = st.theta * Math.PI / 180;
    // rays leave a point in the sample (water, n=1.33) -> coverslip (1.518) -> immersion -> objective
    const W = 640, H = 380, cx = 320, ySample = 330, yGlassTop = 290, yGlassBottom = 260, yLens = 120;
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}">`;
    s += `<rect x="0" y="${yGlassTop}" width="${W}" height="${H - yGlassTop}" fill="rgba(61,255,143,.05)"/><text class="axisl" x="10" y="${H - 10}">sample, aqueous (n = 1.33)</text>`;
    s += `<rect x="0" y="${yGlassBottom}" width="${W}" height="${yGlassTop - yGlassBottom}" fill="rgba(140,200,255,.18)"/><text class="axisl" x="10" y="${yGlassBottom + 18}">coverslip (n = 1.518)</text>`;
    s += `<rect x="0" y="${yLens}" width="${W}" height="${yGlassBottom - yLens}" fill="${n > 1.4 ? 'rgba(255,210,63,.07)' : n > 1.3 ? 'rgba(79,157,255,.07)' : 'transparent'}"/><text class="axisl" x="10" y="${yLens + 18}">immersion: ${st.medium} (n = ${n})</text>`;
    s += `<path d="M ${cx - 200} ${yLens} Q ${cx} ${yLens - 70} ${cx + 200} ${yLens}" fill="rgba(140,200,255,.15)" stroke="#8cc8ff"/><text class="axisl" x="${cx}" y="${yLens - 40}" text-anchor="middle">objective front lens</text>`;
    // trace rays at angles in glass (the angle that NA refers to, since n sinθ is conserved)
    const nG = 1.518, nS = 1.33;
    let lost = 0, kept = 0;
    for (let k = -12; k <= 12; k++) {
      const thG = (k / 12) * (80 * Math.PI / 180); // angle in glass
      const sinS = nG * Math.sin(thG) / nS;
      if (Math.abs(sinS) > 1) continue; // cannot originate from aqueous sample at this angle
      const thS = Math.asin(sinS);
      const x1 = cx + Math.tan(thS) * (ySample - yGlassTop);
      const x2 = x1 + Math.tan(thG) * (yGlassTop - yGlassBottom);
      const sinM = nG * Math.sin(thG) / n;
      const inCone = Math.abs(n * Math.sin(Math.asin(Math.min(1, Math.abs(sinM))))) <= n * Math.sin(th) + 1e-9;
      let pts = `${cx},${ySample} ${x1},${yGlassTop} ${x2},${yGlassBottom}`;
      let col = '#3dff8f';
      if (Math.abs(sinM) > 1) { col = '#ff5c7a'; pts += ` ${x2 + Math.tan(thG) * 30},${yGlassBottom + 30}`; lost++; }
      else {
        const thM = Math.asin(sinM);
        const x3 = x2 + Math.tan(thM) * (yGlassBottom - yLens);
        pts += ` ${x3},${yLens}`;
        if (!inCone) col = '#8fa3c8'; else kept++;
      }
      s += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.6" opacity=".9"/>`;
    }
    s += `<circle cx="${cx}" cy="${ySample}" r="5" fill="#3dff8f"/>`;
    s += `<text class="axisl" x="${W - 10}" y="20" text-anchor="end" fill="#3dff8f">collected</text><text class="axisl" x="${W - 10}" y="36" text-anchor="end" fill="#8fa3c8">outside the objective's cone</text><text class="axisl" x="${W - 10}" y="52" text-anchor="end" fill="#ff5c7a">totally internally reflected</text>`;
    svg.innerHTML = s + '</svg>';
    const NA = Math.min(n * Math.sin(th), n);
    const tc = criticalAngle(nG, n);
    setReadout(readout, [['NA = n sin θ', NA.toFixed(2)], ['Lateral resolution (520 nm)', nm(rayleigh(520, NA))], ['Relative brightness ∝ NA⁴', (NA ** 4 / 1.4 ** 4).toFixed(2) + '× NA 1.4'],
      ['Critical angle glass → medium', Number.isNaN(tc) ? 'none' : tc.toFixed(1) + '°'], ['TIRF possible?', NA > 1.38 ? 'yes (NA > n of cell)' : 'no']]);
  };
  addSeg(controls, 'Immersion medium', Object.keys(MEDIA).map(k => [k, k]), st.medium, v => { st.medium = v; draw(); });
  addSlider(controls, { id: 'th', label: 'Objective half-angle θ', min: 5, max: 72, step: 1, value: st.theta, unit: '°' }, v => { st.theta = v; draw(); });
  draw();
}

const TUBE = { Nikon: 200, Leica: 200, Olympus: 180, Zeiss: 165 };

function lens(host) {
  const { controls, view, readout } = layout(host, 'Modern objectives are infinity-corrected: an object in the front focal plane leaves the objective as parallel bundles, and the tube lens forms the image. Magnification = f(tube) / f(objective). Filters and dichroics sit in the parallel space; the back focal plane is where TIRF focuses its laser and phase rings live.');
  const st = { M: 60, maker: 'Nikon', h: 1 };
  const svg = div(view);
  const draw = () => {
    const ft = TUBE[st.maker], fo = ft / st.M;
    const W = 680, H = 300, y0 = 150, xo = 40, sc = 1;
    const xObjL = xo + 70, xBFP = xObjL + 40, xTube = 470, xImg = 640;
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${y0}" y2="${y0}" stroke="#1f2e4d"/>`;
    const hObj = 30 * st.h, hImg = Math.min(130, hObj * st.M / 20);
    s += `<line x1="${xo}" x2="${xo}" y1="${y0}" y2="${y0 - hObj}" stroke="#ffd23f" stroke-width="3"/><text class="axisl" x="${xo}" y="${y0 + 18}" text-anchor="middle">object</text>`;
    s += `<ellipse cx="${xObjL}" cy="${y0}" rx="8" ry="70" fill="rgba(140,200,255,.18)" stroke="#8cc8ff"/><text class="axisl" x="${xObjL}" y="${y0 + 90}" text-anchor="middle">objective f=${fo.toFixed(2)} mm</text>`;
    s += `<line x1="${xBFP}" x2="${xBFP}" y1="${y0 - 80}" y2="${y0 + 80}" stroke="#ff3fa4" stroke-dasharray="4 3"/><text class="axisl" x="${xBFP + 4}" y="${y0 - 84}" fill="#ff3fa4">back focal plane</text>`;
    s += `<ellipse cx="${xTube}" cy="${y0}" rx="8" ry="70" fill="rgba(140,200,255,.18)" stroke="#8cc8ff"/><text class="axisl" x="${xTube}" y="${y0 + 90}" text-anchor="middle">tube lens f=${ft} mm</text>`;
    s += `<rect x="${(xBFP + xTube) / 2 - 40}" y="${y0 - 120}" width="80" height="22" fill="none" stroke="#1f2e4d"/><text class="axisl" x="${(xBFP + xTube) / 2}" y="${y0 - 105}" text-anchor="middle">infinity space</text>`;
    s += `<line x1="${xImg}" x2="${xImg}" y1="${y0}" y2="${y0 + hImg}" stroke="#ffd23f" stroke-width="3"/><text class="axisl" x="${xImg}" y="${y0 - 8}" text-anchor="middle">image</text>`;
    // three rays from the object tip: through centre (chief) and two marginal, parallel after objective
    const tipY = y0 - hObj;
    [-60, 0, 60].forEach((a, i) => {
      const yAtObj = y0 + a * 0.9 - hObj * (a === 0 ? 1 : 0.0);
      const ys = i === 1 ? tipY : yAtObj;
      const slope = (y0 + hImg - (ys + (hObj) * 0)) ;
      const parY = ys; // parallel bundle height after objective
      s += `<polyline points="${xo},${tipY} ${xObjL},${ys} ${xTube},${parY + (hObj) * ((xTube - xObjL) / 400)} ${xImg},${y0 + hImg}" fill="none" stroke="${['#3dff8f', '#4f9dff', '#ff3fa4'][i]}" stroke-width="1.6"/>`;
      void slope;
    });
    [-50, 0, 50].forEach(a => { s += `<polyline points="${xo},${y0} ${xObjL},${y0 + a} ${xTube},${y0 + a} ${xImg},${y0}" fill="none" stroke="#e8f1ff" stroke-width="1" opacity=".5"/>`; });
    svg.innerHTML = s + '</svg>';
    setReadout(readout, [['Objective focal length', `${fo.toFixed(2)} mm`], ['Magnification', `${(ft / fo).toFixed(0)}×`], ['6.5 µm camera pixel at sample', `${(6500 / st.M).toFixed(0)} nm`],
      ['Same objective with Zeiss tube lens', `${(165 / fo).toFixed(1)}×`], ['Field number 25 → field of view', `${(25 / st.M * 1000).toFixed(0)} µm`]]);
  };
  addSlider(controls, { id: 'mag', label: 'Nominal magnification', min: 4, max: 100, step: 1, value: st.M, unit: '×' }, v => { st.M = v; draw(); });
  addSeg(controls, 'Tube lens (maker)', Object.keys(TUBE).map(k => [k, k]), st.maker, v => { st.maker = v; draw(); });
  draw();
}

function nyquist(host) {
  const { controls, view, readout } = layout(host, 'A camera samples the optical image. To keep all the detail the optics pass, the pixel (at the sample) must be at most half the finest period the objective transmits, λ/(2NA)/2 = λ/(4NA). Bigger pixels alias fine structure into false coarse patterns; much smaller pixels only cost signal per pixel.');
  const st = { NA: 1.4, lam: 520, px: 90, period: 260 };
  const c1 = canvas(view, 300, 300, 'Optical image (continuous)');
  const c2 = canvas(view, 300, 300, 'Sampled by the camera');
  const prof = div(view);
  view.querySelectorAll('figure').forEach(f => { f.style.display = 'inline-block'; f.style.width = '48%'; f.style.marginRight = '2%'; });
  const draw = () => {
    const field = 3000, N = 150, cut = 2 * st.NA / st.lam; // incoherent cutoff frequency (1/nm)
    const f = 1 / st.period, mtf = f >= cut ? 0 : (2 / Math.PI) * (Math.acos(f / cut) - (f / cut) * Math.sqrt(1 - (f / cut) ** 2));
    const val = (x, y) => 0.5 + 0.5 * mtf * Math.cos(2 * Math.PI * (x * Math.cos(0.3) + y * Math.sin(0.3)) * f);
    const a = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) a[j * N + i] = val(i * field / N, j * field / N);
    heatmap(c1, a, N, N, CMAPS.green, 1);
    const M = Math.max(2, Math.round(field / st.px)), b = new Float32Array(M * M);
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) b[j * M + i] = val((i + 0.5) * st.px, (j + 0.5) * st.px);
    heatmap(c2, b, M, M, CMAPS.green, 1);
    const cont = [], samp = [];
    for (let x = 0; x <= 1500; x += 4) cont.push([x, val(x, 0)]);
    for (let x = st.px / 2; x <= 1500; x += st.px) samp.push([x, val(x, 0)]);
    linePlot(prof, [{ pts: cont, color: '#3dff8f', label: 'true profile' }, { pts: samp, color: '#ff3fa4', label: 'pixel samples', dash: '' }, { pts: samp, color: '#ff3fa4', dots: true }], { xlabel: 'position (nm)', ylabel: 'intensity', ymin: 0, ymax: 1.05, H: 230 });
    const ny = nyquistPixel(st.lam, st.NA);
    setReadout(readout, [['Nyquist pixel λ/(4NA)', nm(ny)], ['Your pixel', nm(st.px)], ['Pattern contrast after optics (MTF)', `${(mtf * 100).toFixed(0)}%`],
      ['Sampling', st.px <= ny * 1.05 ? 'Nyquist satisfied' : st.px < st.period / 2 ? 'under-sampled for the optics' : 'ALIASED: period < 2 pixels'], ['Camera pixel for this at 100×', `${(st.px * 100 / 1000).toFixed(1)} µm`]]);
  };
  addSlider(controls, { id: 'px', label: 'Pixel size at sample', min: 20, max: 400, step: 5, value: st.px, unit: ' nm' }, v => { st.px = v; draw(); });
  addSlider(controls, { id: 'per', label: 'Structure period', min: 150, max: 800, step: 5, value: st.period, unit: ' nm' }, v => { st.period = v; draw(); });
  addSlider(controls, { id: 'nyna', label: 'NA', min: 0.3, max: 1.49, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  draw();
}

function phase(host) {
  const { controls, view, readout } = layout(host, 'A thin unstained cell delays light (a phase shift φ) but barely absorbs it, so in brightfield it is invisible: |S + D|² ≈ |S|². Zernike separated the undiffracted light S (which passes the phase ring in the back focal plane) from the light D the specimen diffracts, then shifted S by a quarter wave and dimmed it. Now S and D interfere destructively or constructively, and phase becomes intensity.');
  const st = { phi: 0.3, att: 0.25, sign: 'positive' };
  const svg = div(view);
  const draw = () => {
    const S = [1, 0], P = [Math.cos(st.phi), Math.sin(st.phi)], D = [P[0] - S[0], P[1] - S[1]];
    const rot = st.sign === 'positive' ? Math.PI / 2 : -Math.PI / 2, t = Math.sqrt(st.att);
    const S2 = [t * Math.cos(rot), t * Math.sin(rot)], P2 = [S2[0] + D[0], S2[1] + D[1]];
    const I0 = S2[0] ** 2 + S2[1] ** 2, I1 = P2[0] ** 2 + P2[1] ** 2;
    const W = 640, H = 330, o1 = [170, 200], o2 = [470, 200], sc = 120;
    const arr = (o, v, col, lab, from = [0, 0]) => {
      const x1 = o[0] + from[0] * sc, y1 = o[1] - from[1] * sc, x2 = x1 + v[0] * sc, y2 = y1 - v[1] * sc;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" marker-end="url(#ah)"/><text class="axisl" x="${(x1 + x2) / 2 + 6}" y="${(y1 + y2) / 2 - 6}" fill="${col}">${lab}</text>`;
    };
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#e8f1ff"/></marker></defs>`;
    s += `<text class="axisl" x="${o1[0]}" y="30" text-anchor="middle">Brightfield</text><text class="axisl" x="${o2[0]}" y="30" text-anchor="middle">Phase contrast (${st.sign})</text>`;
    s += `<circle cx="${o1[0]}" cy="${o1[1]}" r="${sc}" fill="none" stroke="#1f2e4d"/><circle cx="${o2[0]}" cy="${o2[1]}" r="${sc}" fill="none" stroke="#1f2e4d"/>`;
    s += arr(o1, S, '#8fa3c8', 'S (background)') + arr(o1, D, '#ff3fa4', 'D', S) + arr(o1, P, '#3dff8f', 'P = S + D');
    s += arr(o2, S2, '#8fa3c8', 'S shifted, dimmed') + arr(o2, D, '#ff3fa4', 'D', S2) + arr(o2, P2, '#3dff8f', 'P');
    svg.innerHTML = s + '</svg>';
    const cBF = (1 - 1) * 100, cPC = (I1 - I0) / I0 * 100;
    setReadout(readout, [['Brightfield contrast', `${cBF.toFixed(0)}%`], ['Phase-contrast contrast', `${cPC.toFixed(0)}%`], ['Specimen appears', cPC < 0 ? 'darker than background' : 'brighter than background'],
      ['Optical path difference (550 nm)', `${(st.phi / (2 * Math.PI) * 550).toFixed(0)} nm`], ['Halo artefact', 'from the finite ring width; grows with large φ']]);
  };
  addSlider(controls, { id: 'phi', label: 'Specimen phase shift φ', min: 0.02, max: 1.5, step: 0.01, value: st.phi, unit: ' rad' }, v => { st.phi = v; draw(); });
  addSlider(controls, { id: 'att', label: 'Ring transmission', min: 0.05, max: 1, step: 0.01, value: st.att }, v => { st.att = v; draw(); });
  addSeg(controls, 'Phase plate', [['positive', 'positive (dark)'], ['negative', 'negative (bright)']], st.sign, v => { st.sign = v; draw(); });
  draw();
}

export const OPTICS = { psf, na, lens, nyquist, phase };
void halfAngle;
