// Virtual Optical Table: the component catalogue. Pure data (no DOM), shared by the engine, the page and the tests.
// Each part: label, cat (palette group), params (defaults), schema (editable fields), note (what it does),
// tech (technique ids), sup (supplier names from the community "Optics and component suppliers" group), db (real-model list).
// Units: mm for positions and sizes, nm for wavelengths, mW for power, degrees for angles.

import { SPECIMEN_OPTIONS } from './table_specimens.js';

const n = (k, label, unit, min, max, step) => ({ k, label, unit, min, max, step });
const o = (k, label, options) => ({ k, label, options });
const DIAM = n('diam', 'Clear aperture', 'mm', 1, 100, 0.1);

export const CATS = [
  ['source', 'Light sources'], ['mirror', 'Mirrors and scanners'], ['split', 'Beam splitters'],
  ['pol', 'Polarization'], ['filter', 'Filters and apertures'], ['lens', 'Lenses and objectives'],
  ['ao', 'Prisms, modulators and fibres'], ['sample', 'Samples'], ['det', 'Detectors'],
];

const MIRRORS = ['Thorlabs', 'Edmund Optics', 'Newport (MKS)', 'OptoSigma'];
const FILTERS = ['Chroma Technology', 'Semrock (IDEX Health & Science)', 'Alluxa'];
const LASERS = ['Coherent', 'TOPTICA Photonics', 'Omicron-Laserage', 'HÜBNER Photonics (Cobolt)', 'Oxxius', 'Spectra-Physics (MKS)', 'Vortran Laser Technology', 'LASOS'];
const POL = ['Thorlabs', 'Edmund Optics', 'Meadowlark Optics', 'Newport (MKS)'];
const CAMS = ['Hamamatsu Photonics', 'Teledyne Vision Solutions (Photometrics)', 'Andor (Oxford Instruments)', 'Excelitas Technologies'];
const SPEC = o('specimen', 'Specimen (for the simulated image)', SPECIMEN_OPTIONS);
const POL_OPTS = [['p', 'p (in the table plane)'], ['s', 's (perpendicular)'], ['45', 'linear 45°'], ['u', 'unpolarized'], ['c', 'circular']];

export const PARTS = {
  // --- sources -------------------------------------------------------------------------------
  laser: { label: 'Laser', cat: 'source', params: { lambda: 488, power: 50, diam: 2, div: 0.5, rays: 5, pol: 'p' },
    schema: [n('lambda', 'Wavelength', 'nm', 350, 1300, 1), n('power', 'Power', 'mW', 0.01, 5000, 0.1), n('diam', 'Beam diameter', 'mm', 0.2, 30, 0.1),
      n('div', 'Full divergence', 'mrad', 0, 50, 0.1), n('rays', 'Rays drawn', '', 1, 15, 1), o('pol', 'Polarization', POL_OPTS)],
    note: 'Emits a narrow, nearly parallel, monochromatic and usually linearly polarized beam.', tech: ['confocal', 'tirf', 'sted'], sup: LASERS },
  led: { label: 'LED', cat: 'source', params: { lambda: 470, fwhm: 30, power: 100, diam: 10, spread: 8, rays: 5 },
    schema: [n('lambda', 'Centre wavelength', 'nm', 350, 1000, 1), n('fwhm', 'Bandwidth (FWHM)', 'nm', 1, 150, 1), n('power', 'Power', 'mW', 0.1, 5000, 1),
      n('diam', 'Bundle diameter', 'mm', 1, 50, 0.5), n('spread', 'Half-angle of spread', '°', 0, 45, 0.5), n('rays', 'Rays per colour', '', 1, 11, 1)],
    note: 'A broader band and a wider, less directional bundle than a laser: ideal for even widefield illumination.', tech: ['widefield'], sup: ['Lumencor', 'Excelitas Technologies', 'Thorlabs'] },
  lamp: { label: 'White lamp', cat: 'source', params: { power: 200, diam: 15, spread: 6, rays: 5 },
    schema: [n('power', 'Power', 'mW', 1, 5000, 1), n('diam', 'Bundle diameter', 'mm', 1, 50, 0.5), n('spread', 'Half-angle of spread', '°', 0, 45, 0.5), n('rays', 'Rays per colour', '', 1, 9, 1)],
    note: 'Halogen or white LED: a spread of colours across the visible, drawn as five wavelength bands.', tech: ['brightfield', 'darkfield', 'phase-contrast'], sup: ['Lumencor', 'Excelitas Technologies', 'Thorlabs'] },
  fibre_out: { label: 'Fibre output', cat: 'source', params: { mode: 'own', lambda: 561, power: 10, na: 0.1, rays: 5 },
    schema: [o('mode', 'Light comes from', [['own', 'its own setting'], ['coupled', 'fibre couplers on this table']]), n('lambda', 'Wavelength (own)', 'nm', 350, 1300, 1),
      n('power', 'Power (own)', 'mW', 0.01, 1000, 0.1), n('na', 'Fibre NA', '', 0.01, 0.5, 0.01), n('rays', 'Rays drawn', '', 1, 15, 1)],
    note: 'The bare end of an optical fibre: a point-like source diverging into a cone set by the fibre NA, so it is usually collimated by a lens.', tech: ['open-hardware'], sup: ['Thorlabs', 'Omicron-Laserage', 'TOPTICA Photonics'] },
  // --- mirrors and scanners -------------------------------------------------------------------
  mirror: { label: 'Mirror', cat: 'mirror', params: { diam: 25.4, R: 99 }, schema: [DIAM, n('R', 'Reflectance', '%', 0, 100, 0.1)],
    note: 'Reflects the beam with angle of incidence equal to angle of reflection; two mirrors give the four degrees of freedom needed to steer a beam.', tech: [], sup: MIRRORS },
  pickoff: { label: 'D-shaped pickoff mirror', cat: 'mirror', params: { diam: 25.4, R: 99 }, schema: [DIAM, n('R', 'Reflectance', '%', 0, 100, 0.1)],
    note: 'A mirror with one straight edge, so it can pick off or combine beams that pass close together.', tech: [], sup: MIRRORS },
  galvo: { label: 'Galvo scan mirror', cat: 'mirror', params: { diam: 10, scan: 0, R: 98 }, schema: [n('diam', 'Mirror size', 'mm', 2, 50, 0.5), n('scan', 'Scan angle (mechanical)', '°', -20, 20, 0.1), n('R', 'Reflectance', '%', 0, 100, 0.1)],
    note: 'A fast motor-driven mirror; tilting it by an angle deflects the beam by twice that angle, which a scan lens turns into a moving spot.', tech: ['confocal', 'multiphoton'], sup: ['Novanta Photonics (Cambridge Technology)', 'Thorlabs'] },
  dm: { label: 'Deformable mirror', cat: 'mirror', params: { diam: 15, R: 98, shape: 'flat' }, schema: [n('diam', 'Aperture', 'mm', 2, 50, 0.5), o('shape', 'Shape', [['flat', 'flat'], ['defocus', 'defocus correction'], ['spherical', 'spherical aberration correction']])],
    note: 'A mirror whose surface is pushed by many actuators to cancel aberrations (adaptive optics); drawn as flat in this 2D model.', tech: ['adaptive-optics'], sup: ['Boston Micromachines', 'Thorlabs'] },
  slm: { label: 'Spatial light modulator', cat: 'mirror', params: { diam: 15, pattern: 'flat', angle: 1.5, R: 90 },
    schema: [n('diam', 'Aperture', 'mm', 2, 50, 0.5), o('pattern', 'Pattern', [['flat', 'flat (mirror)'], ['grating', 'grating: ±1 orders'], ['vortex', 'vortex phase ramp (STED doughnut)'], ['hologram', 'hologram']]),
      n('angle', 'Grating diffraction angle', '°', 0.1, 10, 0.1), n('R', 'Efficiency', '%', 0, 100, 1)],
    note: 'A liquid-crystal array that writes a phase pattern onto the beam: a grating splits it into diffraction orders, a vortex ramp makes the STED doughnut.', tech: ['sim', 'sted', 'adaptive-optics'], sup: ['Meadowlark Optics', 'HOLOEYE Photonics', 'Hamamatsu Photonics'] },
  dmd: { label: 'Digital micromirror device', cat: 'mirror', params: { diam: 15, state: 'on', tilt: 12 },
    schema: [n('diam', 'Aperture', 'mm', 2, 50, 0.5), o('state', 'Micromirrors', [['on', 'on (+tilt)'], ['off', 'off (−tilt)']]), n('tilt', 'Micromirror tilt', '°', 5, 17, 0.5)],
    note: 'Millions of tiny tilting mirrors switched on or off to project a binary pattern onto the sample.', tech: ['sim', 'frap'], sup: ['Thorlabs'] },
  periscope: { label: 'Periscope', cat: 'mirror', params: { rise: 75 }, schema: [n('rise', 'Height change', 'mm', 10, 300, 1)],
    note: 'Two mirrors that raise or lower the beam out of the table plane; in this top view the beam passes straight through.', tech: [], sup: MIRRORS },
  // --- beam splitters -------------------------------------------------------------------------
  dichroic: { label: 'Dichroic mirror', cat: 'split', params: { diam: 25.4, cut: 500, mode: 'lp', edge: 4 },
    schema: [DIAM, n('cut', 'Cut-on / cut-off wavelength', 'nm', 350, 1300, 1), o('mode', 'Type', [['lp', 'long-pass: reflects below, transmits above'], ['sp', 'short-pass: transmits below, reflects above']]), n('edge', 'Edge width', 'nm', 0.5, 40, 0.5)],
    note: 'A wavelength-selective mirror: it separates excitation from emission, or combines lasers of different colours.', tech: ['widefield', 'confocal', 'tirf'], sup: FILTERS },
  bs: { label: 'Beam splitter', cat: 'split', params: { diam: 25.4, R: 50 }, schema: [DIAM, n('R', 'Reflected fraction', '%', 0, 100, 1)],
    note: 'A partially reflecting plate or cube that divides power between two paths in a fixed ratio, independent of colour.', tech: [], sup: MIRRORS },
  pbs: { label: 'Polarizing beam splitter', cat: 'split', params: { diam: 25.4 }, schema: [DIAM],
    note: 'Transmits p-polarized light (in the table plane) and reflects s-polarized light; with a half-wave plate it is a variable attenuator.', tech: ['polarization'], sup: POL },
  // --- polarization ---------------------------------------------------------------------------
  hwp: { label: 'Half-wave plate', cat: 'pol', params: { diam: 25.4, axis: 22.5 }, schema: [DIAM, n('axis', 'Fast-axis angle', '°', -90, 90, 0.5)],
    note: 'Rotates linear polarization: light at angle ψ to the fast axis comes out at −ψ, a rotation of 2ψ.', tech: ['polarization'], sup: POL },
  qwp: { label: 'Quarter-wave plate', cat: 'pol', params: { diam: 25.4, axis: 45 }, schema: [DIAM, n('axis', 'Fast-axis angle', '°', -90, 90, 0.5)],
    note: 'Turns linear polarization at 45° to its axis into circular polarization, and circular back into linear.', tech: ['polarization', 'sted'], sup: POL },
  polarizer: { label: 'Polarizer', cat: 'pol', params: { diam: 25.4, axis: 0 }, schema: [DIAM, n('axis', 'Transmission axis', '°', -90, 90, 0.5)],
    note: 'Passes only the polarization along its axis; for linear light the transmission follows Malus’s law, cos²θ.', tech: ['polarization', 'dic'], sup: POL },
  // --- filters and apertures ------------------------------------------------------------------
  bandpass: { label: 'Band-pass filter', cat: 'filter', params: { diam: 25.4, center: 525, width: 50 }, schema: [DIAM, n('center', 'Centre', 'nm', 350, 1300, 1), n('width', 'Bandwidth', 'nm', 1, 300, 1)],
    note: 'Transmits a band of wavelengths and blocks the rest: the usual emission filter in front of a detector.', tech: ['widefield'], sup: FILTERS },
  longpass: { label: 'Long-pass filter', cat: 'filter', params: { diam: 25.4, cut: 500 }, schema: [DIAM, n('cut', 'Cut-on', 'nm', 350, 1300, 1)],
    note: 'Transmits wavelengths longer than the cut-on and blocks shorter ones, such as scattered laser light.', tech: ['widefield'], sup: FILTERS },
  shortpass: { label: 'Short-pass filter', cat: 'filter', params: { diam: 25.4, cut: 700 }, schema: [DIAM, n('cut', 'Cut-off', 'nm', 350, 1300, 1)],
    note: 'Transmits wavelengths shorter than the cut-off; in two-photon microscopes it blocks the infrared laser before the detectors.', tech: ['multiphoton'], sup: FILTERS },
  nd: { label: 'Neutral-density filter', cat: 'filter', params: { diam: 25.4, od: 1 }, schema: [DIAM, n('od', 'Optical density', 'OD', 0, 6, 0.1)],
    note: 'Attenuates all colours equally: transmission is 10 to the power −OD.', tech: [], sup: MIRRORS },
  iris: { label: 'Iris diaphragm', cat: 'filter', params: { diam: 25.4, open: 6 }, schema: [n('diam', 'Mount size', 'mm', 5, 100, 0.5), n('open', 'Opening', 'mm', 0.2, 60, 0.1)],
    note: 'An adjustable aperture: in a plane conjugate to the sample it is a field stop, in a pupil plane it limits the NA.', tech: ['brightfield'], sup: MIRRORS },
  pinhole: { label: 'Pinhole', cat: 'filter', params: { diam: 25.4, size: 50 }, schema: [n('diam', 'Mount size', 'mm', 5, 100, 0.5), n('size', 'Pinhole diameter', 'µm', 1, 2000, 1)],
    note: 'A tiny hole at a focus: it passes light from the focal spot and rejects out-of-focus light (confocal) or cleans a laser beam (spatial filter).', tech: ['confocal'], sup: MIRRORS },
  slit: { label: 'Slit', cat: 'filter', params: { diam: 25.4, width: 0.1 }, schema: [n('diam', 'Mount size', 'mm', 5, 100, 0.5), n('width', 'Slit width', 'mm', 0.005, 20, 0.005)],
    note: 'A line-shaped aperture, used in line-scanning confocal microscopes and spectrometers.', tech: ['confocal', 'spectral'], sup: MIRRORS },
  annulus: { label: 'Central stop (annulus)', cat: 'filter', params: { diam: 30, stop: 14 }, schema: [n('diam', 'Outer diameter', 'mm', 5, 100, 0.5), n('stop', 'Central stop diameter', 'mm', 0.5, 90, 0.5)],
    note: 'Blocks the centre of the beam so only a hollow cone of light reaches the condenser (darkfield, phase contrast).', tech: ['darkfield', 'phase-contrast'], sup: MIRRORS },
  pinhole_array: { label: 'Pinhole disk', cat: 'filter', params: { diam: 50, pitch: 5, size: 50 }, schema: [n('diam', 'Disk section', 'mm', 5, 120, 1), n('pitch', 'Pinhole spacing', 'mm', 0.2, 20, 0.1), n('size', 'Pinhole diameter', 'µm', 5, 500, 1)],
    note: 'The Nipkow disk of a spinning-disk confocal: many pinholes scan the sample in parallel as it spins.', tech: ['spinning-disk'], sup: ['Thorlabs'] },
  dump: { label: 'Beam dump / block', cat: 'filter', params: { size: 15 }, schema: [n('size', 'Width', 'mm', 2, 100, 1)],
    note: 'Safely absorbs unwanted beams; every stray laser beam on a real table should end in one.', tech: [], sup: MIRRORS },
  // --- lenses and objectives ------------------------------------------------------------------
  lens: { label: 'Thin lens', cat: 'lens', params: { diam: 25.4, f: 100, chromatic: 'no' }, schema: [DIAM, n('f', 'Focal length (negative: diverging)', 'mm', -1000, 1000, 1), o('chromatic', 'Glass', [['no', 'ideal (no dispersion)'], ['yes', 'BK7 singlet (focus shifts with colour)']])],
    note: 'Bends each ray in proportion to its height: a parallel beam focuses at the focal length f.', tech: [], sup: MIRRORS },
  achromat: { label: 'Achromatic doublet', cat: 'lens', params: { diam: 25.4, f: 100 }, schema: [DIAM, n('f', 'Focal length', 'mm', -1000, 1000, 1)],
    note: 'Two cemented glasses whose dispersions cancel, so red and blue focus at the same distance.', tech: [], sup: MIRRORS },
  cyl: { label: 'Cylindrical lens', cat: 'lens', params: { diam: 25.4, f: 50, axis: 'in' }, schema: [DIAM, n('f', 'Focal length', 'mm', -1000, 1000, 1), o('axis', 'Power', [['in', 'in the table plane'], ['out', 'out of the plane (no effect in this view)']])],
    note: 'Focuses in one direction only, turning a round beam into a line or a sheet of light.', tech: ['light-sheet'], sup: MIRRORS },
  tube: { label: 'Tube lens', cat: 'lens', params: { diam: 30, f: 200 }, schema: [n('diam', 'Clear aperture', 'mm', 5, 60, 0.5), n('f', 'Focal length', 'mm', 50, 400, 1)],
    note: 'Forms the image from an infinity-corrected objective; magnification = f(tube lens) / f(objective).', tech: ['widefield'], sup: MIRRORS },
  objective: { label: 'Objective', cat: 'lens', params: { model: '', mag: 60, na: 1.4, nimm: 1.518, ftl: 200 }, db: 'objectives',
    schema: [{ k: 'model', label: 'Real objective', type: 'objective' }, n('mag', 'Magnification', '×', 1, 200, 1), n('na', 'Numerical aperture', '', 0.05, 1.7, 0.01),
      n('nimm', 'Immersion index', '', 1, 1.8, 0.001), n('ftl', 'Design tube-lens focal length', 'mm', 100, 250, 1)],
    note: 'Collects light from the sample: focal length = tube-lens focal length / magnification, and NA = n sin θ caps the cone it accepts.', tech: ['widefield', 'confocal', 'tirf'], sup: ['Thorlabs', 'Edmund Optics'] },
  expander: { label: 'Beam expander', cat: 'lens', params: { kind: 'kepler', f1: 50, f2: 150, diam: 25.4 },
    schema: [o('kind', 'Design', [['kepler', 'Keplerian (two positive lenses)'], ['galileo', 'Galilean (negative + positive)']]), n('f1', 'First lens |f|', 'mm', 5, 500, 1), n('f2', 'Second lens f', 'mm', 5, 1000, 1), DIAM],
    note: 'Two lenses spaced by the sum of their focal lengths widen a beam by f2/f1 (Keplerian has an internal focus, Galilean does not).', tech: [], sup: MIRRORS },
  mla: { label: 'Microlens disk', cat: 'lens', params: { diam: 50, pitch: 5, f: 40 }, schema: [n('diam', 'Disk section', 'mm', 5, 120, 1), n('pitch', 'Lens spacing', 'mm', 0.2, 20, 0.1), n('f', 'Microlens focal length', 'mm', 1, 200, 1)],
    note: 'An array of tiny lenses that focuses the beam into the pinholes of a spinning disk, raising light throughput.', tech: ['spinning-disk'], sup: ['Thorlabs', 'Edmund Optics'] },
  // --- prisms, modulators, fibres -------------------------------------------------------------
  prism: { label: 'Prism', cat: 'ao', params: { side: 30, apex: 60, n: 1.517, disp: 'yes', base: 'air' },
    schema: [n('side', 'Side length', 'mm', 5, 100, 1), n('apex', 'Apex angle', '°', 10, 120, 1), n('n', 'Refractive index (589 nm)', '', 1.3, 2.2, 0.001),
      o('disp', 'Dispersion', [['yes', 'BK7-like'], ['no', 'none']]), o('base', 'Base face', [['air', 'in air'], ['matched', 'index-matched to a slide']])],
    note: 'Refracts light by Snell’s law at each face; dispersion spreads colours, and an index-matched prism couples a beam into a slide for TIRF.', tech: ['tirf', 'spectral'], sup: MIRRORS },
  raprism: { label: 'Right-angle prism', cat: 'ao', params: { leg: 25, n: 1.517 }, schema: [n('leg', 'Leg length', 'mm', 5, 100, 1), n('n', 'Refractive index', '', 1.3, 2.2, 0.001)],
    note: 'Folds the beam by 90° (or 180°) by total internal reflection at the hypotenuse, with no metal coating to lose light.', tech: [], sup: MIRRORS },
  aotf: { label: 'AOTF', cat: 'ao', params: { diam: 6, lambda: 488, bw: 3, eff: 90, angle: 3 },
    schema: [n('diam', 'Aperture', 'mm', 1, 20, 0.5), n('lambda', 'Selected wavelength', 'nm', 350, 1100, 1), n('bw', 'Passband', 'nm', 0.5, 20, 0.5), n('eff', 'Diffraction efficiency', '%', 0, 100, 1), n('angle', 'Diffraction angle', '°', 0.5, 10, 0.1)],
    note: 'An acousto-optic crystal whose sound wave diffracts only the selected colour by a small angle: a fast, electronic laser switch and attenuator.', tech: ['confocal', 'spectral'], sup: ['AA Opto-Electronic'] },
  aom: { label: 'AOM', cat: 'ao', params: { diam: 3, eff: 80, angle: 1 }, schema: [n('diam', 'Aperture', 'mm', 0.5, 20, 0.5), n('eff', 'Diffraction efficiency', '%', 0, 100, 1), n('angle', 'First-order angle', '°', 0.1, 10, 0.1)],
    note: 'An acousto-optic modulator: switches or shifts a single laser line by diffracting it into the first order.', tech: ['flim'], sup: ['AA Opto-Electronic'] },
  fibre_in: { label: 'Fibre coupler', cat: 'ao', params: { f: 8, na: 0.12, core: 4 }, schema: [n('f', 'Coupling lens focal length', 'mm', 1, 100, 0.5), n('na', 'Fibre NA', '', 0.01, 0.5, 0.01), n('core', 'Core diameter', 'µm', 1, 1000, 0.5)],
    note: 'A lens focuses the beam onto the fibre core; light couples only if the spot lands on the core within the fibre NA.', tech: ['open-hardware'], sup: ['Thorlabs', 'Omicron-Laserage'] },
  // --- samples -------------------------------------------------------------------------------
  sample: { label: 'Fluorescent sample', cat: 'sample', params: { dye: 'EGFP', width: 20, absorb: 20, qy: 60, emit: 'epi', cone: 70, rays: 9, photon: '1', specimen: 'auto' },
    schema: [{ k: 'dye', label: 'Dye or fluorescent protein', type: 'dye' }, n('width', 'Width', 'mm', 0.5, 100, 0.5), n('absorb', 'Absorbed at the excitation peak', '%', 0, 100, 1),
      n('qy', 'Quantum yield', '%', 0, 100, 1), o('emit', 'Emission drawn', [['epi', 'back toward the excitation (epi)'], ['forward', 'forward'], ['both', 'both sides'], ['all', 'all directions']]),
      n('cone', 'Cone half-angle drawn', '°', 5, 90, 1), n('rays', 'Emission rays per hit', '', 2, 36, 1), o('photon', 'Excitation', [['1', 'one-photon'], ['2', 'two-photon (uses λ/2)']]), SPEC],
    note: 'Absorbs excitation light according to the dye’s excitation spectrum and re-emits at its emission peak, in every direction.', tech: ['widefield'], sup: [] },
  scatter: { label: 'Scattering sample', cat: 'sample', params: { width: 20, frac: 30, emit: 'all', cone: 60, rays: 9, specimen: 'auto' },
    schema: [n('width', 'Width', 'mm', 0.5, 100, 0.5), n('frac', 'Fraction scattered', '%', 0, 100, 1), o('emit', 'Scattered light drawn', [['epi', 'backward'], ['forward', 'forward'], ['all', 'both sides']]), n('cone', 'Cone half-angle', '°', 5, 90, 1), n('rays', 'Rays per hit', '', 2, 36, 1), SPEC],
    note: 'Redirects part of the light without changing its colour: the contrast of darkfield, iSCAT and brightfield.', tech: ['darkfield', 'iscat', 'brightfield'], sup: [] },
  tirf: { label: 'Coverslip / TIRF interface', cat: 'sample', params: { width: 30, n1: 1.518, n2: 1.33, dye: 'none', absorb: 20, qy: 60, collect: 'glass', cone: 80, rays: 11, specimen: 'auto' },
    schema: [n('width', 'Width', 'mm', 1, 100, 0.5), n('n1', 'Glass index n₁', '', 1, 2, 0.001), n('n2', 'Sample index n₂', '', 1, 2, 0.001),
      { k: 'dye', label: 'Fluorophore at the surface', type: 'dye', none: true }, n('absorb', 'Absorbed at the excitation peak', '%', 0, 100, 1), n('qy', 'Quantum yield', '%', 0, 100, 1),
      o('collect', 'Emission drawn into', [['glass', 'the glass (objective-type)'], ['sample', 'the sample side (prism-type)']]), n('cone', 'Cone half-angle drawn', '°', 5, 90, 1), n('rays', 'Emission rays per hit', '', 2, 36, 1), SPEC],
    note: 'Glass (n₁) meets watery sample (n₂): beyond the critical angle the beam is totally reflected and only an evanescent field ~100 nm deep excites the sample.', tech: ['tirf', 'hilo'], sup: [] },
  // --- detectors -----------------------------------------------------------------------------
  camera: { label: 'Camera', cat: 'det', params: { model: '', size: 13.3, px: 6.5, qe: 80, sensor: 'sCMOS', read: 1.6, bits: 16 }, db: 'detectors',
    schema: [{ k: 'model', label: 'Real camera', type: 'camera' }, n('size', 'Sensor width', 'mm', 1, 50, 0.1), n('px', 'Pixel size', 'µm', 1, 30, 0.1), n('qe', 'Quantum efficiency', '%', 1, 100, 1),
      o('sensor', 'Sensor type', [['sCMOS', 'sCMOS'], ['qCMOS', 'qCMOS'], ['EMCCD', 'EMCCD (electron multiplying)'], ['CCD', 'CCD'], ['CMOS', 'CMOS']]), n('read', 'Read noise (without EM gain)', 'e⁻ rms', 0, 200, 0.1), n('bits', 'Bit depth', 'bit', 8, 16, 1)],
    note: 'An array detector in the image plane: pixel size divided by magnification sets the sampling at the sample.', tech: ['widefield', 'smlm', 'tirf'], sup: CAMS },
  pmt: { label: 'PMT / APD / HyD', cat: 'det', params: { model: '', size: 5, qe: 40 }, db: 'points',
    schema: [{ k: 'model', label: 'Real detector', type: 'point' }, n('size', 'Active area', 'mm', 0.05, 20, 0.05), n('qe', 'Detection efficiency', '%', 1, 100, 1)],
    note: 'A single-element, very sensitive detector that measures the total light from a scanned spot, one pixel at a time.', tech: ['confocal', 'multiphoton', 'fcs'], sup: ['Hamamatsu Photonics', 'Excelitas Technologies'] },
  powermeter: { label: 'Power meter', cat: 'det', params: { size: 10 }, schema: [n('size', 'Sensor width', 'mm', 1, 50, 0.5)],
    note: 'Measures beam power: check it at the back aperture and at the sample whenever you align or change the laser.', tech: [], sup: ['Thorlabs', 'Coherent', 'Newport (MKS)'] },
  eyepiece: { label: 'Eyepiece (to the eye)', cat: 'det', params: { size: 20 }, schema: [n('size', 'Field stop', 'mm', 5, 30, 0.5)],
    note: 'Magnifies the intermediate image for the eye; never look into an eyepiece with a laser on the table.', tech: ['brightfield', 'widefield'], sup: MIRRORS },
  profiler: { label: 'Beam profiler', cat: 'det', params: { size: 10, px: 5.5 }, schema: [n('size', 'Sensor width', 'mm', 1, 30, 0.5), n('px', 'Pixel size', 'µm', 1, 20, 0.1)],
    note: 'A camera without a lens that records where rays land, giving the beam centroid and size.', tech: [], sup: ['Thorlabs', 'Coherent'] },
};

export const DETECTOR_TYPES = ['camera', 'pmt', 'powermeter', 'eyepiece', 'profiler'];
export const SOURCE_TYPES = ['laser', 'led', 'lamp', 'fibre_out'];

// Standard tube-lens focal lengths of infinity-corrected systems (from the makers' documentation).
export const TUBE_F = { Nikon: 200, 'Leica Microsystems': 200, 'Evident (Olympus)': 180, ZEISS: 165 };

// Merge defaults into a component (returns a new object).
export function withDefaults(c) {
  const p = PARTS[c.type];
  return { id: c.id, type: c.type, x: +c.x || 0, y: +c.y || 0, rot: +c.rot || 0, label: c.label, params: { ...(p ? p.params : {}), ...(c.params || {}) } };
}
