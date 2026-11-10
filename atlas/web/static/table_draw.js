// Virtual Optical Table: SVG drawings of each part in its local frame (mm; optical axis +x, transverse +y), and beams.
// draw(c) returns SVG markup for a component already merged with defaults; the caller wraps it in a
// <g transform="translate(x y) rotate(rot)">. Classes are styled in style_table.css.
import { waveColor } from './core.js';
import { objectiveOptics, expanderLenses, prismPoints } from './table_geom.js';

const r = (x, y, w, h, cls, extra = '') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const line = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const txt = (x, y, s, cls = 'tb-sym') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle">${s}</text>`;
const pts = a => a.map(p => p.join(',')).join(' ');

function lensShape(f, h, x = 0, cls = 'tb-lens') {
  if (f >= 0) return `<ellipse class="${cls}" cx="${x}" cy="0" rx="${Math.max(1.5, Math.min(5, 400 / Math.max(f, 1)))}" ry="${h}"/>`;
  const w = 3;
  return `<path class="${cls}" d="M${x - w},${-h} L${x + w},${-h} Q${x + 0.6},0 ${x + w},${h} L${x - w},${h} Q${x - 0.6},0 ${x - w},${-h} Z"/>`;
}
const mount = h => r(-2, -h - 3, 4, 3, 'tb-mount') + r(-2, h, 4, 3, 'tb-mount');

function source(c, w, h, colour) {
  return r(-w, -h, w, h * 2, 'tb-body', 'rx="2"') + r(-3, -h + 2, 3, h * 2 - 4, 'tb-aperture', `style="fill:${colour}"`) +
    `<circle cx="-${w / 2}" cy="0" r="${Math.min(4, h / 2)}" style="fill:${colour}" class="tb-led"/>`;
}

const DRAW = {
  laser: c => source(c, 60, 8, waveColor(c.params.lambda)) + txt(-30, -10, `${c.params.lambda} nm`, 'tb-tag'),
  led: c => source(c, 30, Math.max(6, c.params.diam / 2 + 2), waveColor(c.params.lambda)),
  lamp: () => source(null, 40, 12, '#fff3c4'),
  fibre_out: c => `<path class="tb-fibre" d="M-6,0 C-25,0 -25,-18 -45,-18"/>` + r(-8, -2, 8, 4, 'tb-body') + (c.params.mode === 'coupled' ? txt(-28, -22, 'coupled', 'tb-tag') : ''),
  mirror: c => r(-1.5, -c.params.diam / 2, 4, c.params.diam, 'tb-mirror-back') + line(-1.5, -c.params.diam / 2, -1.5, c.params.diam / 2, 'tb-mirror'),
  pickoff: c => r(-1.5, 0, 4, c.params.diam / 2, 'tb-mirror-back') + line(-1.5, 0, -1.5, c.params.diam / 2, 'tb-mirror'),
  galvo: c => `<g transform="rotate(${c.params.scan})">${r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-mirror-back')}${line(-1, -c.params.diam / 2, -1, c.params.diam / 2, 'tb-mirror')}</g>` +
    `<circle class="tb-body" cx="9" cy="0" r="6"/>` + txt(9, 2.5, 'G', 'tb-sym'),
  dm: c => r(-1.5, -c.params.diam / 2, 6, c.params.diam, 'tb-mirror-back') + line(-1.5, -c.params.diam / 2, -1.5, c.params.diam / 2, 'tb-mirror') +
    Array.from({ length: 5 }, (_, i) => line(1, -c.params.diam / 2 + (i + 0.5) * c.params.diam / 5, 4.5, -c.params.diam / 2 + (i + 0.5) * c.params.diam / 5, 'tb-tick')).join(''),
  slm: c => r(-1.5, -c.params.diam / 2 - 2, 8, c.params.diam + 4, 'tb-body') + r(-1.5, -c.params.diam / 2, 2, c.params.diam, 'tb-slm') + txt(4, c.params.diam / 2 + 9, c.params.pattern, 'tb-tag'),
  dmd: c => r(-1.5, -c.params.diam / 2 - 2, 8, c.params.diam + 4, 'tb-body') +
    Array.from({ length: 6 }, (_, i) => `<g transform="translate(-0.5 ${-c.params.diam / 2 + (i + 0.5) * c.params.diam / 6}) rotate(${c.params.state === 'off' ? -c.params.tilt : c.params.tilt})">${line(0, -1, 0, 1, 'tb-mirror')}</g>`).join(''),
  periscope: () => r(-6, -6, 12, 12, 'tb-body', 'rx="2"') + txt(0, 3, '↕', 'tb-sym'),
  dichroic: c => r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-dichroic', `style="fill:${waveColor(c.params.mode === 'sp' ? c.params.cut + 40 : c.params.cut - 40, 0.55)}"`) + mount(c.params.diam / 2),
  bs: c => r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-bs') + mount(c.params.diam / 2),
  pbs: c => { const d = c.params.diam / 2; return `<polygon class="tb-cube" points="${pts([[0, -d], [d, 0], [0, d], [-d, 0]])}"/>` + line(0, -d, 0, d, 'tb-pbs'); },
  hwp: c => r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-wp') + txt(0, -c.params.diam / 2 - 4, 'λ/2', 'tb-tag'),
  qwp: c => r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-wp') + txt(0, -c.params.diam / 2 - 4, 'λ/4', 'tb-tag'),
  polarizer: c => r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-polarizer') + txt(0, -c.params.diam / 2 - 4, 'P', 'tb-tag'),
  bandpass: c => r(-1.5, -c.params.diam / 2, 3, c.params.diam, 'tb-filter', `style="fill:${waveColor(c.params.center, 0.75)}"`),
  longpass: c => r(-1.5, -c.params.diam / 2, 3, c.params.diam, 'tb-filter', `style="fill:${waveColor(c.params.cut + 50, 0.7)}"`),
  shortpass: c => r(-1.5, -c.params.diam / 2, 3, c.params.diam, 'tb-filter', `style="fill:${waveColor(c.params.cut - 60, 0.7)}"`),
  nd: c => r(-1.5, -c.params.diam / 2, 3, c.params.diam, 'tb-nd', `style="opacity:${0.35 + Math.min(0.6, c.params.od / 6)}"`),
  iris: c => { const o = Math.min(c.params.open, c.params.diam) / 2, d = c.params.diam / 2; return r(-1, -d, 2, d - o, 'tb-blade') + r(-1, o, 2, d - o, 'tb-blade'); },
  pinhole: c => { const o = c.params.size / 2000, d = c.params.diam / 2; return r(-1, -d, 2, d - o, 'tb-blade') + r(-1, o, 2, d - o, 'tb-blade'); },
  slit: c => { const o = Math.min(c.params.width, c.params.diam) / 2, d = c.params.diam / 2; return r(-1, -d, 2, d - o, 'tb-blade') + r(-1, o, 2, d - o, 'tb-blade'); },
  annulus: c => r(-1, -c.params.stop / 2, 2, c.params.stop, 'tb-blade') + r(-1, -c.params.diam / 2 - 5, 2, 5, 'tb-blade') + r(-1, c.params.diam / 2, 2, 5, 'tb-blade'),
  pinhole_array: c => r(-1, -c.params.diam / 2, 2, c.params.diam, 'tb-disk'),
  dump: c => r(0, -c.params.size / 2, 10, c.params.size, 'tb-dump', 'rx="1.5"'),
  lens: c => lensShape(c.params.f, c.params.diam / 2, 0, c.params.chromatic === 'yes' ? 'tb-lens tb-singlet' : 'tb-lens'),
  achromat: c => lensShape(c.params.f, c.params.diam / 2) + line(0.8, -c.params.diam / 2 + 1, 0.8, c.params.diam / 2 - 1, 'tb-cement'),
  cyl: c => r(-2, -c.params.diam / 2, 4, c.params.diam, c.params.axis === 'out' ? 'tb-lens tb-cylout' : 'tb-lens', 'rx="2"'),
  tube: c => lensShape(c.params.f, c.params.diam / 2) + mount(c.params.diam / 2),
  mla: c => { const p = c.params, n = Math.floor(p.diam / p.pitch / 2); let s = r(-1, -p.diam / 2, 2, p.diam, 'tb-disk'); for (let i = -n; i <= n; i++) s += `<ellipse class="tb-lens" cx="0" cy="${i * p.pitch}" rx="1.4" ry="${p.pitch / 2.3}"/>`; return s; },
  expander(c) {
    const L = expanderLenses(c.params), h = c.params.diam / 2;
    return r(L[0].u, -h - 2, L[1].u - L[0].u, 2 * h + 4, 'tb-tube') + L.map(l => lensShape(l.f, h, l.u)).join('');
  },
  objective(c) {
    const O = objectiveOptics(c.params), b = Math.max(O.back, 6) + 3, nose = Math.max(0.6, O.df * 0.85), tip = Math.max(1.2, O.df * 0.35);
    return `<polygon class="tb-obj" points="${pts([[-34, -b], [0, -b], [nose, -tip], [nose, tip], [0, b], [-34, b]])}"/>` +
      r(-30, -b - 1.5, 4, 2 * b + 3, 'tb-objring') + txt(-16, 2.5, `${c.params.mag}×`, 'tb-sym');
  },
  prism: c => `<polygon class="tb-prism" points="${pts(prismPoints(c))}"/>`,
  raprism: c => `<polygon class="tb-prism" points="${pts(prismPoints(c))}"/>`,
  aotf: c => r(-6, -c.params.diam / 2 - 1, 12, c.params.diam + 2, 'tb-crystal') + r(-6, c.params.diam / 2 + 1, 12, 3, 'tb-body') + txt(0, -c.params.diam / 2 - 4, 'AOTF', 'tb-tag'),
  aom: c => r(-5, -c.params.diam / 2 - 1, 10, c.params.diam + 2, 'tb-crystal') + r(-5, c.params.diam / 2 + 1, 10, 3, 'tb-body') + txt(0, -c.params.diam / 2 - 4, 'AOM', 'tb-tag'),
  fibre_in: c => lensShape(c.params.f, 5) + r(c.params.f, -2, 10, 4, 'tb-body') + `<path class="tb-fibre" d="M${c.params.f + 10},0 C${c.params.f + 30},0 ${c.params.f + 30},18 ${c.params.f + 50},18"/>`,
  sample: c => r(-1, -c.params.width / 2, 2, c.params.width, 'tb-sample'),
  scatter: c => r(-1, -c.params.width / 2, 2, c.params.width, 'tb-scatter'),
  tirf: c => r(-2, -c.params.width / 2, 2, c.params.width, 'tb-glass') + r(0, -c.params.width / 2, 3, c.params.width, c.params.dye && c.params.dye !== 'none' ? 'tb-water tb-dyed' : 'tb-water'),
  camera: c => r(0, -c.params.size / 2 - 4, 30, c.params.size + 8, 'tb-body', 'rx="2"') + line(0.5, -c.params.size / 2, 0.5, c.params.size / 2, 'tb-sensor'),
  pmt: c => r(0, -Math.max(6, c.params.size / 2 + 3), 30, 2 * Math.max(6, c.params.size / 2 + 3), 'tb-body', 'rx="5"') + line(0.5, -c.params.size / 2, 0.5, c.params.size / 2, 'tb-sensor'),
  powermeter: c => `<circle class="tb-body" cx="${c.params.size / 2 + 2}" cy="0" r="${c.params.size / 2 + 2}"/>` + line(0.5, -c.params.size / 2, 0.5, c.params.size / 2, 'tb-sensor'),
  eyepiece: c => `<polygon class="tb-body" points="${pts([[0, -c.params.size / 2 - 2], [24, -c.params.size / 2 - 5], [24, c.params.size / 2 + 5], [0, c.params.size / 2 + 2]])}"/>` + line(0.5, -c.params.size / 2, 0.5, c.params.size / 2, 'tb-sensor'),
  profiler: c => r(0, -c.params.size / 2 - 3, 18, c.params.size + 6, 'tb-body') + line(0.5, -c.params.size / 2, 0.5, c.params.size / 2, 'tb-sensor'),
};

export function draw(c) {
  const f = DRAW[c.type];
  return f ? f(c) : r(-5, -5, 10, 10, 'tb-body');
}

// Beam segments -> SVG lines. show = {excitation, emission, scattered}; brightness follows log power.
export function beams(segments, show) {
  const pmax = Math.max(1e-12, ...segments.map(s => s.p));
  let out = '';
  for (const s of segments) {
    if (!show[s.k]) continue;
    const a = Math.max(0.12, Math.min(1, 1 + Math.log10(s.p / pmax) / 4.5));
    out += `<line class="tb-ray ${s.k}" x1="${s.x1.toFixed(3)}" y1="${s.y1.toFixed(3)}" x2="${s.x2.toFixed(3)}" y2="${s.y2.toFixed(3)}" stroke="${waveColor(s.l, a)}"/>`;
  }
  return out;
}
