"""Source for the detailed project pages of "My Microscopy" (one per paper/project).

Question, approach and findings come from the papers themselves; numbers are as stated in each paper.
"role" is a short, general statement: these are team projects, described as group efforts. DOIs checked against
api.crossref.org on 2026-11-09 (Zenodo DOIs against the Zenodo API). Images for each project are listed in
the portfolio manifest under the same "project" id.
"""
PROJECTS = [
 {"id": "lysosome-naadp-2010",
  "title": "When lysosomes multiply: NAADP signalling in neurons",
  "year": 2010,
  "paper": {"cite": "Dickinson GD, Churchill GC, Brailoiu E, Patel S (2010) Deviant nicotinic acid adenine dinucleotide phosphate (NAADP)-mediated Ca2+ signaling upon lysosome proliferation. J Biol Chem 285(18):13321-13325", "doi": "10.1074/jbc.C110.112573"},
  "licence": "Publisher copyright (ASBMB); figure panels are local previews only",
  "question": "Lysosomes are an intracellular calcium store released by the messenger NAADP, and they build up in neurons in ageing and in many neurodegenerative diseases. Does having more lysosomes change calcium signalling?",
  "approach": "Lysosomes were made to proliferate in cultured rat hippocampal neurons (10 days) and PC12 cells (5 days) by inhibiting the lysosomal proteases cathepsin B and L with Z-Phe-Ala-diazomethylketone (ZPAD). Lysosome numbers were checked three ways: LysoTracker Red imaged by widefield epifluorescence (Olympus IX71) and by confocal microscopy (Zeiss Axiovert 200M with LSM 510, 63x/1.4 oil, 543 nm excitation); transmission electron microscopy of fixed, resin-embedded cells (ultrathin sections on a Reichert Ultracut E, uranyl acetate and lead citrate staining, JEOL 1010 with a Gatan Orius CCD), with lysosomes and mitochondria counted and measured in ImageJ; and qRT-PCR of the lysosomal proteins LAMP-1 and LAMP-2.\n\nCalcium was then measured by ratiometric Fura-2 imaging (340/380 nm excitation every 3 s from a TILL Photonics monochromator, 20x/0.75 objective) in 30-60 cells per experiment, in response to GPN (which bursts lysosomes), the cell-permeant NAADP-AM, glutamate, thapsigargin and high potassium.",
  "findings": [
   "ZPAD increased the number and size of electron-dense lysosomes in both cell types but had little effect on mitochondria.",
   "LysoTracker staining of PC12 cells rose with ZPAD concentration, about 10-fold at 200 uM; 50 uM ZPAD raised LAMP-1 and LAMP-2 transcripts 2-3-fold.",
   "Calcium released by GPN from lysosomes rose about 4-fold, while the ER store (thapsigargin) was unchanged.",
   "Responses to NAADP-AM were 1.5-2-fold larger in neurons and PC12 cells, and responses to glutamate (an NAADP-linked transmitter) were also enhanced; depolarisation-evoked signals were unchanged."
  ],
  "role": "George was one of the authors of this team study from the Patel lab at UCL, with collaborators in Oxford and at Temple University, which combined electron microscopy, confocal imaging and calcium imaging.",
  "techniques": ["tem", "confocal", "widefield"],
  "people": "Authors: George Dickinson, Grant Churchill, Eugen Brailoiu, Sandip Patel; Patel lab, University College London",
  "links": [{"title": "Paper (J Biol Chem)", "url": "https://doi.org/10.1074/jbc.C110.112573"}],
  "why_it_matters": "It links the lysosome build-up seen in ageing and neurodegeneration to exaggerated calcium signals, and offers a simple drug treatment for studying acidic calcium stores."},

 {"id": "temperature-puffs-2013",
  "title": "How temperature changes IP3 receptor calcium signals",
  "year": 2013,
  "paper": {"cite": "Dickinson GD, Parker I (2013) Temperature dependence of IP3-mediated local and global Ca2+ signals. Biophys J 104(2):386-395", "doi": "10.1016/j.bpj.2012.12.024"},
  "licence": "Publisher copyright (Biophysical Society / Elsevier); images are rendered from the lab's raw data and stay local until Ian Parker agrees",
  "question": "Most calcium imaging in cultured cells is done at room temperature, not body temperature. How does temperature change the single-channel and cluster-level calcium signals made by IP3 receptors, and the cell-wide waves they build?",
  "approach": "SH-SY5Y neuroblastoma cells were loaded with the calcium dye Fluo-4 and a caged IP3 analogue, and a UV flash released IP3 inside them. Calcium was imaged on the Parker lab's custom TIRF microscope (Olympus IX70, 60x/1.45 objective, 488 nm excitation, Cascade 128 EMCCD at 128 x 128 pixels of 0.33 um and up to 500 frames per second). Moving the laser focus from the edge to the centre of the objective's back aperture switched the same microscope between TIRF, for local puffs and blips, and widefield illumination, for global waves. Cells loaded with the slow buffer EGTA showed isolated puffs and single-channel blips.\n\nThe dish sat in a brass holder with two Peltier elements that set the temperature anywhere from 12 to 40 C, monitored by a thermocouple. Puff and blip amplitudes, durations, latencies and frequencies were measured from small regions of interest, resting calcium was calibrated with Fura-2, and temperature coefficients (Q10) and break points were found from Arrhenius plots with segmental regression.",
  "findings": [
   "Puff and blip amplitudes and spatial spread hardly changed between 12 and 40 C, so calcium flow through an open channel is nearly temperature independent.",
   "Kinetics sped up with warming: puff duration shortened with a Q10 of about 0.49, and blip (single-channel) durations shortened 3.1-3.4-fold from 12 to 40 C.",
   "Global calcium waves were larger when cooler (Q10 = 0.73), explained by longer channel openings.",
   "Puff and blip durations, puff latency and frequency, and wave frequency all showed a break in their Arrhenius plots near 25 C, possibly a lipid phase transition in the ER membrane.",
   "Cooling from 24 to 12 C prolongs single-channel signals about 3-fold without reducing their amplitude, which can help optical recording of channel gating."
  ],
  "role": "George was one of the authors of this team study from the Parker lab at UC Irvine, which combined TIRF calcium imaging on the lab's home-built microscope and temperature-controlled stage with kinetic analysis.",
  "techniques": ["tirf", "widefield"],
  "people": "Authors: George Dickinson, Ian Parker; Parker lab, UC Irvine",
  "links": [{"title": "Paper (Biophys J)", "url": "https://doi.org/10.1016/j.bpj.2012.12.024"}, {"title": "Parker lab calcium images and movies", "url": "https://parkerlab.bio.uci.edu/images_movies_presentations/calcium.htm"}],
  "why_it_matters": "Results obtained at room temperature need care when extrapolated to body temperature, and cooling offers a simple way to slow channel gating enough to see it optically."},

 {"id": "ip3r-tracking-2014",
  "title": "Tracking single IP3 receptors: mobile and anchored",
  "year": 2014,
  "paper": {"cite": "Smith IF, Swaminathan D, Dickinson GD, Parker I (2014) Single-molecule tracking of inositol trisphosphate receptors reveals different motilities and distributions. Biophys J 107(4):834-845", "doi": "10.1016/j.bpj.2014.05.051"},
  "licence": "Publisher copyright (Biophysical Society / Elsevier); figure panels are local previews only",
  "question": "Calcium puffs arise again and again at the same fixed sites, yet photobleaching studies suggested most IP3 receptors move freely in the ER membrane. Which receptors move, which stay put, and how are the stationary ones arranged?",
  "approach": "Type 1 IP3 receptors tagged with the photoconvertible protein mEos2 were expressed in COS-7 cells, whose thin periphery holds a nearly flat sheet of ER. For sptPALM, weak 405 nm light converted a few molecules at a time to the red form, which was imaged with 561 nm excitation in semi-TIRF on a custom Olympus IX70 microscope (100x/1.40 objective) and an Evolve 512 EMCCD at 167 nm per pixel and 150 ms per frame (6.67 frames per second), typically 5,000 frames per cell. Insight3 fitted each spot with a 2D Gaussian and linked spots within 664 nm in consecutive frames; custom MATLAB code computed step sizes, mean squared displacement and two-component fits, and re-linked blinking immobile molecules.\n\nNative receptors in untransfected cells were imaged by STORM on a Nikon N-STORM (100x/1.49 TIRF objective) with an anti-IP3R1 antibody and a Cy3-Alexa Fluor 647 secondary, recording 15,000 frames at 15 ms.",
  "findings": [
   "About 70% of IP3R1 molecules were freely motile, with an apparent diffusion coefficient of about 0.095 um2 per second; the rest were essentially immotile.",
   "Mean step sizes split into two groups centred near 46 and 169 nm, and the slow group matched molecules in fixed cells, confirming it was immobile.",
   "Diffusion slowed only slightly on cooling (Q10 = 1.40), as expected for passive diffusion.",
   "Some immotile receptors sat in clusters a few hundred nanometres across, the size expected for puff sites; activating IP3/calcium signalling did not change motility or clustering within seconds.",
   "STORM of native IP3R1 showed a pattern closely resembling that of the tagged receptors."
  ],
  "role": "George was one of the authors of this team study from the Parker lab, which combined single-molecule tracking, STORM and image analysis.",
  "techniques": ["smlm", "spt", "tirf"],
  "people": "Authors: Ian F. Smith, Divya Swaminathan, George Dickinson, Ian Parker; Parker lab, UC Irvine",
  "links": [{"title": "Paper (Biophys J)", "url": "https://doi.org/10.1016/j.bpj.2014.05.051"}],
  "why_it_matters": "It suggested that calcium puffs come from small, stable clusters of anchored receptors, while the more numerous mobile receptors appear functionally silent."},

 {"id": "ip3-diffusion-2016",
  "title": "IP3 is a local messenger, not a global one",
  "year": 2016,
  "paper": {"cite": "Dickinson GD, Ellefsen KL, Dawson SP, Pearson JE, Parker I (2016) Hindered cytoplasmic diffusion of inositol trisphosphate restricts its cellular range of action. Sci Signal 9(453):ra108", "doi": "10.1126/scisignal.aag1625"},
  "licence": "Publisher copyright (AAAS); cover and figure panels are local previews only",
  "question": "A classic measurement in oocyte extracts gave IP3 a diffusion coefficient near 280 um2 per second, making it a messenger that reaches the whole cell. How fast does IP3 really spread inside intact mammalian cells?",
  "approach": "Elongated SH-SY5Y cells were loaded with Fluo-4 and caged i-IP3. A galvanometer-steered 405 nm laser released i-IP3 either at one spot or as 10 evenly spaced spots along the cell, aimed with a dim coaxial 450 nm guide laser. Calcium puffs, used as natural IP3 detectors spread through the cell, were imaged on the custom TIRF microscope (Olympus IX70, 60x/1.45) with an Evolve 512 EMCCD at 0.266 um per pixel and about 66 frames per second.\n\nPuffs were detected with an automated algorithm (Ellefsen et al. 2014), and the latency to the first puff at each site was plotted against distance from the spot. Numerical diffusion simulations over a range of diffusion coefficients were compared with these latencies, alongside analytical solutions.",
  "findings": [
   "After a spot flash, mean first-puff latencies were about 20 times longer at the far end of the cell than near the spot; after a distributed flash they showed no trend along the cell.",
   "Fitting the simulations gave an effective IP3 diffusion coefficient of 10 um2 per second or less (5-10 um2 per second), about 30-fold slower than the earlier value.",
   "The predicted range of action of IP3 is under 5 um, smaller than a typical mammalian cell.",
   "The authors propose that binding to immobile, functionally inactive receptors hinders IP3 diffusion."
  ],
  "role": "George was one of the authors of this team study from the Parker lab with theoretical collaborators in Buenos Aires and Los Alamos, which combined TIRF calcium imaging, laser photolysis, image analysis and modelling.",
  "techniques": ["tirf"],
  "people": "Authors: George Dickinson, Kyle Ellefsen, Silvina Ponce Dawson, John Pearson, Ian Parker; Parker lab, UC Irvine, with Universidad de Buenos Aires and Los Alamos National Laboratory",
  "links": [{"title": "Paper (Science Signaling)", "url": "https://doi.org/10.1126/scisignal.aag1625"}],
  "why_it_matters": "IP3 is better thought of as a local signal, which changes how cells can keep different IP3-driven signals apart."},

 {"id": "dna-memory-2021",
  "title": "Storing data in DNA origami and reading it with DNA-PAINT",
  "year": 2021,
  "paper": {"cite": "Dickinson GD, Mortuza GM, Clay W, Piantanida L, Green CM, Watson C, Hayden EJ, Andersen T, Kuang W, Graugnard E, Zadegan R, Hughes WL (2021) An alternative approach to nucleic acid memory. Nat Commun 12:2371", "doi": "10.1038/s41467-021-22277-y"},
  "licence": "CC BY 4.0 (paper); data deposit on Zenodo listed as MIT",
  "question": "DNA can store data densely and for a long time, but reading it back normally needs sequencing. Can data written as patterns on DNA origami be read optically instead, and recovered reliably when some bits or whole origami are missing?",
  "approach": "In digital nucleic acid memory (dNAM), each rectangular DNA origami (about 90 x 70 nm) carries a 6 x 8 grid of sites; a staple strand with a docking extension is a 1 and one without is a 0. The message 'Data is in our DNA!\\n' was split across 15 origami designs that also carry index, orientation, parity and checksum bits, protected by fountain codes. Origami were folded, gel-purified and deposited on plasma-cleaned coverslips in flow cells.\n\nThe bits were read by DNA-PAINT: Cy3B-labelled imager strands bind docking sites briefly and repeatedly, giving blinks that can be localised. Imaging used a Nikon Eclipse Ti2 in TIRF (100x/1.49 objective plus 1.5x magnifier, 561 nm laser, ProEM EMCCD at 300 ms per frame), typically 40,000 frames per recording. Localisations came from ThunderSTORM, drift was corrected in Picasso, and custom Python code fitted each origami to the 6 x 8 grid by maximum likelihood, called each bit, and passed the bits to the decoder. AFM checked the origami.",
  "findings": [
   "One 40,000-frame recording identified about 4,500 origami in 2,982 um2.",
   "Only about 750 successfully decoded origami were needed to recover the message with near 100% probability.",
   "The full message was recovered 100% of the time even when origami recovery was as low as 63%.",
   "In simulations the decoder recovered whole messages while errors averaged under 7.4 per origami."
  ],
  "role": "George was one of the authors of this team study from the Nucleic Acid Memory team at Boise State University, which combined DNA nanotechnology, DNA-PAINT super-resolution imaging, image analysis and coding theory.",
  "techniques": ["dna-paint", "smlm", "tirf"],
  "people": "Authors: George Dickinson, Golam Md Mortuza, William Clay, Luca Piantanida, Christopher Green, Chad Watson, Eric Hayden, Tim Andersen, Wan Kuang, Elton Graugnard, Reza Zadegan, Will Hughes; Boise State University",
  "links": [{"title": "Paper (Nat Commun, open access)", "url": "https://doi.org/10.1038/s41467-021-22277-y"}, {"title": "DNA-PAINT recordings and localisations (Zenodo)", "url": "https://doi.org/10.5281/zenodo.4672665"}, {"title": "Code (BoiseState/NAM)", "url": "https://github.com/BoiseState/NAM"}],
  "why_it_matters": "It showed a way to read data stored in DNA without sequencing, using super-resolution microscopy."},

 {"id": "dna-paint-probes-2024",
  "title": "Shorter DNA-PAINT probes that still see 5 nm",
  "year": 2024,
  "paper": {"cite": "Piantanida L, Dickinson GD, Majikes JM, Clay W, Liddle JA, Andersen T, Hayden EJ, Kuang W, Hughes WL (2024) DNA-PAINT probe modifications support high-resolution imaging with shorter binding domains. ACS Nano 18(33):22369-22377", "doi": "10.1021/acsnano.4c06886"},
  "licence": "Publisher copyright (ACS); figure panel is a local preview only",
  "question": "DNA-PAINT imager strands with short binding domains could pack more readable sites onto a DNA nanostructure, but they bind too briefly to be imaged well. Can chemical or structural changes to the probe keep them bound long enough?",
  "approach": "Cy3B-labelled imager probes were shortened and stabilised with mini-hairpin loops and/or bridged nucleic acid (BNA) bases. Their bright and dark times were measured on DNA origami carrying a single docking strand, giving binding and unbinding rates, and their resolving power was tested on origami with sparse and fully occupied 6 x 8 grids. Imaging used a Nikon Eclipse Ti2 in TIRF (100x/1.49 plus 1.5x, about 107 nm per pixel, 561 nm laser, ProEM EMCCD, 150 ms frames, typically 40,000 frames). Dwell times came from Picasso picks and custom code, resolution from Gaussian fits (FWHM) to line profiles, and results were compared with simulated recordings and a thermodynamic model of duplex stability.",
  "findings": [
   "A BNA-modified probe with a 4-nucleotide binding domain, 43% shorter than previously reported probes, gave about 5 nm resolution.",
   "Probes L5b and L4b had binding and unbinding rates equivalent to the standard 7-nt probe L7, and resolved the full grid with FWHM of 5.4 and 5.1 nm (L7: 5.1 nm).",
   "The unbinding rate tracked the free energy of binding in both experiment and model, so probe performance can be predicted ahead of time.",
   "On a NAM pattern, L5b and L4b worked with half the exposure time and 25% fewer frames while keeping FWHM below 6 nm."
  ],
  "role": "George was one of the authors of this team study from Boise State University and NIST, which combined probe chemistry, DNA-PAINT imaging, simulations and thermodynamic modelling.",
  "techniques": ["dna-paint", "smlm", "tirf"],
  "people": "Authors: Luca Piantanida, George Dickinson, Jacob Majikes, William Clay, J. Alexander Liddle, Tim Andersen, Eric Hayden, Wan Kuang, Will Hughes; Boise State University and NIST",
  "links": [{"title": "Paper (ACS Nano)", "url": "https://doi.org/10.1021/acsnano.4c06886"}],
  "why_it_matters": "Shorter probes can target shorter sites, which raises the information density of DNA-origami memory and helps DNA-PAINT more widely."},

 {"id": "piezo1-halotag-2025",
  "title": "Seeing the PIEZO1 channel in human stem-cell-derived cells",
  "year": 2025,
  "paper": {"cite": "Bertaccini GA, Casanellas I, Evans EL, Nourse JL, Dickinson GD, Liu G, Seal S, et al., Parker I, Pathak MM (2025) Visualizing PIEZO1 localization and activity in hiPSC-derived single cells and organoids with HaloTag technology. Nat Commun 16:5556", "doi": "10.1038/s41467-025-59150-1"},
  "licence": "CC BY 4.0 (paper, code and example data)",
  "question": "PIEZO1 turns mechanical forces into calcium signals, but studying the endogenous human channel has been hard. Can a HaloTag knocked into human stem cells show where PIEZO1 sits, how it moves and when it opens, in single cells and in tissue?",
  "approach": "The team engineered human induced pluripotent stem cells (WTC-11) so that endogenous PIEZO1 carries a HaloTag, differentiated them into endothelial cells, keratinocytes and neural stem cells, and labelled the channel with Janelia Fluor dyes. TIRF movies of JF646-labelled channels were analysed by ThunderSTORM localisation and FLIKA nearest-neighbour linking, and trajectories were split into mobile and immobile groups by path length before mean-squared-displacement analysis; fixed cells gave the localisation error. Channel activity was read with the calcium-sensitive ligand JF646-BAPTA imaged at 200 and 500 frames per second. Lattice light-sheet microscopy with adaptive optics imaged PIEZO1 in neural organoids.",
  "findings": [
   "PIEZO1-HaloTag appeared as distinct puncta; analysis of 889,971 trajectories from 40 videos showed mobile and immobile populations.",
   "Mobile puncta had an apparent diffusion coefficient of 0.029 um2 per second in endothelial cells (0.026 in neural stem cells); immobile puncta at most 0.003 um2 per second.",
   "JF646-BAPTA signals at PIEZO1 puncta flickered between dim and bright states, and the PIEZO1 agonist Yoda1 (2 uM) increased the number and brightness of active puncta.",
   "At 500 frames per second, rises and falls of these flickers were complete within 2 frames, approaching patch-clamp time resolution."
  ],
  "role": "George was one of the authors of this team study led by the Pathak lab at UC Irvine, which combined stem-cell engineering, TIRF and light-sheet imaging, and single-molecule analysis software.",
  "techniques": ["tirf", "spt", "smlm", "lattice-light-sheet"],
  "people": "Authors: Gabriella Bertaccini, Ignasi Casanellas, Elizabeth Evans, Jamison Nourse, George Dickinson and colleagues, including Sayan Seal, Srigokul Upadhyayula, Ian Parker and Medha Pathak; Pathak lab, UC Irvine, with UC Berkeley",
  "links": [{"title": "Paper (Nat Commun, open access)", "url": "https://doi.org/10.1038/s41467-025-59150-1"}, {"title": "Analysis code: PIEZO1-LocalizationTools (Zenodo)", "url": "https://doi.org/10.5281/zenodo.15048049"}, {"title": "Code on GitHub", "url": "https://github.com/Pathak-Lab/PIEZO1-LocalizationTools"}, {"title": "Raw supplementary movies (Zenodo)", "url": "https://doi.org/10.5281/zenodo.15059239"}],
  "why_it_matters": "It provides human cell lines and an open analysis pipeline for watching an endogenous mechanosensitive channel move and open."},

 {"id": "analysis-software",
  "title": "Analysis software: FLIKA plugins and CellScope",
  "year": 2025,
  "paper": {"cite": "Ly AT, Freites JA, Bertaccini GA, Evans EL, Dickinson GD, Tobias DJ, Pathak MM (2025) Single-particle tracking reveals heterogeneous PIEZO1 diffusion. Biophys J 124(24):4457-4470", "doi": "10.1016/j.bpj.2025.01.010"},
  "licence": "CC BY 4.0 (Ly et al. 2025); FLIKA is open source; screenshots are local previews only",
  "question": "Imaging labs produce far more data than anyone can score by hand. How can calcium events, single particles and whole cells be detected, tracked and measured reproducibly, with tools biologists can use?",
  "approach": "FLIKA is an open-source Python image-processing program developed in the Parker lab; its puff detection builds on the algorithm of Ellefsen et al. (2014, Cell Calcium). A modernised fork and more than 20 plugins for puff detection, localisation microscopy, light-sheet data and single-particle tracking are used by the Parker and Pathak labs. In Ly et al. (2025), PIEZO1-tdTomato puncta were imaged by TIRF at 10 frames per second and tracked in FLIKA (difference-of-Gaussians filtering, thresholding, 2D Gaussian centroids, linking within three pixels), with a custom Python script that iterated through tracking parameters. CellScope is a separate pipeline for segmenting and tracking whole cells (Cellpose-SAM, SAM2 gap filling), validated against hand annotation.",
  "findings": [
   "Ly et al. 2025: PIEZO1 trajectories split into mobile and immobile groups; cholesterol removal and Yoda1 increased mobility, while GsMTx-4 and added cholesterol reduced it.",
   "Ly et al. 2025: mobile PIEZO1 puncta showed anomalous subdiffusion.",
   "The same FLIKA linking step is part of the published PIEZO1-HaloTag pipeline (Bertaccini et al. 2025).",
   "CellScope segmentation reaches a mean IoU of about 0.83 against hand annotation (unpublished)."
  ],
  "role": "George was one of the authors of Ly et al. (2025), a team study from the Pathak lab, and is one of the contributors to the FLIKA plugins used by the Parker and Pathak labs. He wrote CellScope with Claude Code.",
  "techniques": ["spt", "smlm", "tirf", "high-content"],
  "people": "Ly et al. 2025 authors: Alan Ly, J. Alfredo Freites, Gabriella Bertaccini, Elizabeth Evans, George Dickinson, Douglas Tobias, Medha Pathak (UC Irvine); FLIKA: Parker lab, UC Irvine",
  "links": [{"title": "FLIKA", "url": "https://flika-org.github.io"}, {"title": "FLIKA plugins", "url": "https://github.com/gddickinson/flika_plugins"}, {"title": "CellScope", "url": "https://github.com/gddickinson/cellscope"}, {"title": "Ly et al. 2025 (Biophys J, open access)", "url": "https://doi.org/10.1016/j.bpj.2025.01.010"}, {"title": "Ellefsen et al. 2014: the puff-detection algorithm", "url": "https://doi.org/10.1016/j.ceca.2014.06.003"}],
  "why_it_matters": "Open, tested analysis tools make imaging results reproducible and let more labs ask quantitative questions of their data."},
]

from portfolio_projects_src2 import PROJECTS2  # noqa: E402

PROJECTS = sorted(PROJECTS + PROJECTS2, key=lambda x: x["year"])
