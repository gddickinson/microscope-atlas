// Step-through for light-path diagrams: link each "Following the light" step to the diagram parts it mentions.
// Pure matching (partsOf, matchSteps) is node-tested; stepper() wires it to the page.

// A diagram part is a <g class="lp-..."> with a <title>, or a beam (<polyline> with a <title>), in document order.
export function partsOf(svg) {
  const out = [], re = /<g class="(lp-[a-z]+)"[^>]*>([\s\S]*?)<\/g>(?:<text class="lp-label[^"]*"[^>]*>([^<]*)<\/text>)?|<polyline class="[^"]*"[^>]*>(<title>[\s\S]*?<\/title>)<\/polyline>/g;
  let m;
  while ((m = re.exec(svg))) {
    const t = /<title>([\s\S]*?)<\/title>/.exec(m[2] || m[4] || '');
    if (t) out.push({ cls: m[1] || 'lp-beam', title: t[1], label: m[3] || '' });
  }
  return out;
}

// Step words → parts. `s` tests the step text; `p` tests "class title" of a part (lower case).
const VOCAB = [
  [/objective|high-na|immersion|lens(es)? focus/, /lp-obj|objective/],
  [/dichroic|beam ?splitter|aobs|\bmirror/, /lp-dich|lp-mirror|beam ?splitter|dichroic/],
  [/pinhole|slit/, /lp-pin|pinhole|slit/],
  [/camera|detector|pmt|photomultiplier|hyd|spad|apd|scmos|emccd|ccd|eyepiece|photodiode|screen|spectrometer|transducer|array/, /lp-det|camera|detector|pmt|spectrometer|transducer|eyepiece|photodiode|quadrant/],
  [/laser|lamp|\bled\b|source|filament|gun|emitter|supercontinuum/, /lp-src|laser|lamp|source|gun/],
  [/filter|bandpass|notch/, /lp-filter|filter/],
  [/sample|specimen|coverslip|tissue|cell|grid|slide|embryo|animal|mouse|brain/, /lp-sample|lp-specimen|sample|specimen|slide|tissue/],
  [/condenser/, /condenser/],
  [/tube lens/, /tube lens/],
  [/scan|galvo|galvanometer|resonant|raster/, /scan|galvo/],
  [/polari[sz]er|analy[sz]er|polari[sz]/, /polari[sz]er|analy[sz]er/],
  [/prism|wollaston|nomarski/, /prism/],
  [/annul|phase ring|phase plate|vortex/, /annul|phase|vortex/],
  [/grating|disperse|dispersion/, /grating|dispers/],
  [/fluorescence|emitted|emission|photons? (return|pass)/, /emitted|fluorescence|emission/],
  [/excit/, /excitation/],
  [/tcspc|timing|correlat|electronics|computer|software|reconstruct/, /tcspc|timing|correlat|electronics|computer|reconstruct|software/],
  [/disk|nipkow|microlens/, /disk|nipkow/],
  [/light sheet|sheet/, /sheet/],
  [/wavefront|deformable|slm|adaptive/, /wavefront|deformable|slm|adaptive/],
  [/tip|cantilever|probe/, /tip|cantilever|probe/],
  [/feedback|setpoint/, /feedback/],
  [/piezo|stage|goniometer/, /piezo|stage|goniometer/],
  [/zone plate|x-ray/, /zone plate|x-ray/],
  [/interfer|reference arm|reference beam/, /interfer|reference/],
];

const head = t => t.toLowerCase().split(/[:(;,]/)[0].trim();

// For each step, the indices of the parts it mentions (vocabulary, or the part's own name appearing in the step).
export function matchSteps(steps, parts) {
  const keys = parts.map(p => `${p.cls} ${p.title} ${p.label || ''}`.toLowerCase());
  return steps.map(step => {
    const s = step.toLowerCase().split(';')[0], hit = new Set(); // the main clause names the parts
    for (const [sr, pr] of VOCAB) if (sr.test(s)) keys.forEach((k, i) => { if (pr.test(k)) hit.add(i); });
    parts.forEach((p, i) => { for (const h of [head(p.title), head(p.label || '')]) if (h.length >= 5 && s.includes(h)) hit.add(i); });
    return [...hit];
  });
}

// Page wiring: highlight parts for the current step; Prev/Next buttons and clicks on the step list both drive it.
export function stepper(root, steps) {
  const svg = root.querySelector('svg.lightpath'), box = root.querySelector('.lp-stepper'), ol = root.querySelector('ol.steps');
  if (!svg || !box || !steps || !steps.length) return;
  const els = [...svg.querySelectorAll('g[class^="lp-"], polyline')].filter(e => e.querySelector(':scope > title'));
  const lab = e => { const n = e.nextElementSibling; return n && n.classList.contains('lp-label') ? n.textContent : ''; };
  const hits = matchSteps(steps, els.map(e => ({ cls: e.tagName === 'polyline' ? 'lp-beam' : e.getAttribute('class'), title: e.querySelector(':scope > title').textContent, label: lab(e) })));
  let cur = -1;
  const show = i => {
    cur = i;
    svg.classList.toggle('lp-stepping', i >= 0);
    els.forEach((e, k) => {
      const on = i >= 0 && hits[i].includes(k), prev = e.previousElementSibling, next = e.nextElementSibling;
      e.classList.toggle('lp-hi', on);
      if (prev && prev.tagName === 'polyline') prev.classList.toggle('lp-hi', on); // a beam's halo
      if (next && next.classList.contains('lp-label')) next.classList.toggle('lp-hi', on);
    });
    if (ol) [...ol.children].forEach((li, k) => li.classList.toggle('on', k === i));
    box.querySelector('.lp-step-text').textContent = i < 0 ? `Step through the ${steps.length} stages of the light path; highlighted parts are the ones each step mentions.` : steps[i] + (hits[i].length ? '' : ' (not drawn as a separate part)');
    box.querySelector('.lp-step-n').textContent = i < 0 ? '' : `${i + 1} / ${steps.length}`;
  };
  box.querySelector('[data-step="prev"]').onclick = () => show(cur <= 0 ? -1 : cur - 1);
  box.querySelector('[data-step="next"]').onclick = () => show(cur >= steps.length - 1 ? -1 : cur + 1);
  if (ol) [...ol.children].forEach((li, k) => { li.onclick = () => show(cur === k ? -1 : k); });
  show(-1);
}

export const stepperHtml = () => `<div class="lp-stepper"><button class="btn alt" data-step="prev">◀ Prev</button><span class="lp-step-n"></span><button class="btn" data-step="next">Next ▶</button><p class="lp-step-text small"></p></div>`;
