# Re-verification: data/systems/superres.json (R12)

Checked 2026-11-10. Step 1: `scripts/verify_sources.py` rendered every source in Chrome and looked for every number each
entry states (year, resolution, specs). Step 2: entries with numbers not found, or unreadable sources, were re-read by
hand (tabs and collapsed specification panels opened as a visitor would; PDFs read directly; paper years checked on Crossref).

Corrections: DeltaVision OMX SR (100/300 nm removed: not in the sources, which say 2-fold), Leica STELLARIS 8 STED (STED lines
589/660/775 nm per Leica's current page; WLL range and axial value removed; empty Danaher source replaced), ONI Nanoimager
(spec PDF added; CO₂ is the optional incubator's; 20 nm XY added from the spec sheet), Bruker Vutara VXL (source pointed to
the product page whose Specifications panels hold every value), Abberior Facility Line (detector set depends on configuration).

| Entry | Result |
|---|---|
| N-SIM S (nikon-n-sim-s) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| N-SIM E (nikon-n-sim-e) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| Elyra 7 with Lattice SIM (zeiss-elyra-7) | 2026-11-10: every stated number found in the rendered sources (3/3 readable) |
| ELYRA PS.1 (zeiss-elyra-ps1) | 2026-11-10: every stated number found in the rendered sources (3/3 readable) |
| DeltaVision OMX SR (cytiva-deltavision-omx-sr) | 2026-11-10: specs and year re-read in the sources; resolution nm values not in them, removed |
| DeltaVision OMX Blaze (ge-deltavision-omx-blaze) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| DeepSIM (crestoptics-deepsim) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| VT-iSIM (visitech-vt-isim) | 2026-11-10: all numbers found; the Fred Hutch PDF read directly (Chrome cannot render it) |
| Live-SR (gataca-live-sr) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| STEDYCON (abberior-stedycon) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| FACILITY line (abberior-facility-line) | 2026-11-10: Emory specifications tab and Maryland panel re-read: all numbers found; detector set varies by configuration |
| INFINITY (abberior-infinity) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| MINFLUX (abberior-minflux) | 2026-11-10: every stated number found in the rendered sources (3/3 readable) |
| MIRAVA POLYSCOPE (abberior-mirava-polyscope) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| STELLARIS 8 STED (TauSTED) (leica-stellaris-8-sted) | 2026-11-10: Leica product page re-read: <30 nm, up to 5 Power HyD; STED lines now 589/660/775; WLL range and axial value not in the sources, removed |
| TCS STED (leica-tcs-sted) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| N-STORM (nikon-n-storm) | 2026-11-10: Nikon product page re-read; 'Discontinued' was only a menu link, the page still offers the system |
| Nanoimager (oni-nanoimager) | 2026-11-10: every spec found in ONI's technical specification PDF; CO₂ belongs to the stage-top incubator |
| Vutara VXL (bruker-vutara-vxl) | 2026-11-10: every spec found in the product page's Specifications panels |
| SAFe 360 (abbelight-safe-360) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| SR GSD 3D (leica-sr-gsd-3d) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| SRRF-Stream+ (andor-srrf-stream) | 2026-11-10: every stated number found in the rendered sources (2/2 readable) |
| 4x 3D-ExM Kit (dojindo-3d-exm-kit) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| STED microscopy proposal (hell-wichmann-sted-1994) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| STED demonstration in cells (hell-klar-sted-2000) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| RESOLFT with photoswitchable protein (hell-resolft-2005) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| MINFLUX (hell-minflux-2017) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| 3D multicolor MINFLUX (hell-minflux-3d-2020) | 2026-11-10: year confirmed on Crossref |
| MINSTED (hell-minsted-2021) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| PALM (betzig-palm-2006) | 2026-11-10: year confirmed on Crossref |
| STORM (zhuang-storm-2006) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| FPALM (hess-fpalm-2006) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| dSTORM (sauer-dstorm-2008) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| 3D STORM (zhuang-3d-storm-2008) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| iPALM (hess-ipalm-2009) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| DNA-PAINT (jungmann-dna-paint-2010) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| DNA-PAINT and Exchange-PAINT in cells (jungmann-exchange-paint-2014) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| RESI (jungmann-resi-2023) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| Structured illumination microscopy (gustafsson-sim-2000) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| Saturated SIM (gustafsson-ssim-2005) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| 3D-SIM (gustafsson-3d-sim-2008) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| 3D-SIM of the nucleus (schermelleh-3d-sim-2008) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| Instant SIM (iSIM) (shroff-isim-2013) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| Patterned-activation nonlinear SIM (betzig-nl-sim-2015) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| SOFI (enderlein-sofi-2009) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
| SRRF (NanoJ-SRRF) (henriques-srrf-2016) | 2026-11-10: every stated number found in the rendered sources (1/1 readable) |
| Expansion microscopy (boyden-expansion-2015) | 2026-11-10: year confirmed on Crossref; numbers found in the readable sources |
