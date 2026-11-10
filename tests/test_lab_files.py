"""The microscopy file inspector reads an OME-TIFF upload and reports shape, pixel size, channels and a preview."""
import base64
import io

import numpy as np
import tifffile
from fastapi.testclient import TestClient

from atlas import lab_files
from atlas.web.app import app

client = TestClient(app)


def _ome_tiff():
    rng = np.random.default_rng(0)
    data = rng.integers(0, 1000, size=(3, 2, 32, 48), dtype=np.uint16)  # Z C Y X
    data[:, 1] += 2000
    buf = io.BytesIO()
    tifffile.imwrite(buf, data, ome=True, metadata={
        "axes": "ZCYX", "PhysicalSizeX": 0.108, "PhysicalSizeY": 0.108, "PhysicalSizeZ": 0.3,
        "Channel": {"Name": ["GFP", "mCherry"]}})
    return buf.getvalue(), data


def test_inspect_ome_tiff():
    raw, data = _ome_tiff()
    r = client.post("/api/lab/inspect", files={"file": ("test.ome.tif", raw, "image/tiff")})
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["format"] == "OME-TIFF" and b["dtype"] == "uint16"
    assert b["axes"] == "ZCYX" and b["shape"] == [3, 2, 32, 48]
    assert abs(b["pixel_size"]["x"] - 0.108) < 1e-9 and abs(b["pixel_size"]["z"] - 0.3) < 1e-9
    assert [c["name"] for c in b["channels"]] == ["GFP", "mCherry"]
    assert b["channels"][1]["min"] == float(data[:, 1].min())
    assert abs(b["channels"][0]["mean"] - float(data[:, 0].mean())) < 1e-6
    png = base64.b64decode(b["preview"])
    assert png[:8] == b"\x89PNG\r\n\x1a\n"


def test_plain_tiff_and_rejections():
    buf = io.BytesIO()
    tifffile.imwrite(buf, np.arange(64 * 64, dtype=np.float32).reshape(64, 64))
    r = client.post("/api/lab/inspect", files={"file": ("plain.tif", buf.getvalue(), "image/tiff")})
    assert r.status_code == 200 and r.json()["channels"][0]["max"] == 64 * 64 - 1
    r = client.post("/api/lab/inspect", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert r.status_code == 415


def test_size_limit(monkeypatch):
    monkeypatch.setattr(lab_files, "MAX_BYTES", 100)
    r = client.post("/api/lab/inspect", files={"file": ("big.tif", b"II*\x00" + b"0" * 200, "image/tiff")})
    assert r.status_code == 413
