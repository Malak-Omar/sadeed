import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="BestMatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory session state  (single active session – fine for demo)
# ---------------------------------------------------------------------------
_state: dict = {
    "candidates": {},    # cid -> {original_text, anonymized_text, pii, filename}
    "job_description": "",
    "ranking": [],
    "indexed": False,
}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "candidates_loaded": len(_state["candidates"])}


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@app.post("/upload")
async def upload(
    cvs: List[UploadFile] = File(...),
    job_description: str = Form(...),
):
    if len(cvs) == 0:
        raise HTTPException(400, "At least one CV required")
    if len(cvs) > 10:
        raise HTTPException(400, "Maximum 10 CVs allowed")

    from .pdf_reader import chunk_text, extract_text_from_pdf
    from .anonymizer import anonymize_cv
    from .rag import build_index

    # Reset state
    _state["candidates"] = {}
    _state["job_description"] = job_description
    _state["ranking"] = []
    _state["indexed"] = False

    candidate_ids = [chr(65 + i) for i in range(len(cvs))]
    candidate_chunks: dict[str, list[str]] = {}

    for cv, cid in zip(cvs, candidate_ids):
        pdf_bytes = await cv.read()
        original_text = extract_text_from_pdf(pdf_bytes)

        anonymized_text, pii = anonymize_cv(original_text, cid)

        _state["candidates"][cid] = {
            "original_text": original_text,
            "anonymized_text": anonymized_text,
            "pii": pii,
            "filename": cv.filename or f"cv_{cid}.pdf",
        }

        candidate_chunks[cid] = chunk_text(anonymized_text)

    build_index(candidate_chunks)
    _state["indexed"] = True

    return {
        "success": True,
        "candidates_processed": len(cvs),
        "candidate_ids": candidate_ids,
        "message": "All CVs anonymized and indexed successfully ✓",
    }


# ---------------------------------------------------------------------------
# Ranking
# ---------------------------------------------------------------------------

@app.get("/ranking")
async def get_ranking():
    if not _state["candidates"]:
        raise HTTPException(400, "No CVs uploaded yet")

    if not _state["ranking"]:
        from .analyzer import rank_candidates

        result = rank_candidates(
            _state["job_description"],
            {cid: data["anonymized_text"] for cid, data in _state["candidates"].items()},
        )
        _state["ranking"] = result

    return {
        "ranking": _state["ranking"],
        "total_candidates": len(_state["candidates"]),
    }


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    question: str


@app.post("/chat")
async def chat(req: ChatRequest):
    if not _state["indexed"]:
        raise HTTPException(400, "No CVs indexed yet. Please upload CVs first.")

    from .rag import search
    from .analyzer import chat_with_candidates

    chunks = search(req.question, top_k=8)
    if not chunks:
        return {"answer": "No relevant information found in the uploaded CVs.", "sources": 0}

    answer = chat_with_candidates(req.question, chunks)
    return {"answer": answer, "sources": len(chunks)}


# ---------------------------------------------------------------------------
# Reveal identity
# ---------------------------------------------------------------------------

@app.post("/reveal/{candidate_id}")
async def reveal(candidate_id: str):
    candidate_id = candidate_id.upper()
    if candidate_id not in _state["candidates"]:
        raise HTTPException(404, f"Candidate {candidate_id} not found")

    data = _state["candidates"][candidate_id]
    pii = data["pii"]

    # Build a friendly display object
    identity = {
        "candidate_id": candidate_id,
        "filename": data["filename"],
        "name": pii.get("PERSON", ["Unknown"])[0],
        "email": pii.get("EMAIL_ADDRESS", ["Not found"])[0],
        "phone": pii.get("PHONE_NUMBER", ["Not found"])[0],
        "location": pii.get("LOCATION", ["Not found"])[0] if pii.get("LOCATION") else "Not found",
        "raw_pii": pii,
    }
    return identity


# ---------------------------------------------------------------------------
# Serve React SPA in production
# ---------------------------------------------------------------------------

_static = Path(__file__).parent.parent / "static"

if _static.exists():
    _assets = _static / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API paths
        if full_path.startswith(("upload", "ranking", "chat", "reveal", "health")):
            raise HTTPException(404)
        index = _static / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return JSONResponse({"message": "Frontend not built. Run: npm run build"})
