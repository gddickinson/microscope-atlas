// Pure calculations for the Labelling and probes tools (no DOM, no fetch): node-tested in tests/lab_label.test.mjs.
import { SEC_RULES } from './lab_label_data.js';

// ---------- spectra ----------
// Linear interpolation of a [[nm, v], ...] curve; 0 outside its range.
export function interp(curve, nm) {
  if (!curve || !curve.length || nm < curve[0][0] || nm > curve[curve.length - 1][0]) return 0;
  let i = 1;
  while (i < curve.length && curve[i][0] < nm) i++;
  if (i >= curve.length) return curve[curve.length - 1][1];
  const [x0, y0] = curve[i - 1], [x1, y1] = curve[i];
  return x1 === x0 ? y1 : y0 + (y1 - y0) * (nm - x0) / (x1 - x0);
}

const LO = 300, HI = 900;
// Cumulative emission (1 nm grid) so the fraction in any band is O(1).
export function emissionCum(curve) {
  const cum = new Float64Array(HI - LO + 2);
  for (let nm = LO; nm <= HI; nm++) cum[nm - LO + 1] = cum[nm - LO] + Math.max(0, interp(curve, nm));
  return cum;
}
export function bandFraction(cum, lo, hi) {
  const tot = cum[cum.length - 1];
  if (!tot) return 0;
  const a = Math.max(LO, Math.min(HI + 1, Math.round(lo))), b = Math.max(LO - 1, Math.min(HI, Math.round(hi)));
  return b < a ? 0 : (cum[b - LO + 1] - cum[a - LO]) / tot;
}
export const curvePeak = c => (c && c.length ? c.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : NaN);

// ---------- multicolour panel designer ----------
// fluors: [{name, kind, brightness|null, ex: curve, em: curve}]. Returns candidate (fluor, laser) options.
export function panelOptions(fluors, lasers, { minEx = 0.5, defaultBrightness = null } = {}) {
  const known = fluors.map(f => f.brightness).filter(b => b > 0).sort((a, b) => a - b);
  const fallback = defaultBrightness ?? (known.length ? known[Math.floor(known.length / 2)] : 30);
  const opts = [];
  for (const f of fluors) {
    if (!f.ex || !f.em || !f.ex.length || !f.em.length) continue;
    const prep = { ...f, B: f.brightness > 0 ? f.brightness : fallback, guessedB: !(f.brightness > 0), peak: curvePeak(f.em), cum: emissionCum(f.em) };
    for (const l of lasers) {
      const e = interp(f.ex, l);
      if (e >= minEx && l < prep.peak) opts.push({ f: prep, laser: l, exEff: e });
    }
  }
  return opts.sort((a, b) => a.f.peak - b.f.peak);
}

// Detection bands: split at the midpoint between neighbouring emission peaks; each band starts ≥ gap nm above its
// own laser; first band starts 25 nm below its peak, last ends 60 nm above.
export function proposeBands(members, { gap = 8, firstBelow = 25, lastAbove = 60 } = {}) {
  return members.map((m, i) => {
    let lo = i === 0 ? m.f.peak - firstBelow : (members[i - 1].f.peak + m.f.peak) / 2;
    const hi = i === members.length - 1 ? m.f.peak + lastAbove : (m.f.peak + members[i + 1].f.peak) / 2;
    lo = Math.max(lo, m.laser + gap);
    return [Math.round(lo), Math.round(hi)];
  });
}

// Sequential acquisition (one laser per channel; opts.simultaneous: all lasers on). S[i][j] = B_j · ex_j(laser_i) · emission fraction of j in band i.
// Crosstalk X[i][j] = S[i][j] / S[i][i]. Score = geometric mean of S[i][i] × (1 − worst crosstalk)².
export function evaluatePanel(members, opts = {}) {
  const bands = proposeBands(members, opts);
  const n = members.length;
  if (bands.some(([a, b]) => b - a < (opts.minWidth ?? 10))) return null;
  // Simultaneous mode: every panel laser is on (equal power) in every channel.
  const ls = [...new Set(members.map(m => m.laser))];
  const exc = (mj, mi) => opts.simultaneous ? ls.reduce((t, l) => t + interp(mj.f.ex, l), 0) : (mj === mi ? mi.exEff : interp(mj.f.ex, mi.laser));
  const S = members.map((mi, i) => members.map(mj => mj.f.B * exc(mj, mi) * bandFraction(mj.f.cum, bands[i][0], bands[i][1])));
  const own = S.map((r, i) => r[i]);
  if (own.some(v => !(v > 0))) return null;
  const X = S.map((r, i) => r.map(v => v / own[i]));
  let maxX = 0;
  X.forEach((r, i) => r.forEach((v, j) => { if (i !== j) maxX = Math.max(maxX, v); }));
  const geo = Math.exp(own.reduce((s, v) => s + Math.log(v), 0) / n);
  const score = geo * (1 - Math.min(maxX, 1)) ** 2;
  return { members, bands, signal: own, X, maxX, geo, score };
}

// Beam search over emission-ordered panels of n fluorophores (each used once, peaks ≥ minSep nm apart).
export function designPanels(fluors, lasers, n, { minEx = 0.5, minSep = 15, beam = 150, top = 3, ...rest } = {}) {
  const opts = panelOptions(fluors, lasers, { minEx, ...rest });
  let states = [{ members: [], ev: null }];
  for (let step = 0; step < n; step++) {
    const next = [];
    for (const s of states) {
      const last = s.members[s.members.length - 1];
      for (const o of opts) {
        if (last && o.f.peak < last.f.peak + minSep) continue;
        if (s.members.some(m => m.f.name === o.f.name)) continue;
        const members = [...s.members, o];
        const ev = evaluatePanel(members, rest);
        if (ev) next.push({ members, ev });
      }
    }
    next.sort((a, b) => b.ev.score - a.ev.score);
    states = next.slice(0, beam);
    if (!states.length) return [];
  }
  const out = [], seen = new Set();
  for (const s of states) {
    const key = s.members.map(m => m.f.name).sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s.ev);
    if (out.length >= top) break;
  }
  return out;
}

// ---------- fluorescent protein picker ----------
export const COLOUR_BANDS = [['blue', 0, 470], ['cyan', 470, 500], ['green', 500, 530], ['yellow', 530, 560], ['orange', 560, 590], ['red', 590, 640], ['far-red', 640, 700], ['near-IR', 700, 2000]];
export const colourOf = em => (COLOUR_BANDS.find(([, a, b]) => em >= a && em < b) || ['?'])[0];
// Filters FPbase protein rows. Unknown maturation/pKa fail an active limit. Sorted by brightness (unknown last).
export function filterFPs(rows, { colour = '', monomer = false, maxMaturation = null, maxPka = null, switchType = '' } = {}) {
  return rows.filter(r => r.kind === 'protein'
    && (!colour || colourOf(r.em) === colour)
    && (!monomer || String(r.agg || '').toUpperCase() === 'M')
    && (maxMaturation == null || (r.maturation != null && r.maturation < maxMaturation))
    && (maxPka == null || (r.pka != null && r.pka < maxPka))
    && (!switchType || String(r.switch || '').toUpperCase() === switchType.toUpperCase()))
    .sort((a, b) => (b.brightness || -1) - (a.brightness || -1) || a.name.localeCompare(b.name));
}

// ---------- antibody dilution ----------
// Either target concentration (needs stock mg/mL; 1 mg/mL = 1000 µg/mL) or a 1:X dilution.
export function antibodyDilution({ stockMgMl = null, targetUgMl = null, ratio = null, finalUl }) {
  const factor = ratio ? ratio : (stockMgMl * 1000) / targetUgMl;
  if (!(factor >= 1) || !(finalUl > 0)) return { factor: NaN, abUl: NaN, diluentUl: NaN, workingUgMl: NaN };
  const abUl = finalUl / factor;
  return { factor, abUl, diluentUl: finalUl - abUl, workingUgMl: stockMgMl ? stockMgMl * 1000 / factor : NaN };
}
// Volume for N coverslips/wells with an overage (%).
export const totalVolume = (n, perUl, overagePct = 10) => n * perUl * (1 + overagePct / 100);
// Cost of the antibody used. Vial size in µL, or in µg with the stock concentration (1 mg/mL = 1 µg/µL).
export function antibodyCost({ abUl, price, vialUl = null, vialUg = null, stockMgMl = null }) {
  const vol = vialUl || (vialUg && stockMgMl ? vialUg / stockMgMl : NaN);
  return { vialUl: vol, cost: abUl / vol * price, experimentsPerVial: vol / abUl };
}

// ---------- secondary antibody planner ----------
const CAP = s => s.replace(/\b\w/g, c => c.toUpperCase());
const RELATED = [['mouse', 'rat'], ['goat', 'sheep']];
const related = (a, b) => RELATED.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
const igName = (p, subclass) => p.host === 'chicken' ? 'IgY' : p.isotype === 'IgM' ? 'IgM (µ chain)' : subclass && p.isotype ? `${p.isotype} (Fcγ subclass specific)` : 'IgG (H+L)';

// primaries: [{host, isotype?, target?, abundance?}]; sample: species of the specimen ('' if not animal tissue/cells).
export function planSecondaries(primaries, { sample = '' } = {}) {
  const issues = [], rules = new Set(['sameHost', 'notPrimaryHost', 'blocking']);
  const hosts = [...new Set(primaries.map(p => p.host))];
  const mice = primaries.filter(p => p.host === 'mouse');
  let subclass = false;
  for (const h of hosts) {
    const g = primaries.filter(p => p.host === h);
    if (g.length < 2) continue;
    const isos = g.map(p => p.isotype || '');
    const distinct = isos.every(Boolean) && new Set(isos).size === isos.length;
    if (h === 'mouse' && distinct) { subclass = true; rules.add('subclass'); continue; }
    rules.add('dupHost');
    issues.push({ level: 'error', rule: 'dupHost', text: `${g.length} ${h} primaries${h === 'mouse' ? ' without different, known isotypes' : ''}: secondaries cannot tell them apart.` });
  }
  if (hosts.includes('goat') && hosts.includes('sheep')) { rules.add('goatSheep'); issues.push({ level: 'error', rule: 'goatSheep', text: 'Goat and sheep primaries together: anti-goat and anti-sheep secondaries cross-react.' }); }
  else if (hosts.includes('goat') || hosts.includes('sheep')) { rules.add('goatSheep'); issues.push({ level: 'warn', rule: 'goatSheep', text: 'Goat/sheep primary: block with normal serum of the secondary host, not BSA or milk (bovine IgG).' }); }
  if (hosts.includes('mouse') && hosts.includes('rat')) { rules.add('adsorb'); issues.push({ level: 'warn', rule: 'adsorb', text: 'Mouse and rat primaries together: use anti-mouse adsorbed against rat (min X Rat) and anti-rat adsorbed against mouse.' }); }
  if (sample && hosts.includes(sample)) { rules.add('endogenous'); issues.push({ level: 'warn', rule: 'endogenous', text: `${CAP(sample)} primary on ${sample} sample: anti-${sample} secondaries also detect endogenous ${sample} Ig.` }); }
  // Choose one secondary host: not a primary host, not closely related to one (subclass-specific → goat).
  const pool = subclass ? ['goat'] : ['donkey', 'goat'];
  const ok = h => !hosts.includes(h) && !hosts.some(p => related(p, h));
  let host = pool.find(ok) || null;
  if (!host) {
    if (subclass) issues.push({ level: 'error', rule: 'subclass', text: 'Subclass-specific anti-mouse secondaries are raised in goat, but a goat (or sheep) primary is present: a donkey anti-goat would bind the goat secondaries. Directly conjugate one primary instead.' });
    else issues.push({ level: 'error', rule: 'notPrimaryHost', text: 'Both donkey and goat primaries are present: no common secondary host. Mixing goat-anti and donkey-anti-goat secondaries fails because anti-goat binds the goat secondaries. Directly conjugate one primary, or find all secondaries in a third host.' });
  }
  const secondaries = primaries.map((p, i) => {
    const others = [...new Set([...hosts.filter(h => h !== p.host), ...(sample && sample !== p.host ? [sample] : [])])];
    const name = host ? `${CAP(host)} anti-${CAP(p.host)} ${igName(p, subclass && p.host === 'mouse')}` : '';
    return { i, host, name, minX: others, adsorbed: others.length > 0 };
  });
  if (hosts.length > 1 || sample) rules.add('adsorb');
  return { host, subclass, secondaries, issues, rules: [...rules].map(k => ({ key: k, ...SEC_RULES[k] })) };
}

// Assign conjugates (sorted bright → dim) to primaries (low abundance first). channels: [{dye, laser, brightness}].
export function assignChannels(primaries, channels) {
  const rank = { low: 0, medium: 1, high: 2 };
  const order = primaries.map((p, i) => i).sort((a, b) => (rank[primaries[a].abundance] ?? 1) - (rank[primaries[b].abundance] ?? 1));
  const ch = [...channels].sort((a, b) => (b.brightness || 0) - (a.brightness || 0));
  const out = new Array(primaries.length).fill(null);
  order.forEach((pi, k) => { out[pi] = ch[k] || null; });
  return out;
}

// ---------- absorbance, degree of labelling, reactions ----------
// Protein from A280 corrected for dye absorbance, and DOL = dye M / protein M (Thermo/DyLight formulas).
export function degreeOfLabelling({ a280, amax, epsDye, cf, epsProt = 210000, path = 1, dilution = 1, mw = null }) {
  const aProt = a280 - amax * cf;
  const protM = aProt / (epsProt * path) * dilution;
  const dyeM = amax / (epsDye * path) * dilution;
  return { aProt, protM, dyeM, dol: dyeM / protM, protMgMl: mw ? protM * mw : NaN };
}
// Beer–Lambert. mode 'eps' (M⁻¹cm⁻¹), 'e01' (A of 1 mg/mL), 'e1pct' (A of 1% = 10 mg/mL).
export function proteinFromAbsorbance({ a, path = 1, mode = 'eps', eps = null, e01 = null, e1pct = null, mw = null }) {
  let molar = NaN, mgMl = NaN;
  if (mode === 'eps') { molar = a / (eps * path); mgMl = mw ? molar * mw : NaN; }
  else { mgMl = mode === 'e01' ? a / (e01 * path) : 10 * a / (e1pct * path); molar = mw ? mgMl / mw : NaN; }
  return { molar, uM: molar * 1e6, mgMl };
}
export const mgMlToUM = (mgMl, mw) => mgMl / mw * 1e6;
export const uMToMgMl = (uM, mw) => uM * mw / 1e6;
export const e01FromEps = (eps, mw) => eps / mw;

// Dye needed for a labelling reaction: protein (mg or mg/mL × µL), molar excess, dye MW and stock (mM or mg/mL).
export function labellingReaction({ protMg, protMw = 150000, excess, dyeMw, stockMM = null, stockMgMl = null, reactivity = 100 }) {
  const protNmol = protMg / protMw * 1e6;
  const dyeNmol = protNmol * excess / (reactivity / 100);
  const dyeUg = dyeNmol * dyeMw / 1000;
  const stockUl = stockMM ? dyeNmol / stockMM : stockMgMl ? dyeUg / stockMgMl : NaN;
  return { protNmol, dyeNmol, dyeUg, stockUl };
}
