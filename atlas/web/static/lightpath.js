// Light-path diagram engine: SVG primitives and the renderer. Diagrams themselves live in lightpath_defs.js.
// A diagram is a function returning a list of SVG strings drawn in a 600 x 400 box.
import { DEFS, FAMILY_DEFAULT } from './lightpath_defs.js';

export const C = { ex: '#4f9dff', ex2: '#3dff8f', em: '#3dff8f', red: '#ff3fa4', far: '#ff4d4d', ir: '#d0303a', white: '#e8f1ff', e: '#ffd23f', part: '#8fa3c8' };

let uid = 0;
const tip = t => (t ? `<title>${t}</title>` : '');

export const P = {
  beam(pts, color, w = 4, { dash = true, op = 0.9, tip: t } = {}) {
    const d = pts.map(p => p.join(',')).join(' ');
    return `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-opacity="${op * 0.35}" stroke-linejoin="round"/>` +
      `<polyline class="${dash ? 'flowing' : ''}" points="${d}" fill="none" stroke="${color}" stroke-width="${Math.max(1.4, w / 2.5)}" stroke-opacity="${op}" stroke-linejoin="round">${tip(t)}</polyline>`;
  },
  cone(x1, y1, w1, x2, y2, w2, color, op = 0.22) {
    return `<polygon points="${x1 - w1},${y1} ${x1 + w1},${y1} ${x2 + w2},${y2} ${x2 - w2},${y2}" fill="${color}" opacity="${op}"/>`;
  },
  hcone(x1, y1, h1, x2, y2, h2, color, op = 0.22) {
    return `<polygon points="${x1},${y1 - h1} ${x1},${y1 + h1} ${x2},${y2 + h2} ${x2},${y2 - h2}" fill="${color}" opacity="${op}"/>`;
  },
  lens(x, y, r = 34, label = '', { vertical = false, t } = {}) {
    const e = vertical ? `<ellipse cx="${x}" cy="${y}" rx="7" ry="${r}"/>` : `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="7"/>`;
    return `<g class="lp-lens">${e}${tip(t || label)}</g>` + (label ? P.label(vertical ? x : x + r + 8, vertical ? y - r - 8 : y + 4, label, vertical ? 'middle' : 'start') : '');
  },
  objective(x, y, label = 'Objective', { up = true, w = 46, h = 52, t } = {}) {
    // narrow end points toward the sample
    const top = up ? y - h / 2 : y + h / 2, bot = up ? y + h / 2 : y - h / 2;
    return `<g class="lp-obj"><polygon points="${x - 12},${top} ${x + 12},${top} ${x + w / 2},${bot} ${x - w / 2},${bot}"/>` +
      `<rect x="${x - w / 2 - 2}" y="${up ? bot : bot - 8}" width="${w + 4}" height="8" rx="2"/>${tip(t || 'Objective lens: collects light from the sample; its NA sets resolution and brightness')}</g>` +
      (label ? P.label(x + w / 2 + 10, y + 4, label) : '');
  },
  hobjective(x, y, label = 'Objective', { right = true, w = 46, h = 52, t } = {}) {
    const tip0 = right ? x + h / 2 : x - h / 2, base = right ? x - h / 2 : x + h / 2;
    return `<g class="lp-obj"><polygon points="${tip0},${y - 12} ${tip0},${y + 12} ${base},${y + w / 2} ${base},${y - w / 2}"/>${tip(t || 'Objective lens')}</g>` +
      (label ? P.label(x, y + w / 2 + 16, label, 'middle') : '');
  },
  dichroic(x, y, len = 60, label = 'Dichroic', { flip = false, t } = {}) {
    const d = len / 2 / Math.SQRT2, s = flip ? -1 : 1;
    return `<g class="lp-dich"><line x1="${x - d}" y1="${y + s * d}" x2="${x + d}" y2="${y - s * d}"/>${tip(t || 'Dichroic mirror: reflects excitation wavelengths, transmits the longer emission wavelengths')}</g>` +
      (label ? P.label(x - d - 8, y + d + 14, label, 'end') : '');
  },
  mirror(x, y, len = 44, flip = false, label = '') {
    const d = len / 2 / Math.SQRT2, s = flip ? -1 : 1;
    return `<g class="lp-mirror"><line x1="${x - d}" y1="${y + s * d}" x2="${x + d}" y2="${y - s * d}"/>${tip(label || 'Mirror')}</g>` + (label ? P.label(x + d + 6, y - d, label) : '');
  },
  filter(x, y, w = 50, color = C.em, label = '', { vertical = false, t } = {}) {
    const r = vertical ? `<rect x="${x - 4}" y="${y - w / 2}" width="8" height="${w}"/>` : `<rect x="${x - w / 2}" y="${y - 4}" width="${w}" height="8"/>`;
    return `<g class="lp-filter" style="--fc:${color}">${r}${tip(t || label || 'Filter')}</g>` + (label ? P.label(vertical ? x : x + w / 2 + 8, vertical ? y - w / 2 - 8 : y + 4, label, vertical ? 'middle' : 'start') : '');
  },
  source(x, y, color, label, { w = 70, h = 34, kind = 'laser', t } = {}) {
    const g = `lg${++uid}`;
    return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
      `<g class="lp-src"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="5"/>` +
      `<circle cx="${x}" cy="${y}" r="${kind === 'lamp' ? 13 : 8}" fill="url(#${g})"/>${tip(t || label)}</g>` +
      P.label(x, y + h / 2 + 15, label, 'middle');
  },
  detector(x, y, label = 'Camera', { w = 70, h = 34, kind = 'camera', t } = {}) {
    const inner = kind === 'camera'
      ? `<rect x="${x - 16}" y="${y - 7}" width="32" height="14" fill="#1b2a4a" stroke="${C.em}" stroke-width="1"/>`
      : kind === 'array' ? Array.from({ length: 7 }, (_, i) => `<circle cx="${x - 18 + i * 6}" cy="${y}" r="2.5" fill="${C.em}"/>`).join('')
        : `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${C.em}" stroke-width="2"/>`;
    return `<g class="lp-det"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="5"/>${inner}${tip(t || label)}</g>` + P.label(x + w / 2 + 8, y + 4, label);
  },
  pinhole(x, y, gap = 6, w = 70, label = 'Pinhole', vertical = false) {
    const a = vertical
      ? `<rect x="${x - 3}" y="${y - w / 2}" width="6" height="${w / 2 - gap / 2}"/><rect x="${x - 3}" y="${y + gap / 2}" width="6" height="${w / 2 - gap / 2}"/>`
      : `<rect x="${x - w / 2}" y="${y - 3}" width="${w / 2 - gap / 2}" height="6"/><rect x="${x + gap / 2}" y="${y - 3}" width="${w / 2 - gap / 2}" height="6"/>`;
    return `<g class="lp-pin">${a}<title>Pinhole in a conjugate image plane: blocks out-of-focus light</title></g>` + (label ? P.label(x + w / 2 + 8, y + 4, label) : '');
  },
  sample(x, y, w = 150, label = 'Sample', { cover = true, t } = {}) {
    let s = `<g class="lp-sample"><rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="18" rx="2"/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${x - w / 2 + 18 + i * (w - 36) / 4}" cy="${y - 1}" rx="9" ry="5" class="cell"/>`;
    if (cover) s += `<line x1="${x - w / 2}" y1="${y + 9}" x2="${x + w / 2}" y2="${y + 9}" class="cover"/>`;
    return s + tip(t || 'Sample on a coverslip') + '</g>' + (label ? P.label(x - w / 2 - 8, y + 4, label, 'end') : '');
  },
  box(x, y, w, h, label, t = '', cls = 'lp-box') {
    return `<g class="${cls}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="5"/>${tip(t || label)}</g>` + P.label(x, y + 4, label, 'middle', 'inbox');
  },
  coil(x, y, w = 90, label = '', t = 'Electromagnetic lens: a coil whose field focuses the electron beam') {
    return `<g class="lp-coil"><rect x="${x - w / 2}" y="${y - 9}" width="22" height="18" rx="4"/><rect x="${x + w / 2 - 22}" y="${y - 9}" width="22" height="18" rx="4"/>${tip(t)}</g>` + (label ? P.label(x + w / 2 + 8, y + 4, label) : '');
  },
  label(x, y, text, anchor = 'start', cls = '') { return `<text class="lp-label ${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`; },
  note(x, y, text, color = C.white) { return `<text class="lp-note" x="${x}" y="${y}" fill="${color}">${text}</text>`; },
  glow(x, y, r, color, op = 0.8) {
    const g = `gg${++uid}`;
    return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/>`;
  },
  inset(x, y, r, inner, label) {
    return `<g class="lp-inset"><circle cx="${x}" cy="${y}" r="${r}"/>${inner}</g>` + (label ? P.label(x, y + r + 15, label, 'middle') : '');
  },
};

export function hasDiagram(id) { return Boolean(DEFS[id]); }

export function lightPath(id, { family } = {}) {
  const def = DEFS[id] || DEFS[FAMILY_DEFAULT[family]];
  if (!def) return '';
  const body = def(P, C).join('');
  const caption = DEFS[id] ? '' : '<text class="lp-label" x="300" y="394" text-anchor="middle">(closest family diagram)</text>';
  return `<svg class="lightpath" viewBox="0 0 600 400" role="img" aria-label="Light path diagram for ${id}">${body}${caption}</svg>`;
}

export function miniPath(id) {
  const def = DEFS[id];
  return def ? `<svg class="lightpath mini" viewBox="0 0 600 400" aria-hidden="true">${def(P, C).join('')}</svg>` : '';
}
