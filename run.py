"""Start Microscope Atlas at http://127.0.0.1:8010 (local only)."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("atlas.web.app:app", host="127.0.0.1", port=8010)
