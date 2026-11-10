# Session log

## 2026-11-09: Round 1, first build (R0)
George asked for an extensive microscopy project in the style of Code Breaker: a sourced database of
microscopes, teaching pages and simulations for every technique, useful for teaching and revision.

Built a FastAPI + plain-JS app (port 8010) with a fluorescence-themed dark UI and a background of blinking
single molecules that slowly builds a "super-resolved" image.
- Database: 293 systems in 6 files from 6 parallel research agents (confocal/multiphoton 49, super-resolution 47,
  light-sheet/in vivo 50, widefield/screening 48, electron/probe 49, label-free/open/historical 52; two duplicates
  merged), 28 detectors, 28 objectives. Every entry has source URLs and a `checked` date.
- Caveat: the session's shared web-search quota (200) ran out part-way through the research, so many facts rest on
  search-result summaries of the cited pages rather than full reads, and many years are null. Agents' lists of
  doubtful facts are the starting point of R1. Not yet in the database: Revvity Operetta/Opera Phenix (403),
  3DHISTECH (SSL error), Gatan K3 (blocked), Siemens Elmiskop, Axiovert 200M. STM is tagged `afm` until an `spm` id exists.
- Teaching pages: all 51 techniques (three agents), 210 papers, each DOI checked against Crossref by the agents;
  I re-checked three DOIs recalled from memory in superres.json (all correct). Some history years and typical
  numbers are flagged as from memory in the agents' reports (e.g. Nicol prism 1828, Nipkow 1884, MINFLUX
  σ ≈ L/(4√N) constant) and should be spot-checked in R1.
- Fluorophores: FPbase GraphQL (1,013 proteins and dyes; 71 curated spectra). Names not matched yet: sfGFP,
  mNeptune2, GCaMP6s, jGCaMP7s, FITC, TRITC, JF549/646, TMR, Fura-2, Rhod-2, MitoTracker Deep Red, Abberior STAR dyes.
- Simulations (18): PSF/Rayleigh, NA and immersion, infinity optics, Nyquist, phase contrast, TIRF, confocal pinhole,
  two-photon, light-sheet, STED, SMLM, SIM k-space, Jablonski, FRET, camera noise, FRAP, SPT/MSD, electron wavelength.
  Physics lives in `sim_engine.js` with node tests; the tests caught a wrong Soumpasis argument (τD/2t vs 2τD/t), fixed.
- Pages: techniques, systems browser/detail/compare, manufacturers, detectors/objectives, fluorophores, spectra viewer
  with crosstalk tables, technique chooser, optics calculator, fundamentals (10 sections), history (276 events),
  glossary (67), question bank (208 Q&As), portfolio, about.
- My Microscopy page uses only facts George has confirmed; George should review it.
- Tests: 11 pytest + node engine tests pass; Playwright smoke test of 19 routes clean (fixed: stack overflow from
  `Math.max(...)` on large arrays; a slider id clashing with the background canvas id).
- Repo: private GitHub repo gddickinson/microscope-atlas (Code Breaker is private too; making it public is George's call).
Next: Round 2 (R1 data audit).

## 2026-11-09: Round 2, public release, static site, quiz, lab tools, papers, community (George's requests)
- Repo to be public, with a static export: `scripts/build_static.py` dumps every API response through the FastAPI
  TestClient into `site/api/*.json`; `static_api.js` answers the front end from those files (system and fluorophore
  search run in the browser); Python-only tools show a notice. `.github/workflows/pages.yml` tests, builds and
  publishes to GitHub Pages on push. Asset paths are relative so the site works under any sub-path (tested at /site/).
- Interview prep became a teaching Quiz (`quiz.js`): six generated multiple-choice types (light-path diagram,
  tagline, equation, key number with same-technique distractors, glossary, fluorophore peaks), Leitner flashcards
  over the 208 worked questions, and browse. The content field `interview` is now `quiz`; all interview and
  job-search references were removed from the repo.
- Lab Tools hub (`lab.js`, `lab_ui.js`) with tools written by three parallel agents: microscope setup and planning
  (`lab_setup*.js`), labelling and probes (`lab_label*.js`), bench calculators and analysis (`lab_bench*.js`,
  `lab_analysis*.js`, plus a Python file inspector `atlas/lab_files.py`). Reference values cite sources per row.
- Papers database: 257 papers (cited landmark papers + 56 curated reviews, protocols, rigor guides, software),
  Crossref metadata and citation counts (`scripts/build_papers.py`); one recalled DOI (Cromey 2010) did not resolve
  and was dropped. Community page: 49 resources in 6 groups, all links checked (`scripts/check_links.py`).
- Auto-linking (`links.js`): technique names, glossary terms and software in teaching text link to pages/sites.
- My Microscopy: people and labs (Parker, Pathak, Hughes/Boise State NAM, Patel, Sanders) and code (FLIKA,
  George's FLIKA edition and plugins, CellScope), each link fetched and checked; DOIs of George's papers verified.
  Gallery of 8 renderings of raw TIRF Ca²⁺ puff recordings from Dickinson & Parker 2013 Biophys J (published;
  linked by the archive catalogue). The archive's notes say sharing archive-derived material needs Ian Parker's
  agreement, so these stay LOCAL-ONLY (`data/portfolio_staging/`, git-ignored; shown with a "local preview" badge)
  until George confirms. Publish by moving approved files + manifest entries to `data/portfolio/`.
- Systems link check: 450 source links, 49 not OK; most are publisher 403s to scripts (doi.org → Science), about
  ten are real 404s (docs/link_report_systems.md) for R1.
- Repo made public (single clean commit, force-pushed by George); GitHub Pages live at
  https://gddickinson.github.io/microscope-atlas/ (CI needed numpy/tifffile/pillow/python-multipart; fixed).
  Live-site smoke test of 22 routes clean.
- My Microscopy: 8 project pages (`scripts/content/portfolio_projects_src.py`: question, approach, findings, role,
  techniques, people, links), clickable from highlights, gallery and a Projects grid. 27 local-only images
  (git-ignored) including renders of the published Zenodo data for Nat Commun 2021 (DNA-PAINT) and 2025 (PIEZO1),
  raw TIRF puff data for Biophys J 2013, and figure panels; each with licence and provenance in the local manifest.
  Open points for George: CellScope role wording, Ian Parker's permission for archive images.

## 2026-11-10: Round 3 (hourly), R1 data audit, part 1
Link checker now encodes spaces and non-ASCII URLs. Of 450 system source links, 10 dead pages were replaced by
Wayback Machine snapshots of the same pages (titled "archived copy") and 5 dead duplicates dropped where the entry
keeps other sources; the remaining failures are publisher 403s to scripts. Added Revvity Opera Phenix Plus and
Operetta CLS (295 systems) and the Gatan K3 detector, each from vendor and facility pages. Next in R1: 3DHISTECH,
Axiovert 200M, Elmiskop, an `spm` technique page, and re-reading snippet-sourced facts.
- 2026-11-10: 200 Wikimedia Commons images (80 instruments, 120 micrographs; PD/CC0/CC BY/CC BY-SA only, licence
  re-checked on download, author and source shown with each) via `scripts/fetch_commons.py` and the curated
  `scripts/content/images_src.py`; 15 mismatched or weak images removed after review. Shown on system pages,
  technique pages (43 of 51 techniques have images) and a new Image Gallery. Gaps: hilo, lattice light-sheet, OPM,
  fluctuation, FCS, FRAP, miniscope, light-field. CellScope now credited as written by George with Claude Code.
- 2026-11-10: Methods papers (140, every technique ≥2, all DOIs checked against Crossref; `methods_src.py`, merged
  by build_papers.py as category "Methods") → 386 papers. 150 video tutorials checked via YouTube oEmbed
  (`videos_src.py`), shown on technique pages and a Video Tutorials page. 29 optics/component suppliers added to
  Community (88 links, plus all video links, checked; 403 now counts as "blocked", not failed). Removed the
  unresolvable Cromey 2010 DOI. Weak spots: stereo methods papers; thin videos for HILO, lattice, CARS/SRS, photoacoustic.
- 2026-11-10: Virtual optical table (`#/table`): browser-only 2D ray tracer, 43 part types (real cameras and
  objectives from the database, dye spectra for fluorescence, supplier links), 33 presets including 11 cited
  literature set-ups, readouts from sim_engine, undo/save/share. Linked from the Lab Tools menu and hub, home page and
  technique pages ("Build it on the optical table"). Node tests cover the optics and every preset.

## 2026-11-10: Round 4 (hourly), R1 data audit, part 2
Added 3DHISTECH Pannoramic 1000, ZEISS Axiovert 200M and Siemens Elmiskop I (298 systems), each from vendor,
facility, museum or manual sources; no resolution or fluorescence claims that the sources did not make (Elmiskop
dates differ between sources, 1954-1956, and the summary says so). Next in R1: an `spm` (STM) teaching page and
re-reading snippet-sourced facts.

## 2026-11-10: Sample imaging on the optical table; more My Microscopy; group attribution (George's requests)
- Optical table: specimens (11, seeded) on the sample parts and a simulated image for every camera/PMT, formed
  from the traced optics (NA, M, λ, inferred illumination mode incl. TIRF/HILO/confocal/spinning disk/light sheet/
  2P/STED/SIM/brightfield/darkfield), Gaussian PSF (σ = 0.21 λ/NA), camera pixels and noise; image viewer with LUTs,
  contrast, histogram, line profile, ground truth and PNG export. Light-sheet preset sheet thinned to ~3.9 µm; two
  imaging demo presets. Tests in `table_imaging.test.mjs`. Photometry is relative; STED I/Is and HILO field assumed.
- My Microscopy: 9 more project pages (17 total) with 15 more local-only figure images (42 total). All
  contributions now described as group efforts (George's rule, also in CLAUDE.md); "My role" → "Contribution".
- History squashed into one clean commit again (force-pushed by George).

## 2026-11-10: Round 5 (hourly), R1 data audit, part 3
New technique `spm` (scanning tunnelling microscopy): teaching page (tunnelling physics, Tersoff-Hamann, modes,
pitfalls, quiz), papers Binnig 1982/1983, Tersoff-Hamann 1985, Binnig-Rohrer 1987 (DOIs checked on Crossref), an
STM diagram, "STM" auto-links, and the IBM 1981 STM system retagged from afm to spm. Methods gap recorded for spm.
Not pushed: local main holds the squashed clean commit awaiting George's force-push; this round is committed on top.
- 2026-11-10: 8 unpublished, analysis-free archive images added LOCALLY (3D STORM of mitochondria, two-colour
  dSTORM of tubulin/IP3R1 and ER/IP3R1, widefield vs STORM, a raw Ca2+ rise montage, a migrating keratinocyte); 50
  local images in all. New "From the archive" project flagged local_only, hidden wherever its images are absent.

## 2026-11-10: Round 6 (hourly), R1 closed
Sourced the inferred statuses in confocal.json: FV3000 discontinued March 2024 and FVMPE-RS discontinued (Evident
obsolete-product pages; FV5000/FV5000MPE named as replacements), ZEISS LSM 7 MP end of support 1 Oct 2024; Cell
Observer SD only has its ZEN bundles listed as end of support, so the entry says hardware status is unconfirmed.
R1 completed; systematic re-reading of snippet-sourced facts is the new row R12. Next: R2 simulations II.

## 2026-11-09: Round 7 (hourly), R2 simulations II, first half
New physics in `sim_engine.js` (radix-2 FFT and 2D FFT, Noll-normalised Zernike pupil PSF with Strehl ratio,
Maréchal approximation, separable Gaussian blur, Richardson-Lucy, FLIM phasors, weak-phase CTF with Scherzer values,
missing-wedge reconstruction and Radermacher elongation), tested in `tests/sim_engine2.test.mjs` (FFT round trip,
Strehl vs Maréchal at λ/20, RL flux and falling error, phasor on the semicircle, first CTF zero at 1/√(λΔf), 1.55× at
±60°). Five new simulations in `sim_imaging.js` and `sim_tomo.js`: deconv, aberration, phasor, ctf, wedge (23 total).
Smoke test includes them; README gains the CTF and missing-wedge figures. Next in R2: Köhler, DIC shear, FCS
autocorrelation, AFM tip convolution, spinning-disk crosstalk, expansion factor.

## 2026-11-10: Round 8 (hourly), R2 simulations II completed
Six more simulations (29 total): Köhler illumination as Abbe partially coherent imaging of a grating (back-focal-plane
view of the orders and condenser discs), DIC shear and bias on a phase-map cell, AFM tip dilation (sphere + cone tip),
FCS from a simulated 2D diffusion trace (N and D recovered from the autocorrelation, not echoed), spinning-disk
crosstalk (single pinhole (a/r)² vs the array's fill-factor floor, signal/background in thick samples), and expansion
factor vs label displacement. Physics in `sim_engine.js` (now 447 lines; split before adding more), tested in
`tests/sim_engine3.test.mjs`. README gains Köhler and AFM figures. Next: R3 diagrams for every technique.

## 2026-11-10: Round 9 (hourly), R3 diagrams for every technique
22 new light-path diagrams in `lightpath_defs2.js` (FLIM with TCSPC, two-channel FRET, FCS correlator, FRAP, SPT,
spectral detection with a grating and array, Raman spectrometer, CARS/SRS pump and Stokes with forward detection,
SHG, QPI interferometer, iSCAT, OCT Michelson, photoacoustic, X-ray zone plates, CLEM, high-content, slide scanner,
intravital, miniscope, adaptive optics loop, light field, open hardware). Shared helpers moved to `lightpath_kit.js`.
All 52 techniques now have their own diagram (`tests/lightpath.test.mjs`); each was rendered and checked for overlaps
and clipped labels. Techniques figure refreshed. Next in R3: step-through mode linking `light_path` steps to parts.

## 2026-11-10: Round 10 (hourly), R3 completed
Step-through mode for the light-path diagrams (`lightpath_steps.js`). Prev/Next under the diagram, or a click on a
"Following the light" step, highlights the diagram parts that step names and dims the rest. Matching uses a small
vocabulary (objective, dichroic, pinhole, detectors, sources, scanners, prisms...) plus each part's own name, taken from
the step's main clause only (text before the first semicolon) to avoid over-highlighting. 269 of 336 steps link to at
least one part; the rest say the step is not drawn as a separate part. Tested in `tests/lightpath.test.mjs`. TEM
specimen label shortened (it was clipped). TIRF/STED page figures refreshed. Next: R4 Image Lab.

## 2026-11-10: Round 11 (hourly), R4 Image Lab, first half
New page `#/imagelab` (nav: Lab tools; also in the lab hub). The object is a test specimen (bead pairs, USAF, Siemens
star, microtubules, mitochondria, nuclear pores, single molecules) or the user's own TIFF/PNG/JPEG, read in the browser.
It is imaged with a Gaussian PSF (FWHM 0.51 λ/NA), binned camera pixels, Poisson shot noise, background and read noise,
then restored with Richardson-Lucy. Power spectra of object, image and restoration show the 2NA/λ cut-off as a circle.
Readouts: PSF width, camera pixel vs Nyquist, peak SNR, and Pearson correlation with the object (0.48 camera image →
0.75 restored for bead pairs at NA 1.4). New `sim_engine_image.js` (re-exported from `sim_engine.js`, which was near
its line budget) with node tests; browser TIFF reader `imagelab_io.js` (8/16/32-bit int and float, strips, tiles, RGB
chunky/planar, big-endian, multi-page, PackBits) checked against tifffile/numpy in `tests/test_imagelab.py` (PackBits
by the Apple TN1023 example in node, since tifffile needs imagecodecs to write it). README gains an Image Lab section and
figure. Next in R4: localize spots in a single-molecule frame and check the fits against Python.

## 2026-11-10: Round 12 (hourly), R4 Image Lab completed
Spot localization in the Image Lab. New `sim_engine_loc.js` (re-exported by `sim_engine.js`): robust noise from the
median absolute deviation, local-maximum detection on the PSF-smoothed frame above k noise σ, a Levenberg-Marquardt
fit of a symmetric 2D Gaussian (x, y, A, bg, σ; photons = 2πσ²A), and nearest-neighbour matching to known positions.
New "Single-molecule frame" specimen (molecules at known positions ≥ 1 µm apart) and a `Localize spots` panel
(`imagelab_spots.js`): overlay of fits and truth, readouts of found/missed/false, error vs truth and the Thompson,
Larson and Webb (2002) limit (3.6 nm measured vs 4.2 nm predicted at 100 nm pixels, ~900 photons). Tests: node
(noise-free fits exact, 300 noisy fits give 0.077 px scatter = Thompson 0.077 px) and Python (every fit equals
scipy curve_fit on the same window to 1e-4; ≥ 90% of molecules within 0.5 px). README figure added. R4 completed;
next: R5 microscope builder.

## 2026-11-10: Round 13 (hourly), R5 microscope builder completed
New `#/builder` page (Lab tools nav and hub). Objective and camera come from the components database: `builder_calc.js`
reads magnification, NA, immersion index (via the sourced immersion table in `lab_setup2.js`), pixel size, sensor
format, QE, read noise and frame rate from the entries' spec text. That gives 23 usable objectives and 18 cameras;
those whose medium or format the source leaves open are skipped, and a missing QE or read noise becomes a labelled
user input. The fluorophore is one of the 71 with FPbase spectra (ε, QY, τ from FPbase), with a laser line and an
emission band. Reports: FWHM/Rayleigh/axial, pixel vs Nyquist, field of view vs illuminated field, frame rate, power
density, excitation and emission rates with saturation, collection efficiency, band fraction, photons per exposure,
peak-pixel SNR, Thompson precision. Physics in the new `sim_engine_photon.js` (re-exported; `tests/sim_engine_photon.test.mjs`);
parsing and report checked in `tests/builder.test.mjs` (e.g. Alexa 488 on a 60×/1.49 + Prime BSI Express at 10 mW over
100 µm, 100 ms: ~1,600 photons, 2.9 nm). README section and figure. Next: R6 database growth (lasers, filter sets).

## 2026-11-10: Round 14 (hourly), R6 database growth, light sources and filter sets
Two new component kinds. `data/components/light_sources.json` has 28 entries: 16 lasers (OBIS, iBeam smart, Cobolt
04-01/06-01, LuxX+, FlexxRay LBX, iChrome MLE, CELESTA, L6Cc, LightHUB Ultra, Nikon LU-N4 (discontinued), Chameleon
Discovery NX, Mai Tai, Axon, FemtoFiber ultra 920, MPB 775 nm fibre laser) and 12 LED and lamp sources (CoolLED
pE-300ultra/pE-800/pE-4000, Lumencor SPECTRA and SOLA, X-Cite XYLIS II/NOVEM/120Q, Colibri 7, D-LEDI, Lumen 300-LED,
HBO 100 W/2). `filters.json` has 16 entries: Chroma 49000-49008, 69002 and 89000, plus Semrock DAPI/GFP/YFP/TxRed/mCherry/Cy5,
Pinkel and LF quad sets, all marked obsolete as their pages state. Gathered by three research agents from fetched
pages only, and spot-checked by curl. ZEISS filter sets were dropped (only second-hand 2012 PDFs). Unconfirmed availability
and distributor-hosted sources are noted in the summaries. The `COMPONENT_KINDS` validator now checks ids, status and
URLs for all four kinds; the API, static export, components page tabs and nav were updated. Server restarted (new
PID). Next in R6: builder picks lasers and filters from the database, current Semrock sets, more systems, photos.

## 2026-11-10: Round 15 (hourly), R6: builder uses the light-source and filter databases
The microscope builder now picks a light source and a filter set from the new tables. `parseSource` reads the lines a
source states, ignoring model codes such as XT730S and Colibri bandwidths, plus the common laser lines inside a stated
family range. Multiphoton and STED lasers and sources with no stated lines are left out (16 usable). `parseFilterSet`/
`parseBands` read centre/width bands (15 sets; the Chroma 69002 page gives no widths). `pickBand` chooses the set's
emission band nearest the dye's emission above the line. The page notes the source's stated output power, warns that
LED peaks make the budget an estimate, and says whether the line lies inside the set's exciter band. Tests extended in
`tests/builder.test.mjs`. Builder figure refreshed. Next in R6: current Semrock sets, more systems, photos.

## 2026-11-10: My Microscopy page regrouped (George's request)
George asked for the page's elements to be grouped better, with graphs and figures removed and only good raw images
shown; the linked project pages keep the figures. `content.portfolio_images` now merges an optional `display.json`
beside each manifest that marks every file `image` (with a group) or `figure` (unlisted files count as figures). The
local classification is in `data/portfolio_staging/display.json` (git-ignored like the images): 16 raw images in three
groups (Calcium signals 3, Super-resolution 11, Cells 2), 34 figures. Annotated paper panels (labelled EM, confocal
comparison grids, lettered STORM panels) count as figures. The main page now has the grouped raw-image gallery
(compact cards, title and technique, caption on hover), research themes (thumbnails from raw images only), compact
project cards (title and year), and labs, code, instruments, papers and software folded into collapsible sections.
Project pages show "Images" then "Figures and analysis". Page height 5,234 → 4,054 px at 1400 px wide.

## 2026-11-10: Round 16, Cells page (George's request), first part
George asked for a Cells page with diagrams of cell types, explanations of structure and biology, an image database
of many cell types and an identifier for uploaded images; he chose a local deep model for identification.
- Diagrams: 10 hand-drawn SVGs (`cell_diagrams.js`, `cell_diagrams2.js`); parts are clickable and open the structure
  entry. Tested in `tests/cells.test.mjs`.
- Content: `data/content/cells.json` from a research agent: 22 structures, 34 cell types, 23 numbers. Every value is
  from a fetched page (68 BioNumbers BNIDs re-checked by the agent; two spot-checked by me). NCBI Bookshelf returned
  CAPTCHAs; OpenStax was not used because its pages forbid use in AI training (flag for George).
- Identifier: `atlas/cell_id.py` with BiomedCLIP (MIT, DOI checked on Crossref) on MPS. torch 2.15, open_clip 4.2.1
  and transformers 5.22 are installed in .venv; `requirements-ml.txt` keeps them optional. The text match alone is
  right for yeast, pollen and mitotic cells; it confuses cardiac with skeletal muscle and onion epidermis with guard
  cells, and misses cheek cells. Nearest-neighbour votes from labelled atlas images should help once they exist.
- Page `cells.js` with five tabs; nav entry under Learn; static export includes the content (the identifier shows a
  notice there).
Still running: the Commons cell-image search (placeholder `scripts/content/cell_images_src.py`).

## 2026-11-10: Cells page completed; Nobel Prizes page (George's requests)
- Cell images: the research agent verified 99 Commons files through the API (licence, size, description). Two
  with loosely supported fluorescence tags were dropped; 97 were fetched through `fetch_commons.py` (TIFFs re-encoded
  as JPEG). Two were already atlas images, so `_merge` gives the existing entries a `cell_type` instead of
  duplicating them (295 images in total, 33 cell types).
- Identifier accuracy (`scripts/eval_cell_id.py`, leave-one-out, 97 images): zero-shot 32% top-1 / 55% top-3,
  neighbours alone 25% / 42%, blend 32% / 56% at text weight 0.7 (0.5 gave 31% / 54%). With 2-4 reference images
  per type the neighbour vote is weak. Archaea added to the prompts (34 candidates). Tested in the browser by
  uploading a pollen image: pollen first at 79%.
- Nobel page (`nobel.js`, Community menu): 19 prizes from nobelprize.org. Exclusions with reasons are in the agent's
  notes (Ross 1902, Ehrlich/Metchnikoff 1908, Svedberg 1926, lasers 1964, vesicle traffic 2013, patch clamp 1991).

## 2026-11-10: Round 17, R15 more cell images (George's request), groundwork
George asked for more cell images to improve identification. Three research agents are searching Commons, split by cell
group, for about 6 more single-panel images per type. Meanwhile:
- `fetch_commons.py`: a second source list, `cell_images_src2.py`, stored at 720 px / 160 kB to limit repo growth.
- `cell_id.py`: a softmax probe trained on the reference embeddings (numpy, L2) and a three-way blend. The weights
  stay text 0.7 + neighbours 0.3 until the new images are measured. With 97 images the probe scores 24% top-1, the
  same as the neighbour vote.
- `eval_cell_id.py`: compares zero-shot, neighbours, probe and blends, leave-one-out (the probe is refit without
  each image).

## 2026-11-10: My Microscopy: calcium signalling section, archive movies and 3D renders (George's requests)
- Calcium signalling section (`scripts/content/calcium_src.py` → portfolio.json "calcium"; rendered by `calciumSection`
  in learn.js). Background in five paragraphs from 13 papers, each DOI checked on Crossref by the research agent: ER
  [Ca2+] is "a few hundred micromolar" as its sources say. "Where our work fits" describes the group projects as team
  work and links each one; the group's 2016 IP3-diffusion finding moved there from the background. Glossary and
  references sit in a fold-out.
- Movies (local preview, git-ignored like all archive material; `portfolio_images7.py`, `portfolio_images8.py`,
  manifest `portfolio_manifest5.py`): calcium puffs at 12, 22 and 35 C from the published temperature study (dF/F
  over the resting image, slowed 4.7-6.5x); hundreds of puffs in a Xenopus oocyte (GeorgeDisc1, 110322; unpublished,
  display only); "How a STORM image is made", with widefield, then raw blinking N-STORM frames beside the
  reconstruction building up from the NIS export's localisations (frame f → time point (f-1)//2). H.264 MP4 with
  poster frames; the page plays on-screen videos (`playVisible`).
- 3D (`portfolio_images6.py`): depth-coded 3D STORM projections from the lab's "Best examples" exports (SH-SY5Y
  microtubules, full field and zoom; ER in SH-SY5Y and COS-7) and a tilted two-colour COS-7 view (height x1.5,
  stated). Rotating oblique views streaked because z precision is coarser than x-y, so they were dropped. The 2011
  MetaMorph 3D reconstruction of a brain slice from Carl Cotman's lab (file names on GeorgeDisc1) is shown as rendered.
- George attached GeorgeDisc1; `nd2` package added to .venv for reading N-STORM movies.

## 2026-11-10: more cell images (R15 completed), calcium movies from Commons, STORM movie fixed, z-series views
- R15: 193 more Commons cell images; identifier blend now text 0.4 + trained probe 0.4 + neighbours 0.2
  (33% top-1, 59% top-3 on 290 images; docs/cell_id_eval.md). Image tests: total-size cap 45 → 70 MB, videos need
  posters, calcium movies may lack a technique id.
- 15 Commons calcium images (12 .ogv movies and 2 GIFs from open-access papers, converted to MP4 ≤ 590 kB by
  `scripts/commons_video.py`) under "Calcium signalling across biology". Kept out of the general galleries.
- "How a STORM image is made": George noticed blinks and reconstruction did not line up. The NIS export sat 1.75 px
  (ATTO 488) and 2.5 px (Alexa 647) off the raw frames; measured by cross-correlation in the script and removed.
  The movie now opens on the whole field with the zoom box, and rings mark each frame's localisations on both
  panels.
- Widefield z-series (GeorgeDisc1/ZStack, 2014): focus-through movies and depth-coded projections of COS-7 IP3R1 and
  SH-SY5Y ER-RFP (no x-y calibration in the files, so no rotated views yet). The gallery group is now "3D views".

## 2026-11-10: more archive examples (George's request)
- Surveyed the Parker-lab catalogue for good examples. New local-preview items: a global Ca2+ rise sweeping into a
  cell (Calcium_STORM 150317 p003, Nikon TIRF) and shadowless-TIRF puffs with Cal-520 at 200 Hz (2014_06_27), both
  in "Calcium events from the lab"; a transmitted-light image of SH-SY5Y cells (N-STORM). Considered and rejected:
  noisy Patching transmitted-light frames (HeLa, SH-SY5Y; 128-px neuron frames), a sparse three-colour IP3R1/2/3
  STORM, the 110202 strip recordings (499 x 146, mostly dark) and the BTS anchoring recording (flash-dominated).
- Cells page image database: the lab's own cell-type recordings (`cell_type` in the local manifest: SH-SY5Y,
  Xenopus oocyte movie, keratinocytes) appear beside the Commons images as "local preview" (`cellImages` in cells.js);
  the identifier's reference set stays Commons-only.

## 2026-11-10: Round 18 (hourly), R6 systems growth
60 new systems (298 → 358) in `data/systems/light_more.json` (31 light microscopes: e.g. Evident IXplore IX85 SpinSR,
ZEISS Lattice SIM 5, 3i AXL ctLS, Phi HoloMonitor M4, Femtonics Atlas, Akoya PhenoImager HT, ImageXpress Pico,
Ventana DP 600, Leica M165 FC, ZEISS LSM 800, LaVision TriM Scope II, Luxendo QuVi SPIM, Tomocube HT-2H) and
`em_probe_open_more.json` (29: JEOL CRYO ARM 200, Glacios 2, ZEISS Sigma, Phenom XL G2, Leica ARTOS 3D, five AFMs,
Xradia 630 Versa, four soft X-ray beamlines, iFLM, SECOM, mesoSPIM Benchtop, PlanktoScope, NINscope, eduSPIM, the
2015 ASLM, and seven historical EMs). Each entry was gathered by research agents from fetched pages only. I
spot-checked two by curl and corrected one wording (NX20 "200 mm samples"). Weak sources and unconfirmed
availability are noted in the agents' reports, and the summaries say so where it applies.

## 2026-11-10: 3D views, tracked cells, FANTOM copy and backup (George's requests)
- 3D (local preview): rocking 3D STORM views of microtubules, ER, mitochondria (TOM20) and IP3R1. The localisations
  go into a 3D density grid blurred more in z, the view rocks ±30°, and height is stretched 2.5× (stated in the
  captions). The turning widefield z-series movies were withdrawn after George said the depth looked wrong: the
  COS-7 file records no z step (the ER file gives 0.1 µm on its first plane only), and widefield stacks smear along
  z. The x-y pixel of 167 nm is estimated from the lab's 2014 EMCCD set-up (Smith et al. 2014). Focus-through captions
  corrected.
- Tracked cells (local preview, Cells group): CellScope's saved results rendered as a single cell tracked for 13 h
  and a multi-cell field with coloured trails. The masks match the far-red channel, not DIC (edge test). The cell
  type conflicts between CellScope's sidecar ("keratinocyte") and its README ("endothelial"), so captions say it is
  to be confirmed.
- FANTOM: GeorgeDisc1's ZStack, Carls slice and Xeno ooctes folders (43 GB) were completed under
  CASTLE_DATA/real/archive_drive1 (copy only, verified by file count and per-file size) and recorded as a note in
  FANTOM/INVENTORY. A first sources.json entry clashed with the existing archive_drive1 prefix; it was replaced by
  the note, and the inventory was rescanned and committed.
- Backup: `scripts/backup_to_drive.sh` → /Volumes/FANTOM/MICROSCOPE_ATLAS_BACKUP (project incl. git-ignored local
  data, verified git bundle, ~/.cache/microscope_atlas; 846 MB). Restore tested by cloning the bundle.
- DNA-PAINT demo: downloading the 45.5 GB dNAM raw recordings (Zenodo 4672665) to FANTOM/DNA_PAINT_DATA; 7-Zip
  installed with Homebrew.

## 2026-11-10: Round 19 (hourly), R6 filter sets
17 current filter sets added (33 in total): Semrock/IDEX BrightLine BFP-A, LED-FITC-B, GFP-4050C, Cy3-4040D, TRITC-C,
LED-TRITC-B, TxRed-4040D, Cy5-4040D, LED-Cy5-B, Cy7-B, the DA/FI/TR/Cy5-4X4M-C Sedat set and LF405/488/561/635-B;
Chroma 49004 ET-Cy3/TRITC and 49007 ET-Cy7; Edmund 67-003 GFP, 67-008 Texas Red and 67-010 Cy5 (passbands given as
ranges, so the builder cannot use them). Correction: the eight Semrock sets marked "discontinued" in round 14 are
orderable. Every IDEX page carries a hidden "This product is obsolete!" block shown only for stocking type 'O';
rendered in Chrome, all eight showed no notice and an add-to-cart button. Status reverted to current and the README
updated. Lesson: for script-rendered stores, check what a visitor sees, not the raw page text.

## 2026-11-10: drive 4 attached (George)
- George chose to copy everything missing from drive 4 ('Internal Drive') to FANTOM: about 1.04 TB (George/ 291 GB,
  ScienceSignalling/ 123 GB, Work/ 629 GB) into CASTLE_DATA/real/archive_drive4, with rsync --ignore-existing, running
  in the background. To be verified and recorded in FANTOM/INVENTORY when done.
- Local-preview additions from drive 4 (`portfolio_images13.py`): astrocyte Ca2+ rises (2014_07_17, Cal-520, caged
  IP3, shadowless TIRF at 100 Hz; the release is found as the steepest sustained rise after the shutter opening, since
  the flash leaves no step) and conventional vs shadowless TIRF of the same three cells. Both cite Ellefsen, Dynes &
  Parker 2015 PLOS ONE (DOI checked on Crossref). The astrocyte movie also appears in the Cells image database under
  glial cells.
