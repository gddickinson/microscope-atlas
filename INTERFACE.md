# Microscope Atlas: navigation map

`run.py` starts the full app (FastAPI) on http://127.0.0.1:8010. `scripts/build_static.py` exports the static site
(`site/`, published to GitHub Pages by `.github/workflows/pages.yml`): same front end, API answered from exported
JSON by `static_api.js`; Python-only tools show a notice.

## atlas/ (Python backend)
| File | Purpose | Key names |
|---|---|---|
| `paths.py` | Data locations | `DATA`, `SYSTEMS`, `COMPONENTS`, `CONTENT`, `STATIC` |
| `jsonio.py` | Cached JSON loading (re-read when a file changes) | `load`, `load_lists` |
| `catalog.py` | Systems, components, technique index; search and facets | `systems`, `search`, `facets`, `get`, `manufacturers`, `components`, `techniques` |
| `content.py` | Technique pages merged with systems and sims; named content files; papers; portfolio images | `technique`, `overview`, `simulations`, `named`, `papers`, `portfolio_images` |
| `fluorophores.py` | FPbase fluorophore rows and spectra | `search`, `spectra` |
| `lab_files.py` | Microscopy file inspector (TIFF/OME-TIFF, ND2 if `nd2` installed): metadata, stats, PNG preview | `inspect_upload`, `inspect_bytes` |
| `web/app.py` | All routes under `/api`; mounts `/static`, `/portfolio` (published images) and `/portfolio-local` (git-ignored previews) | `app` |

## atlas/web/static/ (front end, plain ES modules, no build step)
| File | Purpose |
|---|---|
| `index.html`, `style.css`, `style_pages.css`, `icon.svg` | Shell, theme (fluorescence palette), page styles |
| `main.js` | Entry: imports page modules, background, search box, router start |
| `core.js` | `api` (server, or `static_api.js` when `window.ATLAS_STATIC`), hash `route`/`go`/`onLeave`, `esc`, `slider`, `waveColor`, blinking-molecule background |
| `static_api.js` | Static-site data layer: exported JSON files plus in-browser system and fluorophore search |
| `links.js` | `loadLinks`, `linkify`: technique names, glossary terms and external resources become links in teaching text |
| `home.js` | Home page, live counts, resolution ladder |
| `systems.js`, `systems_compare.js` | Systems browser with facets, system detail, manufacturers; comparison table and resolution chart (`picked` = compare list in localStorage) |
| `components.js` | Components tables (`#/components/<kind>`): detectors, objectives, light sources, filter sets |
| `techniques.js` | Technique index by family and the teaching page |
| `lightpath.js`, `lightpath_kit.js`, `lightpath_defs.js`, `lightpath_defs2.js`, `lightpath_steps.js` | SVG light-path engine (`P` primitives, `lightPath`, `miniPath`, `hasDiagram`); shared layouts (`epi`, `transmitted`, `scanner`, `psfInset`, axis `X`/`Y`); per-technique diagrams (`DEFS`, `FAMILY_DEFAULT`; part 2 `DEFS2` merged in): one for each of the 52 techniques; step-through (`partsOf`, `matchSteps`, `stepper`) links `light_path` steps to highlighted parts |
| `fluor.js` | Fluorophore table with Stokes plot; spectra viewer with lasers, bands and crosstalk tables |
| `sims.js` | Simulation index and `#/sim/<id>` router; merges the sim modules below |
| `sim_engine.js` | Pure physics (Airy, Bessel, TIRF depth, STED, localization precision, FRET, Soumpasis, random walks, MSD, FCS, electron λ, camera SNR, seeded RNG; FFT/`fft2`/`fftshift`, Zernike `aberratedPSF` + `marechal`, `gaussBlur`, `richardsonLucy`, FLIM `phasorOf`/`phasorFromDecay`/`phasorLifetimes`, `ctf`/`scherzer`, `missingWedge`/`wedgeElongation`, `abbeImage`, `dicImage`, `fcsTrace`/`autocorrelation`/`fcsConcentration`, `afmImage`/`tipShape`, `diskSectioning`, `expansionResolution`). Node-tested; near the 500-line budget, so new physics goes in split files re-exported at its end |
| `sim_engine_image.js` | Image-Lab physics re-exported by `sim_engine.js`: `toSquare`, `psfSigmaPx`, `blurPSF`, `binImage`, `cameraImage` (shot, background, read noise), `powerSpectrum`, `imageStats`, `pearson`, `rmsError` |
| `sim_ui.js` | Layout, sliders, segmented buttons, canvases, `heatmap`, `linePlot`, `animate` |
| `sim_optics.js` | psf, na, lens, nyquist, phase |
| `sim_section.js` | tirf, pinhole, twophoton, lightsheet |
| `sim_super.js` | sted, smlm, simk |
| `sim_dynamic.js` | jablonski, fret, noise, frap, spt, electron |
| `sim_imaging.js` | deconv (Richardson-Lucy), aberration (Zernike modes, Strehl, AO), phasor (FLIM) |
| `sim_tomo.js` | ctf (cryo-EM CTF and Thon rings), wedge (tomography missing wedge) |
| `sim_optics2.js` | kohler (Abbe imaging with a condenser aperture), dic (shear and bias), afm (tip convolution) |
| `sim_function.js` | fcs (simulated trace and autocorrelation), disk (spinning-disk crosstalk), expansion (expansion factor and linkage) |
| `learn.js` | Fundamentals, history (built from page histories + historical systems), glossary, My Microscopy (with image gallery), about |
| `quiz.js` | Quiz: generated multiple choice (diagrams, taglines, equations, key numbers, glossary, fluorophores), Leitner flashcards, browse |
| `papers.js` | Papers database page and the Community resources page |
| `table.js` (+ `table_engine.js`, `table_geom.js`, `table_optics.js`, `table_parts.js`, `table_analysis.js`, `table_presets*.js`, `table_draw.js`, `table_view.js`, `table_panels.js`, `table_store.js`, `style_table.css`) | Virtual optical table (`#/table`, `#/table/<preset>`, `#/table?l=<shared>`): pure 2D ray tracer `trace(layout)`, 43 part types with teaching notes, technique and supplier links, 33 presets (11 from papers, cited), readouts, undo, save/share |
| `table_specimens.js`, `table_imaging.js`, `table_imaging_optics.js`, `table_viewer.js`, `table_viewer_draw.js` | Sample imaging on the optical table: 11 seeded specimens (`makeSpecimen`), optics and illumination mode inferred from the traced layout (`inferOptics`), image formation with PSF, sectioning, pixel binning and camera noise (`imageFormation`), and the image viewer (zoom, LUTs, contrast, histogram, line profile, scale bar, ground truth, PNG export) |
| `videos.js` | Video tutorials page (`#/videos`) and `videoCard` used on technique pages |
| `images.js` | Wikimedia Commons images: `figure`/`credit`/`gallery` helpers, `imageIndex`, and the `#/gallery` page |
| `lab.js`, `lab_ui.js` | Lab Tools hub/router (`ALL`, `isStatic`) and form helpers (`num`, `select`, `text`, `row`, `panel`, `results`, `table`, `note`, `sources`, `fmt`). Tool contract: `TOOLS = [{id, group, title, blurb, mount, python?}]` |
| `lab_setup.js`, `lab_setup2.js` | Microscope setup and planning: kohler, camera-match, z-step, tirf-offset, power-density, immersion-reference, objective-finder, acquisition-planner, light-dose |
| `lab_label.js`, `lab_label2.js`, `lab_label_calc.js`, `lab_label_data.js` | Labelling and probes: panel-designer, fp-picker, antibody-dilution, secondary-planner, degree-of-labelling, labelling-reaction, protein-absorbance, tags-probes, fixation-guide (pure functions in `_calc`, sourced tables in `_data`) |
| `lab_bench.js`, `lab_bench2.js`, `lab_bench_calc.js`, `lab_bench_data.js` | Bench calculators: molarity, dilution, serial, units, percent, seeding, hemocytometer, centrifuge, recipes, photons |
| `lab_analysis.js`, `lab_analysis2.js`, `lab_analysis_calc.js` | Analysis: locprec, fretcalc, snr, frapfit, msdtrack, inspect (server-side, `POST /api/lab/inspect` in `atlas/lab_files.py`) |
| `sim_engine_photon.js` | Photon-budget physics re-exported by `sim_engine.js`: `crossSection`, `photonFlux`, `powerDensity`, `excitationRate`, `emissionRate` (saturation), `collectionEfficiency`, `specAt`, `bandFraction`, `centralPixelFraction` |
| `builder.js`, `builder_calc.js` | Microscope builder (`#/builder`): `parseObjective`, `parseCamera`, `immersionIndex` read numbers from database spec text; `report` computes resolution, sampling, field, photon budget, SNR |
| `sim_engine_loc.js` | Localization physics re-exported by `sim_engine.js`: `robustNoise` (median/MAD), `detectSpots`, `fitGaussian2D` (Levenberg-Marquardt), `localize`, `matchLocalizations` |
| `imagelab.js`, `imagelab_io.js`, `imagelab_spots.js` | Image Lab page (`#/imagelab`): object from a test specimen, a single-molecule frame with known positions, or the user's file; simulated camera image, Richardson-Lucy, spectra; spot localization panel (`spotPanel`); browser TIFF reader `decodeTiff` (+ `unpackBits`, `fromRGBA`, `fromImageFile`) |
| `tools.js` | Technique chooser (rule table `P` + `score`), optics calculator |

## data/
- `technique_index.json`: the 52 technique ids (the controlled vocabulary) and families.
- `systems/*.json`: microscope systems, one entry per line (schema in `docs/DATA_SCHEMA.md`).
- `components/detectors.json`, `objectives.json`, `light_sources.json`, `filters.json` (kinds listed in `catalog.COMPONENT_KINDS`).
- `content/techniques/*.json`: teaching pages; `content/simulations.json`; `content/fundamentals.json`, `glossary.json`, `portfolio.json` are generated from `scripts/content/*_src.py`.
- `fluorophores.json`, `spectra.json`: from FPbase via `scripts/fetch_fpbase.py`.
- `papers.json`: from `scripts/build_papers.py` (technique-page papers + `scripts/content/papers_src.py` + methods/protocol papers in `scripts/content/methods_src.py`, enriched by Crossref).
- `content/videos.json`: from `scripts/content/videos_src.py` (YouTube tutorials checked via oEmbed).
- `content/community.json`: from `scripts/content/community_src.py` (links checked by `scripts/check_links.py`).
- `images/`: freely licensed Wikimedia Commons images + manifest.json (author, licence, source) from `scripts/fetch_commons.py` and the curated list `scripts/content/images_src.py`.
- `portfolio/` (published images + manifest.json) and `portfolio_staging/` (git-ignored local previews).

## scripts/
`validate_data.py` (schema check, used by tests) · `build_static.py` (static export) · `build_papers.py` · `check_links.py [--systems]` (reports in docs/) · `fetch_commons.py` (images) · `fetch_fpbase.py` (fluorophores and spectra) · `content/build_content.py` (fundamentals, glossary, portfolio) · `screenshots.py` (Playwright + Chrome: README figures in `docs/img` and a smoke test of every route; needs the server running).

## tests/
`test_data.py` (validator, counts, every sim id has code) · `test_api.py` (routes) · `test_lab_files.py` (inspector endpoint) · `test_images.py` (licences, credits, ids, size) · `test_methods_videos.py` (methods coverage, video rows) · `table_engine.test.mjs` (ray-tracer physics and every preset) · `table_imaging.test.mjs` (PSF width, photon conservation, noise statistics, TIRF weighting, binning, modes per preset) · `test_imagelab.py` (TIFF reader, image ops and spot fits vs tifffile/numpy/scipy, via `imagelab_check.mjs`) · `sim_engine_photon.test.mjs` (cross-section, flux, saturation, collection, band fraction) · `builder.test.mjs` (spec parsing on the real database, report vs hand calculation) · `sim_engine_loc.test.mjs` (exact noise-free fits, precision vs Thompson, matching) · `sim_engine_image.test.mjs` (PSF σ, binning, Poisson and read noise, spectra, PackBits) · `lightpath.test.mjs` (every technique has a diagram that renders; step matching and coverage) · `test_js.py` runs every `tests/*.test.mjs` with node (sim engine incl. `sim_engine2/3.test.mjs` for Simulations II, lab setup, labelling, bench).

Flow: `web/app.py` → `catalog` / `content` / `fluorophores` → `jsonio` → `data/`. Front end: `main.js` → page modules → `core.api` → `/api/...`.
