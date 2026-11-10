"""HTTP API under /api and the single-page front end."""
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .. import catalog, content, fluorophores
from ..paths import DATA, STATIC

app = FastAPI(title="Microscope Atlas")
app.mount("/static", StaticFiles(directory=STATIC), name="static")
# Portfolio images: data/portfolio is published; data/portfolio_staging is local-only (git-ignored) previews.
for _name, _dir in (("portfolio", DATA / "portfolio"), ("portfolio-local", DATA / "portfolio_staging"), ("images", DATA / "images")):
    if _dir.exists():
        app.mount(f"/{_name}", StaticFiles(directory=_dir), name=_name)


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/api/stats")
def stats():
    f = catalog.facets()
    pages = content.technique_pages()
    return {"systems": f["total"], "manufacturers": len(f["manufacturer"]),
            "techniques": len(catalog.techniques()), "pages": len(pages),
            "simulations": len(content.simulations()),
            "fluorophores": len(fluorophores.all_rows()), "spectra": len(fluorophores.spectra()),
            "detectors": len(catalog.components("detectors")),
            "objectives": len(catalog.components("objectives")),
            "light_sources": len(catalog.components("light_sources")), "filters": len(catalog.components("filters")),
            "papers": len(content.papers()),
            "kind": f["kind"], "family": f["family"], "decade": f["decade"]}


@app.get("/api/techniques")
def techniques():
    return content.overview()


@app.get("/api/techniques/{tid}")
def technique(tid: str):
    page = content.technique(tid)
    if not page:
        raise HTTPException(404, "unknown technique")
    return page


@app.get("/api/systems")
def systems(q: str = "", technique: str = "", kind: str = "", manufacturer: str = "",
            status: str = "", family: str = ""):
    return catalog.search(q, technique, kind, manufacturer, status, family)


@app.get("/api/systems/facets")
def facets():
    return catalog.facets()


@app.get("/api/systems/{sid}")
def system(sid: str):
    s = catalog.get(sid)
    if not s:
        raise HTTPException(404, "unknown system")
    names = catalog.technique_names()
    return {**s, "technique_names": {t: names.get(t, t) for t in s.get("techniques", [])},
            "images": content.images_for(system=sid)}


@app.get("/api/manufacturers")
def manufacturers():
    return catalog.manufacturers()


@app.get("/api/components/{kind}")
def components(kind: str):
    if kind not in catalog.COMPONENT_KINDS:
        raise HTTPException(404, "unknown component type")
    return catalog.components(kind)


@app.get("/api/fluorophores")
def fluor(q: str = "", kind: str = "", ex_min: int = 0, ex_max: int = 2000, limit: int = 300):
    return fluorophores.search(q, kind, ex_min, ex_max, limit)


@app.get("/api/portfolio/images")
def portfolio_images(public: bool = False):
    return content.portfolio_images(public)


@app.get("/api/images")
def images():
    return content.images()


@app.get("/api/papers")
def papers():
    return content.papers()


@app.get("/api/spectra")
def spectra():
    return fluorophores.spectra()


@app.get("/api/content/{name}")
def named(name: str):
    if name not in ("history", "glossary", "fundamentals", "simulations", "portfolio", "chooser", "community", "videos"):
        raise HTTPException(404, "unknown content")
    return content.named(name)


# Lab Tools: microscopy file inspector (the upload is processed in memory and never stored).
from fastapi import File, UploadFile  # noqa: E402

from .. import lab_files  # noqa: E402


@app.post("/api/lab/inspect")
async def lab_inspect(file: UploadFile = File(...)):
    return await lab_files.inspect_upload(file)
