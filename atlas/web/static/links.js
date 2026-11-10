// Auto-linking of terms in teaching text: techniques -> their pages, glossary terms -> glossary,
// software and resources -> external sites. Call loadLinks() once; linkify(text, seen) returns safe HTML.
import { api, esc } from './core.js';

const ALIASES = {
  tirf: ['TIRF'], hilo: ['HILO'], confocal: ['confocal'], 'spinning-disk': ['spinning-disk', 'spinning disk'], ism: ['Airyscan', 'image scanning microscopy'],
  multiphoton: ['two-photon', 'multiphoton'], 'light-sheet': ['light-sheet', 'light sheet', 'SPIM'], 'lattice-light-sheet': ['lattice light-sheet', 'lattice light sheet'],
  'oblique-plane': ['oblique-plane', 'SCAPE'], sim: ['SIM', 'structured illumination'], sted: ['STED'], smlm: ['PALM', 'STORM', 'dSTORM', 'SMLM'],
  'dna-paint': ['DNA-PAINT'], minflux: ['MINFLUX', 'MINSTED'], fluctuation: ['SOFI', 'SRRF'], expansion: ['expansion microscopy'],
  flim: ['FLIM'], fret: ['FRET'], fcs: ['FCS'], frap: ['FRAP'], spt: ['single-particle tracking', 'sptPALM'], spectral: ['spectral unmixing'],
  raman: ['Raman'], 'cars-srs': ['CARS', 'SRS'], shg: ['SHG', 'second-harmonic'], qpi: ['quantitative phase', 'holotomography'], iscat: ['iSCAT', 'mass photometry'],
  oct: ['OCT'], photoacoustic: ['photoacoustic'], tem: ['TEM'], sem: ['SEM'], 'cryo-em': ['cryo-EM'], 'cryo-et': ['cryo-ET', 'cryo-electron tomography'],
  'volume-em': ['FIB-SEM', 'serial block-face'], afm: ['AFM', 'atomic force microscopy'], spm: ['STM', 'scanning tunnelling microscopy', 'scanning tunneling microscopy'], xray: ['micro-CT', 'X-ray microscopy'], clem: ['CLEM'],
  'high-content': ['high-content'], 'slide-scanner': ['whole-slide'], intravital: ['intravital'], miniscope: ['miniscope'], 'adaptive-optics': ['adaptive optics'],
  'light-field': ['light-field'], 'phase-contrast': ['phase contrast'], dic: ['DIC'], darkfield: ['darkfield', 'dark-field'], polarization: ['polarized light'],
  widefield: ['widefield', 'epifluorescence'], brightfield: ['brightfield'], stereo: ['stereomicroscope'],
};
let index = null, re = null;

export async function loadLinks() {
  try {
    const [glossary, community] = await Promise.all([api('/content/glossary'), api('/content/community')]);
    index = new Map();
    for (const [id, names] of Object.entries(ALIASES)) for (const n of names) index.set(n, { href: `#/technique/${id}`, key: id });
    for (const g of glossary) {
      const t = g.term.replace(/\s*\(.*\)$/, '');
      if (t.length > 4 && !index.has(t)) index.set(t.toLowerCase(), { href: `#/glossary?q=${encodeURIComponent(t)}`, key: 'g:' + t, ci: true });
    }
    for (const grp of community) for (const l of grp.links) {
      const n = l.name.replace(/\s*\(.*\)$/, '');
      if (!index.has(n)) index.set(n, { href: l.url, key: 'x:' + n, ext: true });
    }
    const terms = [...index.keys()].sort((a, b) => b.length - a.length).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    re = new RegExp(`(?<![\\w-])(${terms.join('|')})(?![\\w-])`, 'gi');
  } catch (e) { console.warn('links unavailable', e); }
}

// seen: a Set shared across one page so each term is linked once; skip: a technique id not to link (the current page).
export function linkify(text, seen = new Set(), skip = '') {
  const safe = esc(text);
  if (!re) return safe;
  return safe.replace(re, m => {
    const hit = index.get(m) || index.get(m.toLowerCase());
    if (!hit || (!hit.ci && !index.has(m)) || hit.key === skip || seen.has(hit.key)) return m;
    seen.add(hit.key);
    return hit.ext ? `<a href="${esc(hit.href)}" target="_blank" rel="noopener" class="xl">${m}</a>` : `<a href="${hit.href}" class="il">${m}</a>`;
  });
}
