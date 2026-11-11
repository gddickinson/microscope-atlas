// Virtual Optical Table: the SVG breadboard. Draws holes, beams, parts, labels and the selection handle, and turns pointer
// gestures into callbacks: drag a part to move it, drag the round handle to rotate, drag empty board to pan, wheel to zoom.
// createBoard(host, cb) -> { render(state, result), fit(), zoomBy(k), centre() }
//   cb = { select(id|null), move(id, x, y, done), rotate(id, deg, done) }
import { esc } from './core.js';
import { draw, beams } from './table_draw.js';
import { PARTS } from './table_parts.js';

const NS = 'http://www.w3.org/2000/svg';
const HANDLE = 32; // mm from the part centre

export function createBoard(host, cb) {
  host.innerHTML = `<svg class="tb-svg" xmlns="${NS}" role="application" aria-label="Optical breadboard. Drag parts to move and the round handle to rotate; or Tab to a part, then arrow keys move it (Shift for 10 mm), R and E rotate, Delete removes, Escape deselects">
    <defs><clipPath id="tb-clip"><rect class="tb-cliprect"/></clipPath><pattern id="tb-holes" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="12.5" cy="12.5" r="2.1" class="tb-hole"/></pattern></defs>
    <rect class="tb-plate" rx="6"/><rect class="tb-holes" fill="url(#tb-holes)"/>
    <g class="tb-beams" clip-path="url(#tb-clip)"></g><g class="tb-parts"></g><g class="tb-labels"></g><g class="tb-ui"></g></svg>`;
  const svg = host.querySelector('svg');
  const L = name => svg.querySelector('.tb-' + name);
  let vb = { x: -20, y: -20, w: 1040, h: 640 }, board = { w: 1000, h: 600 }, state = null, drag = null;

  let comps = [], k = 1; // k: mm per "normal" unit, so labels and handles keep their on-screen size when zooming
  const setVB = () => {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const k2 = Math.min(4, Math.max(0.01, vb.w / 900));
    if (Math.abs(k2 - k) / k > 0.02) { k = k2; overlay(); }
  };
  function toBoard(e) {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  // Fit the view to the parts (or the whole board when it is empty), keeping the SVG aspect ratio.
  function fit() {
    const rect = svg.getBoundingClientRect(), aspect = rect.width && rect.height ? rect.height / rect.width : 0.6;
    const cs = state ? state.layout.components : [];
    let x0 = 0, y0 = 0, x1 = board.w, y1 = board.h;
    if (cs.length) {
      x0 = Math.min(...cs.map(c => c.x)) - 70; x1 = Math.max(...cs.map(c => c.x)) + 70;
      y0 = Math.min(...cs.map(c => c.y)) - 60; y1 = Math.max(...cs.map(c => c.y)) + 60;
    }
    let w = Math.max(160, x1 - x0), h = Math.max(100, y1 - y0);
    if (h / w > aspect) w = h / aspect; else h = w * aspect;
    vb = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
    setVB();
  }
  function zoomBy(k, at) {
    const c = at || { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
    const w = Math.min(5000, Math.max(4, vb.w * k)), s = w / vb.w;
    vb = { x: c.x - (c.x - vb.x) * s, y: c.y - (c.y - vb.y) * s, w, h: vb.h * s };
    setVB();
  }
  const centre = () => ({ x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 });

  function render(st, result) {
    state = st;
    const b = st.layout.board || { w: 1000, h: 600 };
    board = { ...b };
    for (const k of ['plate', 'holes', 'cliprect']) { const r = L(k); r.setAttribute('width', board.w); r.setAttribute('height', board.h); }
    L('beams').innerHTML = result ? beams(result.segments, st.show) : '';
    // keyboard: every part is focusable and named; focusing one selects it, and focus survives the redraw
    const had = svg.contains(document.activeElement) && document.activeElement.closest('.tb-part')?.dataset.id;
    const name = c => c.label || PARTS[c.type]?.label || c.type;
    L('parts').innerHTML = (result ? result.components : []).map(c => `<g class="tb-part${c.id === st.selected ? ' sel' : ''}" data-id="${esc(c.id)}" transform="translate(${c.x} ${c.y}) rotate(${c.rot})"
      tabindex="0" role="button" aria-label="${esc(name(c))} at ${Math.round(c.x)}, ${Math.round(c.y)} mm, ${Math.round(c.rot)}°${c.id === st.selected ? ', selected' : ''}">
      <rect class="tb-hit" x="-12" y="-14" width="24" height="28"/>${draw(c)}<title>${esc(name(c))}</title></g>`).join('');
    if (had) L('parts').querySelector(`[data-id="${CSS.escape(had)}"]`)?.focus({ preventScroll: true });
    comps = result ? result.components : [];
    overlay();
  }
  function overlay() {
    if (!state) return;
    L('labels').innerHTML = state.labels ? placeLabels(comps).map(([c, y, t]) => `<text class="tb-label" x="${c.x}" y="${y}" text-anchor="middle" style="font-size:${7 * k}px;stroke-width:${2.2 * k}px">${esc(t)}</text>`).join('') : '';
    const sel = comps.find(c => c.id === state.selected);
    if (sel) {
      const R = HANDLE * k, a = sel.rot * Math.PI / 180, hx = sel.x + R * Math.cos(a), hy = sel.y + R * Math.sin(a);
      L('ui').innerHTML = `<circle class="tb-selring" cx="${sel.x}" cy="${sel.y}" r="${R * 0.8}"/><line class="tb-handle-line" x1="${sel.x}" y1="${sel.y}" x2="${hx}" y2="${hy}"/>
        <circle class="tb-handle" data-handle="1" cx="${hx}" cy="${hy}" r="${5 * k}"><title>Drag to rotate (or press R / E)</title></circle>`;
    } else L('ui').innerHTML = '';
  }
  // Labels go below a part, or above / further below when they would overlap one already placed.
  function placeLabels(comps) {
    const placed = [];
    return comps.map(c => {
      const t = c.label || PARTS[c.type]?.label || c.type, w = t.length * 3.6 * k;
      for (const dy of [24, -20, 34, -30, 44]) {
        const y = c.y + dy * k;
        if (!placed.some(p => Math.abs(p.x - c.x) < (p.w + w) / 2 + 2 * k && Math.abs(p.y - y) < 8 * k)) { placed.push({ x: c.x, y, w }); return [c, y, t]; }
      }
      return [c, c.y + 24 * k, t];
    });
  }

  svg.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const p = toBoard(e), handle = e.target.closest('[data-handle]'), part = e.target.closest('.tb-part');
    if (handle && state && state.selected) drag = { mode: 'rotate', id: state.selected };
    else if (part) {
      const id = part.dataset.id, c = state.layout.components.find(k => k.id === id);
      cb.select(id);
      drag = { mode: 'move', id, start: p, x0: c.x, y0: c.y, moved: false };
    } else { drag = { mode: 'pan', start: { x: e.clientX, y: e.clientY }, vb0: { ...vb }, moved: false }; }
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    if (drag.mode === 'pan') {
      const m = svg.getScreenCTM(), dx = (e.clientX - drag.start.x) / m.a, dy = (e.clientY - drag.start.y) / m.d;
      if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
      vb = { ...drag.vb0, x: drag.vb0.x - dx, y: drag.vb0.y - dy };
      setVB();
      return;
    }
    const p = toBoard(e);
    if (drag.mode === 'move') {
      drag.moved = true;
      cb.move(drag.id, drag.x0 + p.x - drag.start.x, drag.y0 + p.y - drag.start.y, false);
    } else {
      const c = state.layout.components.find(k => k.id === drag.id);
      drag.moved = true;
      cb.rotate(drag.id, Math.atan2(p.y - c.y, p.x - c.x) * 180 / Math.PI, false, e.shiftKey);
    }
  });
  const end = e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.mode === 'pan' && !d.moved) cb.select(null);
    if (d.mode === 'move' && d.moved) { const c = state.layout.components.find(k => k.id === d.id); cb.move(d.id, c.x, c.y, true); }
    if (d.mode === 'rotate' && d.moved) { const c = state.layout.components.find(k => k.id === d.id); cb.rotate(d.id, c.rot, true, true); }
    try { svg.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };
  L('parts').addEventListener('focusin', e => { const id = e.target.closest('.tb-part')?.dataset.id; if (id && (!state || state.selected !== id)) cb.select(id); });
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(e.deltaY * 0.0015), toBoard(e)); }, { passive: false });
  fit();
  return { render, fit, zoomBy, centre, svg };
}
