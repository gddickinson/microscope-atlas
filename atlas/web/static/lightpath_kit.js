// Shared building blocks for the light-path diagrams (lightpath_defs.js, lightpath_defs2.js).
// Inverted epi layout: sample at the top, objective below, dichroic, then the detector at the bottom.

export const X = 300;            // optical axis
export const Y = { sample: 48, obj: 112, mid: 185, dich: 255, filt: 300, tube: 330, det: 370 };

export function epi(P, C, { src = 'Laser 488 nm', ex = C.ex, em = C.em, kind = 'laser', det = 'Camera', detKind = 'camera', extra = [], beamIn = null, skipObjBeam = false } = {}) {
  const out = [];
  // excitation: source -> dichroic -> up to objective
  out.push(P.beam(beamIn || [[505, Y.dich], [X, Y.dich], [X, Y.obj + 30]], ex, 5, { tip: 'Excitation light' }));
  if (!skipObjBeam) out.push(P.cone(X, Y.obj - 24, 10, X, Y.sample + 8, 40, ex, 0.18));
  // emission back down
  out.push(P.beam([[X + 7, Y.obj + 30], [X + 7, Y.det - 18]], em, 4, { tip: 'Emitted fluorescence' }));
  out.push(P.sample(X, Y.sample), P.objective(X, Y.obj));
  out.push(P.dichroic(X, Y.dich), P.source(540, Y.dich, ex, src, { kind }));
  out.push(P.filter(X, Y.filt, 50, em, 'Emission filter'), P.lens(X, Y.tube, 34, 'Tube lens'));
  out.push(P.detector(X, Y.det, det, { kind: detKind }));
  return out.concat(extra);
}

export function transmitted(P, C, { cond = [], obj = [], note = '', light = C.white, label = 'Camera / eyepiece' } = {}) {
  // upright transmitted: lamp at the bottom, image at the top
  const out = [];
  out.push(P.beam([[X, 362], [X, 40]], light, 6, { tip: 'Transmitted light' }));
  out.push(P.cone(X, 250, 40, X, 200, 6, light, 0.12), P.cone(X, 200, 6, X, 150, 40, light, 0.12));
  out.push(P.source(X, 372, light, 'Lamp (Köhler illumination)', { kind: 'lamp', w: 80 }));
  out.push(P.lens(X, 318, 40, 'Field diaphragm and collector'));
  out.push(...cond);
  out.push(P.lens(X, 250, 42, 'Condenser'));
  out.push(P.sample(X, 200, 160, 'Specimen', { cover: true }));
  out.push(P.objective(X, 150, 'Objective', { up: false }));
  out.push(...obj);
  out.push(P.detector(X, 34, label, { kind: 'camera' }));
  if (note) out.push(P.note(20, 392, note, C.part));
  return out;
}

export function scanner(P, x, y) {
  return P.box(x, y, 92, 28, 'XY scanner', 'Galvanometer (or resonant) mirrors scan the focused spot across the sample');
}

export function psfInset(P, C, x, y, kind) {
  const r = 34;
  let inner = '';
  if (kind === 'donut') inner = `<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${C.far}" stroke-width="12" opacity=".7"/>` + P.glow(x, y, 7, C.em, 1);
  if (kind === 'spot') inner = P.glow(x, y, 22, C.em, 0.9);
  if (kind === 'stripes') for (let i = -3; i <= 3; i++) inner += `<rect x="${x + i * 9 - 2}" y="${y - 28}" width="4.5" height="56" fill="${C.ex}" opacity=".7"/>`;
  if (kind === 'blink') [[-12, -8], [10, 6], [-4, 14], [14, -14]].forEach(([a, b], i) => { inner += P.glow(x + a, y + b, 6 + (i % 2) * 3, i % 2 ? C.red : C.em, 0.95); });
  return P.inset(x, y, r, inner, { donut: 'Excitation + STED doughnut', spot: 'Focused spot', stripes: 'Patterned illumination', blink: 'Sparse blinking' }[kind]);
}
