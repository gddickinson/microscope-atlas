# Microscope Atlas

Web app for learning microscopy and for everyday lab work: technique pages with light-path diagrams,
interactive physics simulations, lab tools, a quiz, and sourced databases of microscope systems, components,
fluorophores and papers. PUBLIC repo (gddickinson/microscope-atlas) with a static export on GitHub Pages:
never commit private or unpublished material.

@INTERFACE.md

Resume by reading the tail of SESSION_LOG.md, then ROADMAP.md: pick the row marked `in_progress`, else the
topmost `pending` one.

- Run: `.venv/bin/python run.py`, then open http://127.0.0.1:8010
- Test: `.venv/bin/python -m pytest -q tests/` (includes node tests of `sim_engine.js`).
  Check pytest's own exit status before committing (never trust a status piped through `tail`).
- Smoke test and README figures: with the server up, `.venv/bin/python scripts/screenshots.py`.
- Keep every file under 500 lines. Data JSON is one entry per line. Update INTERFACE.md and SESSION_LOG.md when
  structure changes. Commit and push at the end of each round.

## Data rules
- Every system entry needs a source URL that supports it; omit specs that cannot be sourced. Never type specs from memory.
- Paper citations need a DOI checked against Crossref (`https://api.crossref.org/works/<doi>`), or no DOI at all.
- `scripts/validate_data.py` must pass. Technique ids come only from `data/technique_index.json`.
- George's work (My Microscopy page, project pages, captions, README) is described as GROUP effort: say what the
  team/study did, never split credit between individuals ("X did the imaging, Y wrote the code"). Exception: CellScope,
  which George wrote with Claude Code. Images from published work only; ask George before adding claims.
- Physics in simulations goes in `sim_engine.js` with a node test against a known value.
