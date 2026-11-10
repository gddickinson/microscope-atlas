// Core helpers, the hash router and the blinking-molecule background.
// Pages register with route(name, fn); fn(args, query) renders into #app.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const cache = new Map();
export async function api(path, { fresh = false } = {}) {
  if (!fresh && cache.has(path)) return cache.get(path);
  let v;
  if (window.ATLAS_STATIC) {
    v = await (await import('./static_api.js')).staticApi(path);
  } else {
    const r = await fetch('api' + path);
    if (!r.ok) throw new Error(`${r.status} ${path}`);
    v = await r.json();
  }
  cache.set(path, v);
  return v;
}

export function html(strings, ...vals) {
  return strings.reduce((a, s, i) => a + s + (i < vals.length ? vals[i] : ''), '');
}

export const list = (items, fn, sep = '') => (items || []).map(fn).join(sep);
export const app = () => $('#app');

// --- router ---------------------------------------------------------------
const routes = {};
export function route(name, fn) { routes[name] = fn; }

export function go(hash) { location.hash = hash; }

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: parts[0] || 'home', args: parts.slice(1), query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

let stopCurrent = null;
export function onLeave(fn) { stopCurrent = fn; }

async function render() {
  if (stopCurrent) { try { stopCurrent(); } catch (e) { console.warn(e); } stopCurrent = null; }
  const { name, args, query } = parse();
  const fn = routes[name] || routes.notfound;
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === name));
  $$('nav details').forEach(d => d.removeAttribute('open'));
  const root = app();
  root.innerHTML = '<p class="mute">Loading...</p>';
  try {
    await fn(args, query);
  } catch (e) {
    console.error(e);
    root.innerHTML = `<h1>Something went wrong</h1><p class="err">${esc(e.message)}</p>`;
  }
  if (!query.keep) window.scrollTo(0, 0);
  root.focus({ preventScroll: true });
}

export function start() {
  window.addEventListener('hashchange', render);
  document.addEventListener('click', e => {
    const open = $$('nav details[open]');
    open.forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  render();
}

// --- small UI helpers -------------------------------------------------------
export function tags(items, cls = '') {
  return list(items, t => `<span class="tag ${cls}">${esc(t)}</span>`);
}

export function bullets(items) {
  return items && items.length ? `<ul>${list(items, i => `<li>${esc(i)}</li>`)}</ul>` : '';
}

export function sourceLinks(sources) {
  return list(sources, s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a></li>`);
}

export function doiLink(p) {
  const body = esc(p.cite);
  return p.doi ? `<a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">${body}</a>` : body;
}

// Slider bound to a label; returns the input element.
export function slider(host, { id: rawId, label, min, max, step, value, unit = '', fmt = v => v }, onInput) {
  const id = 'sl-' + rawId;
  const wrap = document.createElement('div');
  wrap.className = 'ctl';
  wrap.innerHTML = `<label for="${id}">${esc(label)} <b id="${id}-v">${fmt(value)}${unit}</b></label>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">`;
  host.appendChild(wrap);
  const input = wrap.querySelector('input');
  const out = wrap.querySelector('b');
  input.addEventListener('input', () => { out.textContent = fmt(+input.value) + unit; onInput(+input.value); });
  return input;
}

// Wavelength (nm) to an approximate display colour.
export function waveColor(nm, alpha = 1) {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = 0.4; b = 0.6; }
  else if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 780) { r = 1; }
  else { r = 0.55; b = 0.15; }
  let f = 1;
  if (nm < 420) f = 0.35 + 0.65 * Math.max(0, nm - 380) / 40;
  else if (nm > 700) f = Math.max(0.35, 0.35 + 0.65 * (780 - nm) / 80);
  const c = v => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
  return `rgba(${c(r)},${c(g)},${c(b)},${alpha})`;
}

// --- background: single molecules blink and slowly build a "super-resolved" image ---
export function background(canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, curves = [], acc = [];
  const palette = ['#3dff8f', '#ff3fa4', '#4f9dff'];
  function resize() {
    w = canvas.width = innerWidth; h = canvas.height = innerHeight;
    curves = Array.from({ length: 7 }, () => {
      const p = [Math.random() * w, Math.random() * h];
      const a = Math.random() * Math.PI * 2;
      return { p, a, k: (Math.random() - 0.5) * 0.004, len: 400 + Math.random() * 900, col: palette[Math.floor(Math.random() * 3)] };
    });
    acc = [];
  }
  function sample() {
    const c = curves[Math.floor(Math.random() * curves.length)];
    const t = Math.random() * c.len;
    const a = c.a + c.k * t;
    const x = c.p[0] + Math.cos(c.a) * t + Math.sin(a) * 30;
    const y = c.p[1] + Math.sin(c.a) * t - Math.cos(a) * 30;
    return { x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, col: c.col, life: 1 };
  }
  let blinks = [];
  function frame() {
    ctx.fillStyle = 'rgba(4,6,12,0.25)';
    ctx.fillRect(0, 0, w, h);
    for (const p of acc) { ctx.fillStyle = p.col; ctx.globalAlpha = 0.35; ctx.fillRect(p.x, p.y, 1.4, 1.4); }
    ctx.globalAlpha = 1;
    if (blinks.length < 26) blinks.push(sample());
    for (const b of blinks) {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 9);
      g.addColorStop(0, b.col); g.addColorStop(1, 'transparent');
      ctx.globalAlpha = b.life; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, 7); ctx.fill();
      b.life -= 0.04 + Math.random() * 0.03;
      if (b.life <= 0) { acc.push(b); if (acc.length > 6000) acc.splice(0, 400); }
    }
    ctx.globalAlpha = 1;
    blinks = blinks.filter(b => b.life > 0);
    if (!reduce) requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', resize);
  frame();
}
