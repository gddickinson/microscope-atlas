# Re-verification: data/systems/lightsheet_invivo.json (R12)

Checked 2026-11-11 with `scripts/verify_sources.py` (sources rendered in Chrome, PDFs read with pdftotext; every
number an entry states looked for in its sources), flagged entries looked at by hand, results recorded with
`scripts/apply_verification.py`.

35 of 50 entries verified; 15 marked snippet-sourced, each listing the values its
sources do not show.

Checker improvement this round: DOI sources are read from Crossref plus the open-access full text where Europe PMC has it (XML, or the PMC page for author manuscripts), which confirmed several research set-ups; the Mesolens entry gained its eLife DOI (the eLife web page is behind a captcha) and all 8 of its numbers were then found. No values changed. The remaining research entries have their years confirmed on Crossref, but their papers have no open full text (or state the numbers differently) and are marked snippet-sourced, as are maker figures not on the cited pages (UltraMicroscope Blaze objectives, Doric optogenetic lines, mesoSPIM installation count).

| Entry | Result |
|---|---|
| Lightsheet 7 (zeiss-lightsheet-7) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Lattice Lightsheet 7 (zeiss-lattice-lightsheet-7) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| MuVi SPIM (bruker-luxendo-muvi-spim) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| InVi SPIM Lattice Pro (bruker-luxendo-invi-spim-lattice-pro) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| TruLive3D Imager (bruker-luxendo-trulive3d-imager) | snippet-sourced: not found in the sources on 2026-11-11: specs.Optics=1 |
| LCS SPIM (bruker-luxendo-lcs-spim) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| UltraMicroscope Blaze (miltenyi-ultramicroscope-blaze) | snippet-sourced: not found in the sources on 2026-11-11: specs.Objectives=1.1, specs.Objectives=0.1, specs.Objectives=4, specs.Objectives=0.35, specs.Objectives=12, specs.Objectives=0.53, specs.Total magnification=0.66, specs.Total magnification=0.66, specs.Total magnification=2.75, specs.Total magnification=2.4, specs.Total magnification=10, specs.Total magnification=7.2, specs.Light sheets=1, specs.Light sheets=6, specs.Camera=4.2, specs.Camera=2048, specs.Camera=2048, specs.Camera=6.5, specs.Lasers (one installation)=405, specs.Lasers (one installation)=488, specs.Lasers (one installation)=561, specs.Lasers (one installation)=640, specs.Lasers (one installation)=785 |
| UltraMicroscope II (lavision-ultramicroscope-ii) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| TCS SP8 DLS (leica-tcs-sp8-dls) | snippet-sourced: not found in the sources on 2026-11-11: specs.Design=90 |
| Viventis LS2 Live (leica-viventis-ls2-live) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Viventis Deep (leica-viventis-deep) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Lattice LightSheet (3i-lattice-lightsheet) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| diSPIM / iSPIM (asi-dispim) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| SmartSPIM (lifecanvas-smartspim) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Aurora 3D (3Di) (alpenglow-aurora-3di) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Multiphoton Mesoscope (thorlabs-multiphoton-mesoscope) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| nVista (inscopix-nvista) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| nVoke (inscopix-nvoke) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| nVista 2P (inscopix-nvista-2p) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Fluorescence miniscopes (Snap-in and Twist-on) (doric-fluorescence-miniscopes) | snippet-sourced: not found in the sources on 2026-11-11: specs.Electronic focus=300, specs.Optogenetic light=55, specs.Optogenetic light=580, specs.Optogenetic light=640 |
| NeuraLight 3D Ultra (bruker-neuralight-3d-ultra) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Mesolens (strathclyde-mesolens) | 2026-11-11: every stated number found in the sources (1/2 readable; PDFs read directly) |
| Slit ultramicroscope (siedentopf-zsigmondy-ultramicroscope) | snippet-sourced: not found in the sources on 2026-11-11: specs.Illumination=90 |
| OPFOS (voie-opfos-1993) | snippet-sourced: not found in the sources on 2026-11-11: resolution.z_nm=26000 |
| SPIM (stelzer-spim-2004) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| DSLM (stelzer-keller-dslm-2008) | snippet-sourced: not found in the sources on 2026-11-11: specs.Throughput=1.5 |
| MuVi-SPIM (hufnagel-muvi-spim-2012) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| SiMView (keller-simview-2012) | snippet-sourced: not found in the sources on 2026-11-11: specs.Acquisition=175, specs.Temporal resolution=30 |
| Whole-brain light-sheet calcium imaging (ahrens-keller-whole-brain-2013) | snippet-sourced: not found in the sources on 2026-11-11: specs.Volume rate=0.8 |
| IsoView (keller-isoview-2015) | snippet-sourced: not found in the sources on 2026-11-11: specs.Resolution=1.1, specs.Resolution=2.5, specs.Volume rate=2 |
| Bessel beam plane illumination (betzig-bessel-plane-illumination-2011) | snippet-sourced: not found in the sources on 2026-11-11: resolution.xy_nm=300, resolution.z_nm=300, specs.Speed=200 |
| Lattice light-sheet microscope (betzig-lattice-light-sheet-2014) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Adaptive-optical lattice light-sheet microscope (AO-LLSM) (betzig-ao-llsm-2018) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Guide-star adaptive optics (betzig-ao-guide-star-2014) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Pupil-segmentation adaptive optics (ji-betzig-pupil-segmentation-ao-2010) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Oblique plane microscope (OPM) (dunsby-opm-2008) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| SCAPE (hillman-scape-2015) | snippet-sourced: not found in the sources on 2026-11-11: specs.Speed=20 |
| SCAPE 2.0 (hillman-scape-2-2019) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| diSPIM (shroff-dispim-2013) | snippet-sourced: not found in the sources on 2026-11-11: resolution.xy_nm=330, resolution.z_nm=330, specs.Speed=200, specs.Speed=0.5, specs.Speed=50 |
| Ultramicroscope for cleared brains (dodt-ultramicroscopy-2007) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Open-top light-sheet microscope (OTLS) (liu-open-top-light-sheet-2017) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| ctASLM (fiolka-ctaslm-2019) | snippet-sourced: not found in the sources on 2026-11-11: resolution.z_nm=260 |
| mesoSPIM (mesospim-initiative) | snippet-sourced: not found in the sources on 2026-11-11: specs.Installations=35 |
| OpenSPIM (openspim) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| UCLA Miniscope V4 (ucla-miniscope-v4) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Integrated miniature fluorescence microscope (schnitzer-integrated-miniscope-2011) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| MINI2P (moser-mini2p-2022) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Light-field microscope for neural activity (vaziri-light-field-2014) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
| Two-photon random access mesoscope (2p-RAM) (svoboda-2p-ram-2016) | 2026-11-11: every stated number found in the sources (2/2 readable; PDFs read directly) |
| Diesel2p (smith-diesel2p-2021) | 2026-11-11: every stated number found in the sources (1/1 readable; PDFs read directly) |
