// Virtual Optical Table: read the imaging optics for one detector from a trace result (pure, no DOM).
// inferOptics(result, detId, view) -> { ok, reason } or makeOptics(...) plus { camera, sampleId, specimen, fovNm, notes }
// The emission path to the detector is followed from the sample: the first objective after the sample sets NA and
// immersion (an iris before the tube lens can stop the NA down: NA = pupil radius / f, Abbe sine condition); lenses and
// further objectives after it set the magnification as in table_analysis.js (tube lens / objective focal length, later
// pairs as relays, an objective counting as a lens of f = f(tube lens) / M). The mode is inferred from what the trace saw
// at the sample: total internal reflection (TIRF), a highly inclined refracted beam (HILO), a vortex depletion beam (STED),
// ±1 diffraction orders (SIM), λ/2 two-photon excitation, a converging low-NA beam (light sheet), a pinhole or pinhole
// disk in the detection path (confocal), direct vs scattered light for transmitted-light samples.
import { makeOptics } from './table_imaging.js';
import { autoSpecimen, SPECIMENS } from './table_specimens.js';
import { gaussianSheet } from './sim_engine.js';

const LENSES = ['lens', 'achromat', 'tube', 'cyl'];
const SAMPLES = ['sample', 'tirf', 'scatter'];
const APERTURES = ['pinhole', 'iris', 'slit'];
const D2R = Math.PI / 180;
function onSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  if (!L2) return false;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2;
  return t > 0 && t < 1 && Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / Math.sqrt(L2) < 1;
}
const focal = c => (c.type === 'objective' ? c.params.ftl / c.params.mag : c.params.f);

// Cameras and point detectors that receive light (candidates for the image viewer).
export function imagingDetectors(result) {
  return result.components.filter(c => c.type === 'camera' || c.type === 'pmt')
    .map(c => ({ id: c.id, type: c.type, title: c.label || (c.type === 'camera' ? 'Camera' : 'Point detector'), power: result.readouts[c.id]?.power || 0 }));
}

// Magnification through a list of focal elements after the objective (f values in mm).
function magnification(fo, fs) {
  if (!fs.length) return null;
  let M = fs[0] / fo;
  for (let i = 1; i + 1 < fs.length; i += 2) M *= fs[i + 1] / fs[i];
  return M;
}

export function inferOptics(result, detId, view = {}) {
  const byId = Object.fromEntries(result.components.map(c => [c.id, c]));
  const det = byId[detId], r = result.readouts[detId];
  if (!det || (det.type !== 'camera' && det.type !== 'pmt')) return { ok: false, reason: 'Only cameras and point detectors (PMT, APD, HyD) form images.' };
  if (!r || !r.power) return { ok: false, reason: 'No light reaches this detector, so the image is black.' };
  const paths = [...(r.paths || []), (r.mainPath || []).join('>')].filter(Boolean).map(p => p.split('>'));
  const isSample = id => byId[id] && SAMPLES.includes(byId[id].type) && !(byId[id].type === 'tirf' && (!byId[id].params.dye || byId[id].params.dye === 'none'));
  let path = null, si = -1;
  for (const p of paths) { const i = p.findIndex(isSample); if (i >= 0) { path = p; si = i; break; } }
  if (!path) return { ok: false, reason: 'No sample lies on the light path to this detector: put a fluorescent, TIRF or scattering sample at the objective focus.' };
  const sample = byId[path[si]], sr = result.readouts[sample.id] || {};
  const seen = new Set(), rest = [];
  for (const id of path.slice(si + 1)) if (byId[id] && !seen.has(id)) { seen.add(id); rest.push(byId[id]); }
  if (rest[rest.length - 1] !== det) rest.push(det);
  // Rays pass through the hole of a pinhole, iris or slit without touching it, so the path does not list them: add any
  // aperture whose centre lies on a straight leg of the path (within 1 mm).
  const legs = [sample, ...rest];
  for (const a of result.components.filter(c => APERTURES.includes(c.type) && !seen.has(c.id))) {
    for (let i = 0; i + 1 < legs.length; i++) {
      if (onSegment(a, legs[i], legs[i + 1])) { rest.splice(i, 0, a); seen.add(a.id); break; }
    }
  }
  rest.pop();
  const oi = rest.findIndex(c => c.type === 'objective');
  if (oi < 0) return { ok: false, reason: 'No objective between the sample and this detector, so no image of the sample forms.' };
  const obj = rest[oi], fo = focal(obj), after = rest.slice(oi + 1);
  const isFocal = c => c.type === 'objective' || (LENSES.includes(c.type) && !(c.type === 'cyl' && c.params.axis === 'out'));
  const fsUntil = stop => after.slice(0, stop < 0 ? after.length : stop).filter(isFocal).map(focal);
  const M = magnification(fo, fsUntil(-1));
  const point = det.type === 'pmt';
  if (!point && !M) return { ok: false, reason: 'No tube lens after the objective: an infinity-corrected objective needs one to form an image on the camera.' };

  let NA = obj.params.na;
  const notes = [];
  const iris = after.slice(0, after.findIndex(isFocal) < 0 ? after.length : after.findIndex(isFocal)).find(c => c.type === 'iris');
  if (iris && iris.params.open / 2 / fo < NA) { NA = +(iris.params.open / 2 / fo).toFixed(3); notes.push(`An iris in the objective's back aperture stops the NA down to ${NA}.`); }
  const remote = after.some(c => c.type === 'objective');
  if (remote) NA = Math.min(NA, ...after.filter(c => c.type === 'objective').map(c => c.params.na));

  const fluor = sample.type !== 'scatter';
  const wl = Object.entries(r.byLambda || {}), wsum = wl.reduce((t, [, p]) => t + p, 0);
  const lam = (fluor && sr.emPeak) || (wsum ? Math.round(wl.reduce((t, [l, p]) => t + l * p, 0) / wsum) : 520);
  const exL = sr.exLambdas || [], lamEx = exL.length ? Math.min(...exL) : lam;
  const tags = sr.exTags || [], pinIdx = after.findIndex(c => c.type === 'pinhole'), diskIdx = after.findIndex(c => c.type === 'pinhole_array');
  const bk = r.byKind || {};
  const o = { NA, n: obj.params.nimm, M, lam, lamEx, kind: point ? 'point' : 'camera' };

  if (!fluor) o.mode = point && pinIdx >= 0 ? 'confocal' : (bk.excitation || 0) > (bk.scattered || 0) ? 'brightfield' : 'darkfield'; // confocal: reflectance
  else if (sample.type === 'tirf') {
    if (sr.tir && sr.tir.length) { o.mode = 'tirf'; o.depth = Math.min(...sr.tir.map(t => t.depth)); }
    else if (sr.through && sr.through.length && sr.through[0].out > 50) {
      o.mode = 'hilo';
      o.hiloDz = 10000 / Math.tan(sr.through[0].out * D2R); // dz = D / tan θ for an illuminated field D = 10 µm (assumed)
      notes.push(`Inclined sheet about ${(o.hiloDz / 1000).toFixed(1)} µm thick (dz = D / tan θ with θ = ${sr.through[0].out.toFixed(0)}° and a 10 µm field).`);
    } else o.mode = 'widefield';
  } else if (sample.params.photon === '2') o.mode = 'two-photon';
  else if (tags.includes('vortex')) {
    o.mode = 'sted';
    const lDep = Math.max(...exL), pDep = (sr.exByLambda || {})[lDep] || 0;
    o.sat = Math.min(300, pDep / 5); // assumption: the saturation intensity Is is reached at 5 mW of depletion power
    notes.push(`Depletion: ${pDep.toFixed(0)} mW at ${lDep} nm reaches the sample; assuming Is at 5 mW, I/Is ≈ ${o.sat.toFixed(0)}.`);
  } else if (diskIdx >= 0) o.mode = 'spinning-disk';
  else if (pinIdx >= 0 && point) o.mode = 'confocal';
  else if (tags.some(t => t === '+1' || t === '-1')) {
    o.mode = 'sim';
    const s = obj.params.nimm * Math.sin(Math.max(...sr.exAngles.map(Math.abs)) * D2R);
    o.stripe = lamEx / (2 * s); // stripe period λ / (2 n sin θ)
  } else if (remote) { o.mode = 'light-sheet'; o.sheet = 2000; notes.push('Oblique light sheet assumed 2 µm thick; the tilt of the imaged plane is not modelled.'); }
  else if (sr.exSpread && sr.exSpread[1] - sr.exSpread[0] < 0.05 && sr.exAngles && (sr.exAngles[1] - sr.exAngles[0]) / 2 < 10) {
    o.mode = 'light-sheet';
    const half = Math.max(0.05, (sr.exAngles[1] - sr.exAngles[0]) / 2), naIll = 1.33 * Math.sin(half * D2R);
    o.sheet = Math.min(20000, gaussianSheet(lamEx, naIll, 1.33).thickness);
    notes.push(`Sheet thickness 2w₀ = ${(o.sheet / 1000).toFixed(1)} µm from the illumination NA ${naIll.toFixed(3)}.`);
  } else o.mode = point ? 'scanning' : 'widefield';
  if (o.mode === 'sted' && pinIdx < 0) notes.push('No pinhole: sectioning would be weaker than modelled.');

  // pinhole size in Airy units: 1 AU = 1.22 λ M / NA at the pinhole plane
  const pin = pinIdx >= 0 ? after[pinIdx] : diskIdx >= 0 ? after[diskIdx] : null;
  if (pin && (o.mode === 'confocal' || o.mode === 'sted' || o.mode === 'spinning-disk')) {
    const Mp = magnification(fo, fsUntil(pin === after[pinIdx] ? pinIdx : diskIdx)) || M || obj.params.mag;
    o.au = pin.params.size / (1.22 * lam * 1e-3 * Mp / NA);
    notes.push(`Pinhole ${pin.params.size} µm = ${o.au.toFixed(2)} Airy units.`);
  } else if (o.mode === 'sted') o.au = 1;

  // photometry from the trace (relative mW at the detector)
  if (o.mode === 'brightfield') o.rho = bk.excitation || 0;
  else if (!fluor) o.rho = bk.scattered || 0;
  else { o.rho = bk.emission || 0; o.leak = (bk.excitation || 0) + (bk.scattered || 0); }

  const pre = makeOptics({ ...o, pixelNm: 100 });
  const scan = Math.max(5, Math.floor(pre.nyqNm / 5) * 5);
  const pixelNm = point ? (view.scanPx || scan) : det.params.px * 1000 / M;
  const optics = makeOptics({ ...o, pixelNm });
  const camera = point ? { kind: 'point', sensor: 'PMT', qe: det.params.qe, read: 0, bits: 16 }
    : { kind: 'camera', sensor: det.params.sensor || 'sCMOS', qe: det.params.qe, read: det.params.read ?? 1.6, bits: det.params.bits || 16 };
  const spec = sample.params.specimen && sample.params.specimen !== 'auto' ? sample.params.specimen : autoSpecimen(fluor ? optics.mode : optics.mode === 'brightfield' ? 'brightfield' : 'darkfield', fluor ? sample.params.dye || '' : '');
  return {
    ok: true, ...optics, camera, sampleId: sample.id, detId, specimen: spec, specimenAuto: !sample.params.specimen || sample.params.specimen === 'auto',
    fovNm: point ? Infinity : det.params.size * 1e6 / M, scanDefault: scan, dye: sample.params.dye, notes,
    defaultExposure: point ? (optics.mode === 'sted' ? 40 : 2) : optics.mode === 'brightfield' ? 5 : 50,
  };
}

// Field of the specimen: its natural size, widened so coarse pixels still give ≥ 96 pixels across, capped by the sensor's
// field of view and by the 256-pixel image the viewer computes.
export function specimenFov(o) {
  const S = SPECIMENS[o.specimen] || SPECIMENS.microtubules;
  return Math.round(Math.min(Math.max(S.fov, 96 * o.pixelNm), o.fovNm, 256 * o.pixelNm));
}
