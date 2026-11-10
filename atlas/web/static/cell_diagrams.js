// Cell diagrams (600 x 400 SVG): shared helpers and the animal, plant, bacterial and yeast cells. More cell types in
// cell_diagrams2.js. Every structure is a <g class="cd-part" data-s="<structure id>"> with a <title>, so the page can
// highlight it and link it to the structure's explanation (ids as in data/content/cells.json).

export const COL = { mem: '#3dff8f', nuc: '#4f9dff', er: '#ffd23f', golgi: '#ff3fa4', mito: '#ff8a3d', lyso: '#b77bff', chl: '#3ddc84', vac: '#7fb2ff', cyto: '#9fb4d8', wall: '#8fd16a' };

export const part = (s, title, inner) => `<g class="cd-part" data-s="${s}"><title>${title}</title>${inner}</g>`;
// Leader line from a point on the structure to a text label.
export const label = (x, y, tx, ty, text, anchor = 'start') =>
  `<line class="cd-lead" x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/><text class="cd-label" x="${tx + (anchor === 'end' ? -4 : anchor === 'start' ? 4 : 0)}" y="${ty + 4}" text-anchor="${anchor}">${text}</text>`;
export function mito(cx, cy, rx, ry, rot = 0) {
  let cr = `M${cx - rx + 6},${cy}`;
  for (let i = 1; i < 8; i++) cr += ` L${cx - rx + 6 + i * (2 * rx - 12) / 8},${cy + (i % 2 ? -ry * 0.6 : ry * 0.6)}`;
  return `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${COL.mito}" fill-opacity=".28" stroke="${COL.mito}" stroke-width="1.5"/><path d="${cr}" fill="none" stroke="${COL.mito}" stroke-width="1"/></g>`;
}
export const dots = (pts, r, fill, op = 0.9) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" fill-opacity="${op}"/>`).join('');
export function golgi(x, y, s = 1, rot = 0) {
  let g = `<g transform="rotate(${rot} ${x} ${y})">`;
  for (let i = 0; i < 4; i++) g += `<path d="M${x - 34 * s + i * 3},${y - 14 * s + i * 9 * s} Q${x},${y - 30 * s + i * 9 * s} ${x + 34 * s - i * 3},${y - 14 * s + i * 9 * s}" fill="none" stroke="${COL.golgi}" stroke-width="${5 * s}" stroke-linecap="round" stroke-opacity=".75"/>`;
  return g + dots([[x + 40 * s, y + 6 * s], [x + 44 * s, y + 20 * s], [x - 42 * s, y + 10 * s]], 4 * s, COL.golgi, 0.6) + '</g>';
}
// Rough ER: arcs around a nucleus with ribosome dots.
function roughER(cx, cy, r0, a0, a1, n = 3) {
  let out = '';
  for (let k = 0; k < n; k++) {
    const r = r0 + k * 12, p = t => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    out += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${COL.er}" stroke-width="2.5" stroke-opacity=".7"/>`;
    for (let t = a0; t < a1; t += 0.22) { const [x, y] = p(t); out += `<circle cx="${(x + 3 * Math.cos(t)).toFixed(1)}" cy="${(y + 3 * Math.sin(t)).toFixed(1)}" r="1.6" fill="${COL.er}"/>`; }
  }
  return out;
}
function nucleus(cx, cy, r, nucleolus = true) {
  let pores = '';
  for (let t = 0; t < 2 * Math.PI; t += Math.PI / 7) pores += `<circle cx="${(cx + r * Math.cos(t)).toFixed(1)}" cy="${(cy + r * Math.sin(t)).toFixed(1)}" r="2.2" fill="#04070e"/>`;
  return part('nucleus', 'Nucleus: holds the chromosomes; DNA is copied and transcribed here', `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COL.nuc}" fill-opacity=".22"/>`) +
    part('nuclear-envelope', 'Nuclear envelope: a double membrane perforated by nuclear pores', `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COL.nuc}" stroke-width="3"/>${pores}`) +
    (nucleolus ? part('nucleolus', 'Nucleolus: where ribosomal RNA is made and ribosomes are assembled', `<circle cx="${cx + r * 0.2}" cy="${cy - r * 0.15}" r="${r * 0.28}" fill="${COL.nuc}" fill-opacity=".7"/>`) : '');
}

export const DIAGRAMS = {
  animal: {
    title: 'Animal cell', note: 'A generalised animal cell: no wall, organelles in the cytoplasm, a centrosome organising microtubules.',
    svg: () => {
      let s = part('plasma-membrane', 'Plasma membrane: lipid bilayer that bounds the cell and controls what enters and leaves', `<ellipse cx="300" cy="200" rx="255" ry="172" fill="${COL.mem}" fill-opacity=".05" stroke="${COL.mem}" stroke-width="3"/>`);
      let mt = ''; for (let t = 0; t < 2 * Math.PI; t += Math.PI / 9) mt += `<line x1="400" y1="250" x2="${(400 + 230 * Math.cos(t)).toFixed(0)}" y2="${(250 + 150 * Math.sin(t)).toFixed(0)}"/>`;
      s += part('microtubules', 'Cytoskeleton: microtubules, actin filaments and intermediate filaments give shape and tracks for transport', `<clipPath id="cdA"><ellipse cx="300" cy="200" rx="250" ry="167"/></clipPath><g clip-path="url(#cdA)" stroke="${COL.cyto}" stroke-opacity=".25" stroke-width="1">${mt}</g>`);
      s += part('rough-er', 'Rough endoplasmic reticulum: membrane sheets studded with ribosomes that make secreted and membrane proteins', roughER(270, 190, 82, 1.9, 4.6));
      s += part('smooth-er', 'Smooth endoplasmic reticulum: tubules that make lipids and store calcium', `<path d="M120,260 q20,-20 40,0 t40,0 t40,0 M130,285 q20,-18 40,0 t40,0" fill="none" stroke="${COL.er}" stroke-width="4" stroke-opacity=".55" stroke-linecap="round"/>`);
      s += nucleus(270, 190, 66);
      s += part('golgi', 'Golgi apparatus: stacked cisternae that modify, sort and package proteins', golgi(440, 140, 1, 10));
      s += part('mitochondria', 'Mitochondrion: makes most of the cell\'s ATP; folded inner membrane (cristae)', mito(160, 120, 34, 14, -20) + mito(470, 280, 30, 13, 25) + mito(330, 320, 28, 12, 5));
      s += part('lysosomes', 'Lysosome: acidic compartment with enzymes that break down macromolecules', dots([[420, 215], [500, 200], [215, 330]], 9, COL.lyso, 0.5));
      s += part('peroxisomes', 'Peroxisome: oxidises fatty acids and breaks down hydrogen peroxide', `<circle cx="380" cy="90" r="9" fill="#e8f1ff" fill-opacity=".25" stroke="#e8f1ff"/><circle cx="380" cy="90" r="3" fill="#e8f1ff"/>`);
      s += part('centrosome', 'Centrosome: a pair of centrioles; organises microtubules and the spindle', `<rect x="392" y="243" width="16" height="6" fill="#e8f1ff"/><rect x="397" y="252" width="6" height="16" fill="#e8f1ff"/>`);
      s += part('ribosomes', 'Free ribosomes: make proteins that stay in the cytosol', dots([[200, 100], [215, 95], [345, 260], [358, 262], [480, 120], [520, 240]], 2, '#e8f1ff'));
      s += part('endosomes', 'Vesicles and endosomes: carry material in from the surface and between compartments', dots([[540, 180], [90, 210], [300, 70]], 6, COL.cyto, 0.35));
      return s + label(326, 160, 360, 30, 'Nucleus') + label(286, 175, 330, 52, 'Nucleolus') + label(195, 170, 30, 40, 'Rough ER', 'start') + label(150, 268, 40, 340, 'Smooth ER') +
        label(460, 125, 520, 40, 'Golgi') + label(150, 112, 12, 96, 'Mitochondrion') + label(500, 200, 575, 150, 'Lysosome', 'end') + label(380, 90, 410, 18, 'Peroxisome') +
        label(400, 255, 500, 360, 'Centrosome') + label(300, 372, 300, 392, 'Plasma membrane', 'middle');
    },
  },
  plant: {
    title: 'Plant cell', note: 'A plant cell adds a cellulose wall, chloroplasts and a large central vacuole that keeps the cell turgid.',
    svg: () => {
      let s = part('cell-wall', 'Cell wall: cellulose layer outside the membrane that gives strength and shape', `<rect x="40" y="30" width="520" height="340" rx="22" fill="none" stroke="${COL.wall}" stroke-width="10"/>`);
      s += part('plasma-membrane', 'Plasma membrane: pressed against the wall by turgor pressure', `<rect x="50" y="40" width="500" height="320" rx="16" fill="${COL.mem}" fill-opacity=".04" stroke="${COL.mem}" stroke-width="2"/>`);
      s += part('vacuole', 'Central vacuole: a large sac of water and solutes bounded by the tonoplast; keeps the cell turgid', `<rect x="170" y="85" width="300" height="220" rx="60" fill="${COL.vac}" fill-opacity=".14" stroke="${COL.vac}" stroke-width="2"/>`);
      s += nucleus(110, 120, 42);
      s += part('rough-er', 'Endoplasmic reticulum: ribosome-studded membranes around the nucleus', roughER(110, 120, 52, 0.2, 2.2, 2));
      let chl = ''; for (const [x, y, r] of [[100, 300, 0], [500, 90, 90], [520, 220, 90], [300, 335, 0], [250, 62, 0], [400, 335, 10]]) {
        chl += `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="28" ry="13" fill="${COL.chl}" fill-opacity=".35" stroke="${COL.chl}" stroke-width="1.5"/>`;
        for (let i = -2; i <= 2; i++) chl += `<rect x="${x + i * 9 - 3}" y="${y - 6}" width="6" height="12" fill="${COL.chl}" fill-opacity=".8"/>`;
        chl += '</g>';
      }
      s += part('chloroplasts', 'Chloroplast: photosynthesis; stacks of thylakoid membranes (grana) hold chlorophyll', chl);
      s += part('mitochondria', 'Mitochondrion: respiration, as in animal cells', mito(90, 220, 22, 10, 70) + mito(500, 320, 22, 10, -20));
      s += part('golgi', 'Golgi apparatus: makes and sorts wall polysaccharides and proteins', golgi(140, 330, 0.7, 0));
      s += part('peroxisomes', 'Peroxisome', `<circle cx="520" cy="150" r="7" fill="#e8f1ff" fill-opacity=".25" stroke="#e8f1ff"/>`);
      s += part('plasmodesmata', 'Plasmodesmata: channels through the wall that connect neighbouring cells', `<rect x="296" y="24" width="8" height="14" fill="#04070e"/><rect x="296" y="362" width="8" height="14" fill="#04070e"/>`);
      return s + label(320, 195, 320, 195, 'Central vacuole', 'middle') + label(130, 100, 200, 20, 'Nucleus') + label(520, 220, 585, 250, 'Chloroplast', 'end') + label(45, 200, 15, 160, 'Cell wall', 'start') +
        label(90, 220, 15, 255, 'Mitochondrion', 'start') + label(140, 325, 200, 395, 'Golgi') + label(300, 30, 340, 12, 'Plasmodesma');
    },
  },
  bacterium: {
    title: 'Bacterium', note: 'A rod-shaped bacterium: no nucleus or membrane-bound organelles; DNA in a nucleoid, often a flagellum.',
    svg: () => {
      let s = part('cilia-flagella', 'Flagellum: a rotating helical filament that drives swimming', `<path d="M480,200 c20,-30 40,30 60,0 s40,30 60,0" fill="none" stroke="${COL.cyto}" stroke-width="3"/>`);
      s += part('pili', 'Pili: thin protein hairs for attachment and DNA transfer', `<g stroke="${COL.cyto}" stroke-width="1.5">${[[150, 130, 135, 105], [250, 120, 245, 92], [350, 120, 360, 92], [200, 280, 190, 308], [330, 282, 340, 310]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join('')}</g>`);
      s += part('cell-wall', 'Cell wall: peptidoglycan mesh (with an outer membrane in Gram-negative bacteria)', `<rect x="100" y="115" width="390" height="170" rx="85" fill="none" stroke="${COL.wall}" stroke-width="8"/>`);
      s += part('plasma-membrane', 'Plasma membrane: where respiration and transport happen in a bacterium', `<rect x="110" y="125" width="370" height="150" rx="75" fill="${COL.mem}" fill-opacity=".05" stroke="${COL.mem}" stroke-width="2"/>`);
      s += part('nucleoid', 'Nucleoid: the circular chromosome, folded but not enclosed by a membrane', `<path d="M220,200 c10,-40 50,-40 60,-10 s40,30 60,0 s-20,50 -60,40 s-70,10 -60,-30" fill="${COL.nuc}" fill-opacity=".2" stroke="${COL.nuc}" stroke-width="2"/>`);
      s += part('plasmid', 'Plasmid: small extra DNA circle, often carrying resistance genes', `<circle cx="400" cy="230" r="14" fill="none" stroke="${COL.nuc}" stroke-width="2"/>`);
      s += part('ribosomes', 'Ribosomes (70S): make proteins throughout the cytoplasm', dots([[160, 170], [180, 230], [190, 160], [380, 160], [420, 180], [300, 255], [340, 250], [150, 210], [430, 210]], 3, '#e8f1ff'));
      return s + label(280, 180, 300, 40, 'Nucleoid', 'middle') + label(400, 216, 450, 330, 'Plasmid') + label(130, 140, 60, 60, 'Cell wall', 'middle') + label(118, 210, 30, 230, 'Membrane', 'start') +
        label(560, 200, 560, 150, 'Flagellum', 'middle') + label(250, 95, 250, 70, 'Pili', 'middle') + label(180, 230, 120, 340, 'Ribosomes');
    },
  },
  yeast: {
    title: 'Yeast cell', note: 'Budding yeast: a fungal cell with a wall, nucleus and vacuole, dividing by growing a bud.',
    svg: () => {
      let s = part('cell-wall', 'Cell wall: glucans, mannoproteins and a little chitin', `<ellipse cx="260" cy="200" rx="160" ry="135" fill="none" stroke="${COL.wall}" stroke-width="8"/><circle cx="450" cy="150" r="62" fill="none" stroke="${COL.wall}" stroke-width="7"/>`);
      s += part('plasma-membrane', 'Plasma membrane', `<ellipse cx="260" cy="200" rx="150" ry="125" fill="${COL.mem}" fill-opacity=".05" stroke="${COL.mem}" stroke-width="2"/><circle cx="450" cy="150" r="54" fill="${COL.mem}" fill-opacity=".05" stroke="${COL.mem}" stroke-width="2"/>`);
      s += part('vacuole', 'Vacuole: the yeast equivalent of the lysosome, also a store', `<ellipse cx="220" cy="230" rx="60" ry="50" fill="${COL.vac}" fill-opacity=".18" stroke="${COL.vac}" stroke-width="2"/>`);
      s += nucleus(310, 150, 42);
      s += part('mitochondria', 'Mitochondria: in yeast often a branched network', mito(200, 120, 26, 10, -30) + mito(330, 280, 26, 10, 20) + mito(460, 165, 18, 8, 0));
      s += part('rough-er', 'Endoplasmic reticulum, continuous with the nuclear envelope', roughER(310, 150, 52, -0.4, 1.6, 2));
      s += part('bud-scar', 'Bud scar: a chitin ring left on the mother wall after each division', `<circle cx="140" cy="300" r="12" fill="none" stroke="${COL.wall}" stroke-width="4"/>`);
      return s + label(330, 140, 360, 40, 'Nucleus') + label(220, 230, 120, 380, 'Vacuole') + label(450, 120, 530, 50, 'Bud') + label(132, 306, 12, 350, 'Bud scar') + label(185, 112, 12, 60, 'Mitochondrion') + label(102, 210, 12, 240, 'Cell wall');
    },
  },
};
