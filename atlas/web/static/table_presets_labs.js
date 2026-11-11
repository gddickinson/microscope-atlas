// Virtual Optical Table: set-ups from the Parker lab (UC Irvine), the Pathak lab (UC Irvine) and the Hughes lab (Boise
// State), each from the group's papers (DOIs checked against Crossref) or the Parker lab's construction notes. Like the
// literature set, these are simplified teaching schematics: parts and values come from the cited Methods; what is
// drawn differently, or not stated in the source, is listed in `simplified`.
import { c, df } from './table_presets_basic.js';

const OLY = (mag, na, nimm = 1.518) => ({ mag, na, nimm, ftl: 180 });   // Olympus objectives: 180 mm tube lens
const NIK = (mag, na, nimm = 1.518) => ({ mag, na, nimm, ftl: 200 });   // Nikon objectives: 200 mm tube lens
// Cameras: database values where the paper names exactly that model (cameraParams of the database entry); otherwise only
// what the paper states (sensor type, pixel size) and the table's defaults for the rest.
const CASCADE128P = { model: 'photometrics-cascade-128-plus', px: 24, qe: 90, size: 3.07, sensor: 'EMCCD', read: 65, bits: 16 };
const FUSIONBT = { model: 'hamamatsu-orca-fusion-bt', px: 6.5, size: 14.98, sensor: 'sCMOS', read: 0.7, bits: 16 };
const EMCCD = { sensor: 'EMCCD', read: 50 };

// Objective-type TIRF train on an inverted stand. Sources (ending in a beam travelling +y along x = 600 + off) are
// focused by a lens of focal length f onto the objective's back focal plane, `off` mm from the axis; the main dichroic at
// (600, 300) sends the light to the objective at x = 700; emission returns through the filters to the camera.
// `side` adds a second input on a dichroic at x = 650 (light arriving from below, travelling −y).
function tirf({ off, f = 150, src, cut, obj, dye, width = 6, filt, tube, cam, camLabel, side = [] }) {
  return [...src, c('lens', 600 + off, 300 - (f - 100), 90, { f }), c('dichroic', 600, 300, -45, { cut }), ...side,
    c('objective', 700, 300, 0, obj), c('tirf', 700 + df(obj.mag, obj.nimm, obj.ftl), 300, 0, { dye, width }),
    filt, c('tube', 500, 300, 180, { f: tube || obj.ftl }), c('camera', 300, 300, 180, cam, camLabel)];
}
const laserDown = (x, p, label) => c('laser', x, 20, 90, { diam: 1, div: 0, ...p }, label);
const fibreDown = (x, p, label) => [c('fibre_out', x, 20, 90, { mode: 'own', na: 0.05, ...p }, label), c('lens', x, 70, 90, { f: 50 }, 'collimator')];
const T = 4.2;  // TIRF offset (mm) for a 60x/1.45 objective with a 180 mm tube lens (critical radius 3.99 mm, pupil 4.35 mm)

const PARKER_TIRF = 'Dickinson GD, Parker I (2013) Temperature dependence of IP3-mediated local and global Ca2+ signals. Biophys J 104:386-395';

export const LABS = [
  // ---------------------------------------------------------------- Parker lab
  { id: 'lab-parker-flash-tirf', title: 'Parker lab: TIRF puff imaging with UV flash photolysis', tech: ['tirf', 'widefield'],
    cite: PARKER_TIRF, doi: '10.1016/j.bpj.2012.12.024',
    simplified: 'From the Methods: Olympus IX70, 60x NA 1.45 TIRF objective, 488 nm argon-ion laser focused at the extreme edge of the back aperture for TIRF (centrally for widefield), emission > 510 nm, Cascade 128 EMCCD at 500 frames/s; a UV flash (350-400 nm) from an arc lamp illuminated a region slightly larger than the field to photorelease caged IP3. The flash is drawn as a 375 nm source with a 50 nm band entering through a second dichroic, as in the lab\'s multi-focal system; distances are illustrative.',
    desc: 'The lab\'s calcium-puff rig: TIRF images of Fluo-4 at 500 frames per second, and a UV flash that releases IP3 inside the cells.',
    components: tirf({ off: T, cut: 500, obj: OLY(60, 1.45), dye: 'Fluo-4', filt: c('longpass', 560, 300, 180, { cut: 510 }), cam: EMCCD, camLabel: 'Cascade 128 EMCCD',
      src: [laserDown(600 + T, { lambda: 488 }, 'Argon-ion laser 488 nm')],
      side: [c('dichroic', 650, 300, 45, { cut: 420 }, 'UV dichroic'), c('led', 650, 470, -90, { lambda: 375, fwhm: 50, power: 100, diam: 10, spread: 4 }, 'UV flash: arc lamp, 350-400 nm')] }) },
  { id: 'lab-parker-laser-spot', title: 'Parker lab: steerable 405 nm laser spot for local photorelease', tech: ['tirf'],
    cite: 'Dickinson GD, Ellefsen KL, Dawson SP, Pearson JE, Parker I (2016) Hindered cytoplasmic diffusion of inositol trisphosphate restricts its cellular range of action. Sci Signal 9:ra108', doi: '10.1126/scisignal.aag1625',
    simplified: 'From the Methods: TIRF on an Olympus IX70 with a 60x NA 1.45 objective, 488 nm excitation, emission > 510 nm on an Evolve 512 EMCCD (0.266 um pixels, ~66 frames/s); photolysis by a 405 nm laser diode steered by computer-controlled galvanometer mirrors (one drawn), intensity set by a variable ND wheel, aimed with a dim coaxial 450 nm guide laser. Where the photolysis beam joins the microscope is not described in the paper: it is drawn entering through a second dichroic, collimated so that it focuses to a spot in the cell.',
    desc: 'Release IP3 at one spot (or step the spot along the cell) and watch how far its action reaches, using puffs as detectors.',
    components: tirf({ off: T, cut: 500, obj: OLY(60, 1.45), dye: 'Fluo-4', filt: c('longpass', 560, 300, 180, { cut: 510 }), cam: EMCCD, camLabel: 'Evolve 512 EMCCD',
      src: [laserDown(600 + T, { lambda: 488 }, 'TIRF laser 488 nm')],
      side: [c('dichroic', 650, 300, 45, { cut: 470 }, 'Photolysis dichroic'), c('galvo', 650, 420, -45, { scan: 0 }, 'Galvo mirrors (steer the spot)'), c('nd', 760, 420, 0, { od: 0.5 }, 'Variable ND wheel'),
        c('dichroic', 860, 420, -45, { cut: 430 }, 'Combines 405 and 450'), c('laser', 960, 420, 180, { lambda: 450, diam: 1, div: 0, power: 1 }, '450 nm guide laser'),
        c('laser', 860, 560, -90, { lambda: 405, diam: 1, div: 0, power: 20 }, '405 nm photolysis laser')] }) },
  { id: 'lab-parker-shadowless-tirf', title: 'Parker lab: spinning-spot shadowless TIRF', tech: ['tirf', 'open-hardware'],
    cite: 'Ellefsen KL, Dynes JL, Parker I (2015) Spinning-spot shadowless TIRF microscopy. PLoS One 10:e0136055', doi: '10.1371/journal.pone.0136055',
    simplified: 'From the paper: 488 and 532 nm lasers (488 drawn) through a single-mode fibre, collimated to an 8 mm beam by a parabolic mirror (drawn as a lens), two galvanometer mirrors driven by 90°-shifted sine waves that spin the spot around the edge of the back focal plane (one drawn, frozen at one point of the circle), a 10x eyepiece scan lens and a 50 mm f/1.8 camera lens as tube lens (drawn as one focusing lens), a 500 nm dichroic and 510 nm long-pass filter on an Olympus IX70 with a 60x NA 1.45 objective, and a Cascade 128 EMCCD. In a 2D table the circle cannot be drawn: tilt the galvo to move the spot across the pupil.',
    desc: 'Spinning the TIRF spot around the pupil during each exposure averages out the streaks and shadows of single-direction TIRF.',
    components: tirf({ off: T, f: 150, cut: 500, obj: OLY(60, 1.45), dye: 'Fluo-4', filt: c('longpass', 560, 300, 180, { cut: 510 }), cam: EMCCD, camLabel: 'Cascade 128 EMCCD',
      src: [c('fibre_out', 480, 120, 0, { mode: 'own', lambda: 488, na: 0.05 }, 'Single-mode fibre (488 + 532 nm)'), c('lens', 530, 120, 0, { f: 50 }, 'Collimator (parabolic mirror)'),
        c('galvo', 600 + T, 120, -45, { scan: 0 }, 'Galvo pair (spins the spot)')] }) },
  { id: 'lab-parker-axial-linescan', title: 'Parker lab: axial line-scan confocal with UV photolysis', tech: ['confocal'],
    cite: 'Callamaras N, Parker I (1999) Radial localization of inositol 1,4,5-trisphosphate-sensitive Ca2+ release sites in Xenopus oocytes resolved by axial confocal linescan imaging. J Gen Physiol 113:199-213', doi: '10.1085/jgp.113.2.199',
    simplified: 'From the paper and the lab\'s construction notes: Olympus IX70, 40x oil objective NA 1.35 on a piezoelectric focus drive (scans the spot up and down through the oocyte at up to 200 Hz; not drawn), an attenuated 488 nm beam from a 100 mW argon laser, DM2 reflecting < 500 nm, a > 510 nm barrier filter, a confocal pinhole and an avalanche photodiode; DM1 (reflecting < 400 nm) with a 340-400 nm filter brings near-UV light from a shuttered arc lamp (drawn as a 370 nm source). The pulsed 355 nm UV laser is omitted; distances and the pinhole size are illustrative.',
    desc: 'Instead of scanning sideways, the stationary confocal spot is driven along the optical axis, giving fast "radial" images of calcium release deep in an oocyte.',
    components: [c('laser', 40, 250, 0, { lambda: 488, diam: 0.7, div: 0 }, 'Argon laser 488 nm (attenuated)'), c('expander', 160, 250, 0, { f1: 25, f2: 75 }), c('dichroic', 300, 250, -45, { cut: 500 }, 'DM2'),
      c('mirror', 300, 400, -45), c('lens', 350, 400, 0, { f: 50 }), c('tube', 580, 400, 0, { f: 180 }), c('dichroic', 700, 400, 45, { cut: 410 }, 'DM1'),
      c('objective', 800, 400, 0, OLY(40, 1.35), 'Objective on piezo focus drive'), c('sample', 800 + df(40, 1.518, 180), 400, 0, { dye: 'Fluo-4', width: 4 }),
      c('bandpass', 700, 470, -90, { center: 370, width: 60 }, 'F1 340-400 nm'), c('led', 700, 540, -90, { lambda: 370, fwhm: 60, power: 100, diam: 10, spread: 4 }, 'Arc lamp (near-UV)'),
      c('longpass', 300, 225, -90, { cut: 510 }, 'F2'), c('lens', 300, 200, -90, { f: 100 }), c('pinhole', 300, 100, -90, { size: 50 }), c('pmt', 300, 70, -90, { size: 0.2, qe: 60 }, 'Avalanche photodiode')] },
  { id: 'lab-parker-video-confocal', title: 'Parker lab: video-rate confocal (resonant scanner)', tech: ['confocal', 'open-hardware'],
    cite: 'Callamaras N, Parker I (1999) Construction of a confocal microscope for real-time x-y and x-z imaging. Cell Calcium 26:271-279', doi: '10.1054/ceca.1999.0085',
    url: 'https://evanescentlight.com/microscopy_construction/VideoRate_confocal.htm',
    simplified: 'From the construction notes: scan system on an optical table at the video port of an Olympus IX50, DM 500 nm, a resonant x mirror and an off-axis y galvo (one drawn), a plano-concave L1 (f = -50 cm, omitted), a 10x eyepiece as scan lens, an adjustable knife-blade aperture as the confocal aperture (drawn as a pinhole), a 510 nm long-pass barrier filter, an iris and a Hamamatsu R-928 PMT; UV flash photolysis on the epi port (omitted). The laser is not named on the page: drawn at 488 nm, as in the lab\'s other systems of the time. Objective illustrative.',
    desc: 'A resonant mirror sweeps the spot thousands of times a second, giving confocal calcium images at video rate.',
    components: [c('laser', 40, 250, 0, { lambda: 488, diam: 0.7, div: 0 }), c('expander', 160, 250, 0, { f1: 25, f2: 75 }), c('dichroic', 300, 250, -45, { cut: 500 }, 'DM 500 nm'),
      c('galvo', 300, 400, -45, { scan: 0 }, 'Resonant + y scan mirrors'), c('lens', 325, 400, 0, { f: 25 }, 'Scan lens (10x eyepiece)'), c('tube', 530, 400, 0, { f: 180 }),
      c('objective', 710, 400, 0, OLY(40, 1.35)), c('sample', 710 + df(40, 1.518, 180), 400, 0, { dye: 'Fluo-4', width: 4 }),
      c('longpass', 300, 225, -90, { cut: 510 }, 'Barrier filter 510 nm'), c('lens', 300, 200, -90, { f: 100 }), c('pinhole', 300, 100, -90, { size: 100 }, 'Knife-blade aperture (adjustable)'),
      c('iris', 300, 85, -90, { open: 6 }), c('pmt', 300, 60, -90, { qe: 20 }, 'PMT (Hamamatsu R-928)')] },
  { id: 'lab-parker-multifocal', title: 'Parker lab: three-camera multi-focal imaging', tech: ['widefield'],
    cite: 'Demuro A, Parker I (2008) Multi-dimensional resolution of elementary Ca2+ signals by simultaneous multi-focal imaging. Cell Calcium 43:367-374', doi: '10.1016/j.ceca.2007.07.002',
    simplified: 'From the Methods: Olympus IX71, 40x NA 1.35 oil objective, 488 nm 100 mW argon laser for widefield excitation, 500 nm dichroic, 510 nm long-pass filter, a second dichroic for UV flashes (omitted), a diverging lens L1 at the side port, BS1 reflecting 30% to camera 1 and BS2 (50/50) splitting the rest to cameras 2 and 3, all Cascade 128+ EMCCDs on translation stages set at different distances so each is focused at a different depth. Path lengths are exaggerated, as in the paper\'s own diagram; the laser is drawn as an expanded, slightly divergent beam so that it floods the field (the beam-shaping optics are not described).',
    desc: 'Three cameras focused a few hundred nanometres apart record three planes at once, so puffs can be located in depth at full camera speed.',
    components: [c('laser', 600, 20, 90, { lambda: 488, diam: 8, div: 20 }, 'Argon laser 488 nm (expanded)'), c('lens', 600, 200, 90, { f: 200 }), c('dichroic', 600, 300, -45, { cut: 500 }),
      c('objective', 700, 300, 0, OLY(40, 1.35)), c('sample', 700 + df(40, 1.518, 180), 300, 0, { dye: 'Fluo-4', width: 6 }),
      c('longpass', 560, 300, 180, { cut: 510 }), c('tube', 520, 300, 180, { f: 180 }), c('lens', 470, 300, 180, { f: -200 }, 'L1 (diverging)'),
      c('bs', 420, 300, -45, { R: 30 }, 'BS1 (30%)'), c('camera', 420, 130, -90, CASCADE128P, 'Cam1 (Cascade 128+)'),
      c('bs', 330, 300, 45, { R: 50 }, 'BS2 (50/50)'), c('camera', 330, 470, 90, CASCADE128P, 'Cam2 (Cascade 128+)'), c('camera', 160, 300, 180, CASCADE128P, 'Cam3 (Cascade 128+)')] },
  { id: 'lab-parker-lattice', title: 'Parker lab: simplified lattice light-sheet', tech: ['lattice-light-sheet', 'light-sheet', 'open-hardware'], board: { w: 1200, h: 600 },
    cite: 'Ellefsen KL, Parker I (2018) Dynamic Ca2+ imaging with a simplified lattice light-sheet microscope: a sideways view of subcellular Ca2+ puffs. Cell Calcium 71:34-44', doi: '10.1016/j.ceca.2017.11.005',
    simplified: 'From the Methods: 478 and 562 nm lasers (478 drawn) combined and expanded, two pairs of cylindrical lenses forming a thin slit of light on a custom graticule (drawn as a slit) instead of a spatial light modulator, a half-wave plate and polarizing beam splitter for attenuation, an annular mask in the Fourier plane passing only the first diffraction order, relay lenses to a dither galvanometer and on to a Nikon 40x NA 0.8 water-dipping projection objective; an identical detection objective at 90°, a 500 mm tube lens, a 520 ± 20 nm emission filter and an Andor Zyla 4.2 sCMOS; a 405 nm laser for photorelease enters through the detection objective (omitted). Lens focal lengths and spacings are illustrative. A ray tracer cannot form the lattice (an interference pattern), so the relay is simplified: here a demagnifying relay sends a narrow beam into the projection objective, and the annular mask removes its centre, so two shallow beams cross at the focus to form a thin sheet (a ray picture of the Bessel beams that make the lattice); in the instrument the mask is conjugate to the objective pupil.',
    desc: 'A home-built lattice light sheet for about a tenth of the price of a commercial one: a printed graticule makes the lattice, and puffs are seen side-on.',
    components: [c('laser', 40, 300, 0, { lambda: 488, diam: 1, div: 0 }, 'Laser 478 nm'), c('expander', 120, 300, 0, { f1: 25, f2: 75 }), c('hwp', 210, 300, 0, { axis: 22.5 }), c('pbs', 250, 300, 0, {}, 'PBS (attenuation)'),
      c('cyl', 310, 300, 0, { f: 50 }), c('slit', 360, 300, 0, { width: 0.5 }, 'Graticule (lattice pattern)'), c('lens', 460, 300, 0, { f: 100 }),
      c('annulus', 560, 300, 0, { diam: 30, stop: 2 }, 'Annular mask'), c('lens', 660, 300, 0, { f: 100 }, 'Relay lens 1'),
      c('lens', 780, 300, 0, { f: 20 }, 'Relay lens 2 (dither galvo plane; galvo not drawn)'),
      c('objective', 900, 300, 0, NIK(40, 0.8, 1.333), 'Projection objective'),
      c('sample', 900 + df(40, 1.333, 200), 300, 0, { dye: 'Fluo-4', width: 4, emit: 'all', rays: 36 }),
      c('objective', 900 + df(40, 1.333, 200), 300 - df(40, 1.333, 200), 90, NIK(40, 0.8, 1.333), 'Detection objective'),
      c('bandpass', 906.66, 220, -90, { center: 520, width: 40 }), c('tube', 906.66, 180, -90, { f: 500 }), c('mirror', 906.66, 60, 45), c('camera', 1100, 60, 0, { sensor: 'sCMOS' }, 'Andor Zyla 4.2 sCMOS')] },
  { id: 'lab-parker-sptpalm', title: 'Parker lab: single-molecule tracking (sptPALM) in semi-TIRF', tech: ['hilo', 'spt', 'smlm'],
    cite: 'Smith IF, Swaminathan D, Dickinson GD, Parker I (2014) Single-molecule tracking of inositol trisphosphate receptors reveals different motilities and distributions. Biophys J 107:834-845', doi: '10.1016/j.bpj.2014.05.051',
    simplified: 'From the Methods: custom TIRF system on an Olympus IX70 with an Olympus 100x NA 1.40 objective; weak 405 nm light photoconverts a few mEos2-IP3R1 molecules at a time, and 561 nm light excites the red form, both in semi-TIRF (a sheet restricted to the bottom few micrometres); a 568 nm sharp-edge long-pass filter and an Evolve 512 EMCCD (167 nm per pixel, 150 ms frames). The red form of mEos2 is drawn with tdTomato spectra (the atlas has no spectrum of photoconverted mEos2); distances illustrative.',
    desc: 'Photoconvert a few tagged receptors at a time and track each one, frame by frame, in a thin inclined sheet of light.',
    components: tirf({ off: 2.25, f: 150, cut: 570, obj: OLY(100, 1.4), dye: 'tdTomato', filt: c('longpass', 560, 300, 180, { cut: 568 }, '568 nm long-pass'), cam: EMCCD, camLabel: 'Evolve 512 EMCCD',
      src: [laserDown(602.25, { lambda: 561 }, '561 nm excitation'), c('dichroic', 602.25, 110, -45, { cut: 480 }), c('laser', 480, 110, 0, { lambda: 405, diam: 1, div: 0, power: 1 }, '405 nm photoconversion (weak)')] }) },
  // ---------------------------------------------------------------- Pathak lab
  { id: 'lab-pathak-flicker-tirf', title: 'Pathak lab: TIRF of Piezo1 Ca2+ flickers', tech: ['tirf'],
    cite: 'Ellefsen KL, Holt JR, Chang AC, Nourse JL, Arulmoli J, Mekhdjian AH, Abuwarda H, Tombola F, Flanagan LA, Dunn AR, Parker I, Pathak MM (2019) Myosin-II mediated traction forces evoke localized Piezo1-dependent Ca2+ flickers. Commun Biol 2:298', doi: '10.1038/s42003-019-0514-3',
    simplified: 'From the Methods: motorized Olympus IX83 with an automated 4-line cellTIRF illuminator (fibre-coupled lasers; 488 nm drawn), a PLAPO 60x oil objective NA 1.45 and a Hamamatsu Flash 4.0 v2+ sCMOS at 9.54 frames/s, imaging the calcium indicator Cal-520 (drawn with Fluo-4 spectra, which the atlas has). The filter cube is not stated: a 500 nm dichroic and 510 nm long-pass filter are drawn. Some hNSPC recordings used the Parker lab\'s spinning-spot shadowless TIRF (see that preset).',
    desc: 'Calcium flickers through single Piezo1 channels, made by the cell\'s own traction forces, imaged at the coverslip.',
    components: tirf({ off: T, cut: 500, obj: OLY(60, 1.45), dye: 'Fluo-4', filt: c('longpass', 560, 300, 180, { cut: 510 }), cam: { sensor: 'sCMOS', read: 1.6 }, camLabel: 'Hamamatsu Flash 4.0 v2+ sCMOS',
      src: fibreDown(600 + T, { lambda: 488 }, 'cellTIRF illuminator fibre (488 nm)') }) },
  { id: 'lab-pathak-traction-tirf', title: 'Pathak lab: FRET traction-force sensor and Ca2+ imaging in one cell', tech: ['tirf', 'fret'],
    cite: 'Ellefsen KL, Holt JR, Chang AC, Nourse JL, Arulmoli J, Mekhdjian AH, Abuwarda H, Tombola F, Flanagan LA, Dunn AR, Parker I, Pathak MM (2019) Myosin-II mediated traction forces evoke localized Piezo1-dependent Ca2+ flickers. Commun Biol 2:298', doi: '10.1038/s42003-019-0514-3',
    simplified: 'From the Methods: TIRF on a Nikon TiE with an Apo TIRF 100x oil objective NA 1.49; the FRET force probe excited at 532 nm (Crystalaser), then a motorized flip mount (Thorlabs) switches the emission filters and Cal-520 is excited at 473 nm (Coherent Obis), on an Andor iXon EMCCD (5 frames/s for FRET; 15.29 ms exposures for calcium). Drawn in the calcium configuration (473 nm, Cal-520 shown with Fluo-4 spectra); the 532 nm laser and FRET filters are listed but not traced. Filter values illustrative.',
    desc: 'Measure the pulling forces under a cell with a FRET sensor, then flip filters and image Piezo1 calcium flickers in the same cell.',
    components: tirf({ off: 2.8, f: 200, cut: 495, obj: NIK(100, 1.49), dye: 'Fluo-4', filt: c('bandpass', 560, 300, 180, { center: 525, width: 50 }, 'Flip-mounted emission filter'), cam: EMCCD, camLabel: 'Andor iXon EMCCD',
      src: [laserDown(602.8, { lambda: 473 }, 'Coherent Obis 473 nm'), c('laser', 480, 100, 0, { lambda: 532, diam: 1, div: 0 }, '532 nm FRET laser (not traced)'), c('dump', 540, 100, 0)] }) },
  { id: 'lab-pathak-halotag-tirf', title: 'Pathak lab: single PIEZO1-HaloTag channels by TIRF', tech: ['tirf', 'spt'],
    cite: 'Bertaccini GA, Casanellas I, Evans EL, Nourse JL, Dickinson GD, Liu G, Seal S, et al., Parker I, Pathak MM (2025) Visualizing PIEZO1 localization and activity in hiPSC-derived single cells and organoids with HaloTag technology. Nat Commun 16:5556', doi: '10.1038/s41467-025-59150-1',
    simplified: 'From the Methods: Olympus IX83 with a 4-line cellTIRF illuminator, stage-top incubator at 37 °C, PLAPO 60x oil objective NA 1.50 and a Hamamatsu ORCA-Fusion BT sCMOS (about 0.108 um per pixel); JF646-BAPTA on PIEZO1-HaloTag excited by the 640 nm laser at 3.5 mW at the back pupil for 100 frames/s (12 and 20.5 mW for 200 and 500 frames/s); 560 nm for JF549 or tdTomato. JF646 is drawn with Alexa Fluor 647 spectra (the atlas has no JF646 spectrum); the filter cube (paper\'s Supplementary Table 4) is drawn as a 660 nm dichroic and 680/40 band-pass.',
    desc: 'A calcium-sensitive dye bound to each HaloTag-labelled PIEZO1 channel lights up when that channel opens.',
    components: tirf({ off: 4.4, cut: 655, obj: OLY(60, 1.5), dye: 'Alexa Fluor 647', filt: c('bandpass', 560, 300, 180, { center: 690, width: 40 }), cam: FUSIONBT, camLabel: 'ORCA-Fusion BT',
      src: fibreDown(604.4, { lambda: 640, power: 3.5 }, 'cellTIRF fibre (640 nm, 3.5 mW at the pupil)') }) },
  // ---------------------------------------------------------------- Hughes lab
  { id: 'lab-hughes-dnapaint', title: 'Hughes lab: DNA-PAINT of DNA origami (digital nucleic acid memory)', tech: ['dna-paint', 'tirf', 'smlm'],
    cite: 'Dickinson GD, Mortuza GM, Clay W, Piantanida L, Green CM, Watson C, Hayden EJ, Andersen T, Kuang W, Graugnard E, Zadegan R, Hughes WL (2021) An alternative approach to nucleic acid memory. Nat Commun 12:2371', doi: '10.1038/s41467-021-22277-y',
    simplified: 'From the Methods (and Piantanida et al. 2024, ACS Nano 18:22369): Nikon Eclipse Ti2 in TIRF, CFI Apochromat 100x TIRF oil objective NA 1.49 plus an extra 1.5x magnification (drawn as a 300 mm tube lens), a 405/488/561/647 quad-band TIRF cube (drawn as a single dichroic and long-pass filter for the 561 line), a 561 nm laser (about 130 uW in the 2024 study) exciting Cy3B imager strands, a ProEM EMCCD with 512 x 512 pixels of 16 um (about 107 nm at the sample), 300 or 150 ms frames, 40,000 frames per recording; focus held by an in-house optical feedback drift-correction system or Nikon Perfect Focus (not drawn).',
    desc: 'Short dye-labelled DNA strands bind and unbind the origami\'s docking strands; 40,000 frames of their blinks read out the bits stored in each origami.',
    components: tirf({ off: 2.8, f: 200, cut: 568, obj: NIK(100, 1.49), dye: 'Cy3B', filt: c('longpass', 560, 300, 180, { cut: 570 }), tube: 300,
      cam: { sensor: 'EMCCD', px: 16, size: 8.19, read: 50 }, camLabel: 'ProEM EMCCD (512 x 512, 16 um)',
      src: fibreDown(602.8, { lambda: 561, power: 0.13 }, 'Ti2 TIRF illuminator fibre (561 nm)') }) },
];
