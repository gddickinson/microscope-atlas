// Image Lab, part 2: find and fit single-molecule spots in the current camera image (sim_engine_loc.js), compare with
// the true positions when they are known, and with the Thompson/Mortensen precision limit.
import { esc } from './core.js';
import { localize, matchLocalizations, locPrecision } from './sim_engine.js';
import { addSlider, setReadout, canvas, heatmap, CMAPS, div, fmt } from './sim_ui.js';

export function spotPanel(host) {
  host.innerHTML = `<h2>Localize spots</h2><p class="small mute">Single-molecule localization fits each isolated spot with a 2D Gaussian
    (least squares, Levenberg-Marquardt; <a href="https://doi.org/10.1038/nmeth.1447" target="_blank" rel="noopener">Mortensen et al. 2010</a> compare estimators) to find its centre far more precisely than the spot's width. Choose the
    <b>Single-molecule frame</b> specimen to compare the fits with the true positions; with real data, use an image of sparse,
    well-separated spots. Precision follows <a href="https://doi.org/10.1016/s0006-3495(02)75618-x" target="_blank" rel="noopener">Thompson, Larson and Webb (2002)</a>, σ² = (s² + a²/12)/N · (16/9 + 8πb(s² + a²/12)/(N a²)).</p>
    <div class="sim"><div class="controls"></div><div class="view"></div></div>`;
  const controls = host.querySelector('.controls'), view = host.querySelector('.view'), readout = document.createElement('div');
  readout.className = 'readout';
  const st = { k: 5, last: null };
  addSlider(controls, { id: 'il-k', label: 'Detection threshold (× noise σ)', min: 2, max: 15, step: 0.5, value: st.k }, v => { st.k = v; if (st.last) update(st.last); });
  controls.appendChild(readout);
  const wrap = div(view, 'canvases');
  const f1 = document.createElement('figure'); wrap.appendChild(f1);
  const ctx = canvas(f1, 512, 512);
  f1.insertAdjacentHTML('beforeend', '<figcaption>Camera image: <span style="color:#3dff8f">+ fits</span>, <span style="color:#ff3fa4">○ true positions</span></figcaption>');
  const tbl = div(wrap);

  function update(o) {
    st.last = o;
    const { cam, M, sigma, camPx, truth } = o, r = Math.max(2, Math.ceil(2.5 * sigma));
    const t0 = performance.now();
    const fits = M <= 512 ? localize(cam, M, { sigma, k: st.k, r }).slice(0, 2000) : [];
    const ms = performance.now() - t0;
    let lo = Infinity; for (const v of cam) if (v < lo) lo = v;
    heatmap(ctx, cam.map(v => v - lo), M, M, CMAPS.gray);
    const S = ctx.canvas.width / M, P = v => (v + 0.5) * S;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ff3fa4';
    for (const [x, y] of truth || []) { ctx.beginPath(); ctx.arc(P(x), P(y), Math.max(4, 1.6 * sigma * S), 0, 2 * Math.PI); ctx.stroke(); }
    ctx.strokeStyle = '#3dff8f';
    for (const f of fits) { const x = P(f.x), y = P(f.y); ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke(); }
    const med = a => { const s = [...a].sort((p, q) => p - q); return s.length ? s[s.length >> 1] : NaN; };
    const N = med(fits.map(f => f.photons)), b = med(fits.map(f => f.bg)), sFit = med(fits.map(f => f.sigma));
    const pred = fits.length ? locPrecision(sFit * camPx, camPx, N, Math.max(0, b)) : NaN;
    const rows = [['Spots fitted', `${fits.length} (window ${2 * r + 1} × ${2 * r + 1} px, ${ms.toFixed(0)} ms)`],
      ['Median photons per spot, 2πσ²A', fits.length ? fmt(N) : '-'], ['Median background', fits.length ? `${fmt(b)} per pixel` : '-'],
      ['Fitted PSF σ', fits.length ? `${(sFit * camPx).toFixed(0)} nm (expected ${(sigma * camPx).toFixed(0)})` : '-'],
      ['Thompson precision for that spot', fits.length ? `${pred.toFixed(1)} nm` : '-']];
    if (truth && truth.length) {
      const m = matchLocalizations(fits, truth, Math.max(1, sigma));
      rows.push(['Found / missed / false', `${m.matched} / ${m.missed} / ${m.extra}`], ['Error vs truth (rms per axis)', m.matched ? `${(m.rms * camPx).toFixed(1)} nm` : '-']);
    }
    setReadout(readout, rows);
    tbl.innerHTML = fits.length ? `<table class="data small"><thead><tr><th>#</th><th>x (nm)</th><th>y (nm)</th><th>photons</th><th>σ (nm)</th><th>bg</th></tr></thead><tbody>${fits.slice(0, 15).map((f, i) =>
      `<tr><td>${i + 1}</td><td>${(f.x * camPx).toFixed(1)}</td><td>${(f.y * camPx).toFixed(1)}</td><td>${fmt(f.photons)}</td><td>${(f.sigma * camPx).toFixed(0)}</td><td>${fmt(f.bg)}</td></tr>`).join('')}</tbody></table>
      <p class="small mute">${fits.length > 15 ? `First 15 of ${fits.length}, brightest first. ` : ''}Positions from the top-left pixel centre.</p>` : `<p class="small mute">${esc(M > 512 ? 'Image too large to fit here.' : 'No spots above the threshold: lower it, or choose an image of sparse spots.')}</p>`;
  }
  return update;
}
