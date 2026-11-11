# Re-verification: data/systems/confocal.json (R12)

Checked 2026-11-10 with `scripts/verify_sources.py` (sources rendered in Chrome; PDF sources now downloaded and read with
pdftotext), then the flagged entries looked at by hand. Statuses were checked earlier in a real browser (round 14).

32 of 48 entries verified; 16 marked snippet-sourced, each listing the values its sources do not show.
Corrections: ZEISS LSM 980 (launch year 2018 and 350 nm axial value not in the sources, removed). Denk 1990's year
checked on Crossref. Snippet-sourced values are kept for now and are the next things to re-read against maker datasheets.

| Entry | Result |
|---|---|
| LSM 980 with Airyscan 2 (zeiss-lsm-980) | 2026-11-10: specs found in the ZEISS flyer (PDF) and facility pages; 2018 year and 350 nm axial value not in the sources, removed |
| LSM 990 (zeiss-lsm-990) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 900 with Airyscan 2 (zeiss-lsm-900) | snippet-sourced: not found in the sources on 2026-11-10: resolution.xy_nm=150, specs.Detectors=32, specs.Lasers=405, specs.Lasers=488, specs.Lasers=561, specs.Lasers=639, specs.Detection range=405, specs.Detection range=750 |
| LSM 910 (zeiss-lsm-910) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 880 with Airyscan (zeiss-lsm-880) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 7 MP (zeiss-lsm-7-mp) | 2026-11-10: every number found in the sources; the end-of-support date was confirmed on the rendered ZEISS page in the statuses pass |
| LSM 510 (and LSM 510 META) (zeiss-lsm-510) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| LSM 5 LIVE (zeiss-lsm-5-live) | snippet-sourced: not found in the sources on 2026-11-10: specs.Speed=505, specs.Speed=1010, specs.Speed=100, specs.Speed=50 |
| Cell Observer SD (zeiss-cell-observer-sd) | snippet-sourced: not found in the sources on 2026-11-10: specs.Scan unit=1800, specs.Scan unit=5000, specs.Status note=2021, specs.Status note=2023 |
| STELLARIS 8 (leica-stellaris-8) | snippet-sourced: not found in the sources on 2026-11-10: specs.Laser=440, specs.Laser=790, specs.Laser=78, specs.Laser=405, specs.Detection range=850 |
| STELLARIS 5 (leica-stellaris-5) | snippet-sourced: not found in the sources on 2026-11-10: year=2020, specs.Lasers=638 |
| STELLARIS 8 DIVE (leica-stellaris-8-dive) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| TCS SP8 (leica-tcs-sp8) | snippet-sourced: not found in the sources on 2026-11-10: specs.Detectors=4, specs.Detectors=1 |
| SP8 DIVE (leica-sp8-dive) | snippet-sourced: not found in the sources on 2026-11-10: specs.NDD=380 |
| TCS SP5 (leica-tcs-sp5) | snippet-sourced: not found in the sources on 2026-11-10: year=2006, specs.Scanners=2800, specs.Resonant frame rate=25, specs.Resonant frame rate=512, specs.Resonant frame rate=512, specs.Resonant frame rate=2006, specs.Resonant field=15 |
| TCS SP (leica-tcs-sp) | snippet-sourced: not found in the sources on 2026-11-10: specs.Detection=400, specs.Detection=750 |
| TCS SP2 AOBS (leica-tcs-sp2-aobs) | snippet-sourced: no source could be read on 2026-11-10 (empty) |
| AX (nikon-ax) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| AX R (nikon-ax-r) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| NSPARC (nikon-nsparc) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| AX R MP (nikon-ax-r-mp) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| A1R (nikon-a1r) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| A1R MP (nikon-a1r-mp) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| FLUOVIEW FV5000 (evident-fv5000) | 2026-11-10: every stated number found in the sources (2/3 readable; PDFs read directly) |
| FLUOVIEW FV5000MPE (evident-fv5000mpe) | snippet-sourced: not found in the sources on 2026-11-10: year=2025 |
| FLUOVIEW FV4000 (evident-fv4000) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| FLUOVIEW FV4000MPE (evident-fv4000mpe) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| FLUOVIEW FV3000 (olympus-fv3000) | 2026-11-10: every stated number found in the sources (5/5 readable; PDFs read directly) |
| FLUOVIEW FVMPE-RS (olympus-fvmpe-rs) | 2026-11-10: every number found in the sources (the flagged '5000' is the model name FV5000MPE in the status note) |
| FLUOVIEW FV1000 (olympus-fv1000) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Dragonfly (andor-dragonfly) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| BC43 (andor-bc43) | snippet-sourced: not found in the sources on 2026-11-10: year=2021 |
| CSU-W1 (yokogawa-csu-w1) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| CSU-W1 SoRa (yokogawa-csu-w1-sora) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| CSU-X1 (yokogawa-csu-x1) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| X-Light V3 (crestoptics-x-light-v3) | snippet-sourced: not found in the sources on 2026-11-10: resolution.xy_nm=230, resolution.z_nm=600, specs.Disk speed=15000 |
| CICERO (crestoptics-cicero) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Marianas spinning-disk confocal (3i-marianas-sdc) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Ultima 2Pplus (bruker-ultima-2pplus) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Ultima Investigator (bruker-ultima-investigator) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Bergamo II (thorlabs-bergamo) | snippet-sourced: no source could be read on 2026-11-10 (__ERROR__ not a PDF) |
| HyperScope (scientifica-hyperscope) | snippet-sourced: not found in the sources on 2026-11-10: specs.Wavelength=700, specs.Wavelength=1400 |
| MOM (Movable Objective Microscope) (sutter-mom) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| MRC-500 (bio-rad-mrc-500) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Radiance 2100 (bio-rad-radiance-2100) | snippet-sourced: not found in the sources on 2026-11-10: specs.Example lasers=458 |
| Confocal scanning microscope prototype (minsky-confocal-1957) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Tandem-scanning reflected-light microscope (petran-tandem-scanning-1968) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Two-photon laser scanning fluorescence microscope (denk-two-photon-1990) | 2026-11-10: year confirmed on Crossref (Science 248:73, 1990) |
