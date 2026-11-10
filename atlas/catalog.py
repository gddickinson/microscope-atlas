"""Microscope systems, components and the technique index, with search and facets."""
from collections import Counter

from . import jsonio
from .paths import COMPONENTS, DATA, SYSTEMS


def techniques() -> list[dict]:
    return jsonio.load(DATA / "technique_index.json", [])


def technique_names() -> dict[str, str]:
    return {t["id"]: t["name"] for t in techniques()}


def systems() -> list[dict]:
    return jsonio.load_lists(SYSTEMS)


def components(kind: str) -> list[dict]:
    return jsonio.load(COMPONENTS / f"{kind}.json", [])


def _text(item: dict) -> str:
    parts = [item.get("name", ""), item.get("manufacturer", ""), item.get("summary", ""),
             " ".join(item.get("techniques", [])), " ".join(item.get("applications", [])),
             " ".join(f"{k} {v}" for k, v in (item.get("specs") or {}).items())]
    return " ".join(parts).lower()


def search(q: str = "", technique: str = "", kind: str = "", manufacturer: str = "",
           status: str = "", family: str = "") -> list[dict]:
    """Filter systems. Every word of q must appear somewhere in the entry."""
    fam = {t["id"]: t["family"] for t in techniques()}
    words = q.lower().split()
    out = []
    for s in systems():
        techs = s.get("techniques", [])
        if technique and technique not in techs:
            continue
        if family and not any(fam.get(t) == family for t in techs):
            continue
        if kind and s.get("kind") != kind:
            continue
        if manufacturer and s.get("manufacturer") != manufacturer:
            continue
        if status and s.get("status") != status:
            continue
        if words:
            text = _text(s)
            if not all(w in text for w in words):
                continue
        out.append(s)
    out.sort(key=lambda s: (s.get("manufacturer", "").lower(), s.get("name", "").lower()))
    return out


def facets() -> dict:
    """Counts for the filter panel."""
    items = systems()
    fam = {t["id"]: t["family"] for t in techniques()}
    tech = Counter(t for s in items for t in s.get("techniques", []))
    fams = Counter(f for s in items for f in {fam.get(t) for t in s.get("techniques", [])} if f)
    return {
        "total": len(items),
        "technique": dict(tech.most_common()),
        "family": dict(fams.most_common()),
        "kind": dict(Counter(s.get("kind") for s in items).most_common()),
        "status": dict(Counter(s.get("status") for s in items).most_common()),
        "manufacturer": dict(Counter(s.get("manufacturer") for s in items).most_common()),
        "decade": dict(sorted(Counter(_decade(s.get("year")) for s in items).items())),
    }


def _decade(year) -> str:
    return f"{year // 10 * 10}s" if isinstance(year, int) else "unknown"


def get(system_id: str) -> dict | None:
    return next((s for s in systems() if s["id"] == system_id), None)


def manufacturers() -> list[dict]:
    """One row per manufacturer with its systems' techniques and years."""
    rows: dict[str, dict] = {}
    for s in systems():
        m = rows.setdefault(s["manufacturer"], {"name": s["manufacturer"], "systems": [],
                                                  "techniques": Counter(), "years": []})
        m["systems"].append({"id": s["id"], "name": s["name"]})
        m["techniques"].update(s.get("techniques", []))
        if isinstance(s.get("year"), int):
            m["years"].append(s["year"])
    out = []
    for m in rows.values():
        out.append({"name": m["name"], "count": len(m["systems"]), "systems": m["systems"],
                    "techniques": [t for t, _ in m["techniques"].most_common(6)],
                    "first": min(m["years"]) if m["years"] else None,
                    "last": max(m["years"]) if m["years"] else None})
    return sorted(out, key=lambda r: (-r["count"], r["name"]))
