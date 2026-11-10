// Lab Tools, 'Analysis' (part 2): FRAP fitter, MSD analyser, and the Python-backed microscopy file inspector.
// Re-exported through lab_analysis.js. Pure calculations live in lab_analysis_calc.js.
import { esc } from './core.js';
import { num, text, select, row, panel, results, out, table, note, fmt } from './lab_ui.js';
import { linePlot } from './sim_ui.js';
import { rng, randomWalk } from './sim_engine.js';
import { parseTable, frapNormalise, fitRecovery, recoveryModel, frapSummary, analyseTrack } from './lab_analysis_calc.js';

const G = 'Analysis';

// Example FRAP curve: 5 pre-bleach frames, τ = 4 s, 70 % mobile, with a little noise.
function exampleFRAP() {
  const r = rng(7), lines = ['time_s\tintensity'];
  for (let i = 0; i < 40; i++) {
    const t = i * 0.5, tb = t - 2.5;
    const I = tb < 0 ? 1000 : 200 + 560 * (1 - Math.exp(-tb / 4));
    lines.push(`${t.toFixed(1)}\t${(I + 12 * r.normal()).toFixed(1)}`);
  }
  return lines.join('\n');
}

function mountFRAP(host) {
  const p = panel(host);
  const data = text(p, { id: 'fdata', label: 'Data: time and intensity, one row per frame (paste from Excel, Fiji or CSV)', rows: 8, value: exampleFRAP() }, () => draw());
  const r1 = row(p);
  const nPre = num(r1, { id: 'fpre', label: 'Pre-bleach frames (0 = auto)', value: 0, step: 1, min: 0 }, () => draw());
  const mode = select(r1, { id: 'fmode', label: 'Normalise', options: [['full', 'Full scale: pre = 1, first post-bleach = 0'], ['pre', 'Divide by pre-bleach mean']], value: 'full' }, () => draw());
  const w = num(r1, { id: 'fw', label: 'Bleach spot radius w', unit: 'µm', value: 1 }, () => draw());
  const res = out(p), plot = out(p);
  function draw() {
    const rows = parseTable(data.value);
    const n = frapNormalise(rows, { nPre: +nPre.value > 0 ? +nPre.value : null, mode: mode.value });
    if (!n) { res.className = 'callout'; res.textContent = 'Need at least 4 rows of two numbers, with the bleach after the first frame.'; plot.innerHTML = ''; return; }
    const fit = fitRecovery(n.post);
    if (!fit) { res.className = 'callout'; res.textContent = 'Not enough post-bleach points to fit.'; plot.innerHTML = ''; return; }
    const s = frapSummary(fit, +w.value);
    results(res, [['Mobile fraction', `${fmt(100 * s.mobile, 3)} %`], ['t½', `${fmt(s.thalf, 3)} s`], ['τ', `${fmt(fit.tau, 3)} s`],
      ['D (Soumpasis, 0.224 w²/t½)', `${fmt(s.D, 3)} µm²/s`], ['Plateau / I0', `${fmt(s.plateau, 3)} / ${fmt(fit.I0, 3)}`],
      ['Fit R²', fmt(fit.r2, 4), fit.atEdge ? 'τ at the edge of the search: recording too short or too sparse' : ''], ['Pre-bleach frames used', String(n.nPre)]]);
    const tEnd = n.post[n.post.length - 1][0], curve = [];
    for (let i = 0; i <= 200; i++) { const t = tEnd * i / 200; curve.push([t, recoveryModel(t, fit)]); }
    linePlot(plot, [{ pts: [...n.preNorm, ...n.post], color: '#8899bb', dots: true, label: 'data' }, { pts: curve, color: '#3dff8f', label: 'fit A(1 − e^(−t/τ)) + I0' }],
      { xlabel: 'time from bleach (s)', ylabel: 'normalised intensity', ymin: Math.min(0, ...n.post.map(q => q[1])), marks: [{ x: s.thalf, label: 't½' }] });
  }
  draw();
  note(host, 'Correct for acquisition bleaching first (divide by a reference region) and subtract background. The single exponential is empirical; the Soumpasis D assumes pure 2D diffusion into a uniformly bleached circular spot and is an order-of-magnitude estimate. Binding-dominated recoveries need reaction models.', 'callout g small');
}

function exampleTrack() {
  const tr = randomWalk(100, 0.5, 0.05, rng(3), { locErr: 0.02 });
  return ['x_um\ty_um', ...tr.map(([x, y]) => `${x.toFixed(4)}\t${y.toFixed(4)}`)].join('\n');
}

function mountMSD(host) {
  const p = panel(host);
  const data = text(p, { id: 'mdata', label: 'Track: x and y in µm per frame (or frame, x, y)', rows: 8, value: exampleTrack() }, () => draw());
  const r1 = row(p);
  const dt = num(r1, { id: 'mdt', label: 'Frame interval', unit: 's', value: 0.05 }, () => draw());
  const nf = num(r1, { id: 'mnf', label: 'Lags to fit', value: 4, step: 1, min: 2 }, () => draw());
  const res = out(p), plot = out(p);
  function draw() {
    const a = analyseTrack(parseTable(data.value), +dt.value, Math.round(+nf.value));
    if (!a) { res.className = 'callout'; res.textContent = 'Need at least 3 positions.'; plot.innerHTML = ''; return; }
    results(res, [['D', `${fmt(a.D, 3)} µm²/s`], ['Offset (4σ²)', `${fmt(a.offset, 3)} µm²`],
      ['Localization error σ', a.offset > 0 ? `${fmt(a.sigmaLoc * 1000, 3)} nm` : '—', a.offset <= 0 ? 'negative offset: motion blur or too few points' : ''],
      ['Positions / lags shown', `${a.track.length} / ${a.curve.length}`]]);
    const tMax = a.curve[a.curve.length - 1][0];
    linePlot(plot, [{ pts: a.curve, color: '#8899bb', dots: true, label: 'MSD' },
      { pts: [[0, a.offset], [tMax, a.offset + 4 * a.D * tMax]], color: '#3dff8f', label: `fit of first ${a.nFit} lags: 4Dt + 4σ²` }],
    { xlabel: 'lag time (s)', ylabel: 'MSD (µm²)', xmin: 0, marks: [{ x: a.nFit * +dt.value, label: 'fit range' }] });
  }
  draw();
  note(host, 'For a single track, fit only the first few lags (Michalet 2010): long lags average few displacements and are noisy. Curving down at long lags suggests confinement; curving up suggests directed motion.', 'callout g small');
}

function mountInspector(host) {
  const p = panel(host);
  p.innerHTML = `<label for="lt-file">TIFF, OME-TIFF or ND2 file (max 200 MB; processed in memory, not stored)</label>
    <input id="lt-file" type="file" accept=".tif,.tiff,.ome.tif,.ome.tiff,.nd2">`;
  const status = out(p), res = out(p), chans = out(p), prev = out(p);
  const input = p.querySelector('input');
  input.onchange = async () => {
    const f = input.files[0];
    res.innerHTML = chans.innerHTML = prev.innerHTML = '';
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) { status.innerHTML = '<div class="callout">The file is over 200 MB.</div>'; return; }
    status.innerHTML = `<p class="mute">Reading ${esc(f.name)}…</p>`;
    const fd = new FormData();
    fd.append('file', f);
    let body;
    try {
      const r = await fetch('/api/lab/inspect', { method: 'POST', body: fd });
      body = await r.json();
      if (!r.ok) throw new Error(body.detail || r.statusText);
    } catch (e) { status.innerHTML = `<div class="callout">Could not read the file: ${esc(e.message)}</div>`; return; }
    status.innerHTML = '';
    const px = body.pixel_size || {};
    const pxs = ['x', 'y', 'z'].filter(k => px[k]).map(k => `${k} ${fmt(px[k], 4)}`).join(', ');
    results(res, [['Format', body.format], ['Axes', body.axes], ['Shape', body.shape.join(' × ')], ['Data type', body.dtype],
      ['Pixel size', pxs ? `${pxs} ${px.unit || ''}` : 'not in metadata'], ['Size in memory', `${fmt(body.nbytes / 1048576, 3)} MB`]]);
    table(chans, ['Channel', 'Name', 'Excitation', 'Emission', 'Min', 'Max', 'Mean'], body.channels.map((c, i) =>
      [i, esc(c.name || ''), esc(c.excitation ?? ''), esc(c.emission ?? ''), fmt(c.min, 5), fmt(c.max, 5), fmt(c.mean, 5)]));
    if (body.preview) prev.innerHTML = `<figure style="margin:12px 0"><img alt="Preview" style="max-width:100%;image-rendering:pixelated" src="data:image/png;base64,${body.preview}">
      <figcaption class="small mute">Maximum projection over ${esc(body.projected || 'no')} axes, contrast stretched 0.5–99.8 percentile per channel.</figcaption></figure>`;
    if (body.notes?.length) note(prev, body.notes.map(esc).join('<br>'), 'callout small');
  };
}

export const TOOLS = [
  { id: 'frapfit', group: G, title: 'FRAP fitter', blurb: 'Paste a recovery curve: normalise, fit a single exponential, get mobile fraction, t½ and a Soumpasis D.', mount: mountFRAP },
  { id: 'msdtrack', group: G, title: 'MSD analyser', blurb: 'Paste one track: MSD curve, diffusion coefficient and localization offset from the first lags.', mount: mountMSD },
  { id: 'inspect', group: G, title: 'Microscopy file inspector', blurb: 'Upload a TIFF/OME-TIFF (or ND2): dimensions, pixel size, channels, intensity stats and a preview.', mount: mountInspector, python: true },
];
