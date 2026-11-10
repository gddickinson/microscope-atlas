// Form and output helpers for Lab Tools. Every tool module exports TOOLS = [{id, group, title, blurb, mount(host), python?}].
// mount(host) renders into host and may return a cleanup function. Keep calculations in pure functions
// exported from the module (or lab_calc.js) so tests can import them.
import { esc } from './core.js';

// Numeric input. Returns the <input>; onInput fires with the number.
export function num(host, { id, label, value, step = 'any', unit = '', min, max, help = '' }, onInput) {
  const d = document.createElement('div');
  d.innerHTML = `<label for="lt-${id}">${esc(label)}${unit ? ` <span class="mute">(${esc(unit)})</span>` : ''}</label>
    <input id="lt-${id}" type="number" step="${step}" value="${value}" ${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''}>
    ${help ? `<div class="small mute">${esc(help)}</div>` : ''}`;
  host.appendChild(d);
  const i = d.querySelector('input');
  if (onInput) i.addEventListener('input', () => onInput(+i.value));
  return i;
}

export function text(host, { id, label, value = '', rows = 0, placeholder = '' }, onInput) {
  const d = document.createElement('div');
  d.innerHTML = `<label for="lt-${id}">${esc(label)}</label>` + (rows
    ? `<textarea id="lt-${id}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
    : `<input id="lt-${id}" value="${esc(value)}" placeholder="${esc(placeholder)}">`);
  host.appendChild(d);
  const i = d.querySelector('input, textarea');
  if (onInput) i.addEventListener('input', () => onInput(i.value));
  return i;
}

// options: [[value, label], ...]
export function select(host, { id, label, options, value }, onChange) {
  const d = document.createElement('div');
  d.innerHTML = `<label for="lt-${id}">${esc(label)}</label><select id="lt-${id}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  host.appendChild(d);
  const s = d.querySelector('select');
  if (onChange) s.addEventListener('change', () => onChange(s.value));
  return s;
}

// A responsive grid of inputs: row(host) returns a div to put fields in.
export function row(host) { const d = document.createElement('div'); d.className = 'row'; host.appendChild(d); return d; }

export function panel(host, title = '') {
  const d = document.createElement('div');
  d.className = 'panel';
  if (title) d.innerHTML = `<h3 style="margin-top:0">${esc(title)}</h3>`;
  host.appendChild(d);
  return d;
}

// Results as value tiles: rows [[label, value, note?], ...]
export function results(el, rows) {
  el.className = 'kv';
  el.innerHTML = rows.map(([l, v, n]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span>${n ? `<div class="small mute">${esc(n)}</div>` : ''}</div>`).join('');
}

export function out(host) { const d = document.createElement('div'); host.appendChild(d); return d; }

export function table(el, head, rows) {
  el.innerHTML = `<div class="scroll"><table><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

export function note(host, html, cls = 'callout g') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; host.appendChild(d); return d; }

// Sources list for reference data: [{title, url}]
export function sources(host, list) {
  const d = document.createElement('p');
  d.className = 'small mute';
  d.innerHTML = 'Sources: ' + list.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join(' · ');
  host.appendChild(d);
}

export const fmt = (v, d = 3) => (Number.isFinite(v) ? (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : (+v.toPrecision(d)).toLocaleString()) : '—');
