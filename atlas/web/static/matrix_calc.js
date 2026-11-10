// Pure helpers for the technique comparison matrix (#/matrix): read the first stated length out of teaching text
// ("~200-250 nm", "~1.2-4 Å", "~5-20 µm") so rows can be sorted and drawn on a log axis. Node-tested.

const UNIT_NM = { 'Å': 0.1, nm: 1, 'µm': 1e3, 'μm': 1e3, um: 1e3, mm: 1e6, cm: 1e7 };
const NUM = String.raw`(\d+(?:\.\d+)?)`;
const LEN = new RegExp(String.raw`${NUM}(?:\s*(?:-|–|to)\s*${NUM})?\s*(Å|nm|µm|μm|um|mm|cm)(?![A-Za-z])`);

/** First length stated in `text` as {lo, hi} in nanometres (hi = lo for a single value), or null. */
export function firstLength(text) {
  const m = LEN.exec(String(text || ''));
  if (!m) return null;
  const f = UNIT_NM[m[3]];
  const lo = +m[1] * f, hi = (m[2] ? +m[2] : +m[1]) * f;
  return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
}

/** Lateral resolution for the matrix bar: a length stated just after the word "resolution" wins (slide scanners give
 *  pixel size first); otherwise the first length, unless the words before it show it is not a resolution (a FRAP
 *  bleach spot, a CLEM correlation precision), in which case null (no bar). */
export function lateralLength(text) {
  const t = String(text || '');
  const r = /resolution[^;.(]{0,12}?\s*~?\s*(?=\d)/i.exec(t);
  if (r) { const v = firstLength(t.slice(r.index + r[0].length)); if (v) return v; }
  const m = LEN.exec(t);
  if (!m || /bleach|correlation/i.test(t.slice(0, m.index))) return null;
  return firstLength(t);
}

/** Position of a length (nm) on a log axis from `min` to `max` nm, as a fraction 0-1 (clamped). */
export function logPos(nm, min = 0.1, max = 1e5) {
  const f = (Math.log10(nm) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return Math.min(1, Math.max(0, f));
}

/** Human-readable length from nanometres: 0.2 nm, 250 nm, 1.5 µm, 2 mm. */
export function fmtLength(nm) {
  if (nm < 1) return `${+nm.toPrecision(2)} nm`;
  if (nm < 1e3) return `${+nm.toPrecision(3)} nm`;
  if (nm < 1e6) return `${+(nm / 1e3).toPrecision(3)} µm`;
  return `${+(nm / 1e6).toPrecision(3)} mm`;
}

/** Sort comparator for matrix rows; rows without a value always go last. `key(row)` gives a number, string or null. */
export function byKey(key, dir = 1) {
  return (a, b) => {
    const x = key(a), y = key(b);
    if (x == null || x === '') return (y == null || y === '') ? 0 : 1;
    if (y == null || y === '') return -1;
    return dir * (typeof x === 'number' ? x - y : String(x).localeCompare(String(y)));
  };
}
