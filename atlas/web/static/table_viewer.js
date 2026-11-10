// Virtual Optical Table: image viewer panel. Shows the simulated image that a camera (or a scanned point detector) on the
// table would record of the specimen at the sample, refreshed (debounced) whenever the layout changes.
// createViewer(host, { setSampleParam(sampleId, params) }) -> { open(detId), update(result), close(), isOpen() }
// Physics lives in table_imaging.js / table_imaging_optics.js; drawing helpers in table_viewer_draw.js.
import { esc } from './core.js';
import { linePlot } from './sim_ui.js';
import { imageFormation } from './table_imaging.js';
import { inferOptics, imagingDetectors, specimenFov } from './table_imaging_optics.js';
import { makeSpecimen, SPECIMEN_OPTIONS } from './table_specimens.js';
import { LUTS, toRGBA, range, autoRange, drawHistogram, profile, drawScaleBar } from './table_viewer_draw.js';

const f3 = v => (Number.isFinite(v) ? (+v.toPrecision(3)).toLocaleString() : '—');
const opt = (list, v) => list.map(([k, l]) => `<option value="${esc(k)}" ${String(k) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('');

export function createViewer(host, cb = {}) {
  const V = { det: null, result: null, img: null, o: null, spec: null, seed: 1, exposure: null, gain: null, bin: 1, brightness: 1, focus: null, scanPx: null,
    lut: 'grey', lo: 0, hi: 1, dr: [0, 1], auto: true, gamma: 1, truth: false, tool: 'pan', line: null, view: null, shown: false };
  const specCache = new Map();
  let timer = 0;
  host.innerHTML = `<div class="tbv-head"><b>Simulated image</b><label class="tb-inline">Detector <select class="tbv-det" aria-label="Detector"></select></label>
      <span class="tbv-busy small mute" aria-live="polite"></span><button class="alt tbv-close" data-a="close" aria-label="Close the image viewer">Close</button></div>
    <div class="tbv-msg small err" hidden></div>
    <div class="tbv-body">
      <div class="tbv-views">
        <figure class="tbv-fig"><canvas class="tbv-img" aria-label="Simulated image: wheel to zoom, drag to pan or draw a line"></canvas><figcaption class="tbv-px small mono">&nbsp;</figcaption></figure>
        <figure class="tbv-fig tbv-truthfig" hidden><canvas class="tbv-truth" aria-label="Ground truth"></canvas><figcaption class="small mute">Ground truth: every emitter of the specimen, all depths</figcaption></figure>
      </div>
      <div class="tbv-ctrl">
        <label>Specimen <select data-v="specimen">${opt(SPECIMEN_OPTIONS, 'auto')}</select></label>
        <div class="tbv-row"><label>Focus <span class="mute">(µm above glass)</span><input type="number" data-v="focus" step="0.1" min="0" max="8"></label>
          <label><span class="tbv-explabel">Exposure (ms)</span><input type="number" data-v="exposure" min="0.01" max="100000" step="any"></label></div>
        <div class="tbv-row"><label class="tbv-gainlabel">Gain<input type="number" data-v="gain" min="1" max="1000" step="any"></label>
          <label class="tbv-binlabel">Binning <select data-v="bin">${opt([[1, '1 × 1'], [2, '2 × 2'], [4, '4 × 4']], 1)}</select></label>
          <label class="tbv-scanlabel" hidden>Scan pixel (nm)<input type="number" data-v="scanPx" min="5" max="2000" step="any"></label></div>
        <label>Brightness <span class="mute">(labelling × excitation scale)</span><input type="range" data-v="brightness" min="-2" max="2" step="0.1" value="0"></label>
        <div class="tbv-btns"><button data-a="snap">Snap</button><button class="alt" data-a="fit">Fit</button><button class="alt" data-a="one">1:1</button><button class="alt" data-a="line" aria-pressed="false">Line profile</button><button class="alt" data-a="png">Export PNG</button></div>
        <div class="tbv-row"><label>LUT <select data-d="lut">${opt(Object.keys(LUTS).map(k => [k, k]), 'grey')}</select></label>
          <label class="tb-inline tbv-check"><input type="checkbox" data-d="truth"> show ground truth</label></div>
        <canvas class="tbv-hist" width="256" height="56" aria-label="Histogram"></canvas>
        <label>Min <span class="tbv-lo mono"></span><input type="range" data-d="lo" min="0" max="1000" value="0"></label>
        <label>Max <span class="tbv-hi mono"></span><input type="range" data-d="hi" min="0" max="1000" value="1000"></label>
        <div class="tbv-row"><label>Gamma <span class="tbv-gv mono">1</span><input type="range" data-d="gamma" min="0.2" max="3" step="0.05" value="1"></label>
          <button class="alt" data-a="auto">Auto contrast</button></div>
        <a class="tbv-dl small" hidden></a>
      </div>
    </div>
    <div class="tbv-profile"></div>
    <div class="tbv-meta"></div>`;
  const $ = s => host.querySelector(s);
  const cv = $('.tbv-img'), tv = $('.tbv-truth'), off = document.createElement('canvas'), offT = document.createElement('canvas');

  // --- computing -------------------------------------------------------------------------------------
  function schedule(ms = 150) { clearTimeout(timer); $('.tbv-busy').textContent = 'updating…'; timer = setTimeout(compute, ms); }
  function compute() {
    $('.tbv-busy').textContent = '';
    if (!V.shown || !V.result) return;
    const dets = imagingDetectors(V.result);
    $('.tbv-det').innerHTML = dets.map(d => `<option value="${esc(d.id)}" ${d.id === V.det ? 'selected' : ''}>${esc(d.title)} (${esc(d.id)})${d.power ? '' : ': no light'}</option>`).join('') || '<option value="">no camera or point detector</option>';
    if (!dets.some(d => d.id === V.det)) { const d = dets.find(x => x.power) || dets[0]; resetSettings(); V.det = d ? d.id : null; if (d) $('.tbv-det').value = d.id; }
    const o = V.det ? inferOptics(V.result, V.det, { scanPx: V.scanPx }) : { ok: false, reason: 'Add a camera or a point detector (PMT) behind the objective to record an image.' };
    const msg = $('.tbv-msg');
    msg.hidden = o.ok; msg.textContent = o.ok ? '' : o.reason;
    $('.tbv-body').hidden = !o.ok;
    if (!o.ok) { $('.tbv-meta').innerHTML = ''; $('.tbv-profile').innerHTML = ''; V.img = null; return; }
    const fov = specimenFov(o), key = `${o.specimen}|${fov}`;
    if (!specCache.has(key)) { if (specCache.size > 12) specCache.clear(); specCache.set(key, makeSpecimen(o.specimen, { fov, seed: 1 })); }
    V.spec = specCache.get(key);
    const point = o.kind === 'point', em = o.camera.sensor === 'EMCCD';
    const t0 = performance.now();
    try {
      V.img = imageFormation(V.spec, o, o.camera, { seed: V.seed, focus: V.focus ?? V.spec.focus, exposure: V.exposure ?? o.defaultExposure,
        gain: V.gain ?? (em ? 100 : 1), bin: point ? 1 : V.bin, brightness: V.brightness });
    } catch (err) { msg.hidden = false; msg.textContent = 'Could not form the image: ' + err.message; return; }
    V.ms = performance.now() - t0;
    const sizeChanged = !V.o || V.o.pixelNm !== o.pixelNm || !V.view || V.view.w !== V.img.width;
    V.o = o;
    syncControls(o, point, em);
    V.dr = range(V.img.data);
    if (V.auto) [V.lo, V.hi] = autoRange(V.img.data);
    paintOff();
    if (sizeChanged) fit(); else draw();
    drawMeta();
    plotProfile();
  }
  function resetSettings() { Object.assign(V, { exposure: null, gain: null, focus: null, scanPx: null, line: null, auto: true }); }
  function syncControls(o, point, em) {
    const set = (k, v) => { const el = host.querySelector(`[data-v="${k}"]`); if (el && document.activeElement !== el) el.value = v; };
    set('specimen', o.specimenAuto ? 'auto' : o.specimen);
    set('focus', +((V.focus ?? V.spec.focus) / 1000).toFixed(3));
    set('exposure', V.exposure ?? o.defaultExposure);
    set('gain', V.gain ?? (em ? 100 : 1));
    set('scanPx', V.scanPx ?? o.scanDefault);
    $('.tbv-explabel').textContent = point ? 'Pixel dwell (µs)' : 'Exposure (ms)';
    $('.tbv-gainlabel').firstChild.textContent = em ? 'EM gain' : point ? 'Gain (no effect: photon counting)' : 'Analog gain (×)';
    $('.tbv-binlabel').hidden = point;
    $('.tbv-scanlabel').hidden = !point;
  }

  // --- drawing ------------------------------------------------------------------------------------
  function paintOff() {
    const I = V.img, T = I.truth;
    off.width = I.width; off.height = I.height;
    off.getContext('2d').putImageData(new ImageData(toRGBA(I.data, V.lo, V.hi, V.gamma, V.lut), I.width, I.height), 0, 0);
    if (V.truth) {
      offT.width = T.width; offT.height = T.height;
      const [, th] = autoRange(T.data);
      offT.getContext('2d').putImageData(new ImageData(toRGBA(T.data, 0, th, V.gamma, V.lut), T.width, T.height), 0, 0);
    }
    const span = V.dr[1] - V.dr[0] || 1, pos = v => Math.round((v - V.dr[0]) / span * 1000);
    $('[data-d="lo"]').value = pos(V.lo); $('[data-d="hi"]').value = pos(V.hi);
    $('.tbv-lo').textContent = f3(V.lo); $('.tbv-hi').textContent = f3(V.hi); $('.tbv-gv').textContent = V.gamma;
    drawHistogram($('.tbv-hist').getContext('2d'), V.img.data, V.dr, V.lo, V.hi);
  }
  function sizeCanvas(c) {
    const dpr = window.devicePixelRatio || 1, w = Math.max(64, c.clientWidth);
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(w * dpr); }
    return { dpr, w };
  }
  function fit() { const { w } = sizeCanvas(cv); V.view = { s: w / V.img.width, ox: 0, oy: 0, w: V.img.width }; draw(); }
  function paint(c, src, scale) {
    const { dpr } = sizeCanvas(c), ctx = c.getContext('2d'), v = V.view;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, v.ox, v.oy, src.width * v.s * scale, src.height * v.s * scale);
    return { ctx, dpr };
  }
  function draw() {
    if (!V.img || !V.view) return;
    const { ctx, dpr } = paint(cv, off, 1), v = V.view;
    if (V.line) {
      const [a, b, c2, d] = V.line;
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(v.ox + a * v.s, v.oy + b * v.s); ctx.lineTo(v.ox + c2 * v.s, v.oy + d * v.s); ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawScaleBar(ctx, V.img.pixelNm / 1000 / v.s, dpr);
    $('.tbv-truthfig').hidden = !V.truth;
    if (V.truth) { const t = paint(tv, offT, V.img.truth.pixelNm / V.img.pixelNm); t.ctx.setTransform(1, 0, 0, 1, 0, 0); drawScaleBar(t.ctx, V.img.pixelNm / 1000 / v.s, t.dpr); }
  }
  const toImg = e => { const r = cv.getBoundingClientRect(), v = V.view; return [(e.clientX - r.left - v.ox) / v.s, (e.clientY - r.top - v.oy) / v.s, e.clientX - r.left, e.clientY - r.top]; };

  function drawMeta() {
    const m = V.img.meta, o = V.o, s = V.spec, point = o.kind === 'point';
    const rows = [
      ['Imaging mode', m.label], ['Specimen', `${s.label}${o.specimenAuto ? ' (automatic)' : ''}`],
      ['Magnification / NA', `${o.M ? f3(m.M) + '×' : '—'} / ${m.NA}`, point ? 'magnification only matters for the pinhole size in a scanning system' : ''],
      ['Wavelength', `${Math.round(m.lam)} nm emission${m.lamEx !== m.lam ? `, ${Math.round(m.lamEx)} nm excitation` : ''}`],
      ['Pixel at the sample', `${f3(m.pixelNm)} nm (${m.nyquist})`, `Nyquist needs ≤ ${f3(m.nyqNm)} nm here${point ? ' (scan pixel)' : `; ${f3(o.pixelNm * o.M / 1000)} µm camera pixel${m.bin > 1 ? ` × ${m.bin} binning` : ''} / ${f3(o.M)}×`}`],
      ['PSF width (FWHM)', `${f3(m.fwhm)} nm`, `${{ confocal: 'confocal: narrowed for the pinhole size', 'spinning-disk': 'confocal: narrowed for the pinhole size', sted: 'STED: λ/(2NA√(1+I/Is))', 'two-photon': 'two-photon I² focus (Zipfel et al. 2003)', scanning: 'set by the excitation spot' }[m.mode] || 'Gaussian approximation σ = 0.21 λ/NA'}; two points resolve at ≈ ${f3(m.resolution)} nm`],
      ['Field shown', `${f3(m.fieldNm / 1000)} µm, ${V.img.width} × ${V.img.height} px`],
      ['Peak signal / background', `${f3(m.peakPhotons)} / ${f3(m.bgPhotons)} photons per pixel`, `${f3(m.photonsPerFluor)} detected photons per fluorophore in ${f3(m.exposure)} ${m.expUnit}`],
      ['SNR of the brightest feature', f3(m.snr), `QE ${o.camera.qe}%${point ? ', photon counting' : `, read noise ${o.camera.read} e⁻${m.emGain > 1 ? `, EM gain ${m.emGain} (excess noise √2)` : ''}, ${o.camera.bits}-bit`}`],
    ];
    if (m.saturated) rows.push(['Saturated pixels', `${f3(100 * m.saturated)}%`]);
    $('.tbv-meta').innerHTML = `<table class="tbv-table">${rows.map(([k, v, n]) => `<tr><th>${esc(k)}</th><td>${esc(v)}${n ? `<div class="small mute">${esc(n)}</div>` : ''}</td></tr>`).join('')}</table>
      <div class="tbv-why"><b>What limits this image</b><ul>${m.limits.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      ${o.notes.length ? `<p class="small mute">${o.notes.map(esc).join(' ')}</p>` : ''}
      <p class="small"><b>${esc(s.label)}.</b> ${esc(s.desc)} <span class="mute">${esc(s.note)}</span></p>
      <p class="small mute">A teaching model: Gaussian PSF, defocus as geometric blur, sectioning as a depth weight, photon counts scaled from the relative power in the 2D ray trace. Computed in ${Math.round(V.ms)} ms on a ${m.grid} × ${m.grid} grid of ${f3(m.finePitch)} nm.</p></div>`;
  }
  function plotProfile() {
    const el = $('.tbv-profile');
    if (!V.line || !V.img) { el.innerHTML = V.tool === 'line' ? '<p class="small mute">Drag across the image to draw a line; its intensity profile appears here.</p>' : ''; return; }
    const I = V.img, T = I.truth, [a, b, c, d] = V.line, um = I.pixelNm / 1000, k = I.pixelNm / T.pixelNm;
    const p = profile(I.data, I.width, I.height, a, b, c, d).map(([x, y]) => [x * um, y]);
    const t = profile(T.data, T.width, T.height, a * k, b * k, c * k, d * k).map(([x, y]) => [x / k * um, y]);
    const pm = Math.max(...p.map(q => q[1])), pmin = Math.min(...p.map(q => q[1])), tm = Math.max(1e-9, ...t.map(q => q[1]));
    linePlot(el, [{ pts: p, color: '#3dff8f', label: 'image (ADU)' }, { pts: t.map(([x, y]) => [x, pmin + (pm - pmin) * y / tm]), color: '#ff3fa4', dash: '4 3', width: 1.3, label: 'ground truth (scaled)' }],
      { xlabel: 'distance along the line (µm)', ylabel: 'ADU', W: 640, H: 220, ymin: Math.min(0, pmin) });
  }

  // --- events ----------------------------------------------------------------------------------------
  host.addEventListener('input', e => {
    const t = e.target, k = t.dataset.v, d = t.dataset.d;
    if (k === 'specimen') return;
    if (k === 'brightness') { V.brightness = 10 ** +t.value; return schedule(); }
    if (k && t.value !== '' && Number.isFinite(+t.value) && (+t.value > 0 || k === 'focus')) {
      V[k] = k === 'focus' ? Math.max(0, +t.value) * 1000 : +t.value;
      return schedule();
    }
    if (!d || !V.img) return;
    if (d === 'lo' || d === 'hi') { V.auto = false; V[d] = V.dr[0] + (V.dr[1] - V.dr[0]) * +t.value / 1000; if (V.lo >= V.hi) V[d === 'lo' ? 'hi' : 'lo'] = V[d] + (d === 'lo' ? 1 : -1); }
    if (d === 'gamma') V.gamma = +t.value;
    if (d === 'lut') V.lut = t.value;
    if (d === 'truth') V.truth = t.checked;
    paintOff(); draw();
  });
  host.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.v === 'specimen' && V.o && cb.setSampleParam) { V.focus = null; V.line = null; cb.setSampleParam(V.o.sampleId, { specimen: t.value }); }
    if (t.classList.contains('tbv-det')) { V.det = t.value; resetSettings(); compute(); }
    if (t.dataset.d === 'lut' || t.dataset.d === 'truth') { V[t.dataset.d] = t.dataset.d === 'truth' ? t.checked : t.value; if (V.img) { paintOff(); draw(); } }
  });
  host.addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    if (a === 'close') return close();
    if (a === 'snap') { V.seed++; return compute(); }
    if (!V.img) return;
    if (a === 'fit') fit();
    if (a === 'one') { const dpr = window.devicePixelRatio || 1, r = cv.clientWidth / 2, k = 1 / dpr / V.view.s; V.view = { ...V.view, s: 1 / dpr, ox: r - (r - V.view.ox) * k, oy: r - (r - V.view.oy) * k }; draw(); }
    if (a === 'auto') { V.auto = true; [V.lo, V.hi] = autoRange(V.img.data); paintOff(); draw(); }
    if (a === 'line') { V.tool = V.tool === 'line' ? 'pan' : 'line'; e.target.setAttribute('aria-pressed', String(V.tool === 'line')); e.target.classList.toggle('on', V.tool === 'line'); cv.style.cursor = V.tool === 'line' ? 'crosshair' : ''; plotProfile(); }
    if (a === 'png') exportPNG();
  });
  cv.addEventListener('wheel', e => {
    if (!V.view) return;
    e.preventDefault();
    const [, , mx, my] = toImg(e), k = Math.exp(-e.deltaY * 0.0015), v = V.view, fitS = cv.clientWidth / V.img.width;
    const s = Math.max(fitS / 2, Math.min(fitS * 64, v.s * k)), q = s / v.s;
    V.view = { ...v, s, ox: mx - (mx - v.ox) * q, oy: my - (my - v.oy) * q };
    draw();
  }, { passive: false });
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    if (!V.view) return;
    try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic or already released pointer */ }
    const [x, y, mx, my] = toImg(e);
    drag = V.tool === 'line' ? { line: true } : { mx, my, ox: V.view.ox, oy: V.view.oy };
    if (drag.line) V.line = [x, y, x, y];
  });
  cv.addEventListener('pointermove', e => {
    if (!V.img) return;
    const [x, y, mx, my] = toImg(e), I = V.img, ix = Math.floor(x), iy = Math.floor(y);
    if (ix >= 0 && iy >= 0 && ix < I.width && iy < I.height) $('.tbv-px').textContent = `x ${ix}, y ${iy} (${f3(ix * I.pixelNm / 1000)}, ${f3(iy * I.pixelNm / 1000)} µm): ${f3(I.data[iy * I.width + ix])} ADU`;
    if (!drag) return;
    if (drag.line) { V.line[2] = x; V.line[3] = y; } else V.view = { ...V.view, ox: drag.ox + mx - drag.mx, oy: drag.oy + my - drag.my };
    draw();
  });
  const end = () => { if (drag && drag.line) { if (Math.hypot(V.line[2] - V.line[0], V.line[3] - V.line[1]) < 1) V.line = null; plotProfile(); draw(); } drag = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('dblclick', () => V.img && fit());
  const onResize = () => { if (V.shown && V.img) fit(); };
  window.addEventListener('resize', onResize);

  function exportPNG() {
    const I = V.img, k = Math.max(1, Math.floor(768 / I.width)), c = document.createElement('canvas');
    c.width = I.width * k; c.height = I.height * k;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, c.width, c.height);
    drawScaleBar(ctx, I.pixelNm / 1000 / k, 1);
    c.toBlob(blob => {
      if (!blob) return;
      const a = $('.tbv-dl'), url = URL.createObjectURL(blob);
      a.href = url; a.download = `optical-table-${V.det}-${V.spec.id}.png`; a.textContent = 'Download again'; a.hidden = false;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 'image/png');
  }

  function open(detId) {
    if (detId && detId !== V.det) { V.det = detId; resetSettings(); }
    V.shown = true; host.hidden = false;
    compute();
    host.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function close() { V.shown = false; host.hidden = true; clearTimeout(timer); }
  return { open, close, update: result => { V.result = result; if (V.shown) schedule(); }, isOpen: () => V.shown,
    reset: () => { resetSettings(); V.det = null; V.view = null; }, destroy: () => { clearTimeout(timer); window.removeEventListener('resize', onResize); } };
}
