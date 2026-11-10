"""Build data/papers.json: every paper cited on technique pages plus the curated list in content/papers_src.py,
enriched from Crossref (title, authors, journal, year, citation count). Methods papers from content/methods_src.py
get category "Methods" and their technique ids. Curated rows whose first author does not match Crossref are dropped
and reported.

Run: .venv/bin/python scripts/build_papers.py
"""
import json
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "content"))
from papers_src import PAPERS  # noqa: E402
from methods_src import METHODS  # noqa: E402

UA = {"User-Agent": "microscope-atlas/0.2 (educational; https://github.com/gddickinson/microscope-atlas)"}


def crossref(doi: str) -> dict | None:
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.loads(r.read())["message"]
        except Exception as e:  # noqa: BLE001
            if "404" in str(e):
                return None
            time.sleep(2 * (attempt + 1))
    return None


def fold(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s.lower()) if not unicodedata.combining(c))


def record(doi: str, msg: dict) -> dict:
    authors = msg.get("author", [])
    names = [f"{a.get('family', '')} {''.join(p[0] for p in a.get('given', '').replace('-', ' ').split())}".strip() for a in authors]
    year = (msg.get("issued", {}).get("date-parts") or [[None]])[0][0]
    return {"doi": doi.lower(), "title": (msg.get("title") or [""])[0], "authors": names[:3] + (["et al."] if len(names) > 3 else []),
            "first": authors[0].get("family", "") if authors else "", "journal": (msg.get("container-title") or [""])[0],
            "year": year, "volume": msg.get("volume", ""), "pages": msg.get("page", ""),
            "citations": msg.get("is-referenced-by-count", 0), "type": msg.get("type", "")}


def main():
    wanted: dict[str, dict] = {}
    for f in sorted((ROOT / "data" / "content" / "techniques").glob("*.json")):
        for page in json.loads(f.read_text()):
            for p in page.get("papers", []):
                if p.get("doi"):
                    w = wanted.setdefault(p["doi"].lower(), {"techniques": [], "notes": [], "category": "Landmark"})
                    w["techniques"].append(page["id"])
                    if p.get("note"):
                        w["notes"].append(p["note"])
    expect = {}
    for doi, surname, cat, note in PAPERS:
        w = wanted.setdefault(doi.lower(), {"techniques": [], "notes": [], "category": cat})
        w["category"] = cat if w["category"] == "Landmark" and not w["techniques"] else w["category"]
        w["notes"].insert(0, note)
        expect[doi.lower()] = surname
    for doi, surname, techs, note in METHODS:
        w = wanted.setdefault(doi.lower(), {"techniques": [], "notes": [], "category": "Methods"})
        w["category"] = "Methods"
        w["techniques"].extend(techs)
        w["notes"].insert(0, note)
        expect[doi.lower()] = surname
    out, dropped = [], []
    for i, (doi, w) in enumerate(sorted(wanted.items())):
        msg = crossref(doi)
        time.sleep(0.12)
        if not msg:
            dropped.append(f"{doi}: not found")
            continue
        r = record(doi, msg)
        if doi in expect and fold(expect[doi]).split()[0] not in fold(r["first"] + " " + " ".join(r["authors"])):
            dropped.append(f"{doi}: expected {expect[doi]}, Crossref first author {r['first']}")
            continue
        r.update({"category": w["category"], "techniques": sorted(set(w["techniques"])), "note": w["notes"][0] if w["notes"] else ""})
        out.append(r)
        if i % 25 == 0:
            print(i, doi)
    out.sort(key=lambda r: (r["year"] or 0), reverse=True)
    (ROOT / "data" / "papers.json").write_text("[\n" + ",\n".join(json.dumps(r, ensure_ascii=False) for r in out) + "\n]\n")
    print(len(out), "papers;", len(dropped), "dropped")
    for d in dropped:
        print("  DROPPED", d)


if __name__ == "__main__":
    main()
