"""Build data/fluorophores.json and data/spectra.json from FPbase (https://www.fpbase.org).

FPbase data are openly licensed (CC BY-SA 4.0); the source is credited on the Fluorophores page.
Properties: every fluorescent protein with an excitation and emission peak, and every dye.
Spectra: a curated list of common labels, resampled every 2 nm and normalised to a peak of 1.

Run: .venv/bin/python scripts/fetch_fpbase.py
"""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
GQL = "https://www.fpbase.org/graphql/"
UA = {"Content-Type": "application/json", "User-Agent": "microscope-atlas/0.1 (educational)"}

CURATED = [
    # fluorescent proteins
    "EBFP2", "mTagBFP2", "mTurquoise2", "mCerulean3", "ECFP", "EGFP", "sfGFP", "mEmerald", "mNeonGreen",
    "mClover3", "mStayGold", "EYFP", "mVenus", "mCitrine", "mOrange2", "mKO2", "tdTomato", "mScarlet",
    "mScarlet-I3", "mScarlet3", "mApple", "mRuby3", "mCherry", "TagRFP-T", "mKate2", "mNeptune2",
    "miRFP670", "emiRFP670", "iRFP720", "smURFP", "PA-GFP", "PAmCherry1", "mEos2", "mEos3.2", "Dendra2",
    "mMaple3", "Dronpa", "rsEGFP2", "GCaMP6s", "jGCaMP7s", "T-Sapphire",
    # dyes
    "DAPI", "Hoechst 33342", "Alexa Fluor 405", "Alexa Fluor 488", "Alexa Fluor 532", "Alexa Fluor 546",
    "Alexa Fluor 555", "Alexa Fluor 568", "Alexa Fluor 594", "Alexa Fluor 647", "Alexa Fluor 680",
    "Alexa Fluor 750", "ATTO 488", "ATTO 565", "ATTO 647N", "ATTO 655", "Cy2", "Cy3", "Cy3B", "Cy5",
    "Cy5.5", "Cy7", "FITC", "TRITC", "Texas Red", "Fluorescein", "Rhodamine B", "JF549", "JF646",
    "Janelia Fluor 549", "Janelia Fluor 646", "SiR", "TMR", "Fluo-4", "Fura-2", "Rhod-2", "Oregon Green 488",
    "MitoTracker Deep Red", "Nile Red", "Qdot 655", "CF680", "Abberior STAR RED", "Abberior STAR 635P",
    "DyLight 650", "BODIPY FL", "Propidium iodide", "Calcein",
]


def gql(query: str, tries: int = 4) -> dict:
    req = urllib.request.Request(GQL, data=json.dumps({"query": query}).encode(), headers=UA)
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                out = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            print("HTTP", e.code, query[:80], e.read()[:200])
            if attempt == tries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    if "errors" in out:
        raise RuntimeError(out["errors"])
    return out["data"]


STATE = "exMax emMax extCoeff qy brightness lifetime pka maturation twopExMax"


def properties() -> list[dict]:
    rows = []
    for p in gql(f"{{ proteins {{ name slug agg switchType defaultState {{ {STATE} }} "
                 "primaryReference { doi year } } }")["proteins"]:
        s = p.get("defaultState") or {}
        if s.get("exMax") and s.get("emMax"):
            rows.append(_row(p["name"], p["slug"], "protein", s, p.get("primaryReference"),
                             agg=p.get("agg"), switch=p.get("switchType")))
    time.sleep(0.5)
    dye_fields = STATE.replace(" maturation", "")
    for d in gql(f"{{ dyes {{ name slug {dye_fields} }} }}")["dyes"]:
        rows.append(_row(d["name"], d["slug"], "dye", d, None))
    return rows


def _row(name, slug, kind, s, ref, **extra) -> dict:
    row = {"name": name, "slug": slug, "kind": kind, "ex": s.get("exMax"), "em": s.get("emMax"),
           "ec": s.get("extCoeff"), "qy": s.get("qy"), "brightness": s.get("brightness"),
           "lifetime": s.get("lifetime"), "pka": s.get("pka"), "maturation": s.get("maturation"),
           "twop": s.get("twopExMax"), "year": (ref or {}).get("year"), "doi": (ref or {}).get("doi")}
    row.update({k: v for k, v in extra.items() if v})
    row = {k: v for k, v in row.items() if v not in (None, "")}
    return {k: v for k, v in row.items() if v not in (None, "")}


def resample(points: list, step: int = 2) -> list:
    """Linear interpolation onto a 2 nm grid, normalised to a maximum of 1."""
    pts = sorted((float(x), float(y)) for x, y in points)
    if len(pts) < 2:
        return []
    lo, hi = int(pts[0][0]) + 1, int(pts[-1][0])
    peak = max(y for _, y in pts) or 1
    out, j = [], 0
    for x in range(lo - lo % step + step, hi, step):
        while j < len(pts) - 2 and pts[j + 1][0] < x:
            j += 1
        (x0, y0), (x1, y1) = pts[j], pts[j + 1]
        y = y0 + (y1 - y0) * (x - x0) / (x1 - x0 or 1)
        out.append([x, round(max(y, 0) / peak, 3)])
    return out


def spectra() -> dict:
    wanted = {n.lower(): n for n in CURATED}
    index = gql("{ spectra { id subtype category owner { name slug } } }")["spectra"]
    picked: dict[str, dict] = {}
    for sp in index:
        name = sp["owner"]["name"]
        if name.lower() in wanted and sp["subtype"] in ("EX", "AB", "EM", "2P"):
            picked.setdefault(name, {})[sp["subtype"]] = sp["id"]
    out = {}
    for name, ids in sorted(picked.items()):
        entry = {}
        for sub, sid in ids.items():
            data = gql(f"{{ spectrum(id: {sid}) {{ data }} }}")["spectrum"]["data"]
            key = {"EX": "ex", "AB": "ex", "EM": "em", "2P": "twop"}[sub]
            if key == "ex" and "ex" in entry and sub == "AB":
                continue
            entry[key] = resample(data)
            time.sleep(0.15)
        out[name] = entry
        print(name, list(entry))
    return out


def peak(curve: list):
    return max(curve, key=lambda p: p[1])[0] if curve else None


def main():
    props = properties()
    spec = spectra()
    for r in props:
        sp = spec.get(r["name"], {})
        r.setdefault("ex", peak(sp.get("ex", [])))
        r.setdefault("em", peak(sp.get("em", [])))
        if r["name"] in spec:
            r["spectrum"] = True
    props = [r for r in props if r.get("ex") and r.get("em")]
    (DATA / "fluorophores.json").write_text(json.dumps(props, separators=(",", ":")))
    print(len(props), "fluorophores")
    (DATA / "spectra.json").write_text(json.dumps(spec, separators=(",", ":")))
    print(len(spec), "spectra")


if __name__ == "__main__":
    main()
