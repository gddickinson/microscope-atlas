// Reference tables for the Labelling and probes tools. Every number was read from the linked source;
// values that could not be sourced are left out (empty string), never typed from memory.

export const SRC = {
  af: { title: 'Thermo Fisher MP10168: Alexa Fluor succinimidyl esters, Table 4', url: 'https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp10168.pdf' },
  amine: { title: 'Thermo Fisher MP00143: Amine-reactive probes (protocol and Appendix Table 2)', url: 'https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp00143.pdf' },
  thiol: { title: 'Thermo Fisher MP00003: Thiol-reactive probes', url: 'https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp00003.pdf' },
  dylight: { title: 'Thermo Fisher MAN0011617: DyLight amine-reactive dyes (Table 2 and worked example)', url: 'https://documents.thermofisher.com/TFS-Assets/LSG/manuals/MAN0011617_DyLight_AmineReactive_Dye_UG.pdf' },
  fpblog: { title: 'Thermo Fisher blog: calculate dye:protein molar ratios (DyLight 550 IgG example)', url: 'https://thermofisher.com/blog/learning-at-the-bench/calculate-dye-protein-molar-ratios' },
  jirMulti: { title: 'Jackson ImmunoResearch: multiple labeling', url: 'https://www.jacksonimmuno.com/technical/products/protocols/multiple-labeling' },
  jirAdsorb: { title: 'Jackson ImmunoResearch: cross-adsorbed and cross-reactivity', url: 'https://www.jacksonimmuno.com/secondary-antibody-resource/technical-tips/cross-adsorbed-and-cross-reactivity/' },
  jirSub: { title: 'Jackson ImmunoResearch: subclass-specific anti-mouse IgG', url: 'https://www.jacksonimmuno.com/technical/products/groups/subclass-specific' },
  jirFaq: { title: 'Jackson ImmunoResearch FAQ: background', url: 'https://www.jacksonimmuno.com/technical/products/faq/background' },
  halo: { title: 'Wikipedia: HaloTag', url: 'https://en.wikipedia.org/wiki/HaloTag' },
  grimm: { title: 'Grimm et al. 2015 Nat Methods (Janelia Fluor dyes), PMC4344395', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4344395/' },
  promegaJF: { title: 'Promega: HaloTag ligands for super-resolution microscopy', url: 'https://ch.promega.com/resources/technologies/halotag/super-resolution-microscopy/' },
  snap: { title: 'Wikipedia: SNAP-tag', url: 'https://en.wikipedia.org/wiki/SNAP-tag' },
  clip: { title: 'SnapGene: CLIP-tag', url: 'https://snapgene.com/plasmids/basic_cloning_vectors/CLIP-tag' },
  tmp: { title: 'Chen et al. 2012 JACS, second-generation covalent TMP-tag, PMC3433398', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3433398/' },
  flash: { title: 'Wikipedia: FlAsH-EDT2', url: 'https://en.wikipedia.org/wiki/FlAsH-EDT2' },
  sdab: { title: 'Wikipedia: Single-domain antibody', url: 'https://en.wikipedia.org/wiki/Single-domain_antibody' },
  pleiner: { title: 'Pleiner et al. 2015 eLife 4:e11349 (nanobodies for super-resolution), PMC4755751', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4755751/' },
  carr: { title: 'Carrington, Tomlinson & Peckham 2019 MBoC 30:2737 (nanobodies and Affimers), PMC6789155', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6789155/' },
  aptamer: { title: 'Wikipedia: Aptamer', url: 'https://en.wikipedia.org/wiki/Aptamer' },
  paint: { title: 'Jungmann et al. 2014 Nat Methods (DNA-PAINT, Exchange-PAINT), PMC4153392', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4153392/' },
  whelan: { title: 'Whelan & Bell 2015 Sci Rep 5:7924 (SMLM fixation artefacts), PMC4300460', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4300460/' },
  fixwiki: { title: 'Wikipedia: Fixation (histology)', url: 'https://en.wikipedia.org/wiki/Fixation_(histology)' },
  addgene: { title: 'Addgene blog: fixing and permeabilizing for immunofluorescence', url: 'https://blog.addgene.org/deep-dive-fixing-and-permeabilizing-for-immunofluorescence' },
  bitesize: { title: 'Bitesize Bio: cell fixation 101', url: 'https://bitesizebio.com/13459/cell-fixation-101-top-tips-for-protocol-optimization/' },
  citeab: { title: 'CiteAb blog: methanol vs acetone fixation', url: 'https://blog.citeab.com/comparing-fixing-agents/' },
  ptg: { title: 'Proteintech: intracellular flow cytometry staining protocols', url: 'https://www.ptglab.com/news/blog/intracellular-flow-cytometry-staining-protocol/' },
  adam: { title: 'Adam, Sterne-Marr & Gerace 1990 J Cell Biol 111:807 (digitonin), PMC2116268', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2116268/' },
  digi: { title: 'Marks lab (UPenn): digitonin treatment for fluorescence microscopy', url: 'https://www.med.upenn.edu/markslab/assets/user-content/documents/Digitonin%20treatment%20for%20Fluorescence%20microscopy.pdf' },
  fpbase: { title: 'FPbase', url: 'https://www.fpbase.org' },
};

// Dyes for the degree-of-labelling calculator: ε at λmax (M⁻¹cm⁻¹), CF280 = A280/Amax of free dye, MW of the
// reactive form where the source gives it. Alexa Fluor values from MP10168 Table 4 (MP00143 lists AF594 at 73,000
// and AF405 at 34,500: the newer MP10168 values are used and the difference is noted in the UI).
export const DOL_DYES = [
  ['Alexa Fluor 350', 346, 19000, 0.19, 410, 'af'], ['Alexa Fluor 405', 401, 34000, 0.70, 1028, 'af'],
  ['Alexa Fluor 430', 434, 16000, 0.28, 702, 'af'], ['Alexa Fluor 488', 495, 71000, 0.11, 643, 'af'],
  ['Alexa Fluor 500', 502, 71000, 0.18, 700, 'af'], ['Alexa Fluor 514', 517, 80000, 0.18, 714, 'af'],
  ['Alexa Fluor 532', 532, 81000, 0.09, 721, 'af'], ['Alexa Fluor 546', 554, 112000, 0.12, 1260, 'af'],
  ['Alexa Fluor 555', 555, 150000, 0.08, 1250, 'af'], ['Alexa Fluor 568', 578, 91300, 0.46, 792, 'af'],
  ['Alexa Fluor 594', 590, 90000, 0.56, 820, 'af'], ['Alexa Fluor 610-X', 602, 132000, 0.44, 1285, 'af'],
  ['Alexa Fluor 633', 632, 100000, 0.55, 1200, 'af'], ['Alexa Fluor 647', 650, 239000, 0.03, 1300, 'af'],
  ['Alexa Fluor 660', 663, 132000, 0.10, 1100, 'af'], ['Alexa Fluor 680', 679, 184000, 0.05, 1150, 'af'],
  ['Alexa Fluor 700', 702, 192000, 0.07, 1400, 'af'], ['Alexa Fluor 750', 749, 240000, 0.04, 1300, 'af'],
  ['Alexa Fluor 790', 785, 260000, 0.08, 1750, 'af'],
  ['BODIPY FL', 504, 68000, 0.04, '', 'amine'], ['BODIPY TMR', 535, 50000, 0.05, '', 'amine'],
  ['BODIPY TR', 588, 45000, 0.22, '', 'amine'], ['Cascade Blue', 400, 28000, 0.65, '', 'amine'],
  ['Fluorescein (FAM)', 494, 68000, 0.30, '', 'amine'], ['Oregon Green 488', 496, 70000, 0.12, '', 'amine'],
  ['Pacific Blue', 416, 46000, 0.20, '', 'amine'], ['Rhodamine Red', 570, 120000, 0.17, '', 'amine'],
  ['Tetramethylrhodamine (TAMRA)', 555, 65000, 0.30, '', 'amine'], ['Texas Red', 595, 80000, 0.18, '', 'amine'],
  ['DyLight 350', 353, 15000, 0.144, 874, 'dylight'], ['DyLight 405', 405, 30000, 0.564, 793, 'dylight'],
  ['DyLight 488', 493, 70000, 0.147, 1011, 'dylight'], ['DyLight 550', 557, 150000, 0.081, 1040, 'dylight'],
  ['DyLight 594', 595, 80000, 0.585, 1078, 'dylight'], ['DyLight 633', 627, 170000, 0.110, 1066, 'dylight'],
  ['DyLight 650', 655, 250000, 0.037, 1066, 'dylight'], ['DyLight 680', 684, 140000, 0.128, 950, 'dylight'],
  ['DyLight 755', 755, 220000, 0.030, 1092, 'dylight'], ['DyLight 800', 777, 270000, 0.045, 1050, 'dylight'],
].map(([name, lmax, eps, cf, mw, src]) => ({ name, lmax, eps, cf, mw, src }));

// IgG defaults: ε280 ≈ 210,000 M⁻¹cm⁻¹ (DyLight manual) and 1.4 A280 units = 1 mg/mL (MP00143).
export const IGG = { eps: 210000, e01: 1.4, srcEps: 'dylight', srcE01: 'amine' };

// FPbase oligomerisation and switching codes (labels from the FPbase advanced search form).
export const AGG = { M: 'monomer', D: 'dimer', TD: 'tandem dimer', WD: 'weak dimer', T: 'tetramer' };
export const SWITCH = { B: 'basic', PA: 'photoactivatable', PS: 'photoswitchable', PC: 'photoconvertible', MP: 'multi-photochromic', T: 'timer', O: 'other / multistate' };

// Spectra-viewer fluorophores left out of the panel designer: not general-purpose labels.
export const PANEL_EXCLUDE = {
  'Fluo-4': 'calcium indicator', 'Nile Red': 'solvatochromic lipid stain', 'Propidium Iodide': 'dead-cell stain',
  'Qdot 655': 'quantum dot (broad excitation, not a molecular label)', 'Rhodamine B': 'free dye',
};

// Tags and probes. Sizes and numbers only where the linked source states them.
export const TAGS = [
  { name: 'HaloTag', size: '33 kDa (297 residues)', chem: 'Covalent: chloroalkane linker on the ligand reacts with the tag', ligands: 'TMR, Oregon Green, Alexa Fluor 488, coumarin, diAcFAM ligands; Janelia Fluor 549 (Φ 0.88) and JF646 (643/662 nm, Φ 0.54, ε 152,000) HaloTag ligands; photoactivatable JF dyes', live: 'Yes: JF549 ligand crosses live-cell membranes with low background; JF HaloTag ligands are membrane permeable for live single-molecule tracking', fixed: 'Yes (living or chemically fixed cells)', linkage: '', src: ['halo', 'grimm', 'promegaJF'] },
  { name: 'SNAP-tag', size: '19.4 kDa (182 residues)', chem: 'Covalent: O6-benzylguanine substrates; engineered from human O6-alkylguanine-DNA alkyltransferase (AGT)', ligands: 'Benzylguanine dye conjugates; JF549 SNAP-tag ligand', live: 'Yes (labelling in living cells)', fixed: '', linkage: '', src: ['snap', 'grimm'] },
  { name: 'CLIP-tag', size: '', chem: 'Covalent: benzylcytosine (O2-benzylcytosine) substrates; engineered from SNAP-tag', ligands: 'Benzylcytosine dye conjugates', live: '', fixed: '', linkage: '', src: ['snap', 'clip'] },
  { name: 'TMP-tag (eDHFR)', size: '18 kDa (about two-thirds the size of GFP)', chem: 'Non-covalent: trimethoprim (TMP) binds E. coli DHFR with low-nanomolar affinity. Covalent version: eDHFR:L28C cysteine reacts with an acrylamide on the TMP probe', ligands: 'TMP–fluorophore conjugates', live: 'Yes (covalent labelling of intracellular proteins in living cells)', fixed: '', linkage: '', src: ['tmp'] },
  { name: 'FlAsH / ReAsH (tetracysteine)', size: 'Six-residue motif Cys-Cys-Xxx-Xxx-Cys-Cys (best: CCPGCC); FlAsH-EDT2 664.49 g/mol', chem: 'Biarsenical dye binds cysteine pairs; reversed by excess 1,2-ethanedithiol (EDT)', ligands: 'FlAsH (ex 508 / em 528 nm, Φ 0.49 bound); ReAsH (red analogue)', live: 'Yes: membrane permeant', fixed: '', linkage: 'Tiny tag; the main problem is background from endogenous cysteine-rich proteins, and arsenic toxicity', src: ['flash'] },
  { name: 'Nanobody (e.g. GFP-binder)', size: '12–15 kDa; ~13 kDa, diameter ~4 nm', chem: 'Single-domain antibody; dyes on site-specific cysteines or lysines', ligands: 'Dye-conjugated anti-GFP/anti-RFP nanobodies; chromobodies (nanobody–FP fusions) for live cells', live: 'As chromobodies (expressed)', fixed: 'Yes (most common use for SMLM)', linkage: 'Site-specific dye can be ~1–2 nm (Pleiner) or ~2–4 nm (Carrington) from the target', src: ['sdab', 'pleiner', 'carr'] },
  { name: 'Fab fragment', size: '~50 kDa', chem: 'Monovalent antibody fragment (one light chain and half a heavy chain)', ligands: 'Dye-conjugated Fab; unconjugated Fab to block endogenous Ig', live: '', fixed: 'Yes', linkage: 'Dye closer to the target than on a full IgG (no number given)', src: ['sdab', 'carr', 'jirMulti'] },
  { name: 'IgG primary + secondary (reference)', size: '150–160 kDa; ~12 nm long; 12–15 nm each', chem: 'Indirect immunofluorescence', ligands: 'Dye-labelled secondary antibodies', live: 'No (needs permeabilisation for internal targets)', fixed: 'Yes', linkage: '~20 nm for primary + secondary; ~10 nm for a directly labelled primary; label–epitope displacement up to 24–30 nm', src: ['sdab', 'carr', 'pleiner'] },
  { name: 'Affimer', size: '10–12 kDa, ~3 nm', chem: 'Small engineered binding protein', ligands: 'Site-specific dye conjugates', live: '', fixed: 'Yes', linkage: 'Small label: low linkage error', src: ['carr'] },
  { name: 'Aptamer', size: '20–100 bases; 3–20 kDa (another section of the page: 6–30 kDa)', chem: 'Folded nucleic acid binder; one binding site', ligands: 'Fluorophore-modified aptamers', live: '', fixed: 'Yes (e.g. Alexa Fluor 594 aptamer staining of cells)', linkage: 'Much smaller than 150 kDa antibodies', src: ['aptamer'] },
  { name: 'DNA-PAINT docking strand', size: '~9 nt imager strand', chem: 'Transient hybridisation of a dye-labelled imager to a docking strand on the antibody', ligands: 'Cy3B or ATTO 655 imagers at ~0.6–3 nM; Exchange-PAINT: one dye, sequential imagers (10 targets in vitro, 4 in cells)', live: 'No', fixed: 'Yes (fixed HeLa)', linkage: 'Sub-10 nm resolution on DNA origami; streptavidin-bridged antibody conjugates are bulky, so the authors suggest direct coupling, nanobodies or aptamers', src: ['paint'] },
];

// Fixation and permeabilisation. Each row: what it does, starting conditions from the sources, SR notes.
export const FIX = [
  { name: 'Formaldehyde (PFA)', kind: 'Cross-linking fixative', does: 'Cross-links proteins (mainly lysine); effects reversible by excess water. Preserves morphology and subcellular structure better than solvents, but can block some epitopes.', conc: '3.7–4.0% formaldehyde (10% NBF); 3–4% PFA for 5–10 min (cells), up to 30 min (tissue). Whelan & Bell: 3.7% PFA, 37 °C, 12 min.', sr: 'SMLM: good for mitochondria but actin microstructure was lost with PFA alone. Skipping the pre-fixation PBS wash preserved structure best.', src: ['fixwiki', 'addgene', 'bitesize', 'whelan'] },
  { name: 'Glutaraldehyde (GA)', kind: 'Cross-linking fixative', does: 'Two aldehyde groups bridge more distant proteins; permeates more slowly than formaldehyde (thick samples are harder); well suited to EM.', conc: 'Whelan & Bell: 0.4% GA + 0.25% Triton X-100, 90 s at 37 °C, then 3% GA in PBS 15 min; GA solutions made isotonic with cytoskeleton buffer (CSB, pH 6.2).', sr: 'Best structure preservation for microtubules and actin in SMLM (mitochondria could shrink). Quench with 0.1–1% (w/v) NaBH4 or 0.3 M glycine, 15 min: markedly improved Alexa Fluor 647 signal-to-noise.', src: ['fixwiki', 'whelan'] },
  { name: 'Methanol', kind: 'Precipitating fixative (also permeabilises)', does: 'Dehydrates and precipitates proteins. Lipids and soluble proteins can be lost; can disrupt structural epitopes and fluorescent proteins.', conc: '−20 °C, 5–10 min (cells). Whelan & Bell: ice-cold (−20 °C) methanol, 5 min.', sr: 'Microtubules preserved only if kept cold (warming gave non-native curvature) and needed 4× more antibody; unsatisfactory for mitochondria and actin.', src: ['addgene', 'bitesize', 'citeab', 'whelan'] },
  { name: 'Acetone', kind: 'Precipitating fixative (also permeabilises)', does: 'Strong dehydrating agent; soluble and lipid components are lost; harms fluorescent proteins. Reported to conserve epitopes and histology better than methanol.', conc: '−20 °C, 5–10 min (cells); or a 1:1 acetone/methanol mix.', sr: '', src: ['citeab', 'bitesize'] },
  { name: 'Triton X-100', kind: 'Non-ionic detergent (non-selective)', does: 'Permeabilises all membranes including organelles; can remove membrane-associated and soluble proteins if too strong or too long.', conc: 'Whelan & Bell: 0.1–1%, 10 min. Proteintech: 0.1–0.3%, 10 min RT.', sr: 'Optional pre-extraction (0.3% Triton, 30 s, 37 °C, before fixing) reduced background in SMLM.', src: ['addgene', 'whelan', 'ptg'] },
  { name: 'Saponin', kind: 'Cholesterol-selective detergent', does: 'Interacts with membrane cholesterol; keeps membrane-associated proteins in place. Permeabilisation is reversible.', conc: '0.1% saponin + 0.5% BSA in PBS, 10 min RT; keep saponin in all later buffers.', sr: '', src: ['addgene', 'ptg'] },
  { name: 'Digitonin', kind: 'Cholesterol-selective detergent (plasma membrane)', does: 'Permeabilises the plasma membrane to macromolecules while the nuclear envelope stays intact; used to wash out cytosolic (unbound) protein before fixing.', conc: '20–40 µg/mL in KHM buffer, 2 min RT, then 2% formaldehyde 30 min.', sr: '', src: ['adam', 'digi'] },
];
export const FIX_GENERAL = { text: 'The first few minutes of any fixation protocol matter most for sub-diffraction structure; both under- and over-fixation produced artefacts.', src: 'whelan' };

// Secondary-antibody rules, each with its source. Used by planSecondaries (lab_label_calc.js) and shown in the UI.
export const SEC_RULES = {
  sameHost: { text: 'Use secondaries all raised in one host species so they do not recognise one another. Goat and donkey are usually the best hosts.', src: 'jirMulti' },
  notPrimaryHost: { text: 'The secondary host must not be the host of any primary: an anti-X secondary from another host would bind it.', src: 'jirMulti' },
  dupHost: { text: 'Two primaries from the same host (and same isotype) cannot be told apart by secondaries. Use a directly conjugated primary, or block with monovalent Fab fragments between sequential stainings.', src: 'jirMulti' },
  subclass: { text: 'Two mouse monoclonals of different IgG subclasses can be separated with subclass-specific anti-mouse secondaries (goat host in the JIR example). Not needed when only one mouse primary is used.', src: 'jirSub' },
  adsorb: { text: 'Use cross-adsorbed (min X) secondaries against the other primary hosts and the sample species. Mouse and rat are closely related: anti-mouse can detect rat IgG. Adsorption against a close relative may weaken recognition of some monoclonals.', src: 'jirAdsorb' },
  goatSheep: { text: 'Goat, sheep and cow are closely related: anti-goat secondaries cross-react with their IgG. Goat and sheep primaries in one panel cannot be separated reliably, and BSA/milk (bovine IgG) raises background with goat or sheep primaries.', src: 'jirFaq' },
  endogenous: { text: 'Primary host = sample species (e.g. mouse-on-mouse): secondaries detect endogenous Ig. Block first with monovalent Fab anti-species IgG, and choose secondaries adsorbed against the tissue species.', src: 'jirFaq' },
  blocking: { text: 'Block with 5% normal serum from the secondary host, never from the primary host species. Label sequentially and do not premix antibodies.', src: 'jirFaq' },
};

export const HOSTS = ['mouse', 'rabbit', 'rat', 'goat', 'chicken', 'guinea pig', 'donkey', 'sheep', 'human'];
export const ISOTYPES = ['', 'IgG1', 'IgG2a', 'IgG2b', 'IgG2c', 'IgG3', 'IgM'];
// Spectrally separated secondary conjugates per laser line (dyes with spectra in the atlas).
export const CONJUGATES = { 405: 'Alexa Fluor 405', 488: 'Alexa Fluor 488', 532: 'Alexa Fluor 532', 561: 'Alexa Fluor 568', 594: 'Alexa Fluor 594', 640: 'Alexa Fluor 647', 685: 'Alexa Fluor 680', 730: 'Alexa Fluor 750' };
