// Lab Tools, second part: acquisition planner and light-dose budget ('Planning'), immersion and mounting
// reference and objective finder ('Microscope setup'). Imported and re-exported by lab_setup.js.
import { esc, api } from './core.js';
import { num, select, row, panel, results, out, table, note, sources, fmt } from './lab_ui.js';

// Numeric fields bound to a state object s; defs: [[key, label, unit, step, help]].
export function fields(host, s, prefix, defs, draw) {
  const r = row(host);
  for (const [k, label, unit, step = 'any', help] of defs) num(r, { id: `${prefix}-${k}`, label, unit, value: s[k], step, help }, v => { s[k] = v; draw(); });
  return r;
}
export const pick = (host, s, prefix, k, label, options, draw) => select(host, { id: `${prefix}-${k}`, label, options, value: s[k] }, v => { s[k] = v; draw(); });
export const firstNumber = x => { const m = String(x ?? '').match(/\d+(?:\.\d+)?/); return m ? +m[0] : NaN; };

// --- 6. Acquisition planner -----------------------------------------------------------------------
// Bytes per pixel: bit depth rounded up to whole bytes (12- and 14-bit data are stored as 16-bit).
export function acquisitionPlan({ nx, ny, bits, channels = 1, z = 1, t = 1, positions = 1, fps = 10 }) {
  const bpp = Math.ceil(bits / 8);
  const frameBytes = nx * ny * bpp;
  const frames = channels * z * t * positions;
  const bytes = frameBytes * frames;
  return { bpp, frameBytes, frames, bytes, GB: bytes / 1e9, TB: bytes / 1e12, seconds: frames / fps, MBps: frameBytes * fps / 1e6 };
}
// Sampling interval: periodic signal of period T needs Δt < T/2 (Nyquist), ~T/5 in practice;
// an exponential process with time constant τ is usually sampled at Δt ≤ τ/5 (rule of thumb).
export const timeSampling = (tau, kind = 'exp') => (kind === 'periodic' ? { nyquist: tau / 2, practical: tau / 5 } : { nyquist: NaN, practical: tau / 5 });

function mountPlanner(host) {
  const s = { nx: 2048, ny: 2048, bits: 16, channels: 2, z: 30, t: 100, positions: 4, fps: 50, tau: 10, kind: 'exp' };
  const p = panel(host, 'Experiment');
  const o = out(host);
  const p2 = panel(host, 'Nyquist in time');
  const o2 = out(p2);
  const draw = () => {
    const a = acquisitionPlan(s);
    results(o, [
      ['Frames in total', a.frames.toLocaleString(), 'channels × z × time points × positions'],
      ['Size of one frame', `${fmt(a.frameBytes / 1e6)} MB`, `${a.bpp} byte(s) per pixel`],
      ['Data volume', `${fmt(a.GB)} GB`, `${fmt(a.TB)} TB (decimal units, before compression)`],
      ['Acquisition time at camera limit', a.seconds >= 3600 ? `${fmt(a.seconds / 3600)} h` : a.seconds >= 60 ? `${fmt(a.seconds / 60)} min` : `${fmt(a.seconds)} s`, `${fmt(s.fps)} frames/s, ignoring stage and filter moves`],
      ['Sustained write speed needed', `${fmt(a.MBps)} MB/s`, a.MBps > 1000 ? 'beyond most SATA SSDs: use NVMe or RAID' : a.MBps > 400 ? 'needs a fast SSD (NVMe)' : 'fine for a local SSD'],
    ]);
    const ts = timeSampling(s.tau, s.kind);
    results(o2, s.kind === 'periodic'
      ? [['Nyquist limit Δt < T/2', `${fmt(ts.nyquist)} s`], ['Practical interval ≈ T/5', `${fmt(ts.practical)} s`, 'resolves the waveform shape, not just its frequency']]
      : [['Suggested interval Δt ≤ τ/5', `${fmt(ts.practical)} s`, 'about 5 points per time constant'], ['Points over 5τ (≈99% complete)', '≈ 25']]);
  };
  fields(p, s, 'ap', [['nx', 'Image width', 'px', 1], ['ny', 'Image height', 'px', 1], ['bits', 'Bit depth', 'bit', 1], ['channels', 'Channels', '', 1]], draw);
  fields(p, s, 'ap', [['z', 'Z-slices', '', 1], ['t', 'Time points', '', 1], ['positions', 'Positions / wells', '', 1], ['fps', 'Camera frame rate', 'frames/s']], draw);
  const r = row(p2);
  pick(r, s, 'ap', 'kind', 'Process', [['exp', 'Exponential (time constant τ)'], ['periodic', 'Periodic (period T)']], draw);
  num(r, { id: 'ap-tau', label: 'τ or T', unit: 's', value: s.tau }, v => { s.tau = v; draw(); });
  draw();
  note(host, 'Volume = width × height × bytes per pixel × channels × z × time points × positions. The frame-rate-limited time assumes the camera is the bottleneck; add stage, filter and z-piezo moves for multi-position runs. Plan storage for at least twice the raw size (copies and processing). In time, Nyquist applies to periodic signals; for exponential kinetics, ~5 points per τ is a common rule of thumb, and photobleaching sets the opposite limit.');
}

// --- 7. Light-dose budget ---------------------------------------------------------------------------
// Dose (J/cm²) = intensity (W/cm²) × exposure (s) × frames.
export const lightDose = (Wcm2, exposureMs, frames) => Wcm2 * exposureMs / 1000 * frames;

function mountDose(host) {
  const A = { I: 1, exp: 100, frames: 600 }, B = { I: 5, exp: 20, frames: 600 };
  const pa = panel(host, 'Protocol A'), pb = panel(host, 'Protocol B');
  const o = out(host);
  const draw = () => {
    const da = lightDose(A.I, A.exp, A.frames), db = lightDose(B.I, B.exp, B.frames);
    results(o, [
      ['Dose A', `${fmt(da)} J/cm²`, `${fmt(A.I * A.exp / 1000)} J/cm² per frame`],
      ['Dose B', `${fmt(db)} J/cm²`, `${fmt(B.I * B.exp / 1000)} J/cm² per frame`],
      ['B / A', `${fmt(db / da)}×`, Math.abs(db / da - 1) < 1e-9 ? 'equal dose' : db > da ? 'B delivers more light' : 'B delivers less light'],
      ['Signal per frame B / A', `${fmt((B.I * B.exp) / (A.I * A.exp))}×`, 'if fluorescence is linear in intensity (no saturation)'],
    ]);
  };
  const defs = [['I', 'Intensity at the sample', 'W/cm²', 'any', 'from the laser power density tool'], ['exp', 'Exposure per frame', 'ms'], ['frames', 'Frames (all channels, z and time)', '', 1]];
  fields(pa, A, 'da', defs, draw);
  fields(pb, B, 'db', defs, draw);
  draw();
  note(host, 'Dose = intensity × exposure × number of frames. Equal dose does not mean equal harm: at the same dose, high intensity with short exposures is often more phototoxic than low intensity with long exposures, and shorter (blue/UV) wavelengths do more damage per joule. Check health directly (division timing, mitochondrial shape, mobility) rather than relying on dose alone, and spend photons only where you need them: binning, fewer z-slices, longer intervals, a more sensitive camera.');
}

// --- 8. Immersion and mounting reference ------------------------------------------------------------
const S = {
  wiki: { title: 'Wikipedia: List of refractive indices', url: 'https://en.wikipedia.org/wiki/List_of_refractive_indices' },
  zeiss: { title: 'ZEISS immersion media', url: 'https://www.zeiss.com/microscopy/en/products/accessories/microscopy-consumables/immersion-media.html' },
  tde: { title: 'Staudt et al. 2007, Microsc. Res. Tech. 70:1 (TDE)', url: 'https://doi.org/10.1002/jemt.20396' },
  pgold: { title: 'Thermo Fisher: ProLong Gold / Diamond / Glass comparison', url: 'https://www.thermofisher.com/us/en/home/life-science/cell-analysis/cellular-imaging/fluorescence-microscopy-and-immunofluorescence-if/mounting-medium-antifades/prolong-gold-antifade.html' },
  pglass: { title: 'Thermo Fisher: ProLong Glass P36980', url: 'https://www.thermofisher.com/order/catalog/product/P36980' },
  vecta: { title: 'Vector Laboratories: VECTASHIELD', url: 'https://vectorlabs.com/products/vectashield' },
  focus: { title: 'CelExplorer FocusClear FC-102 (Labscoop)', url: 'https://labscoop.com/us/en/product/cee/celexplorer/fc-102-focuscleartm-tissue-optical-clearing-solution-50-ml' },
  silv: { title: 'Silvestri et al. 2016, J. Biomed. Opt. 21:081205', url: 'https://doi.org/10.1117/1.JBO.21.8.081205' },
  uab: { title: 'UAB HRIF: Overview of tissue clearing methods', url: 'https://www.uab.edu/cores/ircp/images/HRIF/Resources/Overview%20of%20Tissue%20Clearing%20Methods%20and%20Applications.pdf' },
  ce3d: { title: 'Bio-protocol: Ce3D+ and Ce3D++ clearing', url: 'https://bio-protocol.org/prep976' },
  cromey: { title: 'Cromey (Univ. Arizona): #1.5 coverslips', url: 'https://plateforme-microscopie.med.usherbrooke.ca/documents/Basic/coverslips_for_microscopy.pdf' },
  duke: { title: 'Duke LMCF: coverslip thickness', url: 'https://microscopy.duke.edu/guides/coverslip-thickness' },
};
// [medium, kind, n (as stated by the source), conditions / notes, source keys]
export const MEDIA = [
  ['Air (STP)', 'immersion', '1.000273', '0 °C, 1 atm', ['wiki']],
  ['Water', 'immersion', '1.333', '589 nm, 20 °C', ['wiki']],
  ['ZEISS Immersol W 2010 (water substitute)', 'immersion', '1.334', 'ne, 23 °C', ['zeiss']],
  ['Silicone oil, ZEISS Immersol Sil 406', 'immersion', '1.406', 'ne, 23 °C', ['zeiss']],
  ['Glycerol-type immersion, ZEISS Immersol G', 'immersion', '1.456', 'ne, 23 °C', ['zeiss']],
  ['Glycerol / water 80:20', 'mounting', '1.45', 'as used by Staudt et al.', ['tde']],
  ['Glycerol (pure)', 'mounting', '1.4729', 'λ not stated', ['wiki']],
  ['Immersion oil type N, ZEISS Immersol 518 N', 'immersion', '1.518', 'ne, 23 °C', ['zeiss']],
  ['Immersion oil type F (fluorescence-free), ZEISS Immersol 518 F', 'immersion', '1.518', 'ne, at its rated 23, 30 or 37 °C version', ['zeiss']],
  ['ZEISS Immersol HI 661 (high-index)', 'immersion', '1.66', 'ne, 23 °C', ['zeiss']],
  ['ProLong Gold (cured)', 'mounting', '1.47', 'after 24 h curing', ['pgold']],
  ['ProLong Diamond (cured)', 'mounting', '1.47', 'after 24 h curing', ['pgold']],
  ['ProLong Glass (cured)', 'mounting', '1.52', 'after 24 h curing', ['pgold', 'pglass']],
  ['VECTASHIELD (H-1000)', 'mounting', '1.45', 'non-setting', ['vecta']],
  ['TDE (2,2′-thiodiethanol) 97% in buffer', 'mounting', '1.515', 'nD, 23 °C; matches oil', ['tde']],
  ['TDE 100%', 'mounting', '1.521', 'nD; water-TDE mixes span 1.333-1.521', ['tde']],
  ['FocusClear', 'clearing', '1.45', 'manufacturer value; Silvestri also quotes 1.47 in the CLARITY context', ['focus', 'silv']],
  ['BABB (benzyl alcohol : benzyl benzoate)', 'clearing', '1.55', '', ['silv', 'uab']],
  ['DBE (dibenzyl ether; 3DISCO / iDISCO+)', 'clearing', '1.56', '', ['silv', 'uab']],
  ['CUBIC', 'clearing', '1.47-1.48', '1.47 (UAB), 1.48 (Silvestri)', ['uab', 'silv']],
  ['SeeDB (fructose)', 'clearing', '1.48', '', ['silv', 'uab']],
  ['Ce3D', 'clearing', '1.49-1.5', 'original recipe; shifts with water content', ['ce3d']],
];
export const COVERSLIPS = [
  ['#0', '85-130 µm', '80-130 µm (Duke)'], ['#1', '130-160 µm', '130-170 µm (Duke)'], ['#1.5', '160-190 µm', 'nominal 170 µm; what most objectives expect'],
  ['#1.5H', '170-180 µm', 'high-precision #1.5; recommended for super-resolution'], ['#2', '190-230 µm', '190-250 µm (Duke)'],
];

// Rule-based immersion advice: aberration grows roughly with depth × |Δn| (µm), a heuristic, not optics.
// NA notes reflect the highest NA among the atlas objectives of each type (data/components/objectives.json).
export const IMMERSIONS = [['Oil', 1.518, 'highest NA (1.4-1.5) and brightness'], ['Glycerol', 1.456, 'NA up to ~1.3'], ['Silicone', 1.406, 'NA up to ~1.3'], ['Water', 1.333, 'NA up to ~1.2, long working distance']];
export function recommendImmersion(nSample, depthUm) {
  return IMMERSIONS.map(([name, n, na]) => {
    const dn = Math.abs(n - nSample), m = dn * depthUm;
    const grade = dn <= 0.02 || m <= 1.5 ? 'good' : m <= 5 ? 'usable' : 'poor';
    let why;
    if (dn <= 0.02) why = `index matched (Δn = ${dn.toFixed(3)}): no depth-dependent spherical aberration, focus moves 1:1; ${na}`;
    else if (grade === 'good') why = `mismatch Δn = ${dn.toFixed(2)} matters little at ${+depthUm.toFixed(1)} µm; ${na}`;
    else if (grade === 'usable') why = `Δn = ${dn.toFixed(2)}: noticeable spherical aberration and axial scaling ≈ ${(nSample / n).toFixed(2)}; use the correction collar`;
    else why = `Δn = ${dn.toFixed(2)} over ${+depthUm.toFixed(1)} µm: strong aberration, signal and z-resolution loss with depth`;
    return { name, n, dn, grade, why };
  }).sort((a, b) => a.dn * depthUm - b.dn * depthUm);
}

function mountImmersion(host) {
  const p = panel(host, 'Refractive indices of immersion, mounting and clearing media');
  const t = out(p);
  table(t, ['Medium', 'Use', 'n', 'Conditions / notes', 'Source'], MEDIA.map(([m, k, n, c, src]) => [esc(m), `<span class="tag ${k === 'immersion' ? 'b' : k === 'clearing' ? 'r' : 'g'}">${esc(k)}</span>`, `<b>${esc(n)}</b>`, esc(c), src.map(x => `<a href="${esc(S[x].url)}" target="_blank" rel="noopener">${esc(S[x].title)}</a>`).join('<br>')]));
  note(p, 'Values are as stated by each source; nD is at 589 nm, ne at 546 nm. Indices fall slightly with temperature, and curing mountants change index while they dry. Aqueous buffers such as PBS sit close to water; no primary value could be checked, so they are not listed. A 2,2′-thiodiethanol mix can be tuned anywhere between water and 1.521.', 'small mute');
  const c = panel(host, 'Coverslip thickness classes');
  table(out(c), ['Number', 'Thickness', 'Notes'], COVERSLIPS.map(r => r.map(esc)));
  sources(c, [S.cromey, S.duke]);
  const h = panel(host, 'Objective vs sample');
  const st = { n: 1.36, depth: 20 };
  const ho = out(host);
  const draw = () => {
    table(ho, ['Objective immersion', 'n', 'Verdict', 'Reason'], recommendImmersion(st.n, st.depth).map(r => [esc(r.name), r.n.toFixed(3), `<span class="tag ${r.grade === 'good' ? 'g' : r.grade === 'usable' ? 'y' : 'r'}">${r.grade}</span>`, esc(r.why)]));
  };
  fields(h, st, 'im', [['n', 'Sample / mounting index', '', 0.01, 'live cells ≈ 1.36-1.38, aqueous 1.33, ProLong 1.47, cleared 1.45-1.56'], ['depth', 'Imaging depth below the coverslip', 'µm']], draw);
  draw();
  note(host, 'The verdict is a rule of thumb: spherical aberration grows with the index step between immersion and sample times the focal depth. Good if matched within 0.02 or depth × Δn ≤ 1.5 µm, usable up to 5 µm, poor beyond. Correction collars and adaptive optics extend these limits; the objective\'s working distance sets a hard one.');
}

// --- 9. Objective finder ----------------------------------------------------------------------------
export function immersionClass(s) {
  const t = String(s ?? '').toLowerCase(), out = [];
  if (t.includes('silicone')) out.push('silicone');
  if (t.includes('glycerol') || t.includes('glycerin')) out.push('glycerol');
  if (t.includes('water')) out.push('water');
  if (t.replace(/silicone oil/g, '').includes('oil')) out.push('oil');
  if (t.includes('air') || t.includes('dry')) out.push('air');
  if (!out.length || /clearing|medium|ri |scaleview/.test(t)) out.push('other');
  return [...new Set(out)];
}
export function filterObjectives(list, { immersion = 'any', minNA = 0, minWD = 0, minMag = 0, maxMag = Infinity }) {
  return list.filter(o => {
    const sp = o.specs || {};
    const NA = firstNumber(sp.NA), WD = firstNumber(sp['Working distance']), M = firstNumber(sp.Magnification);
    if (immersion !== 'any' && !immersionClass(sp.Immersion).includes(immersion)) return false;
    if (minNA > 0 && !(NA >= minNA)) return false;
    if (minWD > 0 && !(WD >= minWD)) return false;
    if ((minMag > 0 || maxMag < Infinity) && !(M >= minMag && M <= maxMag)) return false;
    return true;
  });
}

async function mountFinder(host) {
  let list = [];
  try { list = await api('/components/objectives'); } catch { note(host, 'Could not load the objectives list.', 'callout'); return; }
  const s = { immersion: 'any', minNA: 0, minWD: 0, minMag: 0, maxMag: 200 };
  const p = panel(host, 'Filters');
  const o = out(host);
  const draw = () => {
    const rows = filterObjectives(list, s).sort((a, b) => firstNumber(b.specs.NA) - firstNumber(a.specs.NA));
    table(o, ['Objective', 'Mag', 'NA', 'Immersion', 'WD', 'Correction', 'Source'], rows.map(x => [
      `<b>${esc(x.name)}</b><br><span class="small mute">${esc(x.manufacturer)}</span>`, esc(x.specs.Magnification || '—'), esc(x.specs.NA || '—'), esc(x.specs.Immersion || '—'),
      esc(x.specs['Working distance'] || '—'), esc(x.specs.Correction || ''), (x.sources || []).map(u => `<a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(u.title)}</a>`).join('<br>')]));
    o.insertAdjacentHTML('afterbegin', `<p class="small mute">${rows.length} of ${list.length} objectives in the atlas match.</p>`);
  };
  const r = row(p);
  pick(r, s, 'of', 'immersion', 'Immersion', [['any', 'Any'], ['oil', 'Oil'], ['silicone', 'Silicone oil'], ['glycerol', 'Glycerol'], ['water', 'Water'], ['air', 'Air / dry'], ['other', 'Other / multi-immersion']], draw);
  fields(p, s, 'of', [['minNA', 'Minimum NA', '', 0.05], ['minWD', 'Minimum working distance', 'mm', 0.05], ['minMag', 'Magnification from', '×', 1], ['maxMag', 'to', '×', 1]], draw);
  draw();
  note(host, 'Only objectives in the atlas database are listed, each with the page it was sourced from. Working distances given as a range (collar-dependent) are filtered on the first value. Entries without a stated magnification or working distance drop out when you filter on that field.');
}

export const TOOLS = [
  { id: 'immersion-reference', group: 'Microscope setup', title: 'Immersion and mounting media', blurb: 'Sourced refractive indices of immersion oils, mountants and clearing media, coverslip classes, and which objective suits your sample.', mount: mountImmersion },
  { id: 'objective-finder', group: 'Microscope setup', title: 'Objective finder', blurb: 'Filter the atlas objectives by immersion, NA, working distance and magnification, with links to their sources.', mount: mountFinder },
  { id: 'acquisition-planner', group: 'Planning', title: 'Acquisition planner', blurb: 'Data volume, acquisition time and disk write speed for a multi-dimensional experiment, plus Nyquist in time.', mount: mountPlanner },
  { id: 'light-dose', group: 'Planning', title: 'Light-dose budget', blurb: 'Total light dose in J/cm² for an imaging protocol, and a side-by-side comparison of two protocols.', mount: mountDose },
];
