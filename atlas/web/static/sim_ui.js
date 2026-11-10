// Shared drawing and control helpers for the simulations.
import { slider, esc } from './core.js';

// Layout: controls on the left, figure(s) on the right. Returns {controls, view, readout}.
export function layout(host, intro = '') {
  host.innerHTML = `${intro ? `<p class="lead">${intro}</p>` : ''}<div class="sim"><div class="controls"></div><div class="view"></div></div>`;
  const controls = host.querySelector('.controls');
  const view = host.querySelector('.view');
  const readout = document.createElement('div');
  readout.className = 'readout';
  controls.after ? controls.appendChild(readout) : null;
  return { controls, view, readout };
}

export function addSlider(controls, opts, cb) { return slider(controls, opts, cb); }

export function addSeg(controls, label, options, value, cb) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<label>${esc(label)}</label><div class="seg">${options.map(([v, l]) => `<button data-v="${esc(v)}" class="${v === value ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
  controls.appendChild(wrap);
  wrap.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    wrap.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    cb(b.dataset.v);
  });
}

export function addButton(controls, label, cb, alt = false) {
  const b = document.createElement('button');
  b.textContent = label;
  if (alt) b.className = 'alt';
  b.onclick = cb;
  controls.appendChild(b);
  return b;
}

export function setReadout(el, rows) {
  el.innerHTML = rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
}

export function canvas(host, w, h, caption = '') {
  const fig = document.createElement('figure');
  fig.style.margin = '0 0 12px';
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fig.appendChild(c);
  if (caption) { const f = document.createElement('figcaption'); f.className = 'small mute'; f.textContent = caption; fig.appendChild(f); }
  host.appendChild(fig);
  return c.getContext('2d');
}

// Colour maps: value 0..1 -> [r,g,b].
export const CMAPS = {
  green: v => [v * 60, 40 + v * 215, v * 120],
  magenta: v => [40 + v * 215, v * 50, 40 + v * 170],
  hot: v => [Math.min(255, v * 3 * 255), Math.min(255, Math.max(0, v * 3 - 1) * 255), Math.min(255, Math.max(0, v * 3 - 2) * 255)],
  gray: v => [v * 255, v * 255, v * 255],
  blue: v => [v * 80, v * 160, 60 + v * 195],
};

// Draw a Float32Array image (w x h) scaled to the canvas, normalised to max (or given vmax).
export function heatmap(ctx, data, w, h, cmap = CMAPS.green, vmax = null, gamma = 1) {
  const m = vmax ?? arrMax(data);
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = Math.pow(Math.max(0, Math.min(1, data[i] / m)), gamma);
    const [r, g, b] = cmap(v);
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function arrMax(a) { let m = 1e-12; for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }

// SVG line plot. series: [{pts:[[x,y]], color, label, dash}], opts: {xlabel, ylabel, xmin.., logx, marks:[{x,label,color}]}
export function linePlot(svgHost, series, o = {}) {
  const W = o.W || 640, H = o.H || 300, L = 56, R = 16, T = 16, B = 42;
  const all = series.flatMap(s => s.pts);
  const xmin = o.xmin ?? Math.min(...all.map(p => p[0])), xmax = o.xmax ?? Math.max(...all.map(p => p[0]));
  const ymin = o.ymin ?? Math.min(0, ...all.map(p => p[1])), ymax = o.ymax ?? Math.max(...all.map(p => p[1])) * 1.05;
  const lx = v => (o.logx ? Math.log10(v) : v);
  const x = v => L + (lx(v) - lx(xmin)) / (lx(xmax) - lx(xmin) || 1) * (W - L - R);
  const y = v => H - B - (v - ymin) / (ymax - ymin || 1) * (H - B - T);
  let s = `<svg class="plot" viewBox="0 0 ${W} ${H}">`;
  for (let i = 0; i <= 4; i++) {
    const yv = ymin + (ymax - ymin) * i / 4;
    s += `<line x1="${L}" x2="${W - R}" y1="${y(yv)}" y2="${y(yv)}" stroke="#101a30"/><text class="axisl" x="${L - 6}" y="${y(yv) + 4}" text-anchor="end">${fmt(yv)}</text>`;
    const xv = o.logx ? 10 ** (lx(xmin) + (lx(xmax) - lx(xmin)) * i / 4) : xmin + (xmax - xmin) * i / 4;
    s += `<text class="axisl" x="${x(xv)}" y="${H - B + 16}" text-anchor="middle">${fmt(xv)}</text>`;
  }
  s += `<text class="axisl" x="${(L + W) / 2}" y="${H - 6}" text-anchor="middle">${esc(o.xlabel || '')}</text>`;
  s += `<text class="axisl" x="14" y="${H / 2}" transform="rotate(-90 14 ${H / 2})" text-anchor="middle">${esc(o.ylabel || '')}</text>`;
  for (const m of o.marks || []) s += `<line x1="${x(m.x)}" x2="${x(m.x)}" y1="${T}" y2="${H - B}" stroke="${m.color || '#ffd23f'}" stroke-dasharray="4 3"/><text class="axisl" x="${x(m.x) + 4}" y="${T + 12}" fill="${m.color || '#ffd23f'}">${esc(m.label || '')}</text>`;
  for (const m of o.hmarks || []) s += `<line x1="${L}" x2="${W - R}" y1="${y(m.y)}" y2="${y(m.y)}" stroke="${m.color || '#ffd23f'}" stroke-dasharray="4 3"/><text class="axisl" x="${W - R - 4}" y="${y(m.y) - 4}" text-anchor="end" fill="${m.color || '#ffd23f'}">${esc(m.label || '')}</text>`;
  series.forEach((sr, i) => {
    const pts = sr.pts.filter(p => Number.isFinite(p[1])).map(p => `${x(p[0]).toFixed(1)},${y(Math.max(ymin, Math.min(ymax, p[1]))).toFixed(1)}`).join(' ');
    if (sr.dots) sr.pts.forEach(p => { s += `<circle cx="${x(p[0])}" cy="${y(p[1])}" r="3" fill="${sr.color}"/>`; });
    else s += `<polyline points="${pts}" fill="none" stroke="${sr.color}" stroke-width="${sr.width || 2}" stroke-dasharray="${sr.dash || ''}"/>`;
    if (sr.label) s += `<text class="axisl" x="${L + 10}" y="${T + 14 + i * 15}" fill="${sr.color}">${esc(sr.label)}</text>`;
  });
  svgHost.innerHTML = s + '</svg>';
}

export function fmt(v) {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1000 || a < 0.01) return v.toExponential(1);
  return +v.toPrecision(3) + '';
}

// requestAnimationFrame loop that stops when the page changes.
export function animate(step) {
  let on = true;
  const tick = () => { if (!on) return; step(); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  return () => { on = false; };
}

export function div(host, cls = '') { const d = document.createElement('div'); d.className = cls; host.appendChild(d); return d; }
