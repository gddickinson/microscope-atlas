// Image Lab (#/imagelab): load an image (TIFF/PNG/JPEG) or a test specimen, treat it as the true object and image it
// through a simulated microscope: diffraction blur, camera pixel size (binning), photon and read noise, then
// Richardson-Lucy deconvolution and Fourier power spectra. All in the browser; physics in sim_engine_image.js.
import { route, app, esc } from './core.js';
import { rng, gaussBlur, blurPSF, psfSigmaPx, binImage, cameraImage, powerSpectrum, richardsonLucy, imageStats, pearson, nyquistPixel, fwhmLateral, toSquare } from './sim_engine.js';
import { layout, addSlider, addSeg, addButton, setReadout, canvas, heatmap, CMAPS, div, fmt } from './sim_ui.js';
import { makeSpecimen, SPECIMENS } from './table_specimens.js';
import { fromImageFile } from './imagelab_io.js';
import { spotPanel } from './imagelab_spots.js';

const N = 256;
const DEMOS = ['beadpairs', 'usaf', 'siemens', 'microtubules', 'mitochondria', 'npc', 'single'];

// Specimen emitters splatted onto an N x N grid (weights near the focal plane count most).
function demoImage(id) {
  const s = makeSpecimen(id), px = s.fov / N, a = new Float64Array(N * N);
  for (let i = 0; i < s.n; i++) {
    const x = Math.floor(s.emitters[4 * i] / px), y = Math.floor(s.emitters[4 * i + 1] / px), z = s.emitters[4 * i + 2];
    if (x >= 0 && y >= 0 && x < N && y < N) a[y * N + x] += s.emitters[4 * i + 3] * Math.exp(-((z - s.focus) ** 2) / (2 * 600 * 600));
  }
  return { data: a, px, label: s.label, note: s.note };
}

// Sparse single molecules at known positions (grid pixels of 25 nm, at least 1 µm apart), for testing localization.
function smFrame(seed) {
  const r = rng(seed * 101 + 7), a = new Float64Array(N * N), pts = [];
  for (let tries = 0; pts.length < 40 && tries < 5000; tries++) {
    const x = 16 + Math.floor(r() * (N - 32)), y = 16 + Math.floor(r() * (N - 32));
    if (pts.every(([u, v]) => Math.hypot(u - x, v - y) >= 40)) { pts.push([x, y]); a[y * N + x] = 1; }
  }
  return { data: a, px: 25, pts, note: `${pts.length} single dye molecules at known positions, at least 1 µm apart, in a 6.4 µm field. Try camera pixels ×4 (100 nm), then vary photons and background and watch the localization error follow the Thompson limit.` };
}

const INTRO = 'Pick a test specimen or load your own image (TIFF, PNG or JPEG; it stays in your browser). The image is treated as the true distribution of fluorophores and imaged through a simulated widefield microscope: blurred by the diffraction-limited PSF, recorded on camera pixels of the chosen size, with photon shot noise, background and read noise. Then try to undo the blur with Richardson-Lucy deconvolution, and look at each stage in Fourier space, where the microscope acts as a low-pass filter with a cut-off at 2NA/λ.';

route('imagelab', () => {
  app().innerHTML = `<p class="kicker"><a href="#/lab">Lab tools</a></p><h1>Image Lab</h1><div id="il"></div>`;
  const { controls, view, readout } = layout(app().querySelector('#il'), INTRO);
  const st = { src: 'beadpairs', truth: null, px: 47, upPx: 50, lam: 520, NA: 1.4, bin: 1, photons: 200, bg: 10, read: 1.5, iters: 20, seed: 1, lut: 'gray', file: null };
  const srcBox = div(controls);
  srcBox.innerHTML = `<label>Specimen</label><select id="il-src">${DEMOS.map(d => `<option value="${d}">${esc(SPECIMENS[d].label)}</option>`).join('')}<option value="smframe">Single-molecule frame (known positions)</option><option value="file">Your image…</option></select>
    <input type="file" id="il-file" accept=".tif,.tiff,.png,.jpg,.jpeg,image/*" style="display:none"><p class="small mute" id="il-note"></p>`;
  const sel = srcBox.querySelector('#il-src'), fileIn = srcBox.querySelector('#il-file'), note = srcBox.querySelector('#il-note');
  const pxRow = div(controls);
  addSlider(pxRow, { id: 'il-up', label: 'Pixel size of your image (object space)', min: 5, max: 500, step: 5, value: st.upPx, unit: ' nm' }, v => { st.upPx = v; setFile(); });
  pxRow.style.display = 'none';
  addSlider(controls, { id: 'il-lam', label: 'Emission wavelength λ', min: 400, max: 750, step: 5, value: st.lam, unit: ' nm' }, v => { st.lam = v; draw(); });
  addSlider(controls, { id: 'il-na', label: 'Objective NA', min: 0.1, max: 1.49, step: 0.01, value: st.NA }, v => { st.NA = v; draw(); });
  addSeg(controls, 'Camera pixel (binning of the grid)', [['1', '×1'], ['2', '×2'], ['4', '×4'], ['8', '×8']], '1', v => { st.bin = +v; draw(); });
  addSlider(controls, { id: 'il-ph', label: 'Photons in the brightest pixel', min: 5, max: 5000, step: 5, value: st.photons }, v => { st.photons = v; draw(); });
  addSlider(controls, { id: 'il-bg', label: 'Background', min: 0, max: 500, step: 1, value: st.bg, unit: ' photons/px' }, v => { st.bg = v; draw(); });
  addSlider(controls, { id: 'il-rd', label: 'Camera read noise', min: 0, max: 10, step: 0.1, value: st.read, unit: ' e⁻ rms' }, v => { st.read = v; draw(); });
  addSlider(controls, { id: 'il-it', label: 'Richardson-Lucy iterations', min: 0, max: 100, step: 1, value: st.iters }, v => { st.iters = v; draw(); });
  addSeg(controls, 'Look-up table', [['gray', 'grey'], ['green', 'green'], ['hot', 'hot']], 'gray', v => { st.lut = v; draw(); });
  addButton(controls, 'New noise', () => { st.seed++; draw(); }, true);
  controls.appendChild(readout);

  const wrap = div(view, 'canvases il-grid');
  const fig = cap => { const f = document.createElement('figure'); wrap.appendChild(f); const c = canvas(f, 256, 256); const fc = document.createElement('figcaption'); fc.textContent = cap; f.appendChild(fc); return [c, fc]; };
  const [cT] = fig('Object (your image or the specimen)'), [cI, capI] = fig('Camera image'), [cR, capR] = fig('Restored (Richardson-Lucy)');
  const [cFT] = fig('Power spectrum of the object'), [cFI] = fig('…of the camera image'), [cFR] = fig('…of the restored image');
  const spots = spotPanel(div(app(), 'il-spots'));

  function setDemo() {
    const d = st.src === 'smframe' ? smFrame(st.seed) : demoImage(st.src);
    st.truth = d.data; st.px = d.px; st.pts = d.pts || null; pxRow.style.display = 'none';
    note.textContent = `${d.note} Grid pixel ${d.px.toFixed(0)} nm, field ${(d.px * N / 1000).toFixed(1)} µm.`;
    draw();
  }
  function setFile() {
    if (!st.file) return;
    const f = st.file, side = Math.min(f.w, f.h);
    st.truth = toSquare(f.data, f.w, f.h, N); st.pts = null; st.px = st.upPx * side / N; pxRow.style.display = '';
    const lo = imageStats(st.truth).min; for (let i = 0; i < st.truth.length; i++) st.truth[i] -= lo; // offset to zero
    note.textContent = `${f.name}: ${f.w} × ${f.h} px, ${f.note}. Centre square resampled to ${N} × ${N} (grid pixel ${st.px.toFixed(0)} nm). Already-blurred images get blurred again: a sharp or synthetic image shows the effects best.`;
    draw();
  }
  sel.onchange = () => { if (sel.value === 'file') fileIn.click(); else { st.src = sel.value; setDemo(); } };
  fileIn.onchange = async () => {
    const file = fileIn.files[0]; if (!file) return;
    try { st.file = { ...(await fromImageFile(file)), name: file.name }; setFile(); } catch (e) { note.innerHTML = `<span class="err">${esc(e.message)}</span>`; }
  };

  let pending = 0;
  function draw() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; render(); }); }
  function render() {
    if (!st.truth) return;
    const lut = CMAPS[st.lut], M = N / st.bin, camPx = st.px * st.bin;
    const blurred = blurPSF(st.truth, N, st.lam, st.NA, st.px);
    const cam = cameraImage(binImage(blurred, N, st.bin), { photons: st.photons, bg: st.bg, read: st.read, rand: rng(st.seed) });
    const sig = psfSigmaPx(st.lam, st.NA, camPx);
    const data = cam.map(v => Math.max(0, v - st.bg));
    const rest = st.iters ? richardsonLucy(data.map(v => v + 1e-3), M, Math.max(0.3, sig), st.iters) : data;
    const tb = binImage(st.truth, N, st.bin);
    heatmap(cT, st.truth, N, N, lut);
    const s = imageStats(cam);
    heatmap(cI, cam.map(v => v - s.min), M, M, lut);
    heatmap(cR, rest, M, M, lut);
    capI.textContent = `Camera image: ${M} × ${M} pixels of ${camPx.toFixed(0)} nm`;
    capR.textContent = st.iters ? `Restored: ${st.iters} Richardson-Lucy iterations` : 'Restored: set iterations above 0';
    // log power, floor at the median (the noise level) so the passband stands out; circle = cut-off 2NA/λ
    const kc = 2 * st.NA / st.lam; // cycles per nm
    const spec = (ctx, a, n, p) => {
      const P = powerSpectrum(a, n), med = Float64Array.from(P).sort()[Math.floor(P.length / 2)], q = imageStats(P);
      heatmap(ctx, P.map(v => Math.max(0, v - med)), n, n, CMAPS.hot, Math.max(1e-9, q.max - med));
      const r = kc * n * p * (ctx.canvas.width / n);
      if (r < ctx.canvas.width * 0.75) { ctx.strokeStyle = '#4f9dff'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, r, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }
    };
    spec(cFT, st.truth, N, st.px); spec(cFI, cam, M, camPx); spec(cFR, rest, M, camPx);
    const nyq = nyquistPixel(st.lam, st.NA), peak = st.photons + st.bg;
    const tbb = gaussBlur(tb, M, 0.5); // compare at a common, slightly smoothed scale
    const rel = b => pearson(tbb, gaussBlur(b, M, 0.5)).toFixed(3);
    setReadout(readout, [
      ['PSF FWHM 0.51 λ/NA', `${fwhmLateral(st.lam, st.NA).toFixed(0)} nm (σ = ${sig.toFixed(2)} camera px)`],
      ['Camera pixel vs Nyquist λ/(4NA)', `${camPx.toFixed(0)} vs ${nyq.toFixed(0)} nm: ${camPx <= nyq * 1.05 ? 'sampled' : camPx <= 2 * nyq ? 'slightly undersampled' : 'undersampled'}`],
      ['Frequency cut-off 2NA/λ', `${(2 * st.NA / st.lam * 1000).toFixed(2)} cycles/µm, ${(st.lam / (2 * st.NA)).toFixed(0)} nm period`],
      ['Peak SNR (shot + background + read)', fmt(st.photons / Math.sqrt(peak + st.read ** 2))],
      ['Correlation with the object: camera image', rel(data)],
      ['…restored', st.iters ? rel(rest) : '-'],
      ['Spectra', 'dashed circle = cut-off; beyond it only noise remains'],
    ]);
    spots({ cam, M, sigma: sig, camPx, truth: st.pts && st.pts.map(([x, y]) => [(x + 0.5) / st.bin - 0.5, (y + 0.5) / st.bin - 0.5]) });
  }
  setDemo();
});
