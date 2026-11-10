"""Cell identification for the Cells page (full app only; needs the optional ML packages in requirements-ml.txt).

Two complementary readings of an uploaded image, both from the BiomedCLIP model (Zhang et al. 2023, MIT licence,
microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224), run locally so images never leave the machine:
  1. zero-shot: similarity between the image and a text description of each cell type ("a micrograph of ...");
  2. nearest neighbours: similarity to the atlas's own labelled cell images (data/images, entries with cell_type).
The two are combined into one ranking. It is a teaching aid, not a diagnostic tool.
"""
from __future__ import annotations

import io
import threading

import numpy as np
from fastapi import HTTPException, UploadFile

from . import content
from .paths import DATA

MODEL = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
MAX_BYTES = 40 * 1024 * 1024
CACHE = DATA / "cache" / "cell_embeddings.npz"

# Cell type id -> phrase used in the text prompts (ids as in data/content/cells.json).
PROMPTS = {
    "bacterium": "bacteria", "cyanobacterium": "cyanobacteria", "yeast": "yeast cells", "diatom": "diatoms",
    "ciliate": "a ciliate protist such as Paramecium", "amoeba": "an amoeba", "plant-cell": "plant cells with cell walls",
    "guard-cell": "stomatal guard cells", "pollen": "pollen grains", "erythrocyte": "red blood cells",
    "neutrophil": "a neutrophil in a blood smear", "lymphocyte": "a lymphocyte in a blood smear",
    "macrophage": "macrophages or monocytes", "eosinophil": "an eosinophil in a blood smear", "platelet": "platelets",
    "neuron": "neurons", "glial-cell": "astrocytes or glial cells", "skeletal-muscle": "skeletal muscle fibres",
    "cardiomyocyte": "cardiac muscle cells", "smooth-muscle": "smooth muscle cells",
    "squamous-epithelium": "squamous epithelial cells such as cheek cells", "columnar-epithelium": "columnar epithelium",
    "fibroblast": "fibroblasts", "cultured-cell-line": "cultured cells such as HeLa cells", "keratinocyte": "keratinocytes",
    "adipocyte": "fat cells (adipocytes)", "chondrocyte": "cartilage cells (chondrocytes)", "osteocyte": "bone cells (osteocytes)",
    "hepatocyte": "liver cells (hepatocytes)", "sperm": "sperm cells", "oocyte": "an oocyte (egg cell)",
    "mitotic-cell": "a dividing cell in mitosis", "cancer-cell": "cancer cells",
}
TEMPLATES = ["this is a micrograph of {}", "a microscopy image of {}", "{} under the microscope"]

_lock = threading.Lock()
_state: dict = {}


def available() -> bool:
    try:
        import open_clip  # noqa: F401
        import torch  # noqa: F401
        return True
    except ImportError:
        return False


def _device():
    import torch
    return "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"


def _load():
    """Load the model and text embeddings once (thread-safe)."""
    with _lock:
        if "model" in _state:
            return _state
        import open_clip
        import torch
        model, preprocess = open_clip.create_model_from_pretrained(MODEL)
        tok = open_clip.get_tokenizer(MODEL)
        dev = _device()
        model = model.to(dev).eval()
        ids = list(PROMPTS)
        with torch.no_grad():
            per = []
            for t in TEMPLATES:
                e = model.encode_text(tok([t.format(PROMPTS[i]) for i in ids], context_length=256).to(dev))
                per.append(e / e.norm(dim=-1, keepdim=True))
            text = torch.stack(per).mean(0)
            text = text / text.norm(dim=-1, keepdim=True)
        _state.update(model=model, pre=preprocess, dev=dev, ids=ids, text=text.cpu().numpy(), scale=float(model.logit_scale.exp().item()))
        return _state


def to_rgb(data: bytes):
    """Any PIL-readable image (8/16-bit, grey or colour, first frame of a stack) -> 8-bit RGB with a 0.5-99.5% stretch."""
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im.seek(0)
    if im.mode in ("RGB", "RGBA", "P", "LA", "CMYK", "L"):
        return im.convert("RGB")
    a = np.asarray(im, dtype=np.float64)
    if a.ndim == 3:
        a = a.mean(axis=2)
    lo, hi = np.percentile(a, [0.5, 99.5])
    a = np.clip((a - lo) / max(hi - lo, 1e-9), 0, 1)
    return Image.fromarray((a * 255).astype(np.uint8)).convert("RGB")


def embed(images) -> np.ndarray:
    import torch
    s = _load()
    with torch.no_grad():
        x = torch.stack([s["pre"](im) for im in images]).to(s["dev"])
        e = s["model"].encode_image(x)
        e = e / e.norm(dim=-1, keepdim=True)
    return e.cpu().numpy()


def reference():
    """Embeddings of the atlas's labelled cell images, cached on disk and rebuilt when the image list changes."""
    refs = [i for i in content.images() if i.get("cell_type")]
    key = "|".join(i["file"] for i in refs)
    if "ref" in _state and _state["ref_key"] == key:
        return refs, _state["ref"]
    if CACHE.exists():
        z = np.load(CACHE, allow_pickle=False)
        if str(z["key"]) == key:
            _state.update(ref=z["emb"], ref_key=key)
            return refs, z["emb"]
    from PIL import Image
    emb = np.zeros((0, 512), dtype=np.float32)
    for k in range(0, len(refs), 16):
        batch = [Image.open(DATA / "images" / i["file"]).convert("RGB") for i in refs[k:k + 16]]
        emb = np.concatenate([emb, embed(batch).astype(np.float32)])
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    np.savez(CACHE, emb=emb, key=np.array(key))
    _state.update(ref=emb, ref_key=key)
    return refs, emb


def identify_image(img, top: int = 5, neighbours: int = 6) -> dict:
    s = _load()
    e = embed([img])[0]
    logits = s["scale"] * (s["text"] @ e)
    p = np.exp(logits - logits.max())
    p /= p.sum()
    refs, emb = reference()
    sims = emb @ e if len(refs) else np.zeros(0)
    order = np.argsort(-sims)[:neighbours]
    near = [{**{k: refs[j][k] for k in ("file", "title", "cell_type", "author", "licence", "source_url")}, "url": f"images/{refs[j]['file']}", "similarity": round(float(sims[j]), 3)} for j in order]
    # vote share of the nearest neighbours (similarity-weighted), blended 50:50 with the zero-shot probability
    votes = {}
    for j in order:
        votes[refs[j]["cell_type"]] = votes.get(refs[j]["cell_type"], 0) + max(float(sims[j]), 0)
    tot = sum(votes.values()) or 1
    comb = {cid: 0.5 * float(p[i]) + 0.5 * votes.get(cid, 0) / tot for i, cid in enumerate(s["ids"])}
    ranked = sorted(comb, key=comb.get, reverse=True)[:top]
    return {"model": MODEL.split(":", 1)[1], "device": s["dev"],
            "ranking": [{"id": c, "score": round(comb[c], 3), "zero_shot": round(float(p[s["ids"].index(c)]), 3), "neighbour_votes": round(votes.get(c, 0) / tot, 3)} for c in ranked],
            "neighbours": near}


async def identify_upload(upload: UploadFile) -> dict:
    if not available():
        raise HTTPException(503, "cell identification needs the optional ML packages: pip install -r requirements-ml.txt")
    buf = bytearray()
    while chunk := await upload.read(1 << 20):
        buf.extend(chunk)
        if len(buf) > MAX_BYTES:
            raise HTTPException(413, f"file is larger than {MAX_BYTES // 1048576} MB")
    try:
        img = to_rgb(bytes(buf))
    except Exception as e:
        raise HTTPException(400, f"could not read the image: {e}") from e
    return identify_image(img)
