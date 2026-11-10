// Virtual Optical Table: side panels. Palette (searchable parts by category), properties of the selected part (params,
// real models from the database, teaching note, technique and supplier links), readouts and the preset menu.
import { esc } from './core.js';
import { PARTS, CATS, TUBE_F } from './table_parts.js';

// --- real models from the database ---------------------------------------------------------------
const num = s => { const m = String(s || '').match(/-?\d+(\.\d+)?/); return m ? +m[0] : NaN; };
function immersionIndex(s) {
  const t = String(s || '').toLowerCase(), m = t.match(/(?:index|ne\s*=)\s*(\d\.\d+)/);
  if (m) return +m[1];
  if (t.startsWith('oil') || t.includes('high-index oil')) return 1.518;
  if (t.startsWith('silicone')) return 1.406;
  if (t.includes('glycerol')) return 1.45;
  if (t.startsWith('water')) return 1.333;
  if (t.startsWith('air') || t.startsWith('dry')) return 1;
  return NaN;
}
export function objectiveParams(o) {
  const mag = num(o.specs?.Magnification), na = num(o.specs?.NA), n = immersionIndex(o.specs?.Immersion);
  if (!(mag > 0 && na > 0 && n > 0)) return null;
  return { model: o.id, mag, na, nimm: n, ...(TUBE_F[o.manufacturer] ? { ftl: TUBE_F[o.manufacturer] } : {}) };
}
export function cameraParams(d) {
  const px = num(d.specs?.['Pixel size']), qe = num(d.specs?.['Peak QE']);
  const w = String(d.specs?.Pixels || '').match(/(\d+)\s*[x×]\s*(\d+)/);
  const out = { model: d.id };
  if (px > 0) out.px = px;
  if (qe > 0 && qe <= 100) out.qe = qe;
  if (w && px > 0) out.size = +(w[1] * px / 1000).toFixed(2);
  out.sensor = ['sCMOS', 'qCMOS', 'EMCCD', 'CCD', 'CMOS'].includes(d.type) ? d.type : 'CMOS';
  // Read noise: the lowest mode quoted; for EMCCDs the largest figure (the amplifier noise before EM gain divides it).
  const rn = String(d.specs?.['Read noise'] || ''), rs = [...rn.matchAll(/(\d+(?:\.\d+)?)\s*e/g)].map(m => +m[1]);
  if (/none|photon counting/i.test(rn)) out.read = 0;
  else if (out.sensor === 'EMCCD') out.read = rs.length && Math.max(...rs) > 5 ? Math.max(...rs) : 50; // 50 e⁻: a typical amplifier figure when only the post-gain value is quoted
  else if (rs.length) out.read = Math.min(...rs);
  const bits = [...String(d.specs?.['Bit depth'] || '').matchAll(/\d+/g)].map(m => +m[0]).filter(b => b >= 8 && b <= 16);
  if (bits.length) out.bits = Math.max(...bits);
  return out;
}
export const CAMERA_TYPES = ['sCMOS', 'qCMOS', 'EMCCD', 'CMOS', 'SPAD array'];
export const POINT_TYPES = ['GaAsP PMT', 'HyD/hybrid', 'APD/SPAD'];

// --- palette --------------------------------------------------------------------------------------
export function renderPalette(el, onAdd) {
  el.innerHTML = `<input type="search" class="tb-search" placeholder="Search parts…" aria-label="Search parts"><div class="tb-groups"></div>`;
  const groups = el.querySelector('.tb-groups'), input = el.querySelector('input');
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    groups.innerHTML = CATS.map(([cat, title]) => {
      const items = Object.entries(PARTS).filter(([k, p]) => p.cat === cat && (!q || (p.label + ' ' + k + ' ' + p.note).toLowerCase().includes(q)));
      if (!items.length) return '';
      return `<details ${q || cat === 'source' || cat === 'mirror' ? 'open' : ''}><summary>${esc(title)} <span class="mute">${items.length}</span></summary>
        ${items.map(([k, p]) => `<button class="tb-pal" data-type="${k}" title="${esc(p.note)}">${esc(p.label)}</button>`).join('')}</details>`;
    }).join('') || '<p class="small mute">No part matches.</p>';
  };
  input.addEventListener('input', draw);
  groups.addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (b) onAdd(b.dataset.type); });
  draw();
}

// --- properties -----------------------------------------------------------------------------------
function field(s, v, data, P) {
  const id = 'tbp-' + s.k;
  if (s.options) return `<label for="${id}">${esc(s.label)}</label><select id="${id}" data-k="${s.k}">${s.options.map(([o, l]) => `<option value="${esc(o)}" ${String(o) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  if (s.type === 'dye') {
    const names = (data.dyes || []).slice();
    if (v && v !== 'none' && !names.includes(v)) names.unshift(v);
    return `<label for="${id}">${esc(s.label)}</label><select id="${id}" data-k="${s.k}">${s.none ? `<option value="none" ${v === 'none' ? 'selected' : ''}>none</option>` : ''}${names.map(n => `<option ${n === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  }
  if (s.type === 'objective' || s.type === 'camera' || s.type === 'point') {
    const list = s.type === 'objective' ? (data.objectives || []).filter(objectiveParams)
      : (data.detectors || []).filter(d => (s.type === 'camera' ? CAMERA_TYPES : POINT_TYPES).includes(d.type));
    const sel = list.find(o => o.id === v);
    const src = sel && sel.sources && sel.sources[0];
    return `<label for="${id}">${esc(s.label)}</label><select id="${id}" data-model="${s.type}" data-k="${s.k}"><option value="">custom (edit below)</option>${list.map(o => `<option value="${esc(o.id)}" ${o.id === v ? 'selected' : ''}>${esc(o.manufacturer + ' ' + o.name)}${s.type === 'objective' ? ` (${esc(o.specs.Magnification)} / ${esc(o.specs.NA)})` : ` (${esc(o.type)})`}</option>`).join('')}</select>
      <div class="small">${sel ? `${esc(sel.summary || '')} ${src ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">maker’s page</a> · ` : ''}` : ''}<a href="#/components/${s.type === 'objective' ? 'objectives' : 'detectors'}">all ${s.type === 'objective' ? 'objectives' : 'detectors'} in the database</a>${s.type === 'objective' && sel && !TUBE_F[sel.manufacturer] ? ' · <span class="mute">tube-lens focal length not given for this maker: kept as set</span>' : ''}</div>`;
  }
  return `<label for="${id}">${esc(s.label)}${s.unit ? ` <span class="mute">(${esc(s.unit)})</span>` : ''}</label><input id="${id}" type="number" data-k="${s.k}" value="${esc(v)}" ${s.min !== undefined ? `min="${s.min}"` : ''} ${s.max !== undefined ? `max="${s.max}"` : ''} step="${s.step || 'any'}">`;
}

export function renderProps(el, comp, data, h) {
  if (!comp) {
    el.innerHTML = `<h3>Properties</h3><p class="small mute">Click a part on the table to edit it, or add one from the palette. Keys: R / E rotate (Shift: 1°), arrows nudge, Delete removes, Ctrl+D duplicates, Ctrl+Z / Ctrl+Shift+Z undo and redo.</p>`;
    return;
  }
  const P = PARTS[comp.type], p = comp.params;
  const techs = (P.tech || []).map(t => `<a class="tag b" href="#/technique/${esc(t)}">${esc(data.techNames?.[t] || t)}</a>`).join('');
  const sups = (P.sup || []).map(s => (data.suppliers?.[s] ? `<a href="${esc(data.suppliers[s])}" target="_blank" rel="noopener">${esc(s)}</a>` : esc(s))).join(' · ');
  el.innerHTML = `<h3>${esc(P.label)}</h3><p class="small">${esc(P.note)}</p>
    <div class="tb-xyz"><div><label for="tbp-x">x (mm)</label><input id="tbp-x" type="number" step="0.5" data-pos="x" value="${+comp.x.toFixed(3)}"></div>
      <div><label for="tbp-y">y (mm)</label><input id="tbp-y" type="number" step="0.5" data-pos="y" value="${+comp.y.toFixed(3)}"></div>
      <div><label for="tbp-rot">angle (°)</label><input id="tbp-rot" type="number" step="1" data-pos="rot" value="${+comp.rot.toFixed(2)}"></div></div>
    <label for="tbp-label">Label</label><input id="tbp-label" data-pos="label" value="${esc(comp.label || '')}" placeholder="${esc(P.label)}">
    ${P.schema.map(s => field(s, p[s.k], data, p)).join('')}
    <div class="tb-btns"><button class="alt" data-act="rotm">⟲ 15°</button><button class="alt" data-act="rotp">⟳ 15°</button><button class="alt" data-act="dup">Duplicate</button><button class="alt tb-del" data-act="del">Delete</button>${comp.type === 'camera' || comp.type === 'pmt' ? '<button data-act="view">View image</button>' : ''}</div>
    ${techs ? `<p class="small">Techniques: ${techs}</p>` : ''}
    ${sups ? `<p class="small">Suppliers: ${sups}</p>` : ''}
    ${comp.type === 'camera' || comp.type === 'pmt' ? '<p class="small"><a href="#/components/detectors">Compare detectors</a> · <a href="#/sim/noise">camera noise simulation</a></p>' : ''}
    <p class="small mute">Supplier links go to company home pages; no part numbers or prices are implied.</p>`;
  el.oninput = e => {
    const t = e.target;
    if (t.dataset.pos) return h.setPos(t.dataset.pos, t.dataset.pos === 'label' ? t.value : +t.value, false);
    if (t.dataset.k && t.type === 'number' && t.value !== '' && Number.isFinite(+t.value)) h.setParams({ [t.dataset.k]: +t.value }, false);
  };
  el.onchange = e => {
    const t = e.target;
    if (t.dataset.pos) return h.setPos(t.dataset.pos, t.dataset.pos === 'label' ? t.value : +t.value, true);
    if (!t.dataset.k) return;
    if (t.dataset.model) {
      const list = t.dataset.model === 'objective' ? data.objectives : data.detectors;
      const m = (list || []).find(o => o.id === t.value);
      const upd = !m ? { [t.dataset.k]: '' } : t.dataset.model === 'objective' ? objectiveParams(m) : cameraParams(m);
      return h.setParams(upd, true, true);
    }
    h.setParams({ [t.dataset.k]: t.type === 'number' ? +t.value : t.value }, true, t.tagName === 'SELECT');
  };
  el.querySelector('.tb-btns').onclick = e => { const a = e.target.dataset.act; if (a) h.action(a); };
}

// --- readouts -------------------------------------------------------------------------------------
export function renderReadouts(el, items, result, selected) {
  const sorted = items.slice().sort((a, b) => (b.id === selected) - (a.id === selected));
  el.innerHTML = `<h3>Readouts</h3>${result.warnings.map(w => `<p class="small err">${esc(w)}</p>`).join('')}
    ${sorted.length ? sorted.map(it => `<div class="tb-ro${it.id === selected ? ' sel' : ''}" data-id="${esc(it.id)}"><b>${esc(it.title)}</b>${(it.type === 'camera' || it.type === 'pmt') && result.readouts[it.id]?.power ? ` <button class="alt tb-view" data-view="${esc(it.id)}">View image</button>` : ''}
      <table>${it.rows.map(([k, v, n]) => `<tr><th>${esc(k)}</th><td>${esc(v)}${n ? `<div class="small mute">${esc(n)}</div>` : ''}</td></tr>`).join('')}</table></div>`).join('')
    : '<p class="small mute">Add a light source and a detector to see powers, spot sizes and resolution here.</p>'}
    <p class="small mute">${result.nRays} rays traced. Powers are relative bookkeeping of a 2D ray model (fluorescence is far weaker in reality), not predictions for a real instrument.</p>`;
}

// --- presets --------------------------------------------------------------------------------------
export function renderPresets(el, presets, current, onPick) {
  const card = p => `<button class="tb-preset${p.id === current ? ' on' : ''}" data-id="${esc(p.id)}"><b>${esc(p.title)}</b><span>${esc(p.desc)}</span></button>`;
  el.innerHTML = `<h3>Basic set-ups</h3><div class="tb-presets">${presets.filter(p => p.group === 'basic').map(card).join('')}</div>
    <h3>From the literature (simplified)</h3><div class="tb-presets">${presets.filter(p => p.group === 'literature').map(card).join('')}</div>`;
  el.onclick = e => { const b = e.target.closest('[data-id]'); if (b) onPick(b.dataset.id); };
}

export function presetInfo(p, names = {}) {
  if (!p) return '';
  const cite = p.cite ? `<p class="small">${p.doi ? `<a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">${esc(p.cite)}</a>` : esc(p.cite)}${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.url.replace(/^https?:\/\//, '').split('/')[0])}</a>` : ''}</p>` : '';
  const techs = (p.tech || []).map(t => `<a class="tag b" href="#/technique/${esc(t)}">${esc(names[t] || t)}</a>`).join('');
  return `<b>${esc(p.title)}</b> ${techs}<p class="small">${esc(p.desc)}</p>${cite}${p.simplified ? `<p class="small mute"><b>Simplified:</b> ${esc(p.simplified)}</p>` : ''}`;
}
