// Light-path diagrams for each technique (600 x 400 boxes). Each returns a list of SVG strings.
// Inverted epi layout: sample at the top, objective below, dichroic, then the detector at the bottom.

const X = 300;            // optical axis
const Y = { sample: 48, obj: 112, mid: 185, dich: 255, filt: 300, tube: 330, det: 370 };

function epi(P, C, { src = 'Laser 488 nm', ex = C.ex, em = C.em, kind = 'laser', det = 'Camera', detKind = 'camera', extra = [], beamIn = null, skipObjBeam = false } = {}) {
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

function transmitted(P, C, { cond = [], obj = [], note = '', light = C.white, label = 'Camera / eyepiece' } = {}) {
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

function scanner(P, x, y) {
  return P.box(x, y, 92, 28, 'XY scanner', 'Galvanometer (or resonant) mirrors scan the focused spot across the sample');
}

function psfInset(P, C, x, y, kind) {
  const r = 34;
  let inner = '';
  if (kind === 'donut') inner = `<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${C.far}" stroke-width="12" opacity=".7"/>` + P.glow(x, y, 7, C.em, 1);
  if (kind === 'spot') inner = P.glow(x, y, 22, C.em, 0.9);
  if (kind === 'stripes') for (let i = -3; i <= 3; i++) inner += `<rect x="${x + i * 9 - 2}" y="${y - 28}" width="4.5" height="56" fill="${C.ex}" opacity=".7"/>`;
  if (kind === 'blink') [[-12, -8], [10, 6], [-4, 14], [14, -14]].forEach(([a, b], i) => { inner += P.glow(x + a, y + b, 6 + (i % 2) * 3, i % 2 ? C.red : C.em, 0.95); });
  return P.inset(x, y, r, inner, { donut: 'Excitation + STED doughnut', spot: 'Focused spot', stripes: 'Patterned illumination', blink: 'Sparse blinking' }[kind]);
}

export const DEFS = {
  brightfield: (P, C) => transmitted(P, C, { note: 'Contrast comes from absorption and scattering by the specimen.' }),
  darkfield: (P, C) => transmitted(P, C, {
    cond: [P.box(X, 285, 120, 18, 'Annular stop', 'Opaque central stop: only a hollow cone of light reaches the condenser')],
    note: 'The hollow cone misses the objective; only light scattered by the specimen is collected.',
  }),
  'phase-contrast': (P, C) => transmitted(P, C, {
    cond: [P.box(X, 285, 120, 18, 'Condenser annulus', 'Annulus defines a hollow cone of illumination')],
    obj: [P.box(X, 112, 110, 16, 'Phase plate (ring)', 'Phase ring in the objective back focal plane shifts and dims the direct light by a quarter wave')],
    note: 'Undiffracted light passes the phase ring; interference turns phase delays into intensity.',
  }),
  dic: (P, C) => transmitted(P, C, {
    cond: [P.filter(X, 292, 90, '#ffd23f', 'Polarizer'), P.box(X, 272, 90, 14, 'Wollaston prism', 'Splits the beam into two orthogonally polarized beams sheared by less than the resolution limit')],
    obj: [P.box(X, 108, 90, 14, 'Nomarski prism', 'Recombines the two beams'), P.filter(X, 86, 90, '#ffd23f', 'Analyzer')],
    note: 'Two sheared beams interfere: contrast follows the gradient of optical path length.',
  }),
  polarization: (P, C) => transmitted(P, C, {
    cond: [P.filter(X, 285, 90, '#ffd23f', 'Polarizer')],
    obj: [P.box(X, 108, 90, 14, 'Compensator', 'Optional retarder for measuring birefringence'), P.filter(X, 86, 90, '#ffd23f', 'Analyzer (crossed)')],
    note: 'Between crossed polarizers only birefringent structures appear bright.',
  }),
  stereo: (P, C) => [
    P.beam([[260, 40], [290, 250]], C.white, 5), P.beam([[340, 40], [310, 250]], C.white, 5),
    P.objective(300, 190, 'Common main objective (CMO)', { up: false, w: 140, h: 40 }),
    P.detector(260, 34, 'Left eye', { w: 54 }), P.detector(340, 34, '', { w: 54 }), P.label(372, 38, 'Right eye'),
    P.lens(260, 110, 18), P.lens(340, 110, 18), P.label(360, 114, 'Zoom optics'),
    P.sample(300, 270, 200, 'Specimen', { cover: false }),
    P.source(470, 300, C.white, 'Ring or gooseneck light', { kind: 'lamp' }),
    P.note(20, 392, 'Two channels at slightly different angles give depth perception.', C.part),
  ],
  widefield: (P, C) => epi(P, C, { src: 'LED / arc lamp', kind: 'lamp', extra: [P.filter(470, Y.dich, 40, C.ex, '', { vertical: true }), P.label(470, Y.dich - 26, 'Excitation filter', 'middle')] }),
  tirf: (P, C) => epi(P, C, {
    src: 'Laser 488 nm', skipObjBeam: true,
    beamIn: [[505, Y.dich], [X + 18, Y.dich], [X + 18, Y.obj + 26], [X - 30, Y.sample + 9]],
    extra: [P.lens(430, Y.dich, 24, '', { vertical: true }), P.label(430, Y.dich - 34, 'Lens focuses laser at BFP edge', 'middle'),
      P.beam([[X - 30, Y.sample + 9], [X - 90, Y.obj + 24]], C.ex, 3, { op: 0.5, tip: 'Totally internally reflected beam' }),
      `<rect x="${X - 75}" y="${Y.sample + 1}" width="150" height="8" fill="${C.em}" opacity=".55"><title>Evanescent field: about 100 nm deep</title></rect>`,
      P.note(380, 30, 'Evanescent field ~100 nm', C.em)],
  }),
  hilo: (P, C) => epi(P, C, {
    src: 'Laser 561 nm', ex: C.red, em: '#ff8a3d', skipObjBeam: true,
    beamIn: [[505, Y.dich], [X + 14, Y.dich], [X + 14, Y.obj + 26], [X - 10, Y.sample + 8], [X - 60, Y.sample - 20]],
    extra: [P.note(360, 30, 'Highly inclined thin beam', C.red)],
  }),
  confocal: (P, C) => epi(P, C, {
    det: 'PMT / HyD', detKind: 'pmt',
    extra: [scanner(P, 160, Y.mid), P.beam([[X, Y.mid], [206, Y.mid]], C.part, 2, { dash: false, op: 0.4 }),
      P.pinhole(X + 7, Y.filt + 32, 6, 70, 'Pinhole (≈1 AU)'), psfInset(P, C, 500, 90, 'spot')],
  }).filter(s => !s.includes('Tube lens')),
  'spinning-disk': (P, C) => epi(P, C, {
    extra: [P.box(X, Y.mid, 190, 22, 'Nipkow disk with microlenses', 'Thousands of pinholes scan the sample in parallel; microlenses focus light through them'),
      P.note(420, 140, 'Many spots at once → camera speed', C.part)],
  }),
  ism: (P, C) => epi(P, C, {
    det: 'Detector array (32 el.)', detKind: 'array',
    extra: [scanner(P, 160, Y.mid), P.note(330, 60, 'Each element sees a shifted PSF; pixel reassignment gives ~1.7× resolution', C.part)],
  }).filter(s => !s.includes('Tube lens')),
  multiphoton: (P, C) => [
    P.beam([[505, Y.dich], [X, Y.dich], [X, Y.obj + 30]], C.ir, 6, { tip: 'Femtosecond near-infrared pulses (e.g. 920 nm)' }),
    P.cone(X, Y.obj - 24, 10, X, Y.sample + 2, 2, C.ir, 0.25), P.glow(X, Y.sample + 2, 10, C.em, 1),
    P.sample(X, Y.sample, 150, 'Thick tissue'), P.objective(X, Y.obj),
    P.source(540, Y.dich, C.ir, 'Ti:sapphire fs laser'), scanner(P, 420, Y.mid),
    P.dichroic(X - 70, Y.obj + 40, 50, ''), P.beam([[X - 4, Y.obj + 36], [X - 70, Y.obj + 40], [X - 150, Y.obj + 40]], C.em, 3),
    P.detector(X - 190, Y.obj + 40, '', { kind: 'pmt', w: 60 }), P.label(X - 190, Y.obj + 80, 'Non-descanned GaAsP PMT', 'middle'),
    P.note(330, 330, 'Excitation ∝ I²: fluorescence only at the focus', C.ir), P.note(330, 352, 'No pinhole needed; scattered emission still counts', C.part),
  ],
  'light-sheet': (P, C) => [
    P.beam([[60, 160], [228, 160]], C.ex, 5), P.hcone(228, 160, 22, 300, 160, 2, C.ex, 0.35), P.hcone(300, 160, 2, 372, 160, 22, C.ex, 0.15),
    P.source(40, 100, C.ex, 'Laser'), P.lens(130, 160, 30, 'Cylindrical lens', { vertical: true }),
    P.hobjective(215, 160, 'Illumination objective'),
    `<ellipse cx="300" cy="160" rx="42" ry="30" class="lp-embryo"><title>Sample in a gel cylinder or chamber</title></ellipse>`,
    `<rect x="258" y="157" width="84" height="6" fill="${C.ex}" opacity=".85"><title>Light sheet: only the focal plane is illuminated</title></rect>`,
    P.beam([[300, 192], [300, 352]], C.em, 4), P.objective(300, 230, 'Detection objective (orthogonal)', { up: true }),
    P.filter(300, 290, 50, C.em, 'Emission filter'), P.lens(300, 318, 34, 'Tube lens'), P.detector(300, 370, 'sCMOS camera'),
    P.note(380, 60, 'Sheet thickness vs field of view:', C.part), P.note(380, 80, 'thin sheets diverge quickly', C.part),
  ],
  'lattice-light-sheet': (P, C) => [
    P.beam([[60, 160], [228, 160]], C.ex, 5), P.source(40, 100, C.ex, 'Laser'),
    P.box(110, 230, 80, 24, 'SLM', 'Spatial light modulator writes the lattice pattern'),
    P.box(170, 290, 90, 22, 'Annular mask', 'Selects a thin annulus in the pupil: Bessel-like long, thin beams'),
    P.hobjective(215, 160, 'Excitation objective'),
    `<rect x="258" y="156" width="84" height="8" fill="url(#lattice)"/><defs><pattern id="lattice" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="${C.ex}"/></pattern></defs>`,
    `<ellipse cx="300" cy="160" rx="42" ry="30" class="lp-embryo"/>`,
    P.beam([[300, 192], [300, 352]], C.em, 4), P.objective(300, 230, 'Detection objective'), P.detector(300, 370, 'sCMOS camera'),
    P.note(360, 70, 'Optical lattice sheet ~0.4-1 µm thick', C.ex), P.note(360, 90, 'Dithered or swept to make it uniform', C.part),
  ],
  'oblique-plane': (P, C) => [
    P.beam([[505, Y.dich], [X + 10, Y.dich], [X + 10, Y.obj + 30]], C.ex, 5),
    `<line x1="${X - 40}" y1="${Y.sample + 20}" x2="${X + 30}" y2="${Y.sample - 14}" stroke="${C.ex}" stroke-width="6" opacity=".8"><title>Tilted light sheet through the same objective</title></line>`,
    P.sample(X, Y.sample, 150, 'Sample'), P.objective(X, Y.obj, 'O1 (primary)'), P.dichroic(X, Y.dich), P.source(540, Y.dich, C.ex, 'Laser + scanning galvo'),
    P.beam([[X - 6, Y.obj + 30], [X - 6, Y.dich + 20], [150, Y.dich + 20]], C.em, 4),
    P.hobjective(190, Y.dich + 20, 'O2 (remote focus)', { right: true }),
    P.box(110, Y.dich + 30, 60, 30, 'O3 tilted', 'Tertiary objective tilted to image the oblique plane onto the camera'),
    P.detector(110, 370, 'Camera'),
    P.note(330, 345, 'Remote refocusing images a tilted plane; one objective at the sample', C.part),
  ],
  confocal_dummy: () => [],
  sim: (P, C) => epi(P, C, {
    extra: [P.box(420, Y.mid, 100, 26, 'Grating / SLM', 'Creates a striped illumination pattern; rotated and phase shifted (e.g. 3 × 5 images)'),
      psfInset(P, C, 500, 80, 'stripes'), P.note(20, 392, 'Moiré with the pattern shifts unresolvable frequencies into the passband: ~2× resolution.', C.part)],
  }),
  sted: (P, C) => epi(P, C, {
    det: 'APD / HyD', detKind: 'pmt',
    beamIn: [[505, Y.dich], [X, Y.dich], [X, Y.obj + 30]],
    extra: [P.beam([[505, Y.mid + 18], [X - 4, Y.mid + 18], [X - 4, Y.obj + 30]], C.far, 5, { tip: 'Depletion beam (e.g. 775 nm) shaped into a doughnut' }),
      P.source(540, Y.mid + 18, C.far, 'STED laser 775 nm'), P.box(440, Y.mid + 18, 60, 22, 'Vortex', 'Vortex phase plate: 0 to 2π helical phase makes the doughnut'),
      P.pinhole(X + 7, Y.filt + 32, 6, 70, 'Pinhole'), psfInset(P, C, 500, 80, 'donut')],
  }).filter(s => !s.includes('Tube lens')),
  smlm: (P, C) => epi(P, C, {
    src: '640 nm readout + 405 nm activation', ex: C.far, em: '#ff8a3d', det: 'EMCCD / sCMOS',
    extra: [psfInset(P, C, 500, 80, 'blink'), P.note(20, 392, 'Thousands of frames, each with sparse single molecules; localize each centre to ~10-30 nm.', C.part)],
  }),
  'dna-paint': (P, C) => epi(P, C, {
    src: 'Laser 561 nm (TIRF/HILO)', ex: C.red, em: '#ff8a3d', det: 'EMCCD / sCMOS',
    extra: [psfInset(P, C, 500, 80, 'blink'), P.note(20, 392, 'Imager strands bind docking strands transiently: blinking without photoswitching.', C.part)],
  }),
  minflux: (P, C) => epi(P, C, {
    src: 'Laser 640 nm', ex: C.far, det: 'APDs', detKind: 'pmt',
    extra: [P.box(420, Y.mid, 110, 26, 'EOD + phase plate', 'Electro-optic deflectors place the doughnut at a pattern of positions around the molecule'),
      psfInset(P, C, 500, 80, 'donut'), P.note(20, 392, 'Photon counts at each doughnut position triangulate the molecule: ~2 nm precision.', C.part)],
  }),
  // electron and probe
  tem: (P, C) => [
    P.beam([[X, 30], [X, 370]], C.e, 5, { tip: 'Electron beam (e.g. 200-300 kV)' }),
    P.box(X, 28, 120, 26, 'Electron gun (FEG)'), P.coil(X, 80, 110, 'Condenser lenses'),
    P.sample(X, 140, 140, 'Specimen (thin section / vitreous ice)', { cover: false }),
    P.coil(X, 180, 110, 'Objective lens'), P.box(X, 210, 80, 14, 'Objective aperture'),
    P.coil(X, 260, 110, 'Intermediate & projector'), P.detector(X, 360, 'Direct electron detector'),
    P.note(20, 392, 'Vacuum column; λ ≈ 2.5 pm at 200 kV. Contrast from scattering and phase (defocus).', C.part),
  ],
  sem: (P, C) => [
    P.beam([[X, 30], [X, 300]], C.e, 5), P.box(X, 28, 120, 26, 'Electron gun'), P.coil(X, 90, 110, 'Condenser'),
    P.box(X, 150, 110, 22, 'Scan coils', 'Raster the focused probe across the surface'), P.coil(X, 210, 110, 'Objective (final) lens'),
    `<rect x="200" y="300" width="200" height="40" class="lp-specimen"><title>Bulk specimen (coated if non-conductive)</title></rect>`,
    P.glow(X, 300, 18, C.e, 0.9), P.beam([[X, 300], [450, 250]], '#b77bff', 3), P.detector(480, 240, 'SE detector', { kind: 'pmt', w: 60 }),
    P.box(X - 90, 270, 60, 16, 'BSE det.'), P.note(20, 392, 'Secondary electrons map topography; backscattered electrons map composition.', C.part),
  ],
  afm: (P, C) => [
    `<rect x="120" y="300" width="360" height="30" class="lp-specimen"/>`,
    `<path d="M120 300 q20 -18 40 0 t40 0 t40 -10 t40 10 t40 0 t40 -14 t40 14 t40 0" fill="#3dff8f" opacity=".5"/>`,
    `<polygon points="200,240 330,240 330,252 214,252" class="lp-cant"><title>Cantilever (spring constant k)</title></polygon><polygon points="318,252 330,252 324,282" class="lp-cant"/>`,
    P.source(130, 120, C.red, 'Laser'), P.beam([[130, 120], [326, 240], [470, 110]], C.red, 3),
    P.box(490, 100, 70, 40, 'Quadrant photodiode', 'Measures cantilever deflection'),
    P.box(150, 270, 80, 22, 'Piezo z', 'Feedback keeps deflection or amplitude constant'),
    P.note(20, 392, 'Force = k × deflection; the tip apex radius (~2-10 nm) limits lateral resolution.', C.part),
  ],
};
DEFS.spm = (P, C) => {
  let atoms = '';
  for (let i = 0; i < 14; i++) atoms += `<circle cx="${130 + i * 26}" cy="318" r="12" fill="#3dff8f" opacity=".55"><title>Surface atoms</title></circle>`;
  return [
    `<rect x="110" y="330" width="380" height="30" class="lp-specimen"><title>Conducting sample</title></rect>`, atoms,
    `<polygon points="286,170 314,170 300,292" class="lp-cant"><title>Atomically sharp metal tip</title></polygon>`,
    P.glow(300, 300, 14, C.e, 0.9), P.label(322, 296, 'tunnelling current'),
    P.box(300, 120, 120, 50, 'Piezo tube xyz', 'Piezo tube scanner: sub-ångström x, y and z motion'),
    P.box(500, 120, 110, 40, 'Feedback', 'Keeps the current constant by moving the tip in z; the z signal is the image'),
    P.box(500, 220, 110, 40, 'Current amp', 'Current-to-voltage amplifier'),
    P.beam([[300, 292], [300, 170]], C.e, 2, { op: 0.5 }), P.beam([[360, 120], [445, 120]], C.part, 2, { dash: false }),
    P.beam([[500, 200], [500, 140]], C.part, 2, { dash: false }), P.box(110, 230, 90, 34, 'Bias V', 'Bias voltage between tip and sample'),
    P.note(20, 392, 'I ∝ V·exp(−2κd): about ten times less current per ångström of extra gap.', C.part),
  ];
};
DEFS['cryo-em'] = DEFS.tem;
DEFS['cryo-et'] = (P, C) => DEFS.tem(P, C).concat([P.note(410, 145, '↻ tilt ±60°', C.e)]);
DEFS['volume-em'] = DEFS.sem;
DEFS.fluctuation = DEFS.widefield;
DEFS.expansion = DEFS.widefield;
delete DEFS.confocal_dummy;

export const FAMILY_DEFAULT = {
  'Transmitted light': 'brightfield', Fluorescence: 'widefield', 'Optical sectioning': 'confocal',
  'Super-resolution': 'smlm', 'Functional and spectroscopic': 'confocal', 'Label-free': 'multiphoton',
  'Electron and probe': 'tem', 'Systems and formats': 'widefield',
};
