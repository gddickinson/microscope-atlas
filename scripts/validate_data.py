"""Check every data file against docs/DATA_SCHEMA.md. Exit status 1 on any error.

Run: .venv/bin/python scripts/validate_data.py
"""
import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
KINDS = {"commercial", "research", "open-source", "historical"}
STATUS = {"current", "discontinued", "prototype", "museum"}
ID = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
PAGE_FIELDS = ["id", "tagline", "principle", "light_path", "resolution", "equations", "key_numbers", "strengths",
               "limitations", "best_for", "sample_prep", "tips", "pitfalls", "history", "papers", "related", "quiz"]


def check() -> list[str]:
    errors = []
    techs = {t["id"] for t in json.loads((DATA / "technique_index.json").read_text())}
    seen = {}
    for f in sorted((DATA / "systems").glob("*.json")):
        for i, s in enumerate(json.loads(f.read_text())):
            where = f"{f.name}[{i}] {s.get('id')}"
            for k in ("id", "name", "manufacturer", "techniques", "kind", "status", "summary", "sources", "checked"):
                if not s.get(k):
                    errors.append(f"{where}: missing {k}")
            if "year" not in s:
                errors.append(f"{where}: missing year (use null)")
            if s.get("id") and not ID.match(s["id"]):
                errors.append(f"{where}: id not kebab-case")
            if s.get("id") in seen:
                errors.append(f"{where}: duplicate id (also in {seen[s['id']]})")
            seen[s.get("id")] = f.name
            bad = [t for t in s.get("techniques", []) if t not in techs]
            if bad:
                errors.append(f"{where}: unknown techniques {bad}")
            if s.get("kind") not in KINDS:
                errors.append(f"{where}: bad kind {s.get('kind')}")
            if s.get("status") not in STATUS:
                errors.append(f"{where}: bad status {s.get('status')}")
            if not all(str(src.get("url", "")).startswith("http") for src in s.get("sources", [])):
                errors.append(f"{where}: source without http url")
            year = s.get("year")
            if year is not None and not (isinstance(year, int) and 1500 <= year <= 2027):
                errors.append(f"{where}: odd year {year}")
    for kind in ("detectors", "objectives"):
        for i, c in enumerate(json.loads((DATA / "components" / f"{kind}.json").read_text())):
            for k in ("id", "name", "manufacturer", "type", "summary", "sources"):
                if not c.get(k):
                    errors.append(f"{kind}[{i}]: missing {k}")
    pages = {}
    for f in sorted((DATA / "content" / "techniques").glob("*.json")):
        for p in json.loads(f.read_text()):
            pages[p["id"]] = p
            missing = [k for k in PAGE_FIELDS if k not in p]
            if missing:
                errors.append(f"page {p['id']}: missing {missing}")
            bad = [r for r in p.get("related", []) if r not in techs]
            if bad:
                errors.append(f"page {p['id']}: unknown related {bad}")
    for t in techs - set(pages):
        errors.append(f"technique {t} has no teaching page")
    return errors


def main():
    errors = check()
    for e in errors:
        print(e)
    n = sum(len(json.loads(f.read_text())) for f in (DATA / "systems").glob("*.json"))
    print(f"{n} systems checked; {len(errors)} problems")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
