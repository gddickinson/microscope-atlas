# Re-verification: data/systems/electron_probe.json (R12)

Checked 2026-11-10 with `scripts/verify_sources.py` (sources rendered in Chrome, PDFs read with pdftotext; every
number an entry states looked for in its sources), flagged entries looked at by hand, results recorded with
`scripts/apply_verification.py`.

50 of 50 entries verified; 0 marked snippet-sourced, each listing the values its
sources do not show.

Checker improvements this round: numbers with thousands separators kept whole (1,200,000), resolution values matched in Å, pm or µm as well as nm, and doi.org sources (often behind captchas) read from Crossref. Corrections: Talos F200C voltage (200 kV, as stated), HT7800 0.2 nm, GeminiSEM frame store and Crossbeam laser option removed (not in the sources); Micheva & Smith full text added.

| Entry | Result |
|---|---|
| Krios 5 Cryo-TEM (thermo-krios-5) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Glacios 3 Cryo-TEM (thermo-glacios-3) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Tundra Cryo-TEM (thermo-tundra) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Talos L120C (thermo-talos-l120c) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Talos F200C (thermo-talos-f200c) | 2026-11-10: Thermo Fisher page states 200 kV operation; the 20-200 kV range was not in the source and was replaced |
| Spectra Ultra (thermo-spectra-ultra) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Aquilos 2 Cryo-FIB (thermo-aquilos-2) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Arctis Cryo-PFIB (thermo-arctis) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Hydra Bio Plasma-FIB (thermo-hydra-bio) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Helios 5 DualBeam (thermo-helios-5) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Apreo 2 SEM (thermo-apreo-2) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Volumescope 2 SEM (thermo-volumescope-2) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| CRYO ARM 300 II (JEM-3300) (jeol-cryo-arm-300-ii) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| JEM-1400Flash (jeol-jem-1400flash) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| JEM-ARM300F2 (GRAND ARM 2) (jeol-jem-arm300f2) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| JSM-IT800 (jeol-jsm-it800) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| HT7800 (hitachi-ht7800) | 2026-11-10: specs found on the Hitachi page; the 0.2 nm lattice resolution is not there and was removed |
| SU8200 series (SU8220/SU8230/SU8240) (hitachi-su8200) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| GeminiSEM 360 / 460 / 560 (zeiss-geminisem) | 2026-11-10: specs found on the ZEISS page; the 32k x 24k frame store is not there and was removed |
| Crossbeam 350 / 550 / 750 (zeiss-crossbeam) | 2026-11-10: specs found on the ZEISS page; the femtosecond-laser milling option is no longer mentioned there and was removed |
| MultiSEM 706 (zeiss-multisem-706) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Xradia 620 Versa (zeiss-xradia-620-versa) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Xradia 800 Ultra / 810 Ultra (zeiss-xradia-ultra) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| 3View (gatan-3view) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Serial block-face SEM prototype (denk-horstmann-sbfsem-2004) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Enhanced FIB-SEM (janelia-enhanced-fib-sem) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Array tomography (micheva-smith-array-tomography-2007) | 2026-11-10: year on Crossref; 50-200 nm ultrathin sections confirmed in the paper's full text (PMC source added) |
| AMBER X 2 (tescan-amber-x-2) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Dimension Icon (bruker-dimension-icon) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| NanoWizard V BioScience (bruker-jpk-nanowizard-v) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| NanoWizard ULTRA Speed 3 (bruker-jpk-nanowizard-ultra-speed-3) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Cypher S (oxford-instruments-asylum-cypher-s) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Cypher VRS1250 (oxford-instruments-asylum-cypher-vrs1250) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| NX10 (park-systems-nx10) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| SS-NEX (Ando model) (ribm-ss-nex-ando-model) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| High-speed AFM for biomolecules (ando-kanazawa-hs-afm) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| SkyScan 1276 CMOS Edition (bruker-skyscan-1276) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| SkyScan 2214 CMOS Edition (bruker-skyscan-2214) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| SXT-100 (siriusxt-sxt-100) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| METEOR 2.0 (delmic-meteor) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| THUNDER Imager EM Cryo CLEM (leica-thunder-imager-em-cryo-clem) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| EM Cryo CLEM (leica-em-cryo-clem) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| First electron microscope (knoll-ruska-tem-1931) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| Stereoscan Mk1 (cambridge-stereoscan-1965) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Scanning tunneling microscope (ibm-binnig-rohrer-stm-1981) | 2026-11-10: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Atomic force microscope (binnig-quate-gerber-afm-1986) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Vitrified-specimen cryo-EM (embl-dubochet-vitrification) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
| Bacteriorhodopsin structure by electron cryo-microscopy (mrc-lmb-henderson-bacteriorhodopsin-1990) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Single-particle image processing (frank-single-particle-cryo-em) | 2026-11-10: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Elmiskop I (siemens-elmiskop-1) | 2026-11-10: every stated number found in the sources (3/3 readable; PDFs read directly) |
