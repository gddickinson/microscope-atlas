"""Teaching content: technique pages, fundamentals, history, glossary and simulations index."""
from . import catalog, jsonio
from .paths import CONTENT, DATA


def technique_pages() -> dict[str, dict]:
    pages = {p["id"]: p for p in jsonio.load_lists(CONTENT / "techniques")}
    return pages


def technique(tid: str) -> dict | None:
    """Index entry merged with its teaching page and the systems that use it."""
    base = next((t for t in catalog.techniques() if t["id"] == tid), None)
    if not base:
        return None
    page = technique_pages().get(tid, {})
    systems = [{"id": s["id"], "name": s["name"], "manufacturer": s["manufacturer"],
                "kind": s.get("kind"), "year": s.get("year"), "status": s.get("status")}
               for s in catalog.search(technique=tid)]
    imgs = images_for(technique=tid)
    methods = [p for p in papers() if tid in p.get("techniques", []) and p.get("category") in ("Methods", "Protocol")]
    videos = [v for v in named("videos") if tid in v.get("techniques", [])]
    sims = sorted((s for s in simulations() if tid in s.get("techniques", [])),
                  key=lambda s: s["techniques"].index(tid))
    return {**base, **page, "systems": systems, "sims": sims, "images": imgs, "methods": methods, "videos": videos,
            "has_page": bool(page)}


def overview() -> list[dict]:
    """Technique index with flags for which have pages and how many systems each has."""
    pages = technique_pages()
    counts = catalog.facets()["technique"]
    return [{**t, "tagline": pages.get(t["id"], {}).get("tagline", t["short"]),
             "has_page": t["id"] in pages, "systems": counts.get(t["id"], 0)}
            for t in catalog.techniques()]


def simulations() -> list[dict]:
    return jsonio.load(CONTENT / "simulations.json", [])


def named(name: str):
    """A content file such as history, glossary or fundamentals."""
    return jsonio.load(CONTENT / f"{name}.json", [])


def papers() -> list[dict]:
    """Papers database (scripts/build_papers.py): cited landmark papers plus curated reviews and tools."""
    return jsonio.load(DATA / "papers.json", [])


def portfolio_images(public_only: bool = False) -> list[dict]:
    """Published images (data/portfolio) and, unless public_only, local previews (data/portfolio_staging)."""
    out = []
    for folder, url, public in (("portfolio", "portfolio", True), ("portfolio_staging", "portfolio-local", False)):
        if public_only and not public:
            continue
        # display.json (next to the manifest) marks each file as a raw "image" (with a gallery group) or a "figure"
        # (plot, trace, analysis map, paper or poster panel); unlisted files count as figures.
        display = jsonio.load(DATA / folder / "display.json", {})
        for item in jsonio.load(DATA / folder / "manifest.json", []):
            d = display.get(item["file"], {})
            out.append({**{k: v for k, v in item.items() if k not in ("source_path", "evidence")},
                        "kind": d.get("kind", "figure"), "group": d.get("group", ""),
                        "url": f"{url}/{item['file']}", "public": public})
    return out


def images() -> list[dict]:
    """Freely licensed images (Wikimedia Commons, scripts/fetch_commons.py) with credits."""
    return [{**i, "url": f"images/{i['file']}"} for i in jsonio.load(DATA / "images" / "manifest.json", [])]


def images_for(system: str = "", technique: str = "") -> list[dict]:
    out = [i for i in images() if (system and i.get("system") == system) or (technique and technique in i.get("techniques", []))]
    return sorted(out, key=lambda i: (i.get("kind") != "instrument", i.get("system") == ""))


# key-number labels that state a speed or a depth (others that merely contain "rate"/"depth" are excluded)
_SPEED = r"frame rate|volume rate|fps|scan time|a-scan|speed|time resolution"
_SPEED_NOT = r"speed of sound|disk speed"
_DEPTH = r"imaging depth|penetration|depth in|usable depth|useful imaging depth|interaction depth|resolution / depth"


def matrix() -> list[dict]:
    """One row per technique for the comparison matrix: resolution text and the speed and depth key numbers exactly as
    the technique page states them (each page is sourced by its papers), plus database counts."""
    import re
    pages, counts = technique_pages(), catalog.facets()["technique"]
    sims = simulations()
    rows = []
    for t in catalog.techniques():
        p = pages.get(t["id"], {})
        kn = p.get("key_numbers", [])
        pick = lambda pat, notpat=None: [k for k in kn if re.search(pat, k["label"], re.I)
                                         and not (notpat and re.search(notpat, k["label"], re.I))]
        rows.append({"id": t["id"], "name": t["name"], "family": t["family"],
                     "xy": p.get("resolution", {}).get("xy", ""), "z": p.get("resolution", {}).get("z", ""),
                     "speed": pick(_SPEED, _SPEED_NOT), "depth": pick(_DEPTH),
                     "systems": counts.get(t["id"], 0), "papers": len(p.get("papers", [])),
                     "sims": sum(t["id"] in s.get("techniques", []) for s in sims)})
    return rows
