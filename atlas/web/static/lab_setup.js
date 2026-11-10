// Lab Tools, 'Microscope setup' group: Köhler checklist, camera/objective matcher, z-step, TIRF offset, laser power density.
// Planning tools, the immersion reference and the objective finder live in lab_setup2.js and are re-exported here.
// Pure calculations are exported for tests (tests/lab_setup.test.mjs).
import { esc, api } from './core.js';
import { row, panel, results, out, table, note, fmt } from './lab_ui.js';
import { nyquistPixel, axialWidefield, sectioningFWHM, criticalAngle, penetrationDepth } from './sim_engine.js';
import { TOOLS as PLANNING, fields, pick, firstNumber } from './lab_setup2.js';
export * from './lab_setup2.js';

const H = 6.62607015e-34, C = 2.99792458e8;
export const TUBE_LENS = { Nikon: 200, Leica: 200, Olympus: 180, Zeiss: 165 };

// --- parsing component specs from data/components/*.json ---------------------------
// "2304 x 2304 (5.3 MP)" -> {nx, ny}; "8k x 8k" -> 8192; "(13.3 x 13.3 mm sensor)" -> {wMm, hMm}.
export function parseSensor(pixels) {
  const s = String(pixels ?? '');
  const mm = s.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mm/i);
  const px = s.match(/(\d+(?:\.\d+)?)(k?)\s*x\s*(\d+(?:\.\d+)?)(k?)(?!\s*mm|\.\d|\d)/i);
  const out = {};
  if (px && !(mm && mm.index === px.index)) {
    out.nx = +px[1] * (px[2] ? 1024 : 1);
    out.ny = +px[3] * (px[4] ? 1024 : 1);
  }
  if (mm) { out.wMm = +mm[1]; out.hMm = +mm[2]; }
  return Object.keys(out).length ? out : null;
}

// --- camera and objective matching -------------------------------------------------
// Pixel at sample (nm) = camera pixel (µm) × 1000 / (objective M × relay). Nyquist pixel λ/(4NA).
export function cameraMatch({ pixelUm, mag, relay = 1, lambda, NA, nx, ny, wMm, hMm }) {
  const M = mag * Number(relay);
  const samplePx = pixelUm * 1000 / M;
  const nyq = nyquistPixel(lambda, NA);
  const ratio = samplePx / nyq;
  const verdict = ratio > 1.05 ? `under-sampled ×${ratio.toFixed(2)}` : ratio >= 0.5 ? 'meets Nyquist' : `over-sampled ×${(1 / ratio).toFixed(1)}`;
  const w = nx ? nx * pixelUm : wMm ? wMm * 1000 : NaN, h = ny ? ny * pixelUm : hMm ? hMm * 1000 : NaN;
  return { M, samplePx, nyq, ratio, verdict, fovW: w / M, fovH: h / M, relayNyquist: pixelUm * 1000 / (mag * nyq) };
}

// --- axial sampling ----------------------------------------------------------------------
// Resolution-based step = axial FWHM / 2; strict band-limit step λ / (2n(1 − cos α)) for widefield.
export function zStep({ mode, lambda, NA, n, pinholeAU = 1, sheetUm = 4 }) {
  let axial;
  if (mode === 'confocal') axial = sectioningFWHM(lambda, NA, n, pinholeAU);
  else if (mode === 'lightsheet') axial = sheetUm * 1000;
  else axial = axialWidefield(lambda, NA, n);
  const cosA = Math.sqrt(Math.max(0, 1 - (NA / n) ** 2));
  const strict = mode === 'widefield' ? lambda / (2 * n * (1 - cosA)) : NaN;
  return { axial, step: axial / 2, strict };
}
export function stackPlan({ depthUm, stepNm, exposureMs, overheadMs = 0 }) {
  const slices = Math.floor(depthUm * 1000 / stepNm + 1e-9) + 1;
  return { slices, seconds: slices * (exposureMs + overheadMs) / 1000 };
}

// --- TIRF ---------------------------------------------------------------------------------
// Objective focal length f = f_tube / M; BFP radial offset r = f · n1 sin θ (mm).
export const objectiveFocal = (fTube, M) => fTube / M;
export const tirfOffset = (fObj, n1, thetaDeg) => fObj * n1 * Math.sin(thetaDeg * Math.PI / 180);
export function tirfRange({ M, fTube, NA, n1 = 1.518, n2 = 1.33 }) {
  const f = objectiveFocal(fTube, M);
  const thetaC = criticalAngle(n1, n2);
  const thetaMax = NA < n1 ? Math.asin(NA / n1) * 180 / Math.PI : 90;
  return { f, thetaC, thetaMax, rMin: f * n2, rMax: f * NA, possible: NA > n2 };
}

// --- power density and photon flux ----------------------------------------------------------
export const circleAreaCm2 = dUm => Math.PI * (dUm * 1e-4 / 2) ** 2;
export const confocalSpotUm = (lambda, NA) => 1.22 * lambda / NA / 1000;
export const powerDensity = (mW, areaCm2) => (mW / 1000) / areaCm2; // W/cm²
export const photonEnergy = lambdaNm => H * C / (lambdaNm * 1e-9);   // J
export const photonFlux = (Wcm2, lambdaNm) => (Wcm2 / 1e8) / photonEnergy(lambdaNm); // photons/s/µm²

// --- 1. Köhler illumination ----------------------------------------------------------------
const KOHLER = [
  ['Switch on the lamp, open the field and aperture diaphragms fully, put a stained specimen on the stage and focus it with a 10x objective.', 'Köhler is set relative to a focused specimen; a 10x gives a field diaphragm image that is easy to find.'],
  ['Close the field diaphragm (the iris at the lamp port in the base) until its edges appear in the field of view.', 'The field diaphragm sits in a plane conjugate to the specimen, so a sharp image of it marks the right condenser height.'],
  ['Raise or lower the condenser until the edges of the field diaphragm are sharp (a thin coloured fringe is normal).', 'This puts the condenser focus on the specimen plane, so the lamp filament is imaged into the condenser front focal plane and the field is lit evenly.'],
  ['Centre the polygon with the two condenser centring screws.', 'An off-centre condenser gives oblique, uneven illumination and asymmetric contrast.'],
  ['Open the field diaphragm until its edges just disappear beyond the field of view.', 'Lighting only what you see cuts stray light (glare) and, in fluorescence-capable stands, needless exposure of the specimen.'],
  ['Remove one eyepiece (or swing in the Bertrand lens) and look at the objective back aperture.', 'The aperture diaphragm sits in a plane conjugate to the back focal plane, so you can only judge it there.'],
  ['Close the condenser aperture diaphragm until it fills about 70-80% of the back aperture, then put the eyepiece back.', 'This sets the illumination NA: more open gives resolution, more closed gives contrast and depth of field. Never use it to set brightness; use the lamp voltage or neutral density filters.'],
  ['If the lamp is adjustable, centre and focus the filament (or LED collector) image in the back aperture for even fill.', 'An uneven source image in the back aperture shows up as uneven brightness or colour across the field.'],
  ['Each time you change objective, re-check the field diaphragm size and reset the aperture diaphragm.', 'Field of view and objective NA change with the objective, so both diaphragm settings change too.'],
  ['For phase contrast or DIC, now set the condenser turret and align the annulus or prisms with the phase telescope or Bertrand lens.', 'Phase rings and DIC prisms only work correctly once the illumination is in Köhler.'],
];
const KOHLER_FIX = [
  ['Cannot find the field diaphragm', 'Condenser far out of focus or its top lens swung out; open the diaphragm, focus the specimen again and move the condenser slowly through its range.'],
  ['Dirt or fibres in focus with the specimen', 'They lie in a field plane: the field lens on the base, the field diaphragm, or the slide. Clean those, not the objective.'],
  ['Uneven, darker on one side', 'Condenser not centred, wrong condenser setting for the objective, a filter half in the path, or the lamp not centred.'],
  ['Washed-out, low-contrast image', 'Aperture diaphragm too open, or field diaphragm far larger than the field (glare).'],
  ['Halos, thick dark outlines, grainy image', 'Aperture diaphragm closed too far; resolution is lost to diffraction.'],
  ['Small bright spot or vignetting with a 4x or 2x objective', 'Swing out the condenser top lens (or use the low-power condenser) for low magnification.'],
];

function mountKohler(host) {
  const key = 'atlas-lab-kohler';
  let done = [];
  try { done = JSON.parse(localStorage.getItem(key) || '[]'); } catch { done = []; }
  const p = panel(host, 'Transmitted-light Köhler alignment');
  const prog = out(p);
  const listEl = document.createElement('ol');
  listEl.className = 'steps';
  p.appendChild(listEl);
  const reset = document.createElement('button');
  reset.className = 'alt';
  reset.textContent = 'Reset checklist';
  p.appendChild(reset);
  const save = () => { try { localStorage.setItem(key, JSON.stringify(done)); } catch { /* storage unavailable */ } };
  const draw = () => {
    const n = KOHLER.filter((_, i) => done[i]).length;
    prog.innerHTML = `<p><span class="tag ${n === KOHLER.length ? 'g' : 'b'}">${n} / ${KOHLER.length} steps</span> ${n === KOHLER.length ? 'Illumination is in Köhler. Re-check after changing objective.' : ''}</p>`;
    listEl.innerHTML = KOHLER.map(([step, why], i) => `<li><label style="display:flex;gap:10px;align-items:flex-start;color:var(--ink);margin:0"><input type="checkbox" data-i="${i}" ${done[i] ? 'checked' : ''}><span${done[i] ? ' class="mute"' : ''}>${esc(step)}<br><span class="small mute">Why: ${esc(why)}</span></span></label></li>`).join('');
  };
  listEl.addEventListener('change', e => { const i = +e.target.dataset.i; done[i] = e.target.checked; save(); draw(); });
  reset.onclick = () => { done = []; save(); draw(); };
  draw();
  const t = panel(host, 'Troubleshooting');
  const to = out(t);
  table(to, ['Symptom', 'Likely cause and fix'], KOHLER_FIX.map(([a, b]) => [esc(a), esc(b)]));
  note(host, 'Köhler illumination images the lamp into the condenser front focal plane (and so into the objective back aperture) and the field diaphragm into the specimen plane. The result is an evenly lit field whose size and illumination NA can be set independently.');
}

// --- 2. Camera and objective matcher ----------------------------------------------------------
async function mountCamera(host) {
  const s = { cam: 'manual', pixelUm: 6.5, nx: 2048, ny: 2048, obj: 'manual', mag: 60, NA: 1.4, relay: 1, lambda: 520 };
  let cams = [], objs = [];
  try { cams = (await api('/components/detectors')).filter(d => d.specs && d.specs['Pixel size'] && Number.isFinite(firstNumber(d.specs['Pixel size']))); } catch { cams = []; }
  try { objs = (await api('/components/objectives')).filter(o => o.specs && Number.isFinite(firstNumber(o.specs.NA)) && Number.isFinite(firstNumber(o.specs.Magnification))); } catch { objs = []; }
  const p = panel(host, 'Camera, objective and relay');
  const r1 = row(p);
  const o = out(host);
  const src = out(host);
  let inputs;
  const draw = () => {
    s.relay = +s.relay;
    const cam = cams.find(c => c.id === s.cam);
    const obj = objs.find(c => c.id === s.obj);
    let sensor = { nx: s.nx, ny: s.ny };
    if (cam) { s.pixelUm = firstNumber(cam.specs['Pixel size']); sensor = parseSensor(cam.specs.Pixels) || {}; }
    if (obj) { s.mag = firstNumber(obj.specs.Magnification); s.NA = firstNumber(obj.specs.NA); }
    for (const k of ['pixelUm', 'mag', 'NA']) { inputs[k].value = s[k]; inputs[k].disabled = Boolean(k === 'pixelUm' ? cam : obj); }
    for (const k of ['nx', 'ny']) inputs[k].disabled = Boolean(cam);
    const m = cameraMatch({ ...s, ...sensor });
    const fov = Number.isFinite(m.fovW) ? `${fmt(m.fovW)} × ${fmt(m.fovH)} µm` : 'sensor size unknown';
    results(o, [
      ['Pixel size at the sample', `${fmt(m.samplePx)} nm`, `camera pixel / (${fmt(s.mag)} × ${fmt(s.relay)})`],
      ['Nyquist pixel λ/(4NA)', `${fmt(m.nyq)} nm`],
      ['Sampling', m.verdict, `pixel / Nyquist = ${fmt(m.ratio)}`],
      ['Field of view', fov, cam ? `from the spec "${cam.specs.Pixels || '—'}"` : 'sensor pixels × pixel size / total M'],
      ['Relay for exact Nyquist', `${fmt(m.relayNyquist)}×`, 'extra magnification giving pixel = λ/(4NA)'],
      ['Total magnification', `${fmt(m.M)}×`],
    ]);
    src.innerHTML = [cam, obj].filter(Boolean).map(c => `<p class="small mute">${esc(c.manufacturer)} ${esc(c.name)}: ${(c.sources || []).map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(' · ')}</p>`).join('');
  };
  pick(r1, s, 'cm', 'cam', 'Camera', [['manual', 'Manual entry'], ...cams.map(c => [c.id, `${c.manufacturer} ${c.name} (${c.specs['Pixel size']})`])], draw);
  pick(r1, s, 'cm', 'obj', 'Objective', [['manual', 'Manual entry'], ...objs.map(c => [c.id, `${c.manufacturer} ${c.name} ${c.specs.Magnification} / ${c.specs.NA}`])], draw);
  pick(r1, s, 'cm', 'relay', 'Extra relay magnification', [[1, '1.0×'], [1.2, '1.2×'], [1.5, '1.5×'], [2, '2.0×'], [2.5, '2.5×'], [0.7, '0.7×'], [0.5, '0.5×']], draw);
  const r2 = fields(p, s, 'cm', [['pixelUm', 'Camera pixel', 'µm'], ['nx', 'Sensor width', 'px', 1], ['ny', 'Sensor height', 'px', 1], ['mag', 'Objective magnification', '×'], ['NA', 'Objective NA', '', 0.01], ['lambda', 'Emission wavelength', 'nm', 1]], draw);
  inputs = Object.fromEntries(['pixelUm', 'nx', 'ny', 'mag', 'NA', 'lambda'].map(k => [k, r2.querySelector(`#lt-cm-${k}`)]));
  if (!cams.length) note(p, 'Camera list unavailable: enter the pixel size by hand.', 'callout');
  draw();
  note(host, 'Pixel at sample = camera pixel ÷ total magnification. Nyquist sampling of the band-limited image needs a pixel no larger than λ/(4NA), half the finest period the objective passes (λ/2NA). Slightly under-sampling (×1.2-1.5) is common for speed and signal per pixel; heavy over-sampling spreads photons over more pixels and shrinks the field. For single-molecule localization, a pixel near the PSF standard deviation (~100-160 nm) is usually chosen instead.');
}

// --- 3. Axial Z-step calculator -----------------------------------------------------------------
function mountZ(host) {
  const s = { mode: 'widefield', lambda: 520, NA: 1.4, n: 1.518, pinholeAU: 1, sheetUm: 4, depthUm: 10, exposureMs: 50, overheadMs: 10 };
  const p = panel(host, 'Optics and stack');
  const o = out(host);
  const draw = () => {
    const z = zStep(s);
    const plan = stackPlan({ depthUm: s.depthUm, stepNm: z.step, exposureMs: s.exposureMs, overheadMs: s.overheadMs });
    const rows = [
      [s.mode === 'lightsheet' ? 'Sheet thickness (FWHM)' : 'Axial resolution (FWHM)', `${fmt(z.axial)} nm`, s.mode === 'widefield' ? '2nλ/NA²' : s.mode === 'confocal' ? `optical section at ${fmt(s.pinholeAU)} AU` : 'sets the axial resolution'],
      ['Nyquist z-step (FWHM / 2)', `${fmt(z.step)} nm`],
    ];
    if (s.mode === 'widefield') rows.push(['Strict band-limit step', `${fmt(z.strict)} nm`, 'λ / (2n(1 − cos α)), for deconvolution']);
    rows.push(['Slices for the stack', `${plan.slices}`, `${fmt(s.depthUm)} µm depth, both ends included`], ['Time per stack', `${fmt(plan.seconds)} s`, `slices × (exposure + ${fmt(s.overheadMs)} ms step/readout)`]);
    results(o, rows);
  };
  const r = row(p);
  pick(r, s, 'zs', 'mode', 'Microscope', [['widefield', 'Widefield'], ['confocal', 'Point-scanning / spinning-disk confocal'], ['lightsheet', 'Light sheet']], draw);
  fields(p, s, 'zs', [['lambda', 'Emission wavelength', 'nm', 1], ['NA', 'Objective NA', '', 0.01], ['n', 'Immersion index', '', 0.001], ['pinholeAU', 'Pinhole (confocal)', 'AU', 0.1], ['sheetUm', 'Sheet thickness (light sheet)', 'µm', 0.1]], draw);
  fields(p, s, 'zs', [['depthUm', 'Stack depth', 'µm'], ['exposureMs', 'Exposure per slice', 'ms'], ['overheadMs', 'Step and readout overhead', 'ms']], draw);
  draw();
  note(host, 'Sample in z at half the axial FWHM. Widefield axial resolution is ≈ 2nλ/NA²; for a confocal it is the optical section thickness at the chosen pinhole (Wilson formula, as in the pinhole simulation); for a light sheet the sheet thickness dominates when the detection NA is low. If you plan to deconvolve, use the stricter band-limit step. All numbers are for a matched immersion medium; mismatched samples stretch or compress z.');
}

// --- 4. TIRF beam offset -----------------------------------------------------------------------
function mountTirf(host) {
  const s = { maker: 'Nikon', M: 60, NA: 1.49, n1: 1.518, n2: 1.33, lambda: 488 };
  const p = panel(host, 'Objective and sample');
  const o = out(host);
  const tb = out(host);
  const draw = () => {
    const fTube = TUBE_LENS[s.maker];
    const t = tirfRange({ M: s.M, fTube, NA: s.NA, n1: s.n1, n2: s.n2 });
    results(o, [
      ['Objective focal length', `${fmt(t.f, 4)} mm`, `f_tube ${fTube} mm / ${fmt(s.M)}×`],
      ['Critical angle', Number.isFinite(t.thetaC) ? `${fmt(t.thetaC)}°` : 'none (n2 ≥ n1)', `asin(${fmt(s.n2, 4)} / ${fmt(s.n1, 4)})`],
      ['Maximum angle (NA limit)', `${fmt(t.thetaMax)}°`, 'asin(NA / n1)'],
      ['BFP offset at critical angle', `${fmt(t.rMin)} mm`, 'r = f · n2'],
      ['BFP offset at NA edge', `${fmt(t.rMax)} mm`, 'r = f · NA (back-aperture radius)'],
      ['TIRF offset window', t.possible ? `${fmt(t.rMax - t.rMin)} mm` : 'none: NA ≤ n2', t.possible ? 'usable radial band in the back focal plane' : 'this objective cannot reach TIRF for this sample'],
    ]);
    if (!t.possible) { tb.innerHTML = ''; return; }
    const angles = [];
    for (let i = 0; i <= 5; i++) angles.push(t.thetaC + 0.02 + (t.thetaMax - t.thetaC - 0.02) * i / 5);
    table(tb, ['Angle θ (°)', 'n1 sin θ', 'BFP offset r (mm)', 'Penetration depth d (nm)'],
      angles.map(a => [fmt(a), fmt(s.n1 * Math.sin(a * Math.PI / 180), 4), fmt(tirfOffset(t.f, s.n1, a)), fmt(penetrationDepth(s.lambda, s.n1, s.n2, a))]));
  };
  const r = row(p);
  pick(r, s, 'tf', 'maker', 'Microscope maker (tube lens)', Object.entries(TUBE_LENS).map(([k, v]) => [k, `${k} (${v} mm)`]), draw);
  fields(p, s, 'tf', [['M', 'Objective magnification', '×'], ['NA', 'Objective NA', '', 0.01], ['n1', 'Glass / immersion index n1', '', 0.001], ['n2', 'Sample index n2', '', 0.01, 'cytosol ≈ 1.36-1.38; water 1.33'], ['lambda', 'Laser wavelength', 'nm', 1]], draw);
  draw();
  note(host, 'In objective-type TIRF the laser is focused to a point in the back focal plane; a point at radius r leaves the objective as a collimated beam at angle θ with n1 sin θ = r / f, where f = f_tube / M. TIRF needs n1 sin θ > n2 (critical angle) and the objective can only deliver n1 sin θ ≤ NA, so the usable offset band runs from f·n2 to f·NA. The evanescent intensity decays as exp(−z/d) with d = λ / (4π √(n1² sin²θ − n2²)). Below the critical angle the beam is HILO / oblique, not TIRF.');
}

// --- 5. Laser power density ----------------------------------------------------------------------
function mountPower(host) {
  const s = { mode: 'widefield', mW: 10, dUm: 100, lambda: 488, NA: 1.4, profile: 'flat' };
  const p = panel(host, 'Power and illuminated area');
  const o = out(host);
  const draw = () => {
    const d = s.mode === 'confocal' ? confocalSpotUm(s.lambda, s.NA) : s.dUm;
    const area = circleAreaCm2(d);
    const mean = powerDensity(s.mW, area);
    const peak = s.profile === 'gauss' ? 2 * mean : mean;
    results(o, [
      ['Illuminated diameter', `${fmt(d)} µm`, s.mode === 'confocal' ? 'diffraction-limited spot 1.22λ/NA' : 'as entered'],
      ['Area', `${fmt(area * 1e8)} µm²`, `${fmt(area)} cm²`],
      ['Mean intensity', `${fmt(mean)} W/cm²`, `${fmt(mean / 1000)} kW/cm²`],
      [s.profile === 'gauss' ? 'Peak intensity (Gaussian, 2× mean)' : 'Peak intensity (flat-top)', `${fmt(peak)} W/cm²`, `${fmt(peak / 1000)} kW/cm²`],
      ['Photon flux at peak', `${fmt(photonFlux(peak, s.lambda))} photons/s/µm²`, `E = hc/λ = ${fmt(photonEnergy(s.lambda) * 1e19)} × 10⁻¹⁹ J`],
    ]);
  };
  const r = row(p);
  pick(r, s, 'pw', 'mode', 'Illumination', [['widefield', 'Widefield field'], ['tirf', 'TIRF / HILO spot'], ['confocal', 'Confocal diffraction-limited spot']], draw);
  pick(r, s, 'pw', 'profile', 'Beam profile', [['flat', 'Flat-top (uniform)'], ['gauss', 'Gaussian (diameter = 1/e²)']], draw);
  fields(p, s, 'pw', [['mW', 'Power at the sample', 'mW', 0.01, 'measure after the objective with a slide power meter'], ['dUm', 'Illuminated diameter (widefield/TIRF)', 'µm'], ['lambda', 'Wavelength', 'nm', 1], ['NA', 'Objective NA (confocal spot)', '', 0.01]], draw);
  draw();
  note(host, 'Intensity = power / area, with area = π(d/2)². A Gaussian beam of 1/e² diameter d has a peak twice the mean over that circle. Photon flux = intensity / (hc/λ). <b>Typical orders of magnitude, not limits:</b> live-cell widefield ~0.1-10 W/cm²; TIRF of live cells ~10-100 W/cm²; SMLM (PALM/STORM) ~1-10 kW/cm²; a point-scanning confocal spot reaches kW/cm² to MW/cm² but only for microseconds per pixel, so compare dose (see the light-dose budget) rather than peak intensity.');
}

export const TOOLS = [
  { id: 'kohler', group: 'Microscope setup', title: 'Köhler illumination checklist', blurb: 'Step-by-step transmitted-light alignment with the reason for each step, progress tracking and troubleshooting.', mount: mountKohler },
  { id: 'camera-match', group: 'Microscope setup', title: 'Camera and objective matcher', blurb: 'Pixel size at the sample, Nyquist check, field of view and the relay lens that would give Nyquist sampling.', mount: mountCamera },
  { id: 'z-step', group: 'Microscope setup', title: 'Axial z-step calculator', blurb: 'Nyquist z-step for widefield, confocal and light-sheet stacks, slice count and time per stack.', mount: mountZ },
  { id: 'tirf-offset', group: 'Microscope setup', title: 'TIRF beam offset', blurb: 'Where to put the laser in the back focal plane for TIRF: critical angle, offset window and penetration depth.', mount: mountTirf },
  { id: 'power-density', group: 'Microscope setup', title: 'Laser power density', blurb: 'From mW at the sample to W/cm², kW/cm² and photons/s/µm² for widefield, TIRF or a confocal spot.', mount: mountPower },
  ...PLANNING,
];
