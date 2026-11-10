"""Image Lab: the browser TIFF reader and image ops (imagelab_io.js, sim_engine_image.js) agree with tifffile/numpy."""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest
import tifffile

HERE = Path(__file__).parent
pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")


def decode(path):
    out = subprocess.run(["node", str(HERE / "imagelab_check.mjs"), str(path)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def grating(n=64, period=8, dtype=np.uint16, scale=1000):
    y, x = np.mgrid[0:n, 0:n]
    return (scale * (1.2 + np.cos(2 * np.pi * x / period)) + 3 * y).astype(dtype)


CASES = {
    "u8": (lambda: (np.arange(48 * 40) % 251).reshape(40, 48).astype(np.uint8), {}),
    "u16_be": (lambda: grating(), {"byteorder": ">"}),
    "u16_strips": (lambda: grating(), {"rowsperstrip": 5}),
    "f32_tiled": (lambda: grating(dtype=np.float32, scale=0.37), {"tile": (16, 16)}),
    "i16": (lambda: (grating().astype(np.int32) - 2000).astype(np.int16), {}),
    "packbits": (lambda: grating(), {"compression": "packbits"}),
    "rgb": (lambda: np.stack([grating(), grating() // 2, grating() // 4], -1), {"photometric": "rgb"}),
    "rgb_planar": (lambda: np.stack([grating(), grating() // 2, grating() // 4]), {"photometric": "rgb", "planarconfig": "separate"}),
}


@pytest.mark.parametrize("name", CASES)
def test_tiff_matches_tifffile(tmp_path, name):
    make, kw = CASES[name]
    if "compression" in kw:
        pytest.importorskip("imagecodecs")  # tifffile needs it to write PackBits
    arr = make()
    path = tmp_path / f"{name}.tif"
    tifffile.imwrite(path, arr, **kw)
    ref = tifffile.imread(path).astype(np.float64)
    if ref.ndim == 3:  # samples averaged to one channel
        ref = ref.mean(axis=0 if kw.get("planarconfig") == "separate" else -1)
    got = decode(path)
    assert (got["h"], got["w"]) == ref.shape
    for k, v in {"min": ref.min(), "max": ref.max(), "mean": ref.mean(), "sd": ref.std()}.items():
        assert got["stats"][k] == pytest.approx(v, rel=1e-6, abs=1e-6), k
    assert got["first"] == pytest.approx(ref.ravel()[:5].tolist(), rel=1e-6)
    assert got["last"] == pytest.approx(ref.ravel()[-1], rel=1e-6)
    if "bin2" in got:
        b = ref.reshape(ref.shape[0] // 2, 2, ref.shape[1] // 2, 2).sum(axis=(1, 3))
        assert got["bin2"] == pytest.approx(b.ravel()[:4].tolist(), rel=1e-9)
        assert got["square"]["mean"] == pytest.approx(ref.mean(), rel=1e-9)  # resampling a square onto itself


def test_power_spectrum_peak_matches_numpy(tmp_path):
    arr = grating(n=64, period=8)
    path = tmp_path / "g.tif"
    tifffile.imwrite(path, arr)
    got = decode(path)
    a = arr.astype(np.float64)
    p = np.fft.fftshift(np.abs(np.fft.fft2(a - a.mean())) ** 2)
    iy, ix = np.unravel_index(np.argmax(p), p.shape)
    # the grating's ±1 orders sit 64/8 = 8 pixels either side of the centre; both have the same power
    assert abs(got["peak"][0] - 32) == abs(ix - 32) == 8 and got["peak"][1] == iy == 32


def test_multipage_reads_first_page(tmp_path):
    path = tmp_path / "stack.tif"
    stack = np.stack([grating() + 100 * k for k in range(3)])
    tifffile.imwrite(path, stack, photometric="minisblack", metadata=None)
    got = decode(path)
    assert got["pages"] == 3
    assert got["stats"]["mean"] == pytest.approx(stack[0].astype(np.float64).mean())
