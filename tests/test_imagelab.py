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


def test_localization_matches_scipy(tmp_path):
    """Detect and fit spots in a noisy single-molecule frame; each fit agrees with scipy curve_fit on the same window."""
    from scipy.optimize import curve_fit

    rng = np.random.default_rng(5)
    n, s, amp, bg, r = 128, 1.4, 70.0, 12.0, 4
    truth = rng.uniform(8, n - 8, size=(25, 2))
    yy, xx = np.mgrid[0:n, 0:n]
    mean = bg + sum(amp * np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * s * s)) for x, y in truth)
    frame = rng.poisson(mean).astype(np.float32)
    path = tmp_path / "sm.tif"
    tifffile.imwrite(path, frame)
    out = subprocess.run(["node", str(HERE / "imagelab_check.mjs"), str(path), "--loc", str(s), "5", str(r)],
                         capture_output=True, text=True, check=True)
    fits = json.loads(out.stdout)["fits"]

    def g(xy, x0, y0, a, b, sig):
        u, v = xy
        return b + a * np.exp(-((u - x0) ** 2 + (v - y0) ** 2) / (2 * sig * sig))

    f64 = frame.astype(np.float64)
    for f in fits:
        x0, y0 = f["x0"], f["y0"]
        v, u = np.mgrid[max(0, y0 - r):min(n, y0 + r + 1), max(0, x0 - r):min(n, x0 + r + 1)]
        p0 = [x0, y0, f64[v, u].max() - f64[v, u].min(), f64[v, u].min(), s]
        p, _ = curve_fit(g, (u.ravel(), v.ravel()), f64[v, u].ravel(), p0=p0, maxfev=5000)
        assert [f["x"], f["y"], f["A"], f["bg"], f["sigma"]] == pytest.approx(p.tolist(), rel=1e-4, abs=1e-4)

    # most molecules are found, each within a pixel of the truth (overlapping pairs may merge)
    near = [min(np.hypot(f["x"] - truth[:, 0], f["y"] - truth[:, 1])) for f in fits]
    assert len(fits) >= 20 and np.median(near) < 0.2 and np.mean(np.array(near) < 0.5) >= 0.9
