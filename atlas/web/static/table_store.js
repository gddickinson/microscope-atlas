// Virtual Optical Table: layout validation, browser storage (always guarded) and shareable links.
// A shared link carries the layout in the hash: 'z' + base64url(deflate-raw(JSON)) when the browser has CompressionStream,
// else 'j' + base64url(JSON). Only parameters that differ from the part defaults are stored.
import { PARTS } from './table_parts.js';

const MAX = 300;
const fin = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

// Validate and normalise any layout-like object (from presets, files, links or storage). Throws on garbage.
export function cleanLayout(L) {
  if (!L || !Array.isArray(L.components)) throw new Error('no components list');
  const seen = new Set();
  const comps = L.components.slice(0, MAX).filter(c => c && PARTS[c.type]).map((c, i) => {
    let id = String(c.id || c.type + (i + 1)).replace(/[^\w-]/g, '').slice(0, 40) || 'part' + i;
    while (seen.has(id)) id += 'b';
    seen.add(id);
    const params = {};
    for (const [k, v] of Object.entries(c.params || {})) if (k in PARTS[c.type].params) params[k] = typeof v === 'number' || typeof v === 'string' ? v : String(v);
    const out = { id, type: c.type, x: fin(c.x), y: fin(c.y), rot: fin(c.rot), params };
    if (c.label) out.label = String(c.label).slice(0, 60);
    return out;
  });
  const b = L.board && fin(L.board.w) > 100 && fin(L.board.h) > 100 ? { w: Math.min(5000, fin(L.board.w)), h: Math.min(5000, fin(L.board.h)) } : { w: 1000, h: 600 };
  return { board: b, components: comps };
}

const b64u = bytes => { let s = ''; for (const x of bytes) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0));
const r3 = v => Math.round(v * 1000) / 1000;

function compact(L) {
  return { b: [L.board.w, L.board.h], c: L.components.map(c => {
    const def = PARTS[c.type].params, d = {};
    for (const [k, v] of Object.entries(c.params)) if (def[k] !== v) d[k] = v;
    return [c.type, r3(c.x), r3(c.y), r3(c.rot), d, c.label || 0];
  }) };
}
function expand(o) {
  return { board: { w: o.b[0], h: o.b[1] }, components: o.c.map(([type, x, y, rot, params, label], i) => ({ id: type + (i + 1), type, x, y, rot, params, ...(label ? { label } : {}) })) };
}

export async function encodeLayout(L) {
  const json = JSON.stringify(compact(L));
  if (typeof CompressionStream !== 'undefined') {
    const s = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'z' + b64u(new Uint8Array(await new Response(s).arrayBuffer()));
  }
  return 'j' + b64u(new TextEncoder().encode(json));
}

export async function decodeLayout(code) {
  const bytes = unb64u(code.slice(1));
  let json;
  if (code[0] === 'z') {
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    json = await new Response(s).text();
  } else json = new TextDecoder().decode(bytes);
  return cleanLayout(expand(JSON.parse(json)));
}

// localStorage wrapper: every access in try/catch, so private windows and blocked storage just disable saving.
const KEY_CUR = 'atlas-table-current', KEY_SAVED = 'atlas-table-saved';
const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
export const store = {
  ok: () => write('atlas-table-probe', 1),
  current: () => { const L = read(KEY_CUR); try { return L ? cleanLayout(L) : null; } catch { return null; } },
  saveCurrent: L => write(KEY_CUR, L),
  names: () => Object.keys(read(KEY_SAVED) || {}).sort(),
  get: n => { const L = (read(KEY_SAVED) || {})[n]; try { return L ? cleanLayout(L) : null; } catch { return null; } },
  save: (n, L) => { const all = read(KEY_SAVED) || {}; all[n] = L; return write(KEY_SAVED, all); },
  remove: n => { const all = read(KEY_SAVED) || {}; delete all[n]; return write(KEY_SAVED, all); },
};
