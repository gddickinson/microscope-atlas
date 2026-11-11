"""R12 re-verification, step 3: record the outcome in the systems file and write docs/verify_<name>.md.

Each entry gets `verified`: "<date>: every stated number found in the sources (...)", or
"snippet-sourced: not found in the sources on <date>: field=value, ..." from verify_sources.py results (one or more
result files; later ones win, e.g. a re-run of the flagged entries), unless a hand-checked note is given in the
overrides JSON ({id: note}; notes starting with "snippet-sourced" are kept as they are, others get the date prefix).
Edits to values themselves are made by hand before this step.

Run:  .venv/bin/python scripts/apply_verification.py data/systems/X.json --results r1.json [r2.json] \
          [--overrides notes.json] --date 2026-11-10 --summary "one paragraph for the report"
"""
import argparse
import json
from pathlib import Path


def note_for(r: dict, date: str) -> str:
    readable = sum(f["ok"] for f in r["sources"])
    if not readable:
        errs = sorted({(f["error"] or "empty")[:40].strip() for f in r["sources"]})
        return f"snippet-sourced: no source could be read on {date} ({', '.join(errs)})"
    if r["missing"]:
        return f"snippet-sourced: not found in the sources on {date}: " + ", ".join(f"{f}={n}" for f, n in r["missing"])
    return f"{date}: every stated number found in the sources ({readable}/{len(r['sources'])} readable; PDFs read directly)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--results", nargs="+", required=True)
    ap.add_argument("--overrides")
    ap.add_argument("--date", required=True)
    ap.add_argument("--summary", default="")
    a = ap.parse_args()
    path = Path(a.file)
    entries = json.loads(path.read_text())
    res = {}
    for f in a.results:
        res.update({r["id"]: r for r in json.loads(Path(f).read_text())})
    over = json.loads(Path(a.overrides).read_text()) if a.overrides else {}
    for e in entries:
        if e["id"] in over:
            n = over[e["id"]]
            e["verified"] = n if n.startswith("snippet-sourced") else f"{a.date}: {n}"
            e["checked"] = a.date
        elif e["id"] in res:
            e["verified"] = note_for(res[e["id"]], a.date)
    path.write_text("[\n" + ",\n".join(json.dumps(x, ensure_ascii=False) for x in entries) + "\n]\n")
    ok = sum(1 for e in entries if e.get("verified", "")[:1].isdigit())  # any dated check
    sn = sum(1 for e in entries if e.get("verified", "").startswith("snippet"))
    name = path.stem
    lines = [f"# Re-verification: data/systems/{path.name} (R12)", "",
             f"Checked {a.date} with `scripts/verify_sources.py` (sources rendered in Chrome, PDFs read with pdftotext; every",
             "number an entry states looked for in its sources), flagged entries looked at by hand, results recorded with",
             "`scripts/apply_verification.py`.", "", f"{ok} of {len(entries)} entries verified; {sn} marked snippet-sourced, each listing the values its",
             "sources do not show.", ""] + ([a.summary, ""] if a.summary else []) + \
            ["| Entry | Result |", "|---|---|"] + \
            [f"| {e['name']} ({e['id']}) | {e.get('verified', 'not checked').replace('|', '/')} |" for e in entries]
    Path(f"docs/verify_{name}.md").write_text("\n".join(lines) + "\n")
    print(f"{path.name}: {ok} verified, {sn} snippet-sourced, {len(entries) - ok - sn} other; report docs/verify_{name}.md")


if __name__ == "__main__":
    main()
