"""Microscopy file inspector for the Lab Tools page: TIFF / OME-TIFF (and ND2 when the `nd2` package is installed).

Uploads are read into memory (ND2 goes through a temporary file outside the repo, deleted afterwards) and never
stored. `inspect_bytes` returns dimensions, dtype, pixel size, channel metadata, per-channel min/max/mean and a
percentile-stretched max-projection PNG preview as base64.
"""
import base64
import io
import os
import tempfile
import xml.etree.ElementTree as ET

import numpy as np
import tifffile
from fastapi import HTTPException, UploadFile
from PIL import Image

MAX_BYTES = 200 * 1024 * 1024        # upload limit
MAX_ARRAY_BYTES = 2 * 1024 ** 3      # refuse to decompress more than this
PREVIEW_PX = 512
COLOURS = [(0, 255, 0), (255, 0, 255), (0, 255, 255), (255, 255, 0), (255, 0, 0), (0, 0, 255)]
UNIT_TO_UM = {"nm": 1e-3, "µm": 1.0, "um": 1.0, "micron": 1.0, "microns": 1.0, "mm": 1e3, "cm": 1e4, "m": 1e6}


async def inspect_upload(upload: UploadFile) -> dict:
    """Read an upload with a size limit and inspect it."""
    buf = bytearray()
    while chunk := await upload.read(1 << 20):
        buf.extend(chunk)
        if len(buf) > MAX_BYTES:
            raise HTTPException(413, f"file is larger than {MAX_BYTES // 1048576} MB")
    try:
        return inspect_bytes(bytes(buf), upload.filename or "")
    except HTTPException:
        raise
    except Exception as e:  # unreadable or unsupported files
        raise HTTPException(400, f"could not read file: {e}") from e


def inspect_bytes(data: bytes, filename: str = "") -> dict:
    if filename.lower().endswith(".nd2"):
        return _inspect_nd2(data)
    if data[:4] not in (b"II*\x00", b"MM\x00*", b"II+\x00", b"MM\x00+"):
        raise HTTPException(415, "not a TIFF file (supported: .tif, .tiff, .ome.tif, and .nd2 if the nd2 package is installed)")
    return _inspect_tiff(data)


# --- TIFF ---------------------------------------------------------------------------------------------------
def _inspect_tiff(data: bytes) -> dict:
    with tifffile.TiffFile(io.BytesIO(data)) as tf:
        s = tf.series[0]
        axes, shape, dtype = s.axes, tuple(int(v) for v in s.shape), np.dtype(s.dtype)
        _check_size(shape, dtype)
        arr = s.asarray()
        notes = [] if len(tf.series) == 1 else [f"File has {len(tf.series)} series; showing the first."]
        fmt = "OME-TIFF" if tf.is_ome else "ImageJ TIFF" if tf.is_imagej else "TIFF"
        channels, px = [], {}
        if tf.is_ome and tf.ome_metadata:
            px, channels = _ome_meta(tf.ome_metadata)
        if not px and tf.is_imagej:
            px = _imagej_px(tf.imagej_metadata or {}, tf.pages[0])
        if not px:
            px = _resolution_px(tf.pages[0])
    return _summarise(arr, axes, fmt, px, channels, notes)


def _ome_meta(xml: str) -> tuple[dict, list]:
    root = ET.fromstring(xml)
    ns = {"ome": root.tag.split("}")[0].strip("{")} if root.tag.startswith("{") else {}
    q = (lambda t: f"ome:{t}") if ns else (lambda t: t)
    pix = root.find(f".//{q('Pixels')}", ns)
    if pix is None:
        return {}, []
    px = {}
    for k in "XYZ":
        v = pix.get(f"PhysicalSize{k}")
        if v:
            px[k.lower()] = float(v) * UNIT_TO_UM.get(pix.get(f"PhysicalSize{k}Unit", "µm"), 1.0)
    if px:
        px["unit"] = "µm"
    chans = [{"name": c.get("Name"), "excitation": _num(c.get("ExcitationWavelength")),
              "emission": _num(c.get("EmissionWavelength"))} for c in pix.findall(q("Channel"), ns)]
    return px, chans


def _imagej_px(meta: dict, page) -> dict:
    px = _resolution_px(page)
    if px and meta.get("unit"):
        px["unit"] = "µm" if meta["unit"] in ("micron", "um", "\\u00B5m", "µm") else meta["unit"]
    if px and meta.get("spacing"):
        px["z"] = float(meta["spacing"])
    return px


def _resolution_px(page) -> dict:
    tags = page.tags
    if "XResolution" not in tags:
        return {}
    num, den = tags["XResolution"].value
    if not num or (num == den == 1) or (num == 72 and den == 1):
        return {}  # no calibration (72 dpi is the common default)
    unit = {2: "inch", 3: "cm"}.get(int(tags["ResolutionUnit"].value) if "ResolutionUnit" in tags else 1)
    px = {"x": den / num}
    if "YResolution" in tags:
        yn, yd = tags["YResolution"].value
        px["y"] = yd / yn if yn else px["x"]
    if unit == "cm":
        px = {k: v * 1e4 for k, v in px.items()}
        px["unit"] = "µm"
    else:
        px["unit"] = unit or "pixel⁻¹ (uncalibrated unit)"
    return px


# --- ND2 ----------------------------------------------------------------------------------------------------
def _inspect_nd2(data: bytes) -> dict:
    try:
        import nd2  # optional dependency
    except ImportError as e:
        raise HTTPException(415, "ND2 support needs the `nd2` package (pip install nd2)") from e
    fd, path = tempfile.mkstemp(suffix=".nd2")
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
        with nd2.ND2File(path) as f:
            axes = "".join(f.sizes.keys())
            _check_size(tuple(f.sizes.values()), np.dtype(f.dtype))
            arr = np.asarray(f.asarray())
            vs = f.voxel_size()
            px = {"x": vs.x, "y": vs.y, "z": vs.z, "unit": "µm"}
            chans = []
            for c in (f.metadata.channels or []) if f.metadata else []:
                chans.append({"name": c.channel.name, "emission": _num(getattr(c.channel, "emissionLambdaNm", None)),
                              "excitation": _num(getattr(c.channel, "excitationLambdaNm", None))})
    finally:
        os.remove(path)
    return _summarise(arr, axes, "ND2", px, chans, [])


# --- shared -------------------------------------------------------------------------------------------------
def _check_size(shape, dtype):
    n = int(np.prod(shape, dtype=np.int64)) * dtype.itemsize
    if n > MAX_ARRAY_BYTES:
        raise HTTPException(413, f"image data is {n / 1024 ** 3:.1f} GB uncompressed; limit is 2 GB")


def _num(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _summarise(arr: np.ndarray, axes: str, fmt: str, px: dict, chans_meta: list, notes: list) -> dict:
    axes = axes.upper()
    if arr.ndim != len(axes):  # fall back to generic axis names
        axes = "Q" * (arr.ndim - 2) + "YX"
    orig_axes, orig_shape, dtype, nbytes = axes, [int(v) for v in arr.shape], str(arr.dtype), int(arr.nbytes)
    if axes.endswith("S") and arr.shape[-1] in (3, 4):  # RGB samples: treat as channels
        arr = np.moveaxis(arr, -1, 0)
        axes = "C" + axes[:-1]
    c_ax = axes.find("C")
    if c_ax < 0:
        arr, axes, c_ax = arr[np.newaxis], "C" + axes, 0
    stacks = np.moveaxis(arr, c_ax, 0)  # C first
    rest = axes[:c_ax] + axes[c_ax + 1:]
    channels = []
    projs = []
    for i, ch in enumerate(stacks):
        meta = chans_meta[i] if i < len(chans_meta) else {}
        channels.append({"name": meta.get("name"), "excitation": meta.get("excitation"), "emission": meta.get("emission"),
                         "min": float(ch.min()), "max": float(ch.max()), "mean": float(ch.mean())})
        projs.append(ch.reshape((-1,) + ch.shape[-2:]).max(axis=0) if ch.ndim > 2 else ch)
    return {"format": fmt, "axes": orig_axes, "shape": orig_shape, "dtype": dtype, "nbytes": nbytes,
            "pixel_size": px, "channels": channels, "projected": ", ".join(a for a in rest[:-2]) or None,
            "preview": _preview(projs), "notes": notes}


def _stretch(img: np.ndarray) -> np.ndarray:
    img = img.astype(np.float32)
    lo, hi = np.percentile(img, (0.5, 99.8))
    if hi <= lo:
        hi = lo + 1
    return np.clip((img - lo) / (hi - lo), 0, 1)


def _preview(projs: list) -> str:
    """Composite (up to 6 channels, fixed colours; one channel is grey) as base64 PNG, at most PREVIEW_PX wide."""
    h, w = projs[0].shape
    step = max(1, int(np.ceil(max(h, w) / PREVIEW_PX)))
    if len(projs) == 1:
        rgb = np.repeat(_stretch(projs[0][::step, ::step])[..., None], 3, axis=2)
    else:
        rgb = np.zeros(projs[0][::step, ::step].shape + (3,), np.float32)
        for img, col in zip(projs[:len(COLOURS)], COLOURS):
            rgb += _stretch(img[::step, ::step])[..., None] * (np.array(col, np.float32) / 255)
        rgb = np.clip(rgb, 0, 1)
    b = io.BytesIO()
    Image.fromarray((rgb * 255).astype(np.uint8)).save(b, format="PNG")
    return base64.b64encode(b.getvalue()).decode()
