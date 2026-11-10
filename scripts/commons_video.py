"""Commons video (Ogg/WebM) and animated GIF -> small H.264 MP4 plus a JPEG poster, for scripts/fetch_commons.py.

Limits keep the public repo small: at most 480 px wide, 15 frames per second, the first 20 s, no audio, and under
MAX_BYTES (raising the compression, then shortening, until it fits). Needs ffmpeg on the PATH.
"""
import subprocess
import tempfile
from pathlib import Path

MAX_BYTES = 590_000


def to_mp4(data: bytes, out: Path, seconds: float = 20.0):
    """Write out (.mp4) and out with _poster.jpg; return (width, height) of the video."""
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "src"
        src.write_bytes(data)
        for crf, dur in ((28, seconds), (32, seconds), (34, seconds * 0.6), (36, seconds * 0.4)):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-t", f"{dur:.1f}", "-an",
                            "-vf", "fps=15,scale='min(480,iw)':-2:flags=lanczos,format=yuv420p",
                            "-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-movflags", "+faststart", str(out)], check=True)
            if out.stat().st_size <= MAX_BYTES:
                break
        poster = out.with_name(out.stem + "_poster.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-vf", "thumbnail=50", "-frames:v", "1",
                        "-q:v", "4", str(poster)], check=True)  # a representative frame, whatever the clip length
        probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                "-of", "csv=p=0", str(out)], capture_output=True, text=True, check=True).stdout.strip()
    w, h = (int(v) for v in probe.split(",")[:2])
    return w, h
