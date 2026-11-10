// Lab Tools, 'Analysis' group: localization precision, FRET, SNR/detectability.
// The FRAP fitter, MSD analyser and the Python-backed file inspector live in lab_analysis2.js and are re-exported here.
// Pure calculations are in lab_analysis_calc.js (tests/lab_bench.test.mjs).
import { num, select, row, panel, results, out, note, fmt } from './lab_ui.js';
import { locPrecision } from './sim_engine.js';
import { linePlot } from './sim_ui.js';
import { photonsForPrecision, fretFromIntensity, fretFromLifetime, fretR, detectability } from './lab_analysis_calc.js';
import { TOOLS as MORE } from './lab_analysis2.js';
export * from './lab_analysis_calc.js';

const G = 'Analysis';

function mountLocPrecision(host) {
  const p = panel(host);
  const r1 = row(p);
  const N = num(r1, { id: 'lN', label: 'Photons per localization', value: 1000 }, () => draw());
  const b = num(r1, { id: 'lb', label: 'Background', unit: 'photons/pixel', value: 10 }, () => draw());
  const r2 = row(p);
  const s = num(r2, { id: 'ls', label: 'PSF σ', unit: 'nm', value: 120, help: '≈ 0.21 λ/NA; ~100–130 nm for red dyes at NA 1.4.' }, () => draw());
  const a = num(r2, { id: 'la', label: 'Pixel size at sample', unit: 'nm', value: 100 }, () => draw());
  const r3 = row(p);
  const em = select(r3, { id: 'lem', label: 'Camera', options: [['0', 'sCMOS / CCD (no EM gain)'], ['1', 'EMCCD (excess noise, F² = 2)']], value: '0' }, () => draw());
  const tgt = num(r3, { id: 'lt', label: 'Target precision', unit: 'nm', value: 10 }, () => draw());
  const res = out(p), plot = out(p);
  function draw() {
    const isEM = em.value === '1';
    const sig = locPrecision(+s.value, +a.value, +N.value, +b.value, isEM);
    const need = photonsForPrecision(+tgt.value, +s.value, +a.value, +b.value, isEM);
    results(res, [['Localization precision σ', `${fmt(sig, 3)} nm`], ['FWHM resolution (≈ 2.35 σ)', `${fmt(2.35 * sig, 3)} nm`],
      [`Photons for σ = ${+tgt.value} nm`, Number.isFinite(need) ? fmt(need, 3) : 'not reachable']]);
    const pts = [];
    for (let i = 0; i <= 60; i++) { const n = 10 ** (2 + i * 3 / 60); pts.push([n, locPrecision(+s.value, +a.value, n, +b.value, isEM)]); }
    linePlot(plot, [{ pts, color: '#3dff8f', label: 'σ vs photons' }], { logx: true, xlabel: 'photons', ylabel: 'σ (nm)', ymax: Math.min(pts[0][1] * 1.05, 100),
      marks: [{ x: Math.min(1e5, Math.max(100, +N.value)), label: 'now' }], hmarks: [{ y: +tgt.value, label: 'target', color: '#ff3fa4' }] });
  }
  draw();
  note(host, 'Thompson et al. (2002) with the Mortensen et al. (2010) form: σ² = (s² + a²/12)/N · (16/9 + 8π(s² + a²/12) b / (N a²)), doubled for EMCCD excess noise. This is the best case for an unbiased fit (MLE); least-squares fits do slightly worse.', 'callout g small');
}

function mountFRET(host) {
  const p = panel(host, 'Efficiency from donor intensities: E = 1 − F_DA / F_D');
  const r1 = row(p);
  const fda = num(r1, { id: 'fda', label: 'Donor with acceptor (F_DA)', value: 600 }, () => draw());
  const fd = num(r1, { id: 'fd', label: 'Donor alone (F_D)', value: 1000 }, () => draw());
  const q = panel(host, 'Efficiency from donor lifetimes: E = 1 − τ_DA / τ_D');
  const r2 = row(q);
  const tda = num(r2, { id: 'tda', label: 'τ_DA', unit: 'ns', value: 1.8 }, () => draw());
  const td = num(r2, { id: 'td', label: 'τ_D', unit: 'ns', value: 2.6 }, () => draw());
  const d = panel(host, 'Distance: r = R0 (1/E − 1)^(1/6)');
  const r3 = row(d);
  const r0 = num(r3, { id: 'r0', label: 'Förster radius R0', unit: 'nm', value: 5.0, help: 'For your dye pair (FPbase or the dye supplier lists R0).' }, () => draw());
  const eIn = num(r3, { id: 'ein', label: 'Efficiency (blank: use the lifetime result)', value: '' }, () => draw());
  const res = out(d), plot = out(d);
  function draw() {
    const eI = fretFromIntensity(+fda.value, +fd.value), eT = fretFromLifetime(+tda.value, +td.value);
    const E = eIn.value === '' ? eT : +eIn.value;
    const r = fretR(E, +r0.value);
    results(res, [['E (intensities)', fmt(eI, 3)], ['E (lifetimes)', fmt(eT, 3)], ['Distance from E', Number.isFinite(r) ? `${fmt(r, 3)} nm` : 'E must be between 0 and 1'],
      ['Distance from intensity E', Number.isFinite(fretR(eI, +r0.value)) ? `${fmt(fretR(eI, +r0.value), 3)} nm` : '—']]);
    const R0 = +r0.value, pts = [];
    for (let i = 0; i <= 100; i++) { const x = R0 * 2 * i / 100; pts.push([x, 1 / (1 + (x / R0) ** 6)]); }
    linePlot(plot, [{ pts, color: '#3dff8f', label: 'E(r)' }], { xlabel: 'distance (nm)', ylabel: 'FRET efficiency', ymin: 0, ymax: 1.05,
      marks: Number.isFinite(r) && r <= 2 * R0 ? [{ x: r, label: `E = ${fmt(E, 2)}` }] : [] });
  }
  draw();
  note(host, 'Intensities must be corrected for background, acceptor bleed-through and direct acceptor excitation first. Distances assume κ² = 2/3 (freely rotating dyes); FRET is reliable for about 0.5 R0 to 1.5 R0.', 'callout g small');
}

function mountSNR(host) {
  const p = panel(host);
  const r1 = row(p);
  const S = num(r1, { id: 'sS', label: 'Signal', unit: 'photons/pixel', value: 30 }, () => draw());
  const bg = num(r1, { id: 'sB', label: 'Background', unit: 'photons/pixel', value: 10 }, () => draw());
  const r2 = row(p);
  const qe = num(r2, { id: 'sQ', label: 'Quantum efficiency', unit: '0–1', value: 0.8, min: 0, max: 1 }, () => draw());
  const rd = num(r2, { id: 'sR', label: 'Read noise', unit: 'e⁻ rms', value: 1.5 }, () => draw());
  const r3 = row(p);
  const em = select(r3, { id: 'sE', label: 'EM gain', options: [['0', 'Off (sCMOS / CCD)'], ['1', 'On (EMCCD)']], value: '0' }, () => draw());
  const g = num(r3, { id: 'sG', label: 'EM gain factor', value: 300 }, () => draw());
  const res = out(p), verdict = out(p), plot = out(p);
  function draw() {
    const o = { bg: +bg.value, qe: +qe.value, read: +rd.value, em: em.value === '1', emGain: +g.value };
    const d = detectability({ S: +S.value, ...o });
    results(res, [['SNR', fmt(d.snr, 3)], ['Shot-noise limit √(QE·S)', fmt(d.shotLimit, 3)], ['Fraction of the ideal', `${fmt(100 * d.snr / d.shotLimit, 3)} %`]]);
    verdict.innerHTML = `<div class="callout ${d.rose ? 'g' : ''}">${d.rose ? 'Detectable: SNR ≥ 5 (Rose criterion).' : 'Below the Rose criterion (SNR < 5): the feature cannot be reliably distinguished from noise. Collect more photons, bin pixels, or reduce background.'}</div>`;
    const pts = [], pts2 = [];
    for (let i = 0; i <= 60; i++) {
      const s = 10 ** (-0.5 + i * 3.5 / 60);
      pts.push([s, detectability({ S: s, ...o }).snr]);
      pts2.push([s, detectability({ S: s, ...o, em: !o.em }).snr]);
    }
    linePlot(plot, [{ pts, color: '#3dff8f', label: o.em ? 'EM gain on' : 'EM gain off' }, { pts: pts2, color: '#8899bb', dash: '5 4', label: o.em ? 'EM gain off' : 'EM gain on' }],
      { logx: true, xlabel: 'signal photons per pixel', ylabel: 'SNR', hmarks: [{ y: 5, label: 'Rose (SNR = 5)' }] });
  }
  draw();
  note(host, 'SNR = QE·S / √(F²·QE·(S + B) + (σ_read / G)²). EM gain removes read noise but adds excess noise F = √2, so it helps only at very low signal.', 'callout g small');
}

export const TOOLS = [
  { id: 'locprec', group: G, title: 'Localization precision estimator', blurb: 'σ from photons, background, PSF and pixel size (Thompson/Mortensen), and photons needed for a target precision.', mount: mountLocPrecision },
  { id: 'fretcalc', group: G, title: 'FRET calculator', blurb: 'Efficiency from donor intensities or lifetimes, and distance from E and R0.', mount: mountFRET },
  { id: 'snr', group: G, title: 'SNR and detectability', blurb: 'Camera SNR from signal, background, QE and read noise, with EM gain, and the Rose criterion verdict.', mount: mountSNR },
  ...MORE,
];
