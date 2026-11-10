"""API routes answer with the expected shapes."""
from fastapi.testclient import TestClient

from atlas.web.app import app

client = TestClient(app)


def test_stats():
    s = client.get("/api/stats").json()
    assert s["systems"] > 250 and s["pages"] == s["techniques"]


def test_search_and_facets():
    rows = client.get("/api/systems", params={"technique": "sted"}).json()
    assert rows and all("sted" in r["techniques"] for r in rows)
    assert client.get("/api/systems", params={"q": "airyscan"}).json()
    assert client.get("/api/systems/facets").json()["total"] > 250


def test_technique_page():
    t = client.get("/api/techniques/tirf").json()
    assert t["has_page"] and t["principle"] and t["papers"]
    assert t["sims"][0]["id"] == "tirf"
    assert client.get("/api/techniques/nope").status_code == 404


def test_system_detail_and_components():
    s = client.get("/api/systems/zeiss-lsm-980").json()
    assert s["sources"] and "technique_names" in s
    assert len(client.get("/api/components/detectors").json()) > 10
    assert client.get("/api/components/lasers").status_code == 404
    assert len(client.get("/api/components/light_sources").json()) >= 15
    assert len(client.get("/api/components/filters").json()) >= 10


def test_content_and_fluor():
    for name in ("history", "glossary", "fundamentals", "simulations", "portfolio"):
        assert client.get(f"/api/content/{name}").status_code == 200
    assert client.get("/api/content/secret").status_code == 404
    assert client.get("/api/fluorophores", params={"q": "mcherry"}).json()
    assert "EGFP" in client.get("/api/spectra").json()


def test_index_served():
    assert "Microscope Atlas" in client.get("/").text


def test_technique_matrix():
    rows = client.get("/api/techniques/matrix").json()
    assert len(rows) == len(client.get("/api/techniques").json())
    conf = next(r for r in rows if r["id"] == "confocal")
    assert conf["xy"].startswith("~180") and conf["systems"] > 0 and conf["papers"] > 0
    assert any(k["label"].startswith("Galvo frame rate") for k in conf["speed"])
    # labels that only contain "speed"/"depth" but state something else are not picked
    picked = [k["label"] for r in rows for k in r["speed"] + r["depth"]]
    assert not any(s in p for p in picked for s in ("Speed of sound", "modulation depth", "Bleach depth", "Disk speed"))
