// Pure bench calculations for Lab Tools (no DOM): units, molarity, dilutions, serial dilutions, seeding,
// hemocytometer, centrifuge, photons, Stokes–Einstein, recipe scaling. Tested by tests/lab_bench.test.mjs.

// --- units ----------------------------------------------------------------------------------------
export const VOLUME = { L: 1, mL: 1e-3, 'µL': 1e-6, nL: 1e-9 };            // litres
export const MASS = { kg: 1e3, g: 1, mg: 1e-3, 'µg': 1e-6, ng: 1e-9 };       // grams
// Concentration units: kind 'molar' (base mol/L), 'mass' (base g/L) or 'x' (fold of a stock).
export const CONC = {
  M: ['molar', 1], mM: ['molar', 1e-3], 'µM': ['molar', 1e-6], nM: ['molar', 1e-9], pM: ['molar', 1e-12],
  'g/L': ['mass', 1], 'mg/mL': ['mass', 1], 'µg/mL': ['mass', 1e-3], 'ng/mL': ['mass', 1e-6], 'µg/µL': ['mass', 1],
  '% (w/v)': ['mass', 10], X: ['x', 1],
};
export const CONC_UNITS = Object.keys(CONC);

// Convert a concentration between units. Molar <-> mass needs MW (g/mol); X only converts to X. NaN if impossible.
export function convertConc(v, from, to, mw = NaN) {
  const [kf, ff] = CONC[from] || [], [kt, ft] = CONC[to] || [];
  if (!kf || !kt) return NaN;
  let base = v * ff;
  if (kf !== kt) {
    if (kf === 'x' || kt === 'x' || !(mw > 0)) return NaN;
    base = kf === 'molar' ? base * mw : base / mw; // mol/L·g/mol = g/L
  }
  return base / ft;
}

export const convertVolume = (v, from, to) => v * VOLUME[from] / VOLUME[to];
export const convertMass = (v, from, to) => v * MASS[from] / MASS[to];

// SI prefixes for the general prefix converter.
export const PREFIX = { T: 1e12, G: 1e9, M: 1e6, k: 1e3, '': 1, c: 1e-2, m: 1e-3, 'µ': 1e-6, n: 1e-9, p: 1e-12, f: 1e-15 };
export const convertPrefix = (v, from, to) => v * PREFIX[from] / PREFIX[to];

// Pick a readable unit from a table: auto(0.00025, VOLUME) -> [250, 'µL'].
export function autoUnit(v, table) {
  const units = Object.entries(table).sort((a, b) => b[1] - a[1]);
  if (!Number.isFinite(v) || v === 0) return [v, units.find(u => u[1] === 1)?.[0] ?? units[0][0]];
  for (const [u, f] of units) if (Math.abs(v) / f >= 1) return [v / f, u];
  const [u, f] = units[units.length - 1];
  return [v / f, u];
}

// --- molarity: mass (g) = C (mol/L) × V (L) × MW (g/mol). Pass the unknown as null. -------------------
export function molarity({ massG = null, volL = null, molar = null, mw }) {
  if (!(mw > 0)) return { massG: NaN, volL: NaN, molar: NaN };
  if (massG === null) massG = molar * volL * mw;
  else if (volL === null) volL = massG / (molar * mw);
  else if (molar === null) molar = massG / (volL * mw);
  return { massG, volL, molar };
}

// --- C1 V1 = C2 V2 in consistent units; the unknown is null. ----------------------------------------
export function c1v1({ c1 = null, v1 = null, c2 = null, v2 = null }) {
  if (v1 === null) v1 = c2 * v2 / c1;
  else if (c2 === null) c2 = c1 * v1 / v2;
  else if (v2 === null) v2 = c1 * v1 / c2;
  else if (c1 === null) c1 = c2 * v2 / v1;
  return { c1, v1, c2, v2, diluent: v2 - v1 };
}

// Dilution with units: stock c1 (u1) to final c2 (u2) in final volume v2. Returns V1 (same unit as v2) and diluent.
export function dilute({ c1, u1, c2, u2, v2, mw = NaN }) {
  const c1In2 = convertConc(c1, u1, u2, mw);
  if (!Number.isFinite(c1In2)) return { v1: NaN, diluent: NaN, fold: NaN, error: 'Units are not compatible (give MW to mix molar and mass units).' };
  if (c2 > c1In2) return { v1: NaN, diluent: NaN, fold: c1In2 / c2, error: 'Final concentration is higher than the stock.' };
  const r = c1v1({ c1: c1In2, c2, v2 });
  return { v1: r.v1, diluent: r.diluent, fold: c1In2 / c2 };
}

// --- serial dilution ---------------------------------------------------------------------------------
// mode 'remaining': each tube keeps volume V after passing transfer T on (T = V/(F−1), diluent = V).
// mode 'mixed': each tube is mixed to total V (T = V/F, diluent = V − T); the last tube keeps V.
export function serialDilution({ c0, fold, steps, volume, mode = 'remaining' }) {
  if (!(fold > 1) || !(steps >= 1)) return { transfer: NaN, diluent: NaN, rows: [], stockNeeded: NaN };
  const transfer = mode === 'mixed' ? volume / fold : volume / (fold - 1);
  const diluent = mode === 'mixed' ? volume - transfer : volume;
  const rows = [];
  for (let i = 1; i <= steps; i++) rows.push({ tube: i, conc: c0 / fold ** i, dilution: fold ** i, transfer, diluent, total: transfer + diluent });
  return { transfer, diluent, rows, stockNeeded: transfer, diluentTotal: diluent * steps };
}

// --- percent solutions and stock-to-working ------------------------------------------------------------
export const percentWV = (pct, volMl) => pct * volMl / 100;     // grams of solute
export const percentVV = (pct, volMl) => pct * volMl / 100;     // mL of solute
export function stockToWorking({ stockX, workX, finalVol }) {
  const v1 = workX * finalVol / stockX;
  return { v1, diluent: finalVol - v1 };
}

// --- cell seeding --------------------------------------------------------------------------------------
// density: cells/cm²; area: cm² per well; stock: cells/mL; overage: fractional extra (0.1 = 10 %).
export function seeding({ area, density, stock, wells = 1, overage = 0.1 }) {
  const perWell = density * area;
  const volPerWellMl = perWell / stock;
  const n = wells * (1 + overage);
  return { perWell, volPerWellMl, totalCells: perWell * n, totalVolMl: volPerWellMl * n };
}
export const densityFromConfluence = (confluencePct, confluentDensity) => confluencePct / 100 * confluentDensity;

// --- hemocytometer (Neubauer: 1 mm × 1 mm × 0.1 mm large square = 1e-4 mL) ------------------------------
// live, dead: arrays of counts per large square; dilution: total dilution factor (trypan 1:1 -> 2).
export function hemocytometer({ live, dead = [], dilution = 2, squareMl = 1e-4 }) {
  const n = live.length;
  if (!n) return { liveMl: NaN, deadMl: NaN, totalMl: NaN, viability: NaN, meanLive: NaN };
  const sum = a => a.reduce((s, v) => s + v, 0);
  const meanLive = sum(live) / n, meanDead = dead.length ? sum(dead) / dead.length : 0;
  const k = dilution / squareMl;
  const liveMl = meanLive * k, deadMl = meanDead * k;
  return { meanLive, meanDead, liveMl, deadMl, totalMl: liveMl + deadMl, viability: liveMl + deadMl > 0 ? 100 * liveMl / (liveMl + deadMl) : NaN };
}

// --- centrifuge: RCF = 1.118e-5 · r(cm) · RPM² -----------------------------------------------------------
export const rcf = (rpm, rCm) => 1.118e-5 * rCm * rpm * rpm;
export const rpmFromRcf = (g, rCm) => Math.sqrt(g / (1.118e-5 * rCm));

// --- photons and diffusion ----------------------------------------------------------------------------------
export const H = 6.62607015e-34, C = 2.99792458e8, KB = 1.380649e-23, NA_AVO = 6.02214076e23, QE = 1.602176634e-19;
export const photonEnergyJ = nm => H * C / (nm * 1e-9);
export const photonEnergyEV = nm => photonEnergyJ(nm) / QE;
export const photonsPerSecond = (mW, nm) => mW * 1e-3 / photonEnergyJ(nm);
export const powerFromPhotons = (perS, nm) => perS * photonEnergyJ(nm) * 1e3; // mW

// Radius (nm) of a compact sphere of mass MW (Da) with partial specific volume vbar (cm³/g, 0.73 for proteins).
// No hydration shell, so this is a lower bound on the hydrodynamic radius.
export function radiusFromMW(mwDa, vbar = 0.73) {
  const volCm3 = mwDa * vbar / NA_AVO;
  return Math.cbrt(3 * volCm3 / (4 * Math.PI)) * 1e7; // cm -> nm
}
// Stokes–Einstein D = kT/(6πηr). rNm in nm, T in °C, eta in mPa·s. Returns µm²/s.
export function stokesEinstein(rNm, tempC = 25, etaMPas = 0.89) {
  return KB * (tempC + 273.15) / (6 * Math.PI * etaMPas * 1e-3 * rNm * 1e-9) * 1e12;
}

// --- recipes ------------------------------------------------------------------------------------------------
// recipe.rows: [[component, amount, unit, note?]] for recipe.baseMl; returns rows scaled to targetMl with readable units.
export function scaleRecipe(recipe, targetMl) {
  const f = targetMl / recipe.baseMl;
  return recipe.rows.map(([name, amount, unit, note = '']) => {
    if (amount === null || amount === undefined) return { name, amount: null, unit, note };
    if (unit in MASS) { const [v, u] = autoUnit(amount * f * MASS[unit], { g: 1, mg: 1e-3, 'µg': 1e-6 }); return { name, amount: v, unit: u, note }; }
    if (unit in VOLUME) { const [v, u] = autoUnit(amount * f * VOLUME[unit], { L: 1, mL: 1e-3, 'µL': 1e-6 }); return { name, amount: v, unit: u, note }; }
    return { name, amount: amount * f, unit, note };
  });
}

// Parse whitespace/comma separated numbers ("12 15, 9") into an array, ignoring junk.
export const parseNumbers = s => String(s).split(/[\s,;]+/).filter(t => t !== '').map(Number).filter(Number.isFinite);
