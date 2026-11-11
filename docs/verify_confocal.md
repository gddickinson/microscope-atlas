# Re-verification: data/systems/confocal.json (R12)

Checked 2026-11-11 with `scripts/verify_sources.py` (sources rendered in Chrome, PDFs read with pdftotext; every
number an entry states looked for in its sources), flagged entries looked at by hand, results recorded with
`scripts/apply_verification.py`.

44 of 48 entries verified; 4 marked snippet-sourced, each listing the values its
sources do not show.

R24 second pass (2026-11-11): new sources added (ZEISS LSM 900 brochure, R&D World on the LSM 5 LIVE, launch news for STELLARIS 5, FV5000MPE and BC43, the X-Light V3 brochure, the TCS SP5 product sheet, an archived Bergamo II brochure and HyperScope news, a facility page for the TCS SP2 AOBS); the checker now reads PDF links whose names contain spaces or accents. One correction: TCS SP5's 2800 Hz conventional scanner rate belongs to the later SP5 II, so the entry now quotes the SP5 product sheet (resonant scanner, 16,000 lines per second). Four entries remain snippet-sourced, each listing the value no readable source shows.

| Entry | Result |
|---|---|
| LSM 980 with Airyscan 2 (zeiss-lsm-980) | 2026-11-10: specs found in the ZEISS flyer (PDF) and facility pages; 2018 year and 350 nm axial value not in the sources, removed |
| LSM 990 (zeiss-lsm-990) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 900 with Airyscan 2 (zeiss-lsm-900) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 910 (zeiss-lsm-910) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 880 with Airyscan (zeiss-lsm-880) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| LSM 7 MP (zeiss-lsm-7-mp) | 2026-11-10: every number found in the sources; the end-of-support date was confirmed on the rendered ZEISS page in the statuses pass |
| LSM 510 (and LSM 510 META) (zeiss-lsm-510) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| LSM 5 LIVE (zeiss-lsm-5-live) | 2026-11-11: every stated number found in the sources (3/4 readable; PDFs read directly) |
| Cell Observer SD (zeiss-cell-observer-sd) | snippet-sourced: not found in the sources on 2026-11-11: Status note=2021, 2023 (the ZEISS discontinued-products list does not render these rows for a script; scan-unit speeds now found in the brochure PDF) |
| STELLARIS 8 (leica-stellaris-8) | 2026-11-11: every stated number found: 440-790 nm and 850 nm on Leica's specification page ("sensitive spectral detection from 410 to 850 nm"), 405 nm there too, 78 MHz on the NUS facility page |
| STELLARIS 5 (leica-stellaris-5) | snippet-sourced: not found in the sources on 2026-11-11: Lasers=638 nm (year 2020 now sourced from the April 2020 launch news) |
| STELLARIS 8 DIVE (leica-stellaris-8-dive) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| TCS SP8 (leica-tcs-sp8) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| SP8 DIVE (leica-sp8-dive) | 2026-11-11: every stated number found in the sources (4/4 readable; PDFs read directly) |
| TCS SP5 (leica-tcs-sp5) | 2026-11-11: every stated number found in the sources (2/4 readable; PDFs read directly) |
| TCS SP (leica-tcs-sp) | snippet-sourced: not found in the sources on 2026-11-11: Detection=400-750 nm (a Microscopy and Microanalysis article states it but could not be read) |
| TCS SP2 AOBS (leica-tcs-sp2-aobs) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| AX (nikon-ax) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| AX R (nikon-ax-r) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| NSPARC (nikon-nsparc) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| AX R MP (nikon-ax-r-mp) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| A1R (nikon-a1r) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| A1R MP (nikon-a1r-mp) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| FLUOVIEW FV5000 (evident-fv5000) | 2026-11-10: every stated number found in the sources (2/3 readable; PDFs read directly) |
| FLUOVIEW FV5000MPE (evident-fv5000mpe) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| FLUOVIEW FV4000 (evident-fv4000) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| FLUOVIEW FV4000MPE (evident-fv4000mpe) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| FLUOVIEW FV3000 (olympus-fv3000) | 2026-11-10: every stated number found in the sources (5/5 readable; PDFs read directly) |
| FLUOVIEW FVMPE-RS (olympus-fvmpe-rs) | 2026-11-10: every number found in the sources (the flagged '5000' is the model name FV5000MPE in the status note) |
| FLUOVIEW FV1000 (olympus-fv1000) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Dragonfly (andor-dragonfly) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| BC43 (andor-bc43) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| CSU-W1 (yokogawa-csu-w1) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| CSU-W1 SoRa (yokogawa-csu-w1-sora) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| CSU-X1 (yokogawa-csu-x1) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| X-Light V3 (crestoptics-x-light-v3) | 2026-11-11: every stated number found: 230 and 600 nm in the X-Light V3 brochure, disk speed written there as 15.000 rpm (European thousands point) |
| CICERO (crestoptics-cicero) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Marianas spinning-disk confocal (3i-marianas-sdc) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Ultima 2Pplus (bruker-ultima-2pplus) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Ultima Investigator (bruker-ultima-investigator) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Bergamo II (thorlabs-bergamo) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| HyperScope (scientifica-hyperscope) | 2026-11-11: every stated number found in the sources (3/3 readable; PDFs read directly) |
| MOM (Movable Objective Microscope) (sutter-mom) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| MRC-500 (bio-rad-mrc-500) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Radiance 2100 (bio-rad-radiance-2100) | snippet-sourced: not found in the sources on 2026-11-11: Example lasers=458 nm (the UCL facility page refuses the scripted browser) |
| Confocal scanning microscope prototype (minsky-confocal-1957) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Tandem-scanning reflected-light microscope (petran-tandem-scanning-1968) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Two-photon laser scanning fluorescence microscope (denk-two-photon-1990) | 2026-11-10: year confirmed on Crossref (Science 248:73, 1990) |
