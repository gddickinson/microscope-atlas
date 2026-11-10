// Light-path diagrams, part 2: functional, label-free and system formats (600 x 400 boxes). Merged into DEFS by lightpath_defs.js.
import { X, Y, epi, transmitted, scanner, psfInset } from './lightpath_kit.js';

const decayInset = (P, C, x, y) => {
  let d = `M${x - 26} ${y + 20}`;
  for (let i = 0; i <= 26; i++) d += ` L${x - 26 + i * 2} ${(y + 20 - 40 * Math.exp(-i / 7)).toFixed(1)}`;
  return P.inset(x, y, 34, `<path d="${d}" fill="none" stroke="${C.em}" stroke-width="2"/><line x1="${x - 26}" y1="${y + 21}" x2="${x + 28}" y2="${y + 21}" stroke="${C.part}"/>`, 'Photon timing histogram');
};
const confocalExtras = (P, C, pin = 'Pinhole') => [scanner(P, 160, Y.mid), P.beam([[X, Y.mid], [206, Y.mid]], C.part, 2, { dash: false, op: 0.4 }), P.pinhole(X + 7, Y.filt + 32, 6, 70, pin)];
const noTube = arr => arr.filter(s => !s.includes('Tube lens'));
const note = (P, C, t) => P.note(20, 392, t, C.part);

export const DEFS2 = {
  flim: (P, C) => noTube(epi(P, C, {
    src: 'Pulsed laser', det: 'HyD / SPAD', detKind: 'pmt',
    extra: [...confocalExtras(P, C), P.box(500, Y.det, 100, 30, 'TCSPC timer', 'Time-correlated single-photon counting: times each photon relative to the laser pulse'),
      P.beam([[400, Y.det], [450, Y.det]], C.part, 2, { dash: false }), decayInset(P, C, 500, 90), note(P, C, 'Each photon is timed against the pulse; the decay gives the lifetime.')],
  })),
  fret: (P, C) => [
    P.beam([[505, Y.dich - 40], [X, Y.dich - 40], [X, Y.obj + 30]], C.ex, 5, { tip: 'Donor excitation' }), P.cone(X, Y.obj - 24, 10, X, Y.sample + 8, 40, C.ex, 0.18),
    P.sample(X, Y.sample), P.objective(X, Y.obj), P.dichroic(X, Y.dich - 40), P.source(540, Y.dich - 40, C.ex, 'Donor laser'),
    P.beam([[X + 7, Y.obj + 30], [X + 7, 290], [110, 290], [110, 352]], C.em, 4, { tip: 'Donor emission (shorter wavelength)' }),
    P.beam([[X + 7, 290], [X + 7, 352]], C.red, 4, { tip: 'Acceptor emission (longer wavelength)' }),
    P.dichroic(X + 7, 290, 50, 'Image splitter', { t: 'Splits donor and acceptor emission onto two cameras or two halves of one chip' }),
    P.detector(110, 370, 'Donor channel', { w: 64 }), P.detector(X + 7, 370, 'Acceptor channel', { w: 64 }),
    P.inset(500, 100, 34, P.glow(488, 100, 10, C.em, 1) + P.glow(512, 100, 10, C.red, 1) + `<path d="M494 92 q6 -10 12 0" fill="none" stroke="${C.e}" stroke-width="2"/>`, 'FRET at 2-10 nm'),
    note(P, C, 'Ratio of acceptor to donor signal (or donor lifetime) reports distance.'),
  ],
  fcs: (P, C) => noTube(epi(P, C, {
    src: 'cw laser', det: 'SPAD / APD', detKind: 'pmt',
    extra: [P.pinhole(X + 7, Y.filt + 32, 6, 70, 'Pinhole'), P.box(470, Y.det, 110, 30, 'Correlator', 'Hardware or software autocorrelation of the photon stream'),
      P.beam([[345, Y.det], [415, Y.det]], C.part, 2, { dash: false }),
      P.inset(500, 90, 34, `<ellipse cx="500" cy="90" rx="9" ry="24" fill="${C.ex}" opacity=".35"/>` + [[-14, -10], [6, 4], [16, 16], [-6, 20]].map(([a, b]) => P.glow(500 + a, 90 + b, 5, C.em, 1)).join(''), 'Molecules in the focus'),
      note(P, C, 'A parked spot: intensity flicker → G(τ) → concentration and diffusion.')],
  })),
  frap: (P, C) => epi(P, C, {
    src: 'Lasers', extra: [scanner(P, 160, Y.mid), P.beam([[X, Y.mid], [206, Y.mid]], C.part, 2, { dash: false, op: 0.4 }),
      P.inset(500, 90, 34, `<rect x="474" y="64" width="52" height="52" fill="${C.em}" opacity=".45"/><circle cx="500" cy="90" r="11" fill="#06101c"/>`, 'Bleached spot'),
      note(P, C, 'A brief intense scan bleaches a region; low-power imaging follows recovery.')],
  }),
  spt: (P, C) => epi(P, C, {
    src: 'Laser (TIRF)', det: 'EMCCD / sCMOS',
    beamIn: [[505, Y.dich], [X + 26, Y.dich], [X + 26, Y.obj + 30]],
    extra: [P.inset(500, 90, 34, `<polyline points="482,104 488,96 486,88 494,84 500,90 506,82 512,86 516,76" fill="none" stroke="${C.em}" stroke-width="2"/>` + P.glow(516, 76, 6, C.em, 1), 'One molecule, one track'),
      note(P, C, 'Sparse molecules, fast frames: localize, link into tracks, fit the MSD.')],
  }),
  spectral: (P, C) => noTube(epi(P, C, {
    src: 'Lasers', det: '', detKind: 'array',
    extra: [...confocalExtras(P, C), P.box(X + 7, Y.det - 4, 60, 22, 'Grating', 'Prism or grating spreads the emission into its wavelengths'),
      P.beam([[X + 30, Y.det - 4], [400, Y.det - 16]], C.ex, 2), P.beam([[X + 30, Y.det - 4], [400, Y.det - 4]], C.em, 2), P.beam([[X + 30, Y.det - 4], [400, Y.det + 8]], C.red, 2),
      P.detector(435, Y.det - 4, 'Array', { kind: 'array', w: 70 }), note(P, C, 'A spectrum per pixel; linear unmixing separates overlapping dyes.')],
  })).filter(s => !s.includes('class="lp-det"') || s.includes('>Array<') ),
  raman: (P, C) => [
    P.beam([[505, Y.dich], [X, Y.dich], [X, Y.obj + 30]], C.ex2, 5, { tip: 'Narrow-line laser (e.g. 532 or 785 nm)' }), P.cone(X, Y.obj - 24, 10, X, Y.sample + 4, 3, C.ex2, 0.25),
    P.sample(X, Y.sample, 150, 'Sample (no label)'), P.objective(X, Y.obj), P.dichroic(X, Y.dich, 60, 'Edge / notch filter'), P.source(540, Y.dich, C.ex2, 'Narrow-line laser'),
    P.beam([[X + 7, Y.obj + 30], [X + 7, 320], [200, 320]], C.red, 3, { tip: 'Weak inelastically scattered (Raman) light' }),
    P.box(160, 320, 80, 30, 'Spectrometer', 'Grating spectrometer with a cooled CCD'),
    P.inset(500, 100, 34, `<polyline points="472,116 480,114 484,90 488,114 498,113 502,100 506,113 514,112 518,78 522,112 528,114" fill="none" stroke="${C.red}" stroke-width="2"/>`, 'Vibrational fingerprint'),
    note(P, C, 'Raman scattering is very weak; its frequency shifts identify chemical bonds.'),
  ],
  'cars-srs': (P, C) => [
    P.source(70, 250, C.ex, 'Pump (fs/ps)'), P.source(70, 320, C.ir, 'Stokes (fs/ps)'),
    P.beam([[105, 250], [300, 250]], C.ex, 4), P.beam([[105, 320], [240, 320], [240, 250]], C.ir, 4), P.dichroic(240, 250, 40, ''),
    P.box(170, 320, 70, 22, 'Modulator', 'SRS: the Stokes beam is modulated (MHz) so the pump loss can be detected with a lock-in'),
    scanner(P, 400, 250), P.beam([[300, 250], [354, 250]], C.part, 2, { dash: false, op: 0.4 }),
    P.beam([[X, 250], [X, 168]], C.ex, 5), P.objective(X, 160, 'Objective', { up: true }), P.sample(X, 112, 150, 'Tissue'),
    P.lens(X, 74, 40, 'Condenser (forward)'), P.beam([[X, 104], [X, 34]], C.ex, 3), P.detector(X, 26, 'Photodiode / PMT', { kind: 'pmt', t: 'SRS: photodiode and lock-in amplifier; CARS: PMT behind a filter' }),
    note(P, C, 'Pump − Stokes = a vibration: CARS emits new light, SRS changes the pump.'),
  ],
  shg: (P, C) => [
    P.source(500, 330, C.ir, 'fs laser (e.g. 880 nm)'), scanner(P, 400, 250), P.beam([[500, 312], [500, 250], [446, 250]], C.ir, 4), P.beam([[354, 250], [X, 250], [X, 186]], C.ir, 5),
    P.objective(X, 160, 'Objective', { up: true }), P.cone(X, 134, 10, X, 112, 2, C.ir, 0.3), P.sample(X, 112, 150, 'Collagen / muscle'), P.glow(X, 110, 9, C.ex, 1),
    P.lens(X, 74, 40, 'Condenser'), P.beam([[X, 100], [X, 40]], C.ex, 3, { tip: 'Second harmonic at exactly half the wavelength (440 nm)' }), P.filter(X, 52, 50, C.ex, 'λ/2 band-pass'),
    P.detector(X, 22, 'PMT (forward)', { kind: 'pmt' }), note(P, C, 'Ordered non-centrosymmetric structures double the frequency; no bleaching.'),
  ],
  qpi: (P, C) => [
    P.source(60, 330, C.ex2, 'Laser / LED'), P.beam([[95, 330], [160, 330], [160, 120], [X, 120]], C.ex2, 4, { tip: 'Reference beam' }),
    P.beam([[160, 330], [X, 330], [X, 140]], C.ex2, 4, { tip: 'Object beam' }), P.mirror(160, 330, 40, true, ''), P.label(110, 352, 'Beam splitter'),
    P.mirror(160, 120, 40, false, 'Mirror'), P.sample(X, 250, 140, 'Cells (unlabelled)', { cover: false }), P.objective(X, 190, 'Objective', { up: false }),
    P.dichroic(X, 120, 40, 'Combiner'), P.beam([[X, 120], [X, 40]], C.ex2, 4), P.detector(X, 30, 'Camera: interferogram', {}),
    P.inset(500, 220, 34, Array.from({ length: 7 }, (_, i) => `<path d="M${476 + i * 8} 192 q6 28 0 56" fill="none" stroke="${C.ex2}" stroke-width="1.5"/>`).join(''), 'Fringes bend at cells'),
    note(P, C, 'Interference with a reference beam turns path delay into a phase map.'),
  ],
  iscat: (P, C) => epi(P, C, {
    src: 'Laser', em: C.ex, det: 'Fast camera',
    extra: [P.inset(500, 90, 34, `<circle cx="500" cy="90" r="16" fill="none" stroke="${C.ex}" stroke-width="2"/><circle cx="500" cy="90" r="6" fill="#06101c" stroke="${C.ex}"/>`, 'Interference spot'),
      note(P, C, 'Scattered light interferes with the coverslip reflection: no label needed.')],
  }).map(s => s.replace('Dichroic mirror: reflects excitation wavelengths, transmits the longer emission wavelengths', 'Partially reflecting beam splitter: excitation and signal share one wavelength')).filter(s => !s.includes('Emission filter')),
  oct: (P, C) => [
    P.source(80, 220, C.ir, 'Broadband source', { t: 'Superluminescent diode (spectral-domain) or swept laser (swept-source OCT)' }), P.beam([[105, 220], [260, 220]], C.ir, 4), P.mirror(260, 220, 40, true, ''), P.label(272, 252, 'Beam splitter / fibre coupler'),
    P.beam([[260, 220], [440, 220]], C.ir, 3, { tip: 'Reference arm' }), `<rect x="440" y="196" width="10" height="48" class="lp-mirror"><title>Reference mirror (fixed in Fourier-domain OCT)</title></rect>`, P.label(460, 214, 'Reference mirror'),
    P.beam([[260, 220], [260, 100]], C.ir, 3, { tip: 'Sample arm' }), P.box(260, 150, 80, 24, 'Galvo scan', 'Scans the beam across the tissue for B-scans and volumes'),
    P.lens(260, 105, 32, 'Scan lens'), `<rect x="170" y="40" width="180" height="40" class="lp-specimen"><title>Tissue: retina, skin, vessels</title></rect>`, P.label(360, 60, 'Tissue (mm deep)'),
    P.beam([[260, 220], [260, 330]], C.ir, 3, { tip: 'Recombined light' }), P.detector(260, 352, 'Spectrometer / photodiode', { kind: 'array' }),
    note(P, C, 'Low-coherence interference sorts echoes by depth: µm axial resolution.'),
  ],
  photoacoustic: (P, C) => [
    P.source(100, 80, C.ir, 'Pulsed laser (ns)'), P.beam([[135, 80], [300, 80], [300, 200]], C.ir, 5),
    `<rect x="160" y="200" width="280" height="110" rx="6" class="lp-specimen"><title>Tissue</title></rect>`,
    P.glow(270, 250, 14, C.far, 1), P.glow(340, 270, 10, C.far, 1),
    ...[24, 40, 56].map(r => `<circle cx="270" cy="250" r="${r}" fill="none" stroke="${C.e}" stroke-dasharray="4 4" opacity=".7"><title>Ultrasound wave from thermoelastic expansion</title></circle>`),
    P.box(470, 250, 90, 40, 'Ultrasound', 'Ultrasound transducer or array: records the acoustic arrival times'), P.label(150, 190, 'Absorbers (haemoglobin, melanin)', 'start'),
    note(P, C, 'Light in, sound out: absorbers heat, expand and emit ultrasound.'),
  ],
  xray: (P, C) => [
    P.source(70, 200, C.e, 'X-ray source', { t: 'Synchrotron beamline or laboratory X-ray source' }), P.beam([[95, 200], [560, 200]], C.e, 4, { tip: 'Soft or hard X-rays' }),
    P.lens(170, 200, 40, 'Condenser zone plate', { vertical: true }), P.box(260, 200, 40, 60, 'Sample', 'Cryo-fixed cell or tissue, rotated for tomography'),
    P.lens(350, 200, 30, 'Objective zone plate', { vertical: true }), P.detector(540, 200, '', { w: 60 }), P.label(540, 240, 'X-ray camera', 'middle'),
    P.note(20, 330, 'Water window (284-543 eV): carbon absorbs, water does not.', C.e), note(P, C, 'Zone plates focus X-rays by diffraction; rotating the sample gives 3D.'),
  ],
  clem: (P, C) => [
    P.box(150, 80, 180, 50, 'Fluorescence', 'Light microscopy: find the labelled event or protein'), P.box(450, 80, 180, 50, 'Electron microscopy', 'EM of the same cell: ultrastructure'),
    P.beam([[240, 80], [360, 80]], C.part, 3, { dash: true }), P.label(300, 66, 'same sample', 'middle'),
    P.inset(150, 220, 60, P.glow(130, 210, 12, C.em, 1) + P.glow(172, 238, 10, C.em, 1), 'Where (labels)'),
    P.inset(450, 220, 60, `<ellipse cx="450" cy="220" rx="40" ry="24" fill="none" stroke="${C.part}" stroke-width="2"/><ellipse cx="430" cy="210" rx="8" ry="5" fill="none" stroke="${C.part}"/><ellipse cx="470" cy="232" rx="9" ry="5" fill="none" stroke="${C.part}"/>`, 'What (membranes)'),
    P.label(300, 330, 'Fiducials (beads, grid marks) register the two images', 'middle'), note(P, C, 'The overlay puts molecular identity onto nanometre ultrastructure.'),
  ],
  'high-content': (P, C) => epi(P, C, {
    src: 'Light engine', extra: [`<rect x="190" y="30" width="220" height="30" rx="3" class="lp-specimen"><title>Multiwell plate (96-1536 wells)</title></rect>`,
      ...Array.from({ length: 8 }, (_, i) => `<circle cx="${205 + i * 27}" cy="45" r="9" fill="none" stroke="${C.part}"/>`),
      P.box(500, 140, 110, 30, 'Laser autofocus', 'Finds the plate bottom at every well'), P.box(110, 140, 120, 30, 'Robot / stacker', 'Loads plates for unattended runs'),
      note(P, C, 'Automated stage, autofocus and analysis: thousands of wells per run.')],
  }).filter(s => !s.includes('Sample on a coverslip')),
  'slide-scanner': (P, C) => transmitted(P, C, {
    label: 'Line-scan / area camera', note: 'The slide moves under the objective; tiles are stitched into one image.',
    obj: [P.box(480, 200, 110, 30, 'XY stage →', 'Motorised stage moves the slide in tiles or strips'), P.box(120, 150, 100, 28, 'Focus map', 'Focus measured across the slide before scanning')],
  }),
  intravital: (P, C) => [
    P.source(500, 330, C.ir, 'fs laser'), scanner(P, 400, 250), P.beam([[500, 312], [500, 250], [446, 250]], C.ir, 4), P.beam([[354, 250], [X, 250], [X, 186]], C.ir, 5),
    P.objective(X, 160, 'Water-dipping objective', { up: true }), P.beam([[X, 134], [X, 106]], C.ir, 4),
    `<ellipse cx="300" cy="80" rx="150" ry="36" class="lp-embryo"><title>Anaesthetised animal</title></ellipse>`, `<rect x="270" y="104" width="60" height="6" fill="${C.part}"><title>Imaging window (cranial or abdominal)</title></rect>`,
    P.glow(X, 100, 9, C.em, 1), P.label(300, 32, 'Animal with imaging window', 'middle'), P.dichroic(X - 70, 210, 40, ''), P.beam([[X - 4, 206], [X - 70, 210], [X - 150, 210]], C.em, 3),
    P.detector(X - 190, 210, '', { kind: 'pmt', w: 60 }), P.label(X - 190, 250, 'Non-descanned PMTs', 'middle'),
    note(P, C, 'Living animals: imaging windows, motion correction, infrared for depth.'),
  ],
  miniscope: (P, C) => [
    `<rect x="230" y="40" width="140" height="210" rx="10" class="lp-box"><title>Head-mounted housing (a few grams)</title></rect>`,
    P.detector(X, 66, 'CMOS sensor', { w: 70 }), P.lens(X, 112, 28, 'Achromat'), P.dichroic(X, 160, 40, ''), P.source(420, 160, C.ex, 'Blue LED'),
    P.beam([[385, 160], [X, 160], [X, 230]], C.ex, 3), P.beam([[X + 5, 230], [X + 5, 84]], C.em, 3), P.filter(X, 196, 40, C.ex, ''),
    `<rect x="290" y="250" width="20" height="70" fill="${C.part}" opacity=".7"><title>GRIN lens implanted to reach deep brain regions</title></rect>`, P.label(316, 266, 'GRIN lens / window'),
    `<path d="M120 320 Q300 250 480 320 L480 370 L120 370Z" class="lp-specimen"><title>Brain of a freely moving mouse</title></path>`, P.glow(X, 324, 10, C.em, 1),
    note(P, C, 'Calcium imaging in freely moving animals, tethered or wireless.'),
  ],
  'adaptive-optics': (P, C) => [
    P.beam([[505, Y.dich], [X, Y.dich], [X, Y.obj + 30]], C.ex, 5), P.cone(X, Y.obj - 24, 10, X, Y.sample + 6, 3, C.ex, 0.25), P.sample(X, Y.sample, 150, 'Aberrating tissue'), P.objective(X, Y.obj),
    P.dichroic(X, Y.dich), P.source(540, Y.dich, C.ex, 'Laser'), P.glow(X, Y.sample, 8, C.em, 1),
    P.beam([[X + 7, Y.obj + 30], [X + 7, 180], [160, 180], [160, 300]], C.em, 4), P.mirror(X + 7, 180, 40, false, ''),
    `<path d="M120 180 q20 -8 40 0 t40 0" fill="none" stroke="${C.e}" stroke-width="5"><title>Deformable mirror: applies the opposite of the measured wavefront error</title></path>`, P.label(110, 165, 'Deformable mirror', 'start'),
    P.dichroic(160, 300, 40, ''), P.beam([[160, 300], [160, 360]], C.em, 3), P.detector(160, 370, 'Camera / PMT', { w: 60 }),
    P.beam([[160, 300], [330, 300]], C.em, 2), P.box(380, 300, 100, 36, 'Wavefront sensor', 'Shack-Hartmann sensor reads the wavefront from a guide star (bright point) in the sample'),
    P.beam([[380, 318], [380, 340], [140, 340], [140, 190]], C.part, 1.5, { dash: false, op: 0.5 }), P.label(390, 356, 'feedback loop'),
    note(P, C, 'Measure the wavefront error, cancel it with a deformable mirror.'),
  ],
  'light-field': (P, C) => epi(P, C, {
    src: 'LED', det: 'Camera behind microlenses',
    extra: [`<g>${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${264 + i * 9}" cy="${Y.det - 24}" rx="4" ry="6" fill="none" stroke="${C.white}"/>`).join('')}<title>Microlens array at the image plane</title></g>`, P.label(352, Y.det - 20, 'Microlens array'),
      P.inset(500, 90, 34, Array.from({ length: 9 }, (_, i) => `<circle cx="${480 + (i % 3) * 20}" cy="${70 + Math.floor(i / 3) * 20}" r="8" fill="none" stroke="${C.em}"/>` + P.glow(480 + (i % 3) * 20 + (i % 3 - 1) * 3, 70 + Math.floor(i / 3) * 20, 3, C.em, 1)).join(''), 'Lenslet sub-images'),
      note(P, C, 'Position and angle in one frame: a volume per snapshot, at lower resolution.')],
  }),
  'open-hardware': (P, C) => [
    `<rect x="190" y="30" width="220" height="330" rx="14" class="lp-box"><title>3D-printed body</title></rect>`, P.label(420, 46, '3D-printed body'),
    P.source(X, 70, C.white, 'LED', { kind: 'lamp', w: 50 }), P.beam([[X, 88], [X, 300]], C.white, 4), P.lens(X, 120, 26, 'Condenser lens'),
    P.sample(X, 170, 140, '', { cover: false }), P.label(180, 174, 'Slide', 'end'), P.box(X, 200, 160, 18, 'Flexure stage', 'Printed flexure hinges give sub-µm motion with cheap motors'),
    P.objective(X, 240, 'Objective or webcam lens', { up: true }), P.detector(X, 310, 'Pi camera', { w: 60 }),
    P.box(500, 310, 100, 34, 'Raspberry Pi', 'Single-board computer runs the camera, motors and software'), P.beam([[335, 310], [450, 310]], C.part, 2, { dash: false }),
    note(P, C, 'Printed parts, a board camera and open software, at a fraction of the price.'),
  ],
};
