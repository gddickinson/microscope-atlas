# Data schema

All database content is JSON under `data/`. `scripts/validate_data.py` checks every file against
these rules, and `tests/test_data.py` runs it.

## Rule: sourced, not remembered
Every system entry must carry at least one `sources` URL that supports its key facts (manufacturer page,
datasheet, paper, or a reputable review). Specs that could not be confirmed from a source are left out,
not guessed. `checked` is the date the sources were read.

## `data/systems/<file>.json`: microscope systems
A JSON list of objects:

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | kebab-case, unique across all files, e.g. `zeiss-lsm-980` |
| `name` | string | yes | model name without manufacturer, e.g. `LSM 980` |
| `manufacturer` | string | yes | company, lab or project, e.g. `ZEISS`, `Betzig lab (HHMI Janelia)`, `OpenFlexure` |
| `techniques` | list of strings | yes | ids from `data/technique_index.json`; first is the primary one |
| `kind` | string | yes | `commercial`, `research` (one-off/landmark lab instrument), `open-source`, or `historical` |
| `year` | int or null | yes | year introduced or published |
| `status` | string | yes | `current`, `discontinued`, `prototype`, or `museum` |
| `resolution` | object | no | `{"xy_nm": number, "z_nm": number, "note": "conditions"}`; only sourced numbers |
| `specs` | object | no | short string values, e.g. `{"Detectors": "...", "Lasers": "...", "Speed": "..."}` |
| `summary` | string | yes | 1-3 sentences: what it is and what is distinctive |
| `applications` | list of strings | no | typical uses |
| `sources` | list of `{"url","title"}` | yes | at least one |
| `checked` | string | yes | ISO date the sources were read |

## `data/components/detectors.json`, `objectives.json`
Same pattern: `id`, `name`, `manufacturer`, `type`, `year`, `specs` (object), `summary`, `sources`, `checked`.

## `data/fluorophores.json`
Built by `scripts/fetch_fpbase.py` from the FPbase API plus a sourced list of synthetic dyes.

## `data/content/techniques/<family>.json`: teaching pages
A JSON list, one object per technique id in `data/technique_index.json`:

| Field | Type | Notes |
|---|---|---|
| `id` | string | technique id |
| `tagline` | string | one sentence |
| `principle` | list of strings | 3-6 paragraphs explaining the physics for a scientist; plain text, no markdown |
| `light_path` | list of strings | ordered walk-through of the light (or electron/probe) path, one step per item |
| `resolution` | object | `{"xy": "~180-250 nm", "z": "~500-800 nm", "why": "what limits it"}` |
| `equations` | list | `{"name", "formula", "meaning"}`; formula in plain Unicode, e.g. `d = 0.61 λ / NA` |
| `key_numbers` | list | `{"label", "value"}` typical numbers worth remembering |
| `strengths`, `limitations` | lists of strings | |
| `best_for` | list of strings | biological questions it answers well |
| `sample_prep` | string | labels, mounting, fixation, clearing etc. |
| `tips` | list of strings | practical bench advice for getting good data |
| `pitfalls` | list of strings | common artefacts and how to recognise them |
| `history` | list | `{"year": int, "event": "..."}` |
| `papers` | list | `{"cite": "Authors (year) Journal vol:pages", "doi": "10....", "note": "why it matters"}`; DOI only if verified |
| `related` | list of technique ids | |
| `quiz` | list | `{"q": "...", "a": "..."}` 3-5 self-test questions with concise model answers |
