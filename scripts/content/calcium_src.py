"""Calcium signalling section of My Microscopy (portfolio.json key "calcium").

Background paragraphs written from sources fetched and DOI-checked on Crossref (each paragraph lists its papers by index);
"ours" describes how the group projects fit, as team work (see the project pages for each paper).
"""

CALCIUM = {
 "title": "Calcium signalling",
 "paragraphs": [
  {
   "heading": "A universal messenger",
   "text": "Calcium ions carry signals in almost every cell. At rest the cytosol holds only about 100 nanomolar free calcium, roughly ten thousand times less than the fluid outside the cell (about 1 millimolar), while the endoplasmic reticulum (ER) stores keep a few hundred micromolar. Opening a channel therefore lets calcium rush in, and a stimulus can raise cytosolic calcium about tenfold, to around 1 micromolar. Cells read not just whether calcium rises but how much, how often, how fast and where. With this code calcium controls fertilisation, muscle contraction, secretion, gene transcription, learning and memory, and, when it rises too far or for too long, cell death.",
   "refs": [
    3,
    4,
    0,
    2
   ]
  },
  {
   "heading": "Sources and the toolkit",
   "text": "Each cell builds its signals from a 'toolkit' of channels, pumps, exchangers and binding proteins. Calcium enters across the plasma membrane through channels such as voltage-gated channels, and through store-operated entry: when the ER empties, the ER sensor STIM gathers at junctions with the plasma membrane and opens Orai channels there. Calcium is also released from the ER itself through inositol trisphosphate receptors (IP3Rs) and ryanodine receptors (RyRs). IP3 is made by phospholipase C, which splits a membrane lipid after hormones or growth factors activate G-protein-coupled receptors or receptor tyrosine kinases. Pumps and exchangers then clear the calcium: PMCA and the sodium-calcium exchanger push it out of the cell, SERCA pumps it back into the ER, and mitochondria and calcium-binding buffer proteins take up part of it, shaping the size and duration of each signal.",
   "refs": [
    0,
    3,
    5,
    4
   ]
  },
  {
   "heading": "From single channels to waves",
   "text": "Imaging revealed that calcium signals are built from elementary events. The smallest, a 'blip', is calcium flowing through a single IP3R. IP3Rs sit in clusters, and when several channels in one cluster open together they make a 'puff'. In heart muscle the matching local events, 'sparks', come from release channels in the sarcoplasmic reticulum. Because calcium itself helps open these channels (calcium-induced calcium release), calcium escaping from one cluster can trigger neighbouring clusters; at higher IP3 levels this relay spreads a wave across the cell, often repeated as oscillations. Brief local events drive fast, local responses, whereas global waves and oscillations control slower processes.",
   "refs": [
    6,
    10,
    7,
    3,
    1
   ]
  },
  {
   "heading": "How we see calcium",
   "text": "Watching calcium became practical in 1985, when Roger Tsien's group introduced fura-2, a dye far brighter than earlier indicators that changes its excitation wavelength when it binds calcium, so concentrations can be measured as a ratio. Later dyes such as fluo-3 and fluo-4 followed; fluo-3 imaged with a laser-scanning confocal microscope first revealed calcium sparks. Genetically encoded indicators, beginning with G-CaMP built from a single green fluorescent protein, let cells make their own sensor. Total internal reflection fluorescence (TIRF) microscopy collects signal from only tiny volumes of cytosol around release sites, sharp enough to resolve the flux through single IP3Rs. Caged IP3, a light-sensitive inactive form, can be released by a flash of light at a chosen time and place to start signals on demand.",
   "refs": [
    8,
    7,
    10,
    9,
    12
   ]
  },
  {
   "heading": "Open questions microscopy answers",
   "text": "These tools turn open questions into measurements. Counting single-channel steps inside puffs showed that a typical puff recruits about six active IP3Rs packed within half a micrometre, opening within about 10 milliseconds and then shutting off quickly. Tagging native IP3Rs showed that most clusters drift through the ER, yet signals start at a few immobile clusters parked beside ER-plasma membrane junctions. A remaining puzzle is decoding: how proteins with different calcium sensitivities, and responses tuned to the amplitude, frequency or location of calcium, turn these patterns into the right cellular outcome.",
   "refs": [
    10,
    11,
    3,
    4
   ]
  }
 ],
 "ours": {
  "heading": "Where our work fits",
  "text": "The projects on this page came at these questions from several directions, each as part of a team. PhD work in Dale Sanders' lab asked whether the calcium-mobilising messengers known from animal cells, cADPR and NAADP, also act in plants. With Sandip Patel's group the focus moved to acidic organelles as calcium stores: lysosome build-up exaggerated NAADP-evoked signals in neurons, two-pore channels rather than TRPML1 carried NAADP-evoked release, and loss of presenilins changed lysosomal calcium. In Ian Parker's lab, TIRF imaging at hundreds of frames per second resolved puffs down to single-channel blips. That work found that larger IP3 receptor clusters fire more often, that each channel in a cluster has about a two-in-three chance of joining once a trigger channel opens, and that neighbouring channels tend to close together; that warming speeds channel gating without changing the calcium flowing through an open channel; that most IP3 receptors diffuse in the ER while a minority are anchored, the likely puff sources; that IP3 itself spreads about thirty times more slowly than once thought, so it acts within a few micrometres; and that noise analysis can find signals too small to pick out one by one. Super-resolution STORM was then used to try to map receptors onto puff sites, showing how hard that mapping is.",
  "refs": [
   12
  ],
  "projects": [
   "phd-plant-calcium-2002",
   "lysosome-naadp-2010",
   "trpml1-tpc-2011",
   "presenilin-tpc-2012",
   "puff-trigger-2012",
   "puff-recruitment-2013",
   "puff-termination-2014",
   "temperature-puffs-2013",
   "ip3r-tracking-2014",
   "ip3-diffusion-2016",
   "calcium-noise-2020",
   "storm-puffs-poster-2015"
  ]
 },
 "papers": [
  {
   "doi": "10.1038/35036035",
   "title": "The versatility and universality of calcium signalling",
   "journal": "Nature Reviews Molecular Cell Biology",
   "year": 2000,
   "authors": "Berridge MJ, Lipp P, Bootman MD",
   "supports": "Calcium toolkit mixed and matched into many signals; controls fertilization, proliferation, learning and memory, contraction and secretion; excess calcium is toxic (necrosis, apoptosis).",
   "url": "https://doi.org/10.1038/35036035"
  },
  {
   "doi": "10.1038/nrm1155",
   "title": "Calcium signalling: dynamics, homeostasis and remodelling",
   "journal": "Nature Reviews Molecular Cell Biology",
   "year": 2003,
   "authors": "Berridge MJ, Bootman MD, Roderick HL",
   "supports": "Fast localized spikes drive fast responses, repetitive global transients and waves drive slower ones.",
   "url": "https://doi.org/10.1038/nrm1155"
  },
  {
   "doi": "10.1016/j.cell.2007.11.028",
   "title": "Calcium Signaling",
   "journal": "Cell",
   "year": 2007,
   "authors": "Clapham DE",
   "supports": "Calcium touches nearly every aspect of cell life, incl. excitability, exocytosis, motility, apoptosis and transcription; signalling is highly localized.",
   "url": "https://doi.org/10.1016/j.cell.2007.11.028"
  },
  {
   "doi": "10.1101/cshperspect.a038802",
   "title": "Fundamentals of Cellular Calcium Signaling: A Primer",
   "journal": "Cold Spring Harbor Perspectives in Biology",
   "year": 2020,
   "authors": "Bootman MD, Bultynck G",
   "supports": "Resting ~100 nM rising to ~1 uM; information in frequency, kinetics, amplitude, spatial extent; influx vs store release; IP3R/RyR; PLC makes IP3 from PIP2 after GPCR/RTK activation; puffs, CICR and fire-diffuse-fire waves; oscillations; buffers and mitochondria shape signals; fura-2. (Crossref: issued online 2019, print 2020.)",
   "url": "https://doi.org/10.1101/cshperspect.a038802"
  },
  {
   "doi": "10.1016/j.molcel.2017.05.028",
   "title": "Intracellular Ca2+ Sensing: Its Role in Calcium Homeostasis and Signaling",
   "journal": "Molecular Cell",
   "year": 2017,
   "authors": "Bagur R, Hajnóczky G",
   "supports": "Resting cytosol ~10^-7 M, ~10^4 times below the ~10^-3 M outside; stores 1-5 x 10^-4 M; PMCA and NCX at the plasma membrane, SERCA refills ER, mitochondrial uniporter; buffer proteins shape signals; sensors with different affinities/thresholds.",
   "url": "https://doi.org/10.1016/j.molcel.2017.05.028"
  },
  {
   "doi": "10.1152/physrev.00020.2014",
   "title": "Store-Operated Calcium Channels",
   "journal": "Physiological Reviews",
   "year": 2015,
   "authors": "Prakriya M, Lewis RS",
   "supports": "ER depletion makes STIM gather at ER-plasma membrane junctions, trapping and opening Orai channels (store-operated entry).",
   "url": "https://doi.org/10.1152/physrev.00020.2014"
  },
  {
   "doi": "10.1016/s0143-4160(96)90100-1",
   "title": "Elementary events of InsP3-induced Ca2+ liberation in Xenopus oocytes: hot spots, puffs and blips",
   "journal": "Cell Calcium",
   "year": 1996,
   "authors": "Parker I, Choi J, Yao Y",
   "supports": "Hierarchy: blips (single IP3R), puffs (several receptors at one site), waves by recruiting sites; dual feedback by cytosolic calcium; coordination rises with IP3.",
   "url": "https://doi.org/10.1016/s0143-4160(96)90100-1"
  },
  {
   "doi": "10.1126/science.8235594",
   "title": "Calcium Sparks: Elementary Events Underlying Excitation-Contraction Coupling in Heart Muscle",
   "journal": "Science",
   "year": 1993,
   "authors": "Cheng H, Lederer WJ, Cannell MB",
   "supports": "Sparks seen in heart cells by laser-scanning confocal microscopy with fluo-3; from SR release (ryanodine-sensitive) channels; can trigger waves.",
   "url": "https://doi.org/10.1126/science.8235594"
  },
  {
   "doi": "10.1016/S0021-9258(19)83641-4",
   "title": "A new generation of Ca2+ indicators with greatly improved fluorescence properties.",
   "journal": "Journal of Biological Chemistry",
   "year": 1985,
   "authors": "Grynkiewicz G, Poenie M, Tsien RY",
   "supports": "Fura-2 family: up to 30-fold brighter than quin2, wavelength shift on calcium binding, suited to single cells.",
   "url": "https://doi.org/10.1016/S0021-9258(19)83641-4"
  },
  {
   "doi": "10.1038/84397",
   "title": "A high signal-to-noise Ca2+ probe composed of a single green fluorescent protein",
   "journal": "Nature Biotechnology",
   "year": 2001,
   "authors": "Nakai J, Ohkura M, Imoto K",
   "supports": "G-CaMP: genetically encoded calcium probe built from a single GFP, used in living cells.",
   "url": "https://doi.org/10.1038/84397"
  },
  {
   "doi": "10.1073/pnas.0810799106",
   "title": "Imaging the quantal substructure of single IP3R channel activity during Ca2+ puffs in intact mammalian cells",
   "journal": "Proceedings of the National Academy of Sciences",
   "year": 2009,
   "authors": "Smith IF, Parker I",
   "supports": "TIRF imaging (fluo-4, photoreleased caged IP3, EGTA) of single-channel flux; puffs average ~6 active IP3Rs within <500 nm, recruited in ~10 ms then rapidly terminated; puffs built from blips.",
   "url": "https://doi.org/10.1073/pnas.0810799106"
  },
  {
   "doi": "10.1038/s41467-017-01644-8",
   "title": "Ca2+ signals initiate at immobile IP3 receptors adjacent to ER-plasma membrane junctions",
   "journal": "Nature Communications",
   "year": 2017,
   "authors": "Thillaiappan NB, Chavda AP, Tovey SC, et al.",
   "supports": "Gene-edited tagged native IP3Rs form clusters, most mobile; signals start at a few immobile 'licensed' IP3Rs beside ER-plasma membrane junctions where STIM1 gathers.",
   "url": "https://doi.org/10.1038/s41467-017-01644-8"
  },
  {
   "doi": "10.1126/scisignal.aag1625",
   "title": "Hindered cytoplasmic diffusion of inositol trisphosphate restricts its cellular range of action",
   "journal": "Science Signaling",
   "year": 2016,
   "authors": "Dickinson GD, Ellefsen KL, Dawson SP, et al.",
   "supports": "Using puffs to track IP3 from spot photorelease: diffusion <=10 um2/s (vs ~280 in oocyte extracts), range <5 um, so IP3 acts locally.",
   "url": "https://doi.org/10.1126/scisignal.aag1625"
  }
 ],
 "glossary": [
  {
   "term": "blip",
   "def": "The smallest calcium release event: calcium flowing through a single IP3 receptor channel."
  },
  {
   "term": "puff",
   "def": "A local calcium signal from several IP3 receptors in one cluster opening together."
  },
  {
   "term": "spark",
   "def": "A local calcium release event from ryanodine receptors in muscle, first seen in heart cells."
  },
  {
   "term": "calcium-induced calcium release (CICR)",
   "def": "Positive feedback in which calcium itself opens release channels, letting signals spread from cluster to cluster as waves."
  },
  {
   "term": "IP3 receptor",
   "def": "A calcium channel in the ER membrane that opens when it binds both IP3 and calcium."
  },
  {
   "term": "store-operated calcium entry",
   "def": "Calcium influx that starts when the ER empties: the ER sensor STIM gathers at the plasma membrane and opens Orai channels."
  },
  {
   "term": "SERCA",
   "def": "The pump that moves calcium from the cytosol back into the ER (sarcoplasmic reticulum in muscle)."
  },
  {
   "term": "caged IP3",
   "def": "An inactive, light-sensitive form of IP3 that a flash of light converts to active IP3 at a chosen time and place."
  }
 ]
}
