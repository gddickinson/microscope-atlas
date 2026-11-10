"""Source for data/content/portfolio.json.

Contributions are described as group efforts (no splitting of credit between individuals); images come from
published work only.
"""
PORTFOLIO = {
 "title": "My microscopy",
 "intro": "Twenty years of team research in quantitative imaging, from single-channel calcium signals at 500 frames per second to DNA-PAINT read-out of data stored in DNA origami, and now analysis software for imaging labs. The work below was done with many colleagues in the labs listed further down. This atlas is a way to keep the whole field fresh, and to share why I love it.",
 "highlights": [
  {"project": "temperature-puffs-2013", "title": "Optical patch-clamp by TIRF", "text": "Parker lab studies of single IP3-receptor channel openings ('blips' and 'puffs') in intact cells, imaged by TIRF at up to 500 frames per second on the lab's home-built microscope (UC Irvine).", "techniques": ["tirf", "widefield"]},
  {"project": "ip3r-tracking-2014", "title": "Super-resolution of calcium channels", "text": "Team work using STORM and sptPALM to map and track IP3 receptors (Smith et al., Biophys. J. 2014), and multicolour STORM correlated with live calcium imaging of the same cells.", "techniques": ["smlm", "spt"]},
  {"project": "dna-memory-2021", "title": "Reading data stored in DNA", "text": "Part of the Boise State team that stored digital data in DNA origami and read it back by DNA-PAINT super-resolution microscopy (Nat. Commun. 2021), followed by work on DNA-PAINT probe design (ACS Nano 2024).", "techniques": ["dna-paint"]},
  {"project": "piezo1-halotag-2025", "title": "Analysis software for imaging labs", "text": "Analysis software for imaging labs: single-molecule analysis in the team's PIEZO1-HaloTag study (Nat. Commun. 2025), FLIKA plugins, and deep-learning segmentation and tracking pipelines validated against hand-annotated ground truth.", "techniques": ["spt", "smlm"]},
  {"project": "lysosome-naadp-2010", "title": "Electron microscopy", "text": "Transmission electron microscopy and morphometry of lysosomes in a Patel lab study of lysosome proliferation and NAADP signalling (J. Biol. Chem. 2010).", "techniques": ["tem"]},
  {"project": "lysosome-naadp-2010", "title": "Confocal imaging", "text": "Confocal imaging of lysosomes on a Zeiss LSM 510 in the same study (J. Biol. Chem. 2010), and on other confocal systems over the years.", "techniques": ["confocal"]}
 ],
 "instruments": [
  {"technique": "tirf", "instrument": "Custom TIRF (Olympus IX70, 60×/1.45), Cascade 128 and Evolve 512 EMCCDs, designed and built by Ian Parker", "work": "Single-channel Ca²⁺ imaging; waves and puffs in widefield and TIRF"},
  {"technique": "smlm", "instrument": "Nikon N-STORM, 100×/1.49 APO TIRF", "work": "STORM and sptPALM of IP3 receptors"},
  {"technique": "dna-paint", "instrument": "Nikon Eclipse Ti2 TIRF, 100×/1.49 with 1.5× magnifier, ProEM EMCCD", "work": "DNA-PAINT of DNA origami, 40,000-frame acquisitions"},
  {"technique": "confocal", "instrument": "Zeiss Axiovert 200M with LSM 510", "work": "LysoTracker imaging of lysosomes"},
  {"technique": "tem", "instrument": "JEOL 1010 with Gatan Orius CCD; Reichert Ultracut E", "work": "Ultrastructure and morphometry"}
 ],
 "labs": [
  {"name": "Parker lab", "pi": "Prof. Ian Parker", "where": "Neurobiology & Behavior, UC Irvine", "years": "2010-present",
   "work": "Team research on IP3-receptor channels and Ca2+ puffs using TIRF, STORM and sptPALM, and analysis software (FLIKA).",
   "offers": "Pioneering optical patch-clamp methods; a gallery of Ca2+ images and movies.",
   "links": [{"title": "Lab website", "url": "https://parkerlab.bio.uci.edu"}, {"title": "Calcium images and movies", "url": "https://parkerlab.bio.uci.edu/images_movies_presentations/calcium.htm"}, {"title": "Microscopy construction guides", "url": "https://evanescentlight.com/microscopy_construction.htm"}]},
  {"name": "Pathak lab", "pi": "Prof. Medha Pathak", "where": "Physiology & Biophysics, UC Irvine", "years": "2018-present",
   "work": "Team research on PIEZO1, including single-molecule and cell imaging and its analysis (PIEZO1-HaloTag, Nat. Commun. 2025).",
   "offers": "Research on mechanotransduction and the PIEZO1 ion channel.",
   "links": [{"title": "Lab website", "url": "https://www.pathaklab-uci.com"}]},
  {"name": "Nucleic Acid Memory team", "pi": "Prof. Will Hughes (with R. Zadegan and T. Andersen)", "where": "Micron School of Materials Science & Engineering, Boise State University; the Hughes lab is now at UBC Okanagan", "years": "2019-2022",
   "work": "Team research on storing digital data in DNA origami and reading it by DNA-PAINT (Nat. Commun. 2021).",
   "offers": "Digital nucleic acid memory (dNAM): DNA origami 'pegboards' read by super-resolution microscopy.",
   "links": [{"title": "Boise State news: data is in our DNA", "url": "https://www.boisestate.edu/news/2021/04/22/data-is-in-our-dna-researchers-advance-dna-as-a-memory-material/"}, {"title": "Hughes lab at UBC Okanagan", "url": "https://news.ok.ubc.ca/2026/03/30/undergraduate-students-help-turn-science-fiction-into-reality/"}, {"title": "Creating a molecular pegboard (CFI)", "url": "https://innovation.ca/projects-results/research-stories/dna-data-storage"}]},
  {"name": "Patel lab", "pi": "Prof. Sandip Patel", "where": "Cell & Developmental Biology, University College London", "years": "2002-2004, 2008-2010",
   "work": "Team research on Ca2+ signalling by acidic organelles, NAADP and two-pore channels, including confocal and electron microscopy of lysosomes.",
   "offers": "Leading work on lysosomal Ca2+ signalling, NAADP and two-pore channels.",
   "links": [{"title": "UCL profile", "url": "https://profiles.ucl.ac.uk/9779"}, {"title": "Lab page", "url": "https://www.ucl.ac.uk/life-sciences/sandip-patels-lab"}]},
  {"name": "Sanders lab", "pi": "Prof. Dale Sanders FRS", "where": "Department of Biology, University of York (PhD)", "years": "1998-2002",
   "work": "PhD research in the lab on Ca2+ release channels and signalling in plants.",
   "offers": "Ion channels in plant signalling and zinc homeostasis; later Director of the John Innes Centre.",
   "links": [{"title": "Profile (New Phytologist Foundation)", "url": "https://www.newphytologist.org/people/dale-sanders"}]}
 ],
 "code": [
  {"category": "Image viewers and FLIKA", "title": "FLIKA", "url": "https://flika-org.github.io", "about": "Open-source Python image-processing program for biologists, created in the Parker lab by Kyle Ellefsen; widely used for Ca2+ puff detection and single-particle tracking."},
  {"category": "Image viewers and FLIKA", "title": "FLIKA source (flika-org)", "url": "https://github.com/flika-org/flika", "about": "The main FLIKA repository."},
  {"category": "Image viewers and FLIKA", "title": "FLIKA, extended edition", "url": "https://github.com/gddickinson/flika---Georges-Edition", "about": "Extends FLIKA with tools for super-resolution, particle tracking, Ca2+ imaging, FRAP and spectral unmixing, plus a built-in Claude assistant that scripts and generates plugins."},
  {"category": "Image viewers and FLIKA", "title": "FLIKA plugins", "url": "https://github.com/gddickinson/flika_plugins", "about": "Plugins for Ca2+ puff detection, single-particle tracking batch analysis, localisation and track plotting, light-sheet loading and volume viewing, kymographs and video export."},
  {"category": "Image viewers and FLIKA", "title": "MicroView", "url": "https://github.com/gddickinson/microview", "about": "Desktop viewer for multi-dimensional microscopy files (TIFF, ND2, CZI) with ROI analysis, processing workflows, particle tracking and plugins."},
  {"category": "Single-particle tracking and SMLM", "title": "PIEZO1-HaloTag analysis code", "url": "https://github.com/gddickinson/pathak_lab", "about": "FLIKA plugins and batch scripts used to localise, track and analyse PIEZO1-HaloTag puncta in TIRF recordings, with a small test dataset; released with the PIEZO1-HaloTag study (Nat. Commun. 2025)."},
  {"category": "Single-particle tracking and SMLM", "title": "thunderSTORM in Python", "url": "https://github.com/gddickinson/thunderstorm_python", "about": "Python reimplementation of the thunderSTORM SMLM pipeline: filtering, detection, PSF fitting (least squares, MLE, astigmatic 3D), drift correction, merging, rendering and simulation."},
  {"category": "Single-particle tracking and SMLM", "title": "ParticleTracker", "url": "https://github.com/gddickinson/ParticleTracker", "about": "Detects, localises (Gaussian, radial symmetry, MLE) and tracks particles in fluorescence movies, drawing on thunderSTORM, u-track and trackpy, with a GUI and tests."},
  {"category": "Single-particle tracking and SMLM", "title": "Trajectory analysis", "url": "https://github.com/gddickinson/trajectory_analysis", "about": "Links single-molecule trajectories in TIRF recordings and computes shape and diffusion features (radius of gyration, fractal dimension, MSD)."},
  {"category": "Single-particle tracking and SMLM", "title": "DECODE + MAGIK pipeline", "url": "https://github.com/gddickinson/piezo1_decode_magik", "about": "Localises puncta with DECODE, links them with the MAGIK graph-neural-network tracker and extracts the Ca2+ signal at each punctum from a second channel."},
  {"category": "Cell segmentation, tracking and morphology", "title": "CellScope", "url": "https://github.com/gddickinson/cellscope", "about": "Cell segmentation, tracking and morphology pipeline written with Claude Code (Cellpose-SAM fine-tuned on DIC, SAM2 gap filling), validated against hand annotation."},
  {"category": "Cell segmentation, tracking and morphology", "title": "CellScope analysis workbench", "url": "https://github.com/gddickinson/cellscope_analysis", "about": "Opens recordings with their CellScope masks, inspects tracked cells, quantifies shape, motility and edge dynamics, compares conditions and exports tidy tables."},
  {"category": "Cell segmentation, tracking and morphology", "title": "Membrane curvature and PIEZO1", "url": "https://github.com/gddickinson/cell_curvature_analyzer", "about": "Computes membrane curvature from cell masks, correlates it with PIEZO1 fluorescence over time and classifies edge regions as extending, retracting or stable."},
  {"category": "Cell segmentation, tracking and morphology", "title": "Cell-edge dynamics pipeline", "url": "https://github.com/gddickinson/cell_edge_analysis_individual_scripts", "about": "Measures PIEZO1 fluorescence along moving cell edges, with a fluorescence-edge detection suite and a labelling and review app."},
  {"category": "Cell segmentation, tracking and morphology", "title": "DiPer in Python", "url": "https://github.com/gddickinson/diper_clone", "about": "Python version of the DiPer toolbox for cell-migration trajectories: direction autocorrelation, MSD, speed, directionality ratio and velocity correlation."},
  {"category": "Simulators and teaching", "title": "Ca2+ puff and wave simulator", "url": "https://github.com/gddickinson/calcium_simulator", "about": "2D reaction-diffusion model of cytosolic, ER and mitochondrial Ca2+ with stochastic IP3 receptor clusters that produce puffs and waves."},
  {"category": "Simulators and teaching", "title": "Light-sheet data simulator", "url": "https://github.com/gddickinson/lightsheet_simulator", "about": "Generates synthetic 3D/4D cell volumes (organelles, diffusion, transport, Ca2+ blips, puffs and waves), simulates light-sheet recordings and shows them in a 3D viewer."},
  {"category": "Simulators and teaching", "title": "TIRF microscope simulator", "url": "https://github.com/gddickinson/tirf_microscope_simulation", "about": "An optical table you can adjust: laser angle and power, components, and the resulting evanescent-field camera image."},
  {"category": "Simulators and teaching", "title": "IP3 receptor simulator", "url": "https://github.com/gddickinson/ip3r-simulator", "about": "Physics-based 3D model of the IP3 receptor from experimental structures, with elastic-network modes and gating and Ca2+ release models."},
  {"category": "Simulators and teaching", "title": "PIEZO1 simulator", "url": "https://github.com/gddickinson/piezo1-simulator", "about": "Physics-based 3D model of the PIEZO1 channel from PDB structures: elastic-network gating, membrane-dome measurement and variant mapping."},
  {"category": "Simulators and teaching", "title": "PIEZO1 research software manuals", "url": "https://github.com/gddickinson/piezo1_research_manuals", "about": "Practical manuals for the imaging and analysis software used in PIEZO1 single-molecule work (Micro-Manager, FLIKA, Fiji, thunderSTORM, u-track, napari and more)."},
  {"category": "Simulators and teaching", "title": "This atlas", "url": "https://github.com/gddickinson/microscope-atlas", "about": "Source of Microscope Atlas: technique pages, simulations, lab tools and the sourced databases."},
  {"category": "Simulators and teaching", "title": "All repositories", "url": "https://github.com/gddickinson", "about": "Everything else on GitHub, including earlier versions of several tools above."}
 ],
 "code_papers": [
  {"cite": "Ellefsen KL, Settle B, Parker I, Smith IF (2014) Cell Calcium 56:147-156", "doi": "10.1016/j.ceca.2014.06.003", "note": "The algorithm behind FLIKA's automated detection of local Ca2+ signals."}
 ],
 "papers": [
  {"cite": "Dickinson GD, Mortuza GM, Clay W, Piantanida L, et al. (2021) Nature Communications 12:2371", "doi": "10.1038/s41467-021-22277-y", "note": "An alternative approach to nucleic acid memory: data stored in DNA origami, read by DNA-PAINT."},
  {"cite": "Dickinson GD, Ellefsen KL, Dawson SP, Pearson JE, Parker I (2016) Science Signaling 9:ra108", "doi": "10.1126/scisignal.aag1625", "note": "Hindered cytoplasmic diffusion of IP3 restricts its cellular range of action; journal cover."},
  {"cite": "Smith IF, Swaminathan D, Dickinson GD, Parker I (2014) Biophysical Journal 107:834-845", "doi": "10.1016/j.bpj.2014.05.051", "note": "Single-molecule tracking (sptPALM) and STORM of IP3 receptors."},
  {"cite": "Dickinson GD, Parker I (2013) Biophysical Journal 104:386-395", "doi": "10.1016/j.bpj.2012.12.024", "note": "Temperature dependence of IP3-mediated local and global Ca2+ signals, imaged by TIRF at up to 500 frames per second."}
 ],
 "software": ["FLIKA plugins for single-particle tracking, localization and analysis, used in the Parker and Pathak labs", "Cellpose-SAM fine-tuning and SAM2 gap filling for cell segmentation and tracking (mean IoU ~0.83 against hand annotation)", "This atlas: FastAPI and JavaScript, with simulations of the physics"],
 "footnote": "All of this work was done by teams; see each paper for its full author list and contributions. The Parker-lab microscopes were designed and built by Ian Parker."
}
