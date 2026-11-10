// Reference data for the bench calculators: culture-vessel growth areas and buffer recipes, each with its source.
// Only values read from the linked page are given; masses computed from a stated concentration are marked as computed.

export const SRC = {
  thermoNumbers: { title: 'Thermo Fisher (Gibco): Useful numbers for cell culture', url: 'https://www.thermofisher.com/us/en/home/references/gibco-cell-culture-basics/cell-culture-protocols/cell-culture-useful-numbers.html' },
  labtek: { title: 'Thermo Fisher: Nunc Lab-Tek II Chambered Coverglass, 8-well (155409)', url: 'https://www.thermofisher.com/order/catalog/product/155409' },
  mattek: { title: 'MatTek: 35 mm dish, No. 1.5 coverslip, 14 mm glass diameter (P35G-1.5-14-C)', url: 'https://www.mattek.com/store/p35g-1-5-14-c/' },
  pbs: { title: 'Phosphate-buffered saline (Wikipedia, CSH Protocols 1× and 10× table)', url: 'https://en.wikipedia.org/wiki/Phosphate-buffered_saline' },
  pbsCsh: { title: 'CSH Protocols pdb.rec8247 (original)', url: 'http://cshprotocols.cshlp.org/content/2006/1/pdb.rec8247' },
  tbs: { title: 'Tris-buffered saline (Wikipedia: common formulation)', url: 'https://en.wikipedia.org/wiki/Tris-buffered_saline' },
  lcis: { title: 'Thermo Fisher: Live Cell Imaging Solution (A59688DJ) formulation', url: 'https://www.thermofisher.com/order/catalog/product/A59688DJ' },
  storm: { title: 'Augusta University Cell Imaging Core: N-STORM sample prep and imaging buffers', url: 'https://www.augusta.edu/mcg/cba/cic/storm_tips.pdf' },
  paint: { title: 'Strauss & Jungmann (2020) Nat Methods 17:789, Methods (PMC7610413)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7610413' },
  mowiol: { title: 'NICHD Microscopy & Imaging Core: Mowiol mounting media', url: 'https://www.nichd.nih.gov/about/org/dir/other-facilities/cores/microscopyandimaging/support/MOWIOL' },
};

// Growth area per well or dish (cm²) and typical medium volume (mL) from the source table.
export const VESSELS = [
  { id: '384', name: '384-well plate', area: 0.084, medium: '0.08', src: 'thermoNumbers' },
  { id: '96', name: '96-well plate', area: 0.32, medium: '0.1–0.2', src: 'thermoNumbers' },
  { id: '48', name: '48-well plate', area: 1.1, medium: '0.2–0.4', src: 'thermoNumbers' },
  { id: '24', name: '24-well plate', area: 1.9, medium: '0.5–1.0', src: 'thermoNumbers' },
  { id: '12', name: '12-well plate', area: 3.5, medium: '1–2', src: 'thermoNumbers' },
  { id: '6', name: '6-well plate', area: 9.6, medium: '1–3', src: 'thermoNumbers' },
  { id: 'd35', name: '35 mm dish', area: 8.8, medium: '2', src: 'thermoNumbers' },
  { id: 'd60', name: '60 mm dish', area: 21.5, medium: '5', src: 'thermoNumbers' },
  { id: 'd100', name: '100 mm dish', area: 56.7, medium: '12', src: 'thermoNumbers' },
  { id: 'd150', name: '150 mm dish', area: 145, medium: '30', src: 'thermoNumbers' },
  { id: 't25', name: 'T-25 flask', area: 25, medium: '3–5', src: 'thermoNumbers' },
  { id: 't75', name: 'T-75 flask', area: 75, medium: '8–15', src: 'thermoNumbers' },
  { id: 'lt8', name: '8-well chambered coverglass (Lab-Tek II)', area: 0.7, medium: '0.2–0.5', src: 'labtek' },
  { id: 'gb35', name: '35 mm glass-bottom dish, 14 mm glass (MatTek)', area: +(Math.PI * 0.7 * 0.7).toFixed(2), medium: '', src: 'mattek',
    note: 'Area of the 14 mm glass well, computed from the stated diameter (π·0.7² cm²).' },
];
// Thermo's table (HeLa) gives 1.2e6 cells at confluency in a 6-well (9.6 cm²) or 35 mm dish (8.8 cm²): about 1.25e5–1.4e5 cells/cm².
export const HELA_CONFLUENT = 1.25e5;

// Recipes: rows [[component, amount, unit, note]] for baseMl. 'computed' marks masses derived here from the source's concentrations.
export const RECIPES = [
  { id: 'pbs1', name: 'PBS 1×', group: 'Buffers', baseMl: 1000, src: ['pbs', 'pbsCsh'], rows: [
    ['NaCl', 8.0, 'g', '137 mM'], ['KCl', 0.2, 'g', '2.7 mM'], ['Na₂HPO₄ (anhydrous)', 1.42, 'g', '10 mM'], ['KH₂PO₄', 0.245, 'g', '1.8 mM'],
    ['Water', null, '', 'dissolve in ~80 % of the final volume, adjust pH to 7.4 with HCl, then make up to volume']] },
  { id: 'pbs10', name: 'PBS 10× stock', group: 'Buffers', baseMl: 1000, src: ['pbs', 'pbsCsh'], rows: [
    ['NaCl', 80.07, 'g', '1.37 M'], ['KCl', 2.01, 'g', '27 mM'], ['Na₂HPO₄ (anhydrous)', 14.2, 'g', '100 mM'], ['KH₂PO₄', 2.45, 'g', '18 mM'],
    ['Water', null, '', 'to final volume; dilute 1:10 for 1× and check pH 7.4 after dilution']] },
  { id: 'tbs', name: 'TBS 1× (50 mM Tris, 150 mM NaCl, pH 7.6)', group: 'Buffers', baseMl: 1000, src: ['tbs'], computed: true, rows: [
    ['Tris base (121.14 g/mol)', 6.06, 'g', '50 mM'], ['NaCl (58.44 g/mol)', 8.77, 'g', '150 mM'],
    ['Water', null, '', 'dissolve in ~80 % volume, adjust to pH 7.6 with HCl, make up to volume']] },
  { id: 'hbs', name: 'HEPES-buffered imaging saline (Live Cell Imaging Solution formulation)', group: 'Buffers', baseMl: 1000, src: ['lcis'], computed: true, rows: [
    ['NaCl (58.44 g/mol)', 8.18, 'g', '140 mM'], ['KCl (74.55 g/mol)', 0.186, 'g', '2.5 mM'], ['CaCl₂·2H₂O (147.01 g/mol)', 0.265, 'g', '1.8 mM'],
    ['MgCl₂·6H₂O (203.30 g/mol)', 0.203, 'g', '1.0 mM'], ['HEPES free acid (238.30 g/mol)', 4.77, 'g', '20 mM'],
    ['Water', null, '', 'adjust to pH 7.4 with NaOH; source states ~300 mOsm. Add glucose if your cells need it (not in this formulation)']] },
  { id: 'stormA', name: 'dSTORM Buffer A (10 mM Tris pH 8.0, 50 mM NaCl)', group: 'dSTORM (GLOX)', baseMl: 100, src: ['storm'], computed: true, rows: [
    ['1 M Tris pH 8.0', 1, 'mL', '10 mM'], ['NaCl', 0.292, 'g', '50 mM'], ['Water', null, '', 'to volume']] },
  { id: 'stormB', name: 'dSTORM Buffer B (50 mM Tris pH 8.0, 10 mM NaCl, 10 % glucose)', group: 'dSTORM (GLOX)', baseMl: 10, src: ['storm'], computed: true, rows: [
    ['1 M Tris pH 8.0', 0.5, 'mL', '50 mM'], ['NaCl', 5.84, 'mg', '10 mM'], ['Glucose', 1, 'g', '10 % (w/v)'], ['Water', null, '', 'to volume']] },
  { id: 'glox', name: 'GLOX enzyme stock', group: 'dSTORM (GLOX)', baseMl: 0.25, src: ['storm'], rows: [
    ['Glucose oxidase', 14, 'mg', ''], ['Catalase (17 mg/mL)', 50, 'µL', ''], ['Buffer A', 200, 'µL', 'vortex, spin 14,000 rpm, use the supernatant; 4 °C up to 2 weeks']] },
  { id: 'mea1', name: 'MEA 1 M stock', group: 'dSTORM (GLOX)', baseMl: 1, src: ['storm'], rows: [
    ['Cysteamine (MEA)', 77, 'mg', ''], ['0.25 N HCl', 1.0, 'mL', '4 °C up to 1 month']] },
  { id: 'stormMEA', name: 'dSTORM imaging buffer, GLOX + MEA', group: 'dSTORM (GLOX)', baseMl: 0.697, src: ['storm'], rows: [
    ['Buffer B', 620, 'µL', ''], ['GLOX', 7, 'µL', ''], ['1 M MEA', 70, 'µL', '≈100 mM final'],
    ['Note', null, '', 'mix on ice just before imaging; ~700 µL per Lab-Tek 8-well; refresh as it depletes. Source prefers MEA for ATTO 488 / Alexa 568']] },
  { id: 'stormBME', name: 'dSTORM imaging buffer, GLOX + BME', group: 'dSTORM (GLOX)', baseMl: 0.704, src: ['storm'], rows: [
    ['Buffer B', 690, 'µL', ''], ['GLOX', 7, 'µL', ''], ['2-mercaptoethanol', 7, 'µL', '≈1 % (v/v)'],
    ['Note', null, '', 'mix on ice just before imaging; source recommends BME for Alexa Fluor 647 and Cy3B']] },
  { id: 'bufC', name: 'DNA-PAINT Buffer C', group: 'DNA-PAINT (PCA/PCD)', baseMl: 1000, src: ['paint'], computed: true, rows: [
    ['1× PBS', null, '', 'as solvent'], ['NaCl (58.44 g/mol)', 29.2, 'g', '500 mM (as listed)'], ['EDTA disodium dihydrate (372.24 g/mol)', 0.372, 'g', '1 mM'],
    ['pH', null, '', 'adjust to 7.4']] },
  { id: 'pca40', name: 'PCA 40× stock', group: 'DNA-PAINT (PCA/PCD)', baseMl: 10, src: ['paint'], rows: [
    ['Protocatechuic acid (PCA)', 154, 'mg', ''], ['Water', 10, 'mL', 'add NaOH to dissolve and adjust pH to 9.0']] },
  { id: 'pcd100', name: 'PCD 100× stock', group: 'DNA-PAINT (PCA/PCD)', baseMl: 13.3, src: ['paint'], rows: [
    ['Protocatechuate 3,4-dioxygenase (PCD)', 9.3, 'mg', ''], ['Buffer: 100 mM Tris-HCl pH 8, 50 mM KCl, 1 mM EDTA, 50 % glycerol', 13.3, 'mL', '']] },
  { id: 'trolox100', name: 'Trolox 100× stock', group: 'DNA-PAINT (PCA/PCD)', baseMl: 3.975, src: ['paint'], rows: [
    ['Trolox', 100, 'mg', ''], ['Methanol', 430, 'µL', ''], ['1 M NaOH', 345, 'µL', ''], ['Water', 3.2, 'mL', '']] },
  { id: 'paintImg', name: 'DNA-PAINT imaging buffer (Buffer C + 1× PCA, PCD, Trolox)', group: 'DNA-PAINT (PCA/PCD)', baseMl: 1, src: ['paint'], rows: [
    ['Buffer C', 955, 'µL', 'plus imager strand at your working concentration'], ['PCA 40×', 25, 'µL', '1×'], ['PCD 100×', 10, 'µL', '1×'], ['Trolox 100×', 10, 'µL', '1×']] },
  { id: 'mowiol', name: 'Mowiol + DABCO mounting medium', group: 'Mounting', baseMl: 20, src: ['mowiol'], rows: [
    ['Mowiol 4-88', 2.4, 'g', 'add slowly to the glycerol while mixing'], ['Glycerol', 6, 'g', ''], ['Water', 6, 'mL', 'mix, leave covered overnight at RT'],
    ['0.2 M Tris pH 8.5 (pre-warmed 50 °C)', 12, 'mL', '50 °C for 10 min to 1 h, then 5000 g 15 min 4 °C, keep supernatant'],
    ['DABCO', 0.5, 'g', '2.5 g per 100 mL of supernatant; aliquot, store at −20 °C, degas before use']] },
];
