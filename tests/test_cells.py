"""Cells page: content API, and (when the optional ML packages are installed) the identifier end to end."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from atlas import cell_id
from atlas.web.app import app

client = TestClient(app)
IMG = Path(__file__).resolve().parents[1] / "data" / "images"


def test_cells_content():
    c = client.get("/api/content/cells").json()
    assert len(c["cell_types"]) == 34 and len(c["structures"]) >= 20 and len(c["numbers"]) >= 15
    assert client.get("/api/cells/status").json() == {"available": cell_id.available()}


@pytest.mark.skipif(not cell_id.available(), reason="optional ML packages not installed")
@pytest.mark.parametrize("file,expect", [("three-species-pollen-grains.jpg", "pollen"),
                                         ("saccharomyces-cerevisiae-100x-phase-contrast-microscopy.jpg", "yeast")])
def test_identify(file, expect):
    with open(IMG / file, "rb") as f:
        r = client.post("/api/cells/identify", files={"file": (file, f, "image/jpeg")})
    assert r.status_code == 200, r.text
    top = [x["id"] for x in r.json()["ranking"][:3]]
    assert expect in top, top


def test_identify_rejects_non_images():
    if not cell_id.available():
        pytest.skip("optional ML packages not installed")
    r = client.post("/api/cells/identify", files={"file": ("x.txt", b"not an image", "text/plain")})
    assert r.status_code == 400
