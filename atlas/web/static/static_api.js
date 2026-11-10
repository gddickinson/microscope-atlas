// Static-site data layer: answers /api/... calls from JSON files exported by scripts/build_static.py.
// Plain paths map to files (api/techniques/tirf.json); queried endpoints are filtered here, mirroring
// atlas/catalog.py search() and atlas/fluorophores.py search().
const files = new Map();
async function file(rel) {
  if (!files.has(rel)) files.set(rel, fetch('api/' + rel + '.json').then(r => { if (!r.ok) throw new Error(`${r.status} ${rel}`); return r.json(); }));
  return files.get(rel);
}

export async function staticApi(path) {
  const [p, qs] = path.split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const clean = p.replace(/^\/+/, '');
  if (clean === 'systems' && qs) return searchSystems(q);
  if (clean === 'fluorophores') return searchFluor(q);
  if (clean.startsWith('lab/')) throw new Error('This tool needs the full app (Python server).');
  return file(clean);
}

async function searchSystems({ q = '', technique = '', kind = '', manufacturer = '', status = '', family = '' }) {
  const [all, techs] = await Promise.all([file('systems'), file('techniques')]);
  const fam = Object.fromEntries(techs.map(t => [t.id, t.family]));
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const text = s => [s.name, s.manufacturer, s.summary, (s.techniques || []).join(' '), (s.applications || []).join(' '),
    Object.entries(s.specs || {}).map(([k, v]) => `${k} ${v}`).join(' ')].join(' ').toLowerCase();
  return all.filter(s => (!technique || (s.techniques || []).includes(technique)) &&
    (!family || (s.techniques || []).some(t => fam[t] === family)) && (!kind || s.kind === kind) &&
    (!manufacturer || s.manufacturer === manufacturer) && (!status || s.status === status) &&
    (!words.length || words.every(w => text(s).includes(w))));
}

async function searchFluor({ q = '', kind = '', ex_min = 0, ex_max = 2000, limit = 300 }) {
  const all = await file('fluorophores');
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return all.filter(r => (!kind || r.kind === kind) && r.ex >= +ex_min && r.ex <= +ex_max && words.every(w => r.name.toLowerCase().includes(w)))
    .sort((a, b) => (b.brightness || 0) - (a.brightness || 0) || a.name.localeCompare(b.name)).slice(0, +limit);
}
