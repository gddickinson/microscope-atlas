// Virtual Optical Table: turn a trace result into teaching readouts (pure; uses sim_engine physics).
// analyze(result) -> [{ id, title, rows: [[label, value, note?]] }] for detectors, samples, objectives, couplers and dumps.
// Magnification follows the main ray path to each detector: objective focal length f = f(design tube lens) / M, then the
// first lens after the objective acts as the tube lens; later lens pairs are treated as 4f relays (an estimate).
import { rayleigh, nyquistPixel, gaussianSheet, stedResolution, encircledEnergy } from './sim_engine.js';
import { PARTS } from './table_parts.js';

export function fmtP(mW) {
  if (!Number.isFinite(mW) || mW <= 0) return '0';
  if (mW >= 1000) return (mW / 1000).toPrecision(3) + ' W';
  if (mW >= 1) return mW.toPrecision(3) + ' mW';
  if (mW >= 1e-3) return (mW * 1e3).toPrecision(3) + ' µW';
  return (mW * 1e6).toPrecision(3) + ' nW';
}
const f3 = v => (Number.isFinite(v) ? (+v.toPrecision(3)).toLocaleString() : '—');
const LENSES = ['lens', 'achromat', 'tube', 'cyl'];
const dominant = byL => +Object.entries(byL || {}).sort((a, b) => b[1] - a[1])[0]?.[0];

// Imaging chain along a path of component ids: objective params, magnification at the first image and at the end.
export function chain(path, byId) {
  const comps = path.map(id => byId[id]).filter(Boolean);
  const oi = comps.map(c => c.type).lastIndexOf('objective');
  if (oi < 0) return null;
  const obj = comps[oi].params, fo = obj.ftl / obj.mag;
  const lenses = [];
  for (const c of comps.slice(oi + 1)) {
    if (c.type === 'objective') return { obj, fo, M: null, remote: true };
    if (LENSES.includes(c.type) && !(c.type === 'cyl' && c.params.axis === 'out') && !lenses.includes(c)) lenses.push(c);
  }
  if (!lenses.length) return { obj, fo, M: null };
  let M = lenses[0].params.f / fo;
  for (let i = 1; i + 1 < lenses.length; i += 2) M *= lenses[i + 1].params.f / lenses[i].params.f;
  return { obj, fo, M, tube: lenses[0].params.f, lenses };
}

function detectorRows(c, r, byId) {
  const rows = [['Power arriving', fmtP(r.power)]];
  if (!r.power) return [...rows, ['Status', 'no light reaches this detector']];
  const kinds = Object.entries(r.byKind).filter(([, p]) => p > 0).map(([k, p]) => `${k} ${fmtP(p)}`).join(', ');
  rows.push(['By kind', kinds]);
  rows.push(['By wavelength', Object.entries(r.byLambda).map(([l, p]) => `${Math.round(l)} nm: ${fmtP(p)}`).join(', ')]);
  if (c.params.qe) rows.push(['Detected (× QE)', fmtP(r.power * c.params.qe / 100)]);
  rows.push(['Spot centroid / RMS size', `${f3(r.centroid)} mm / ${f3(r.rms * 1000)} µm`]);
  if (c.type === 'profiler') rows.push(['Beam width (edge rays)', `${f3(r.extent[1] - r.extent[0])} mm`]);
  rows.push(['Mean angle of incidence', `${f3(r.aoi)}°`]);
  if (r.paths.length > 1 && r.oplMax - r.oplMin > 1e-3) rows.push(['Optical path difference', `${f3(r.oplMax - r.oplMin)} mm`, 'between rays arriving by different routes; interference fringes shift by one per wavelength of change']);
  const lam = dominant(r.byLambda), ch = chain(r.mainPath || [], byId);
  if (ch && lam) {
    const NA = ch.obj.na, res = rayleigh(lam, NA), nyq = nyquistPixel(lam, NA);
    rows.push(['Objective', `${ch.obj.mag}× / NA ${ch.obj.na}, f = ${f3(ch.fo)} mm`]);
    rows.push(['Lateral resolution (Rayleigh)', `${f3(res)} nm`, `0.61 λ / NA at ${Math.round(lam)} nm`]);
    if (ch.remote) rows.push(['Imaging', 'remote focus: a second objective re-images the sample']);
    if (ch.M) {
      rows.push(['System magnification', `${f3(ch.M)}×`, `tube lens ${ch.tube} mm / objective ${f3(ch.fo)} mm${ch.lenses.length > 1 ? ', later lens pairs as relays' : ''}`]);
      if (c.type === 'camera' || c.type === 'profiler') {
        const px = c.params.px * 1000 / ch.M;
        const v = px > nyq * 1.3 ? 'undersampled: more magnification would resolve finer detail' : px < nyq * 0.6 ? 'oversampled: fewer photons per pixel than needed' : 'close to Nyquist sampling';
        rows.push(['Pixel at the sample', `${f3(px)} nm`, `Nyquist needs ≤ ${f3(nyq)} nm (λ/4NA): ${v}`]);
        rows.push(['Field of view', `${f3(c.params.size * 1000 / ch.M)} µm`, 'sensor width / magnification']);
      }
      const pin = (r.mainPath || []).map(id => byId[id]).find(k => k && k.type === 'pinhole');
      if (pin) {
        const au = 1.22 * lam * 1e-3 * ch.M / NA;
        rows.push(['Pinhole', `${pin.params.size} µm = ${f3(pin.params.size / au)} Airy units`, `1 AU = 1.22 λ M / NA = ${f3(au)} µm here; it passes ${f3(100 * encircledEnergy(pin.params.size / au))}% of the in-focus spot`]);
      }
    }
  }
  return rows;
}

function sampleRows(c, r, byId) {
  const rows = [];
  if (r.exPower) rows.push(['Excitation arriving', fmtP(r.exPower), `${r.exLambdas.map(Math.round).join(', ')} nm`]);
  if (r.dye) rows.push(['Absorbed / emitted', `${fmtP(r.absorbed)} / ${fmtP(r.absorbed * (c.params.qy || 0) / 100)}`, `${r.dye}, emission peak ${Math.round(r.emPeak)} nm${c.params.photon === '2' ? '; two-photon: absorption looked up at λ/2 (real two-photon cross sections are tiny and need focused pulses)' : ''}`]);
  if (r.scattered) rows.push(['Scattered', fmtP(r.scattered)]);
  if (r.crit) rows.push(['Critical angle', `${f3(r.crit)}°`, `arcsin(n₂/n₁) for ${c.params.n1} / ${c.params.n2}`]);
  if (r.tir && r.tir.length) {
    const t = r.tir[0];
    rows.push(['Total internal reflection', `at ${f3(t.ang)}°`, 'only an evanescent field enters the sample']);
    rows.push(['Penetration depth (1/e intensity)', `${f3(t.depth)} nm`, `d = λ / (4π √(n₁² sin²θ − n₂²)) at ${t.l} nm`]);
  }
  if (r.through && r.through.length) {
    const t = r.through[0];
    rows.push(['Beam enters the sample', `incidence ${f3(t.ang)}°, refracted to ${f3(t.out)}°`, t.out > 50 ? 'highly inclined (HILO-like) sheet' : 'epi illumination'] );
  }
  if (r.exAngles) {
    const half = (r.exAngles[1] - r.exAngles[0]) / 2, spread = r.exSpread[1] - r.exSpread[0];
    const lam = Math.min(...r.exLambdas);
    if (spread < 0.05 && half > 0.05 && half < 10) {
      const NA = 1.33 * Math.sin(half * Math.PI / 180), g = gaussianSheet(lam, NA, 1.33);
      rows.push(['Illumination NA (in water)', f3(NA), 'half-angle of the converging beam']);
      rows.push(['Waist (sheet thickness, 2w₀)', `${f3(g.thickness / 1000)} µm`, `usable length 2z_R ≈ ${f3(g.fov / 1000)} µm`]);
    }
    if ((r.exTags || []).some(t => t === '+1' || t === '-1')) {
      const ch = chain([...new Set(Object.values(byId).filter(k => k.type === 'objective').map(k => k.id))], byId);
      const n = ch ? ch.obj.nimm : 1.518, s = n * Math.sin(Math.max(...r.exAngles.map(Math.abs)) * Math.PI / 180);
      rows.push(['Stripe period of the ±1 orders', `${f3(lam / (2 * s))} nm`, `λ / (2 n sin θ) with n sin θ = ${f3(s)}`]);
    }
    if ((r.exTags || []).includes('vortex')) {
      const obj = Object.values(byId).find(k => k.type === 'objective');
      const NA = obj ? obj.params.na : 1.4, exc = Math.min(...r.exLambdas);
      rows.push(['STED doughnut present', `${Math.max(...r.exLambdas)} nm with vortex phase`, `d ≈ λ / (2 NA √(1 + I/Iₛ)): ${f3(stedResolution(exc, NA, 0))} nm without depletion, ${f3(stedResolution(exc, NA, 30))} nm at I/Iₛ = 30`]);
    }
  }
  return rows;
}

export function analyze(result) {
  const byId = Object.fromEntries(result.components.map(k => [k.id, k]));
  const out = [];
  for (const c of result.components) {
    const r = result.readouts[c.id], P = PARTS[c.type], title = c.label || P.label;
    let rows = [];
    if (P.cat === 'det') rows = detectorRows(c, r, byId);
    else if (P.cat === 'sample') rows = sampleRows(c, r, byId);
    else if (c.type === 'objective') {
      if (r.collected) rows.push(['Collected from the sample side', fmtP(r.collected)]);
      if (r.clipped) rows.push(['Clipped at the back aperture', fmtP(r.clipped), `beam wider than the pupil (Ø ${f3(2 * c.params.ftl / c.params.mag * c.params.na)} mm)`]);
      if (r.outsideNA) rows.push(['Outside the NA (lost)', fmtP(r.outsideNA)]);
    } else if (c.type === 'fibre_in' && r.incident) rows.push(['Coupling efficiency', `${f3(100 * (r.coupled || 0) / r.incident)}%`, `${fmtP(r.coupled || 0)} of ${fmtP(r.incident)}`]);
    else if (c.type === 'dump' && r.power) rows.push(['Power absorbed', fmtP(r.power)]);
    if (rows.length) out.push({ id: c.id, type: c.type, title, rows });
  }
  return out;
}
