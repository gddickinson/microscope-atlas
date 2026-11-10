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
