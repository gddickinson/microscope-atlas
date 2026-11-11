# Re-verification: data/systems/labelfree_open_historical.json (R12)

Checked 2026-11-11 with `scripts/verify_sources.py` (sources rendered in Chrome, PDFs read with pdftotext; every
number an entry states looked for in its sources), flagged entries looked at by hand, results recorded with
`scripts/apply_verification.py`.

43 of 51 entries verified; 8 marked snippet-sourced, each listing the values its
sources do not show.

No values changed this round. Readable sources that no longer show a value (WITec alpha300 page, PicoQuant product pages, Thorlabs and PicoQuant PDF links that now return web pages, STELLARIS 8 CRS laser range, MSOT inVision geometry, TwoMP mass resolution) are marked snippet-sourced with the values listed, to be re-read against maker datasheets after R12. Entries whose only failing source was a captcha page had every number found in their other sources.

| Entry | Result |
|---|---|
| alpha300 R (witec-alpha300-r) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| witec360 (oxford-instruments-witec360) | snippet-sourced: not found in the sources on 2026-11-11: resolution.z_nm=950, specs.Lasers=6, specs.Lasers=266, specs.Lasers=1064, specs.Spectral resolution=0.1, specs.Spectral resolution=1, specs.Spectral resolution=633, specs.Speed=1 |
| inVia Qontor (renishaw-invia-qontor) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| LabRAM Odyssey (horiba-labram-odyssey) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| STELLARIS 8 CRS (leica-stellaris-8-crs) | snippet-sourced: not found in the sources on 2026-11-11: specs.Laser=720, specs.Laser=980 |
| TCS SP8 CARS (leica-tcs-sp8-cars) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Third-harmonic generation scanning microscope (silberberg-lab-thg-microscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| MSOT inVision (ithera-medical-msot-invision) | snippet-sourced: not found in the sources on 2026-11-11: specs.Geometry=360, specs.Geometry=270 |
| Vevo LAZR-X (fujifilm-visualsonics-vevo-lazr-x) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| Ganymede series SD-OCT (thorlabs-ganymede) | snippet-sourced: no source could be read on 2026-11-11 (__ERROR__ not a PDF) |
| Telesto series SD-OCT (thorlabs-telesto) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| TwoMP (refeyn-twomp) | snippet-sourced: not found in the sources on 2026-11-11: specs.Mass resolution=25, specs.Mass resolution=66, specs.Mass resolution=60, specs.Mass resolution=660 |
| OneMP (refeyn-onemp) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Interferometric scattering mass spectrometry (iSCAMS) (kukura-lab-iscat-mass-imaging) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| DHM T-series (lyncee-tec-dhm-t-series) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| STELLARIS 8 FALCON (leica-stellaris-8-falcon) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| MicroTime 200 (picoquant-microtime-200) | snippet-sourced: not found in the sources on 2026-11-11: specs.Lasers=375, specs.Detectors=6 |
| Luminosa (picoquant-luminosa) | snippet-sourced: not found in the sources on 2026-11-11: specs.Lasers=375, specs.Lasers=1064 |
| DCS-120 (becker-hickl-dcs-120) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Alba v5 (iss-alba-v5) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| LSM 510 META (zeiss-lsm-510-meta) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| A1 with spectral detector (nikon-a1-spectral-detector) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| LC-PolScope (mbl-lc-polscope) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| Abrio (cri-abrio) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| OpenPolScope (mbl-openpolscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| OpenFlexure Microscope (openflexure-microscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| UC2 (You. See. Too.) (uc2-modular-microscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Foldscope (prakash-lab-foldscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Octopi (prakash-lab-octopi) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| miCube (hohlbein-lab-micube) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| liteTIRF (jungmann-lab-litetirf) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| K2 TIRF (ganzinger-lab-k2-tirf) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| miEye (tutkus-lab-mieye) | snippet-sourced: year 2022 and <30 nm confirmed (Euro-BioImaging page; HardwareX DOI 10.1016/j.ohx.2022.e00368 on Crossref); licence CC BY-NC-SA 4.0 not confirmed (PyPI page behind a captcha on 2026-11-11) |
| Flamingo (huisken-lab-flamingo) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| PUMA (tadrous-puma) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| openFrame (imperial-cairn-openframe) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| FlyPi (baden-lab-flypi) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| ImSwitch (testa-lab-imswitch) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Hybrid open-top light-sheet microscope (liu-lab-hybrid-open-top-light-sheet) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Compound microscope (janssen-compound-microscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Hooke's compound microscope (hooke-micrographia-microscope) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| Single-lens microscope (van-leeuwenhoek-single-lens-microscope) | 2026-11-11: every stated number found in the sources (2/3 readable; PDFs read directly) |
| Culpeper-type compound microscope (culpeper-type-compound-microscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Achromatic microscope (lister-tulley-achromatic-microscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Abbe illumination apparatus with condenser (zeiss-abbe-condenser) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Apochromatic objective (zeiss-abbe-apochromat) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Kohler illumination (zeiss-kohler-illumination) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| First fluorescence microscopes (reichert-zeiss-first-fluorescence-microscope) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| Phase contrast microscope (zeiss-zernike-phase-contrast-microscope) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| Differential interference contrast (DIC) (nomarski-dic-microscope) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| PLOEMOPAK epi-fluorescence illuminator (leitz-ploemopak) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
