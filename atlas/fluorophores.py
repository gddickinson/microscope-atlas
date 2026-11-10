"""Fluorophore properties and spectra (from FPbase, see scripts/fetch_fpbase.py)."""
from . import jsonio
from .paths import DATA


def all_rows() -> list[dict]:
    return jsonio.load(DATA / "fluorophores.json", [])


def search(q: str = "", kind: str = "", ex_min: int = 0, ex_max: int = 2000, limit: int = 300) -> list[dict]:
    words = q.lower().split()
    out = [r for r in all_rows()
           if (not kind or r["kind"] == kind) and ex_min <= r["ex"] <= ex_max
           and all(w in r["name"].lower() for w in words)]
    out.sort(key=lambda r: (-(r.get("brightness") or 0), r["name"]))
    return out[:limit]


def spectra() -> dict:
    return jsonio.load(DATA / "spectra.json", {})
