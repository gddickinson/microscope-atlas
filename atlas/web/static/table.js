// Virtual Optical Table page: #/table, #/table/<presetId>, #/table?l=<shared layout>. Runs entirely in the browser.
// State = { layout: {board, components}, selected, show, labels, snap }. Every change re-traces (table_engine.js) and
// redraws the board (table_view.js) and panels (table_panels.js). Undo/redo keep JSON snapshots; layouts persist in
// localStorage (guarded), export/import as JSON, and share as a compressed hash.
import { route, api, app, esc, onLeave } from './core.js';
import { trace } from './table_engine.js';
import { analyze } from './table_analysis.js';
import { PRESETS, presetById } from './table_presets.js';
import { createBoard } from './table_view.js';
import { renderPalette, renderProps, renderReadouts, renderPresets, presetInfo } from './table_panels.js';
import { encodeLayout, decodeLayout, cleanLayout, store } from './table_store.js';
import { createViewer } from './table_viewer.js';

const DEFAULT = 'widefield';
const clone = o => JSON.parse(JSON.stringify(o));

route('table', async ([presetId], query) => {
  const root = app();
  root.classList.add('tb-wide');
  root.innerHTML = `<p class="kicker">Lab</p><h1>Virtual optical table</h1>
    <p class="lead">Prototype microscopes and laser set-ups on a virtual breadboard: drop in parts, drag and rotate them, and watch rays trace live. Start from a preset or a published set-up.</p>
    <div class="tb-toolbar">
      <button class="alt" data-act="presets" aria-expanded="false">Presets ▾</button><button class="alt" data-act="new">Clear</button>
      <button class="alt" data-act="undo" title="Ctrl+Z">Undo</button><button class="alt" data-act="redo" title="Ctrl+Shift+Z">Redo</button>
      <button class="alt" data-act="fit">Fit</button><button class="alt" data-act="zin" aria-label="Zoom in">+</button><button class="alt" data-act="zout" aria-label="Zoom out">−</button><button class="alt" data-act="view" title="Simulated camera image of a specimen">View image</button>
      <label class="tb-inline">Snap <select data-set="snap"><option value="0">off</option><option value="1" selected>1 mm</option><option value="12.5">12.5 mm</option><option value="25">25 mm (holes)</option></select></label>
      <label class="tb-inline"><input type="checkbox" data-show="emission" checked> emission</label>
      <label class="tb-inline"><input type="checkbox" data-show="scattered" checked> scattered</label>
      <label class="tb-inline"><input type="checkbox" data-set="labels" checked> labels</label>
    </div>
    <div class="tb-presetpanel panel" hidden></div>
    <div class="tb-info"></div>
    <div class="tb-main">
      <aside class="tb-palette panel" aria-label="Parts"></aside>
      <div class="tb-center"><div class="tb-board"></div>
        <div class="tb-legend small mute"><span><i class="ex"></i>excitation / illumination</span><span><i class="em"></i>emission</span><span><i class="sc"></i>scattered</span><span>colour = wavelength, brightness = power (log scale) · wheel to zoom, drag the board to pan</span></div>
        <div class="tb-viewer panel" hidden></div>
        <div class="tb-files panel"><b>Save and share</b>
          <div class="tb-filerow"><input class="tb-name" placeholder="Name this layout" aria-label="Layout name"><button data-act="save">Save</button><select class="tb-saved" aria-label="Saved layouts"></select><button class="alt" data-act="load">Load</button><button class="alt" data-act="forget">Delete</button></div>
          <div class="tb-filerow"><button class="alt" data-act="export">Export JSON</button><button class="alt" data-act="import">Import JSON</button><input type="file" accept=".json,application/json" class="tb-file" hidden><button class="alt" data-act="share">Share link</button></div>
          <input class="tb-shareurl" readonly hidden aria-label="Shareable link"><div class="tb-status small" aria-live="polite"></div></div>
      </div>
      <aside class="tb-side"><div class="tb-props panel"></div><div class="tb-readouts panel"></div></aside>
    </div>`;
  const $ = s => root.querySelector(s);
  const status = (msg, bad = false) => { const el = $('.tb-status'); el.textContent = msg; el.className = 'tb-status small ' + (bad ? 'err' : 'ok'); };

  // reference data (each optional: the table still works offline with approximate dye peaks)
  const [obj, det, spec, comm, techs] = await Promise.allSettled(['/components/objectives', '/components/detectors', '/spectra', '/content/community', '/techniques'].map(p => api(p)));
  const val = r => (r.status === 'fulfilled' ? r.value : null);
  const spectra = val(spec) || {};
  const suppliers = {};
  for (const g of val(comm) || []) for (const l of g.links || []) suppliers[l.name] = l.url;
  const data = { objectives: val(obj) || [], detectors: val(det) || [], dyes: Object.keys(spectra).sort((a, b) => a.localeCompare(b)), suppliers,
    techNames: Object.fromEntries((val(techs) || []).map(t => [t.id, t.name])) };

  const S = { layout: null, selected: null, show: { excitation: true, emission: true, scattered: true }, labels: true, snap: 1, preset: null };
  let result = null, past = [], future = [], pending = null, raf = 0;

  const board = createBoard($('.tb-board'), {
    select: id => { S.selected = id; refresh(true); },
    move: (id, x, y, done) => edit(L => { const c = find(L, id); c.x = snap(x); c.y = snap(y); }, done, false),
    rotate: (id, deg, done, free) => edit(L => { find(L, id).rot = norm(free || !S.snap ? Math.round(deg * 10) / 10 : Math.round(deg / 5) * 5); }, done, false),
  });
  const viewer = createViewer($('.tb-viewer'), {
    setSampleParam: (id, upd) => edit(L => { const c = find(L, id); if (c) c.params = { ...c.params, ...upd }; }, true, true),
  });
  const find = (L, id) => L.components.find(c => c.id === id);
  const snap = v => (S.snap ? Math.round(v / S.snap) * S.snap : Math.round(v * 100) / 100);
  const norm = d => { let x = ((d + 180) % 360 + 360) % 360 - 180; return Math.round(x * 100) / 100; };

  // --- state changes -----------------------------------------------------------------------------
  function edit(fn, done = true, rerenderProps = true) {
    if (pending === null) pending = JSON.stringify(S.layout);
    fn(S.layout);
    if (done) {
      if (JSON.stringify(S.layout) !== pending) { past.push(pending); if (past.length > 150) past.shift(); future = []; }
      pending = null;
      store.saveCurrent(S.layout);
    }
    refresh(rerenderProps);
  }
  function setLayout(L, presetId = null, record = true) {
    if (record && S.layout) { past.push(JSON.stringify(S.layout)); future = []; }
    S.layout = cleanLayout(L);
    S.preset = presetId;
    S.selected = null;
    viewer.reset();
    $('.tb-info').innerHTML = presetId ? `<div class="panel">${presetInfo(presetById(presetId), data.techNames)}</div>` : '';
    store.saveCurrent(S.layout);
    board.render(S, null);
    board.fit();
    requestAnimationFrame(() => board.fit());
    refresh(true);
  }
  function refresh(props = true) {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      result = trace(S.layout, { spectra });
      board.render(S, result);
      const sel = S.selected && result.components.find(c => c.id === S.selected);
      if (props) renderProps($('.tb-props'), sel, data, handlers);
      else if (sel) for (const k of ['x', 'y', 'rot']) { const i = $('#tbp-' + k); if (i && document.activeElement !== i) i.value = +sel[k].toFixed(3); }
      renderReadouts($('.tb-readouts'), analyze(result), result, S.selected);
      viewer.update(result);
    });
  }
  const handlers = {
    setPos: (k, v, done) => edit(L => { const c = find(L, S.selected); if (k === 'label') c.label = v || undefined; else if (Number.isFinite(v)) c[k] = k === 'rot' ? norm(v) : v; }, done, false),
    setParams: (upd, done, rerender = false) => edit(L => { const c = find(L, S.selected); c.params = { ...c.params, ...upd }; }, done, rerender),
    action: a => act(a),
  };
  function addPart(type) {
    const c = board.centre(), id = uid(type);
    edit(L => L.components.push({ id, type, x: snap(c.x), y: snap(c.y), rot: 0, params: {} }));
    S.selected = id;
    refresh(true);
  }
  function uid(type) {
    const used = new Set(S.layout.components.map(c => c.id));
    let i = 1;
    while (used.has(type + i)) i++;
    return type + i;
  }
  function undo(dir) {
    const [from, to] = dir < 0 ? [past, future] : [future, past];
    if (!from.length) return status(dir < 0 ? 'Nothing to undo.' : 'Nothing to redo.');
    to.push(JSON.stringify(S.layout));
    S.layout = JSON.parse(from.pop());
    if (S.selected && !find(S.layout, S.selected)) S.selected = null;
    store.saveCurrent(S.layout);
    refresh(true);
  }

  async function act(a) {
    const sel = S.selected && find(S.layout, S.selected);
    switch (a) {
      case 'presets': { const p = $('.tb-presetpanel'); p.hidden = !p.hidden; root.querySelector('[data-act=presets]').setAttribute('aria-expanded', String(!p.hidden)); break; }
      case 'new': setLayout({ board: S.layout.board, components: [] }); history.replaceState(null, '', '#/table'); status('Table cleared (Undo brings it back).'); break;
      case 'undo': undo(-1); break;
      case 'redo': undo(1); break;
      case 'fit': board.fit(); break;
      case 'zin': board.zoomBy(0.7); break;
      case 'zout': board.zoomBy(1.4); break;
      case 'view': viewer.open(sel && (sel.type === 'camera' || sel.type === 'pmt') ? sel.id : null); break;
      case 'rotp': case 'rotm': if (sel) edit(L => { const c = find(L, sel.id); c.rot = norm(c.rot + (a === 'rotp' ? 15 : -15)); }); break;
      case 'dup': if (sel) { const id = uid(sel.type); edit(L => L.components.push({ ...clone(sel), id, x: sel.x + 25, y: sel.y + 25 })); S.selected = id; refresh(true); } break;
      case 'del': if (sel) { S.selected = null; edit(L => { L.components = L.components.filter(c => c.id !== sel.id); }); } break;
      case 'save': { const name = $('.tb-name').value.trim() || (S.preset ? presetById(S.preset).title : 'My layout'); status(store.save(name, S.layout) ? `Saved “${name}” in this browser.` : 'Could not save: browser storage is unavailable.', !store.ok()); fillSaved(); break; }
      case 'load': { const n = $('.tb-saved').value, L = n && store.get(n); if (L) { setLayout(L); status(`Loaded “${n}”.`); } else status('Choose a saved layout first.', true); break; }
      case 'forget': { const n = $('.tb-saved').value; if (n) { store.remove(n); fillSaved(); status(`Deleted “${n}”.`); } break; }
      case 'export': {
        const blob = new Blob([JSON.stringify({ format: 'microscope-atlas-optical-table', version: 1, ...S.layout }, null, 1)], { type: 'application/json' });
        const a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob); a2.download = (S.preset || 'optical-table') + '.json'; a2.click();
        setTimeout(() => URL.revokeObjectURL(a2.href), 2000); status('Exported as JSON.'); break;
      }
      case 'import': $('.tb-file').click(); break;
      case 'share': {
        const code = await encodeLayout(S.layout), url = location.href.split('#')[0] + '#/table?l=' + code;
        const box = $('.tb-shareurl'); box.hidden = false; box.value = url; box.select();
        try { await navigator.clipboard.writeText(url); status('Link copied to the clipboard.'); } catch { status('Copy the link above.'); }
        break;
      }
    }
  }
  function fillSaved() {
    const names = store.names();
    $('.tb-saved').innerHTML = names.length ? names.map(n => `<option>${esc(n)}</option>`).join('') : '<option value="">(none saved)</option>';
  }

  // --- wiring --------------------------------------------------------------------------------------
  root.querySelector('.tb-toolbar').addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a) act(a.dataset.act); });
  $('.tb-readouts').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) viewer.open(b.dataset.view); });
  root.querySelector('.tb-files').addEventListener('click', e => { const a = e.target.closest('button[data-act]'); if (a) act(a.dataset.act); });
  root.querySelector('.tb-toolbar').addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.show) S.show[t.dataset.show] = t.checked;
    if (t.dataset.set === 'labels') S.labels = t.checked;
    if (t.dataset.set === 'snap') S.snap = +t.value;
    refresh(false);
  });
  $('.tb-file').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { setLayout(JSON.parse(await f.text())); status(`Imported ${f.name}.`); } catch (err) { status('Not a valid layout file: ' + err.message, true); }
    e.target.value = '';
  });
  renderPalette($('.tb-palette'), addPart);
  renderPresets($('.tb-presetpanel'), PRESETS, presetId, id => {
    const p = presetById(id);
    setLayout({ board: p.board, components: p.components }, id);
    history.replaceState(null, '', '#/table/' + id);
    $('.tb-presetpanel').hidden = true;
    status(`Loaded preset: ${p.title}.`);
  });
  $('.tb-presetpanel').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) root.querySelectorAll('.tb-preset').forEach(x => x.classList.toggle('on', x === b)); });
  const onKey = e => {
    if (e.target.closest('input, select, textarea') || !S.layout) return;
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); undo(e.shiftKey ? 1 : -1); return; }
    if (mod && k === 'y') { e.preventDefault(); undo(1); return; }
    const sel = S.selected && find(S.layout, S.selected);
    if (!sel) return;
    if (mod && k === 'd') { e.preventDefault(); act('dup'); return; }
    if (mod) return;
    const step = e.shiftKey ? 10 : 1;
    const moves = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] };
    if (k === 'r' || k === 'e') { e.preventDefault(); edit(L => { const c = find(L, sel.id); c.rot = norm(c.rot + (k === 'r' ? 1 : -1) * (e.shiftKey ? 1 : 15)); }); }
    else if (k === 'delete' || k === 'backspace') { e.preventDefault(); act('del'); }
    else if (k === 'escape') { S.selected = null; refresh(true); }
    else if (moves[k]) { e.preventDefault(); edit(L => { const c = find(L, sel.id); c.x += moves[k][0]; c.y += moves[k][1]; }); }
  };
  document.addEventListener('keydown', onKey);
  onLeave(() => { document.removeEventListener('keydown', onKey); root.classList.remove('tb-wide'); cancelAnimationFrame(raf); viewer.destroy(); });
  fillSaved();

  // --- initial layout ------------------------------------------------------------------------------
  let initial = null, initialPreset = null;
  if (query.l) {
    try { initial = await decodeLayout(query.l); status('Loaded a shared layout.'); } catch { status('The shared link could not be read; showing the default preset.', true); }
  }
  if (!initial && presetId) {
    const p = presetById(presetId);
    if (p) { initial = { board: p.board, components: p.components }; initialPreset = presetId; } else status(`No preset called “${presetId}”.`, true);
  }
  if (!initial && !presetId) initial = store.current();
  if (!initial) { const p = presetById(DEFAULT); initial = { board: p.board, components: p.components }; initialPreset = DEFAULT; }
  if (!Object.keys(spectra).length) status('Dye spectra unavailable: using approximate excitation/emission peaks.', true);
  setLayout(initial, initialPreset, false);
});

