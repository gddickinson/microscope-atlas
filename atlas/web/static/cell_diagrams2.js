// Cell diagrams, part 2: specialised animal cells (neuron, red blood cell, neutrophil, skeletal muscle fibre,
// columnar epithelium, sperm). Same conventions as cell_diagrams.js; merged into DIAGRAMS there by cells.js.
import { COL, part, label, mito, dots } from './cell_diagrams.js';

function nuc(cx, cy, rx, ry = rx, t = 'Nucleus') {
  return part('nucleus', t, `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${COL.nuc}" fill-opacity=".25" stroke="${COL.nuc}" stroke-width="2.5"/>`);
}

export const DIAGRAMS2 = {
  neuron: {
    title: 'Neuron', note: 'A neuron receives inputs on its dendrites, integrates them in the cell body and sends action potentials down the axon.',
    svg: () => {
      let den = '';
      for (const [x, y] of [[40, 60], [30, 200], [60, 330], [150, 30], [160, 370]]) den += `<path d="M120,200 Q${(x + 120) / 2 + 15},${(y + 200) / 2 - 10} ${x},${y}" /><path d="M${(x + 120) / 2},${(y + 200) / 2} l${x < 100 ? -20 : 20},${y < 200 ? -25 : 25}"/>`;
      let s = part('dendrite', 'Dendrites: branched inputs that receive synapses from other neurons', `<g fill="none" stroke="${COL.mem}" stroke-width="5" stroke-linecap="round" stroke-opacity=".7">${den}</g>`);
      s += part('plasma-membrane', 'Cell body (soma): membrane and cytoplasm around the nucleus', `<circle cx="120" cy="200" r="48" fill="${COL.mem}" fill-opacity=".1" stroke="${COL.mem}" stroke-width="3"/>`);
      s += nuc(118, 198, 22, 22, 'Nucleus of the neuron, in the cell body');
      s += part('rough-er', 'Nissl substance: stacks of rough ER that stain darkly in the cell body', dots([[95, 170], [145, 175], [100, 230], [145, 222], [120, 240]], 4, COL.er, 0.7));
      s += part('axon', 'Axon: a single long process that carries action potentials away from the cell body', `<path d="M168,200 L520,200" stroke="${COL.mem}" stroke-width="4"/>`);
      let my = ''; for (let x = 200; x < 500; x += 62) my += `<rect x="${x}" y="190" width="52" height="20" rx="10"/>`;
      s += part('myelin', 'Myelin sheath: wrapped glial membrane that insulates the axon; gaps are nodes of Ranvier', `<g fill="#e8f1ff" fill-opacity=".2" stroke="#e8f1ff" stroke-width="1.5">${my}</g>`);
      let term = ''; for (const [x, y] of [[575, 150], [585, 200], [570, 250]]) term += `<path d="M520,200 L${x},${y}" stroke="${COL.mem}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="${COL.golgi}" fill-opacity=".4" stroke="${COL.golgi}"/>`;
      s += part('synapse', 'Axon terminals: synaptic boutons that release neurotransmitter onto the next cell', term);
      return s + label(120, 180, 210, 70, 'Nucleus') + label(150, 225, 220, 330, 'Cell body') + label(60, 120, 30, 20, 'Dendrites', 'start') + label(228, 200, 260, 140, 'Myelin sheath') +
        label(255, 200, 290, 270, 'Node of Ranvier') + label(400, 200, 400, 330, 'Axon', 'middle') + label(585, 200, 590, 300, 'Terminals', 'end');
    },
  },
  erythrocyte: {
    title: 'Red blood cell', note: 'Mammalian red blood cells lose their nucleus and organelles as they mature: a biconcave disc packed with haemoglobin.',
    svg: () => {
      let s = part('plasma-membrane', 'Red cell seen face on: the thin centre looks pale under the microscope', `<circle cx="180" cy="200" r="120" fill="#ff4d4d" fill-opacity=".35" stroke="#ff6b6b" stroke-width="3"/><circle cx="180" cy="200" r="55" fill="#ff4d4d" fill-opacity=".12"/>`);
      s += part('cytoskeleton', 'Spectrin cytoskeleton under the membrane: lets the cell deform through narrow capillaries', `<circle cx="180" cy="200" r="112" fill="none" stroke="${COL.cyto}" stroke-dasharray="3 5" stroke-width="2"/>`);
      s += part('haemoglobin', 'Cytoplasm full of haemoglobin, the oxygen-carrying protein; no nucleus or mitochondria', `<path d="M380,150 C420,110 520,110 560,150 C540,185 540,215 560,250 C520,290 420,290 380,250 C400,215 400,185 380,150 Z" fill="#ff4d4d" fill-opacity=".35" stroke="#ff6b6b" stroke-width="3"/>`);
      return s + label(180, 200, 180, 360, 'Pale centre (thin)', 'middle') + label(280, 140, 330, 60, 'Membrane and spectrin') + label(470, 200, 470, 340, 'Side view: biconcave disc', 'middle');
    },
  },
  neutrophil: {
    title: 'Neutrophil', note: 'The commonest white blood cell: a lobed nucleus and a cytoplasm full of granules, built to engulf bacteria.',
    svg: () => {
      let s = part('plasma-membrane', 'Plasma membrane: ruffles and pseudopods let the cell crawl and engulf', `<path d="M300,60 C400,55 470,120 470,200 C480,290 400,345 300,340 C200,345 120,290 130,200 C120,120 200,55 300,60 Z" fill="${COL.mem}" fill-opacity=".05" stroke="${COL.mem}" stroke-width="3"/>`);
      s += part('nucleus', 'Multilobed nucleus: typically three to five lobes joined by thin strands', `<g fill="${COL.lyso}" fill-opacity=".35" stroke="${COL.lyso}" stroke-width="2.5"><ellipse cx="230" cy="170" rx="42" ry="34"/><ellipse cx="320" cy="150" rx="40" ry="32"/><ellipse cx="350" cy="245" rx="44" ry="34"/><path d="M265,165 L285,155 M335,180 L345,212" stroke-width="6"/></g>`);
      const g = []; for (let i = 0; i < 60; i++) { const t = i * 2.4, r = 40 + (i * 37) % 120; g.push([300 + r * Math.cos(t), 200 + r * 0.8 * Math.sin(t)]); }
      s += part('granule', 'Granules: lysosome-like stores of enzymes and antimicrobial proteins', dots(g.filter(([x, y]) => Math.hypot((x - 300) / 165, (y - 200) / 135) < 0.95), 3, COL.golgi, 0.6));
      s += part('lysosomes', 'Phagosome: an engulfed bacterium being digested', `<circle cx="200" cy="280" r="20" fill="none" stroke="${COL.lyso}" stroke-width="2"/><rect x="190" y="274" width="20" height="10" rx="5" fill="${COL.wall}" fill-opacity=".7"/>`);
      return s + label(320, 130, 360, 30, 'Lobed nucleus') + label(420, 230, 530, 300, 'Granules') + label(200, 280, 90, 360, 'Phagosome', 'end') + label(470, 180, 560, 140, 'Membrane', 'end');
    },
  },
  'skeletal-muscle': {
    title: 'Skeletal muscle fibre', note: 'A muscle fibre is one huge cell made by fusion: many nuclei at the edge and myofibrils with repeating sarcomeres.',
    svg: () => {
      let s = part('plasma-membrane', 'Sarcolemma: the muscle fibre\'s plasma membrane', `<rect x="30" y="110" width="540" height="180" rx="40" fill="${COL.golgi}" fill-opacity=".06" stroke="${COL.golgi}" stroke-width="3"/>`);
      let band = ''; for (let x = 60; x < 550; x += 26) band += `<rect x="${x}" y="125" width="13" height="150" fill="${COL.golgi}" fill-opacity=".35"/><line x1="${x + 19.5}" y1="125" x2="${x + 19.5}" y2="275" stroke="#e8f1ff" stroke-opacity=".5"/>`;
      s += part('sarcomere', 'Myofibrils: the striations are repeating sarcomeres (dark A bands of myosin, light I bands, Z lines)', band);
      s += part('nucleus', 'Nuclei: many per fibre, pushed to the edge under the membrane', `<g fill="${COL.nuc}" fill-opacity=".45" stroke="${COL.nuc}">${[[110, 118], [280, 282], [420, 118], [520, 282]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="7"/>`).join('')}</g>`);
      s += part('mitochondria', 'Mitochondria between myofibrils supply ATP for contraction', mito(190, 200, 16, 6) + mito(360, 200, 16, 6));
      return s + label(110, 118, 110, 60, 'Peripheral nuclei', 'middle') + label(230, 150, 280, 50, 'Striations (sarcomeres)') + label(570, 200, 585, 350, 'Sarcolemma', 'end') + label(360, 200, 400, 350, 'Mitochondria');
    },
  },
  'columnar-epithelium': {
    title: 'Columnar epithelium', note: 'Gut-lining cells sit side by side on a basement membrane, sealed by junctions, with microvilli on the top surface.',
    svg: () => {
      let cells = '', mv = '', n = [];
      for (let i = 0; i < 6; i++) {
        const x = 60 + i * 82; cells += `<rect x="${x}" y="90" width="80" height="250" rx="6"/>`; n.push([x + 40, 290]);
        for (let k = 0; k < 8; k++) mv += `<rect x="${x + 6 + k * 9}" y="70" width="5" height="22" rx="2"/>`;
      }
      let s = part('plasma-membrane', 'Plasma membranes of neighbouring cells', `<g fill="${COL.mem}" fill-opacity=".05" stroke="${COL.mem}" stroke-width="2">${cells}</g>`);
      s += part('microvilli', 'Microvilli: finger-like projections supported by actin that enlarge the absorbing surface', `<g fill="${COL.cyto}" fill-opacity=".5">${mv}</g>`);
      s += part('junction', 'Tight junctions: seal the gaps between cells near the top', dots([140, 222, 304, 386, 468].map(x => [x, 100]), 5, COL.er, 0.9));
      s += part('nucleus', 'Nuclei: oval, near the base of each cell', `<g fill="${COL.nuc}" fill-opacity=".35" stroke="${COL.nuc}">${n.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="26"/>`).join('')}</g>`);
      s += part('golgi', 'Golgi above the nucleus, sending proteins to the top surface', dots(n.map(([x, y]) => [x, y - 60]), 7, COL.golgi, 0.5));
      s += part('basement-membrane', 'Basement membrane: a sheet of extracellular matrix the epithelium sits on', `<rect x="50" y="342" width="500" height="8" fill="${COL.wall}" fill-opacity=".6"/>`);
      return s + label(100, 75, 100, 30, 'Microvilli', 'middle') + label(222, 100, 300, 30, 'Tight junction') + label(100, 290, 20, 380, 'Nucleus', 'start') + label(100, 230, 30, 160, 'Golgi', 'start') + label(400, 346, 420, 385, 'Basement membrane');
    },
  },
  sperm: {
    title: 'Sperm cell', note: 'A streamlined cell: a compact nucleus, an acrosome to penetrate the egg, mitochondria wrapped round the flagellum.',
    svg: () => {
      let s = part('acrosome', 'Acrosome: a cap of enzymes released to get through the egg\'s coat', `<path d="M70,200 C70,160 110,150 130,165 L130,235 C110,250 70,240 70,200 Z" fill="${COL.golgi}" fill-opacity=".4" stroke="${COL.golgi}" stroke-width="2"/>`);
      s += part('nucleus', 'Nucleus: very tightly packed DNA (one set of chromosomes)', `<ellipse cx="150" cy="200" rx="58" ry="38" fill="${COL.nuc}" fill-opacity=".3" stroke="${COL.nuc}" stroke-width="2.5"/>`);
      let sp = ''; for (let x = 212; x < 320; x += 12) sp += `<ellipse cx="${x}" cy="200" rx="6" ry="13" fill="${COL.mito}" fill-opacity=".45" stroke="${COL.mito}"/>`;
      s += part('mitochondria', 'Midpiece: mitochondria spiral round the flagellum and power swimming', sp);
      s += part('cilia-flagella', 'Flagellum (tail): a 9+2 microtubule axoneme that beats in waves', `<path d="M320,200 c40,-40 70,40 110,0 s70,40 110,0 s30,-20 40,-10" fill="none" stroke="${COL.cyto}" stroke-width="4"/>`);
      return s + label(90, 175, 60, 80, 'Acrosome', 'middle') + label(160, 225, 160, 320, 'Nucleus', 'middle') + label(270, 190, 280, 100, 'Midpiece (mitochondria)', 'middle') + label(480, 205, 480, 320, 'Flagellum', 'middle');
    },
  },
};
