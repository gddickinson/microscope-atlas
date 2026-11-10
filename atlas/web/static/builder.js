// Microscope builder (#/builder): pick an objective and camera from the database, a fluorophore with a measured
// spectrum, a laser line and an emission band; get resolution, sampling, field of view, photon budget and SNR.
import { route, app, api, esc } from './core.js';
import { layout, addSlider, setReadout, linePlot, div, fmt } from './sim_ui.js';
import { parseObjective, parseCamera, report } from './builder_calc.js';

const LINES = [405, 445, 458, 488, 514, 532, 561, 594, 640, 685, 730];
const INTRO = 'Choose an objective and a camera from the components database, a fluorophore with a measured spectrum (FPbase), a laser line and an emission band. The builder works out what the combination can do: resolution, pixel size at the sample against Nyquist, field of view, and a photon budget for one molecule in widefield illumination, from laser power to photoelectrons, with the SNR and localization precision that follow.';

route('builder', async () => {
  app().innerHTML = '<p class="kicker"><a href="#/lab">Lab tools</a></p><h1>Microscope builder</h1><div id="mb"><p class="mute">Loading components…</p></div>';
  const [objs, cams, spectra] = await Promise.all([api('/components/objectives'), api('/components/detectors'), api('/spectra')]);
  const O = objs.map(parseObjective).filter(Boolean), C = cams.map(parseCamera).filter(Boolean), names = Object.keys(spectra).sort();
  const { controls, view, readout } = layout(app().querySelector('#mb'), INTRO);
  const st = { obj: 'nikon-cfi-apo-tirf-60xc-oil', cam: 'photometrics-prime-bsi-express', extra: 1, fl: names.includes('Alexa Fluor 488') ? 'Alexa Fluor 488' : names[0],
    laser: 488, power: 10, field: 100, lo: 500, hi: 550, T: 90, exp: 100, bg: 10, qe: 80, read: 1.5, fluor: null };
  const opt = (rows, cur, lab) => rows.map(r => `<option value="${esc(r.id ?? r)}" ${(r.id ?? r) === cur ? 'selected' : ''}>${esc(lab(r))}</option>`).join('');
  const pick = div(controls);
  pick.innerHTML = `<label>Objective</label><select id="mb-obj">${opt(O, st.obj, o => `${o.label} (${o.M}×/${o.NA})`)}</select>
    <label>Camera</label><select id="mb-cam">${opt(C, st.cam, c => `${c.label} (${c.type})`)}</select>
    <label>Fluorophore (with a measured spectrum)</label><select id="mb-fl">${opt(names, st.fl, n => n)}</select>
    <label>Laser line</label><select id="mb-laser">${opt(LINES, st.laser, l => l + ' nm')}</select>`;
  const sliders = div(controls), assumed = div(controls);
  controls.appendChild(readout);
  const plot = div(view), groups = ['Optics', 'Sampling and field of view', 'Photon budget (one molecule)', 'Signal'].map(h => { const d = div(view); d.innerHTML = `<h3>${h}</h3>`; return div(d, 'readout'); });
  const srcNote = div(view);

  function mountSliders() {
    sliders.innerHTML = '';
    const S = (id, label, min, max, step, k, unit = '') => addSlider(sliders, { id, label, min, max, step, value: st[k], unit }, v => { st[k] = v; draw(); });
    S('mb-x', 'Extra magnification (tube lens / relay)', 0.5, 3, 0.05, 'extra', '×');
    S('mb-p', 'Laser power at the sample', 0.1, 200, 0.1, 'power', ' mW');
    S('mb-f', 'Illuminated field diameter', 10, 500, 5, 'field', ' µm');
    S('mb-lo', 'Emission filter from', 400, 800, 1, 'lo', ' nm');
    S('mb-hi', 'Emission filter to', 400, 850, 1, 'hi', ' nm');
    S('mb-t', 'Filter and optics transmission', 10, 100, 1, 'T', '%');
    S('mb-e', 'Exposure time', 1, 1000, 1, 'exp', ' ms');
    S('mb-b', 'Background', 0, 500, 1, 'bg', ' photons/pixel/frame');
  }
  function mountAssumed(cam) {
    assumed.innerHTML = '';
    if (cam.qe === null) addSlider(assumed, { id: 'mb-qe', label: 'QE (not stated in the source: your value)', min: 10, max: 100, step: 1, value: st.qe, unit: '%' }, v => { st.qe = v; draw(); });
    if (cam.read === null) addSlider(assumed, { id: 'mb-rd', label: 'Read noise (not stated in the source)', min: 0, max: 10, step: 0.1, value: st.read, unit: ' e⁻' }, v => { st.read = v; draw(); });
  }
  async function setFluor(name, retune) {
    st.fl = name;
    const rows = await api('/fluorophores?q=' + encodeURIComponent(name) + '&limit=50');
    st.fluor = (Array.isArray(rows) ? rows : rows.rows || []).find(r => r.name === name) || null;
    if (retune && st.fluor) {
      st.laser = LINES.filter(l => l <= st.fluor.ex + 5).pop() || LINES[0];
      st.lo = Math.max(st.laser + 10, Math.round(st.fluor.em - 15)); st.hi = st.lo + 50;
      pick.querySelector('#mb-laser').value = st.laser; mountSliders();
    }
    draw();
  }
  pick.querySelector('#mb-obj').onchange = e => { st.obj = e.target.value; draw(); };
  pick.querySelector('#mb-cam').onchange = e => { st.cam = e.target.value; mountAssumed(C.find(c => c.id === st.cam)); draw(); };
  pick.querySelector('#mb-fl').onchange = e => setFluor(e.target.value, true);
  pick.querySelector('#mb-laser').onchange = e => { st.laser = +e.target.value; draw(); };

  function draw() {
    const obj = O.find(o => o.id === st.obj), cam = C.find(c => c.id === st.cam), sp = spectra[st.fl], f = st.fluor;
    linePlot(plot, [{ pts: sp.ex || [], color: '#4f9dff', dash: '4 3', label: `${st.fl} excitation` }, { pts: sp.em || [], color: '#3dff8f', label: 'emission' },
      { pts: [[st.laser, 0], [st.laser, 1.02]], color: '#ffd23f', label: `laser ${st.laser} nm` }, { pts: [[st.lo, 0], [st.lo, 1], [st.hi, 1], [st.hi, 0]], color: '#ff3fa4', dash: '3 3', label: `emission filter ${st.lo}-${st.hi} nm` }],
      { xlabel: 'wavelength (nm)', ylabel: 'relative', xmin: 350, xmax: 850, ymin: 0, ymax: 1.7, H: 240 }); // headroom keeps the legend clear of the curves
    if (!f || !f.ec || !f.qy || st.hi <= st.lo) {
      setReadout(readout, [['Photon budget', !f ? 'loading fluorophore…' : st.hi <= st.lo ? 'filter band is empty' : `${st.fl} has no extinction coefficient or quantum yield in FPbase`]]);
      return;
    }
    const r = report({ obj, cam, extraMag: st.extra, qe: cam.qe === null ? st.qe / 100 : null, read: cam.read === null ? st.read : null,
      fluor: { ec: f.ec, qy: f.qy, lifetime: f.lifetime }, ex: sp.ex || [], em: sp.em || [], laser: st.laser, powerMw: st.power, fieldUm: st.field,
      lo: st.lo, hi: st.hi, filterT: st.T / 100, exposureMs: st.exp, bgPx: st.bg });
    const samp = r.pxS <= r.nyq * 1.05 ? 'Nyquist sampled' : r.pxS <= 2 * r.nyq ? 'slightly undersampled' : 'undersampled: add magnification';
    setReadout(groups[0], [['Total magnification', `${fmt(r.M)}×`], ['Lateral FWHM 0.51λ/NA', `${r.fwhm.toFixed(0)} nm`], ['Rayleigh 0.61λ/NA', `${r.rayleigh.toFixed(0)} nm`],
      ['Axial 2nλ/NA²', `${r.axial.toFixed(0)} nm`], ['Immersion', `${obj.immersion} (n = ${obj.n})`]]);
    setReadout(groups[1], [['Pixel at the sample', `${r.pxS.toFixed(0)} nm`], ['Nyquist pixel λ/(4NA)', `${r.nyq.toFixed(0)} nm: ${samp}`],
      ['Field of view', `${r.fov[0].toFixed(0)} × ${r.fov[1].toFixed(0)} µm${cam.sizeNote ? ` (${cam.sizeNote})` : ''}`], ['', r.fovNote || 'illumination covers the camera field'],
      ['Frame rate', `${fmt(r.fpsMax)} fps at this exposure${cam.fps ? ` (camera max ${cam.fps})` : ''}`]]);
    setReadout(groups[2], [['Power density', `${r.kWcm2 < 0.1 ? (r.kWcm2 * 1000).toFixed(1) + ' W/cm²' : r.kWcm2.toFixed(2) + ' kW/cm²'}`],
      ['Excitation at the laser line', `${(r.relEx * 100).toFixed(0)}% of peak`], ['Excitations per molecule', `${fmt(r.k)} /s (saturation ${(r.sat * 100).toFixed(2)}%)`],
      ['Emitted photons', `${fmt(r.emit)} /s (QY ${f.qy})`], ['Collected by the objective', `${(r.coll * 100).toFixed(1)}%`], ['Emission inside the filter', `${(r.inBand * 100).toFixed(0)}%`],
      ['Camera QE', `${(r.qe * 100).toFixed(0)}%${cam.qe === null ? ' (your value)' : ''}`], ['Photons at the camera per exposure', fmt(r.photons)]]);
    setReadout(groups[3], [['Brightest pixel', `${fmt(r.peakPx)} photons (${(r.frac * 100).toFixed(0)}% of the spot)`], ['Peak-pixel SNR', fmt(r.snrPeak)],
      ['Localization precision (Thompson; ×√2 for EMCCD)', `${r.locNm.toFixed(1)} nm`], ['Read noise', `${r.read} e⁻${cam.F > 1 ? ' (EM gain, excess noise √2)' : ''}`]]);
    setReadout(readout, [['Photons per molecule per frame', fmt(r.photons)], ['Pixel / Nyquist', `${r.pxS.toFixed(0)} / ${r.nyq.toFixed(0)} nm`], ['σ localization', `${r.locNm.toFixed(1)} nm`]]);
    srcNote.innerHTML = `<p class="small mute">Specs from the database entries for the <a href="#/components/objectives">objective</a> and <a href="#/components/detectors">camera</a>; ε, QY and lifetime from FPbase for ${esc(st.fl)} (ε ${fmt(f.ec)} M⁻¹cm⁻¹, QY ${f.qy}${f.lifetime ? `, τ ${f.lifetime} ns` : ', τ 3 ns assumed'}).
      Model: flat-top widefield illumination, isotropic emission, σ = 3.82×10⁻²¹ ε cm², two-level saturation, Gaussian PSF; it ignores polarization, blinking, bleaching and optics losses beyond the transmission slider.</p>`;
  }
  mountSliders(); mountAssumed(C.find(c => c.id === st.cam));
  setFluor(st.fl, false);
});
