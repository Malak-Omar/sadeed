import os
import numpy as np
import faiss
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

_EMBED_MODEL = "models/gemini-embedding-2"
_EMBED_URL = (
    "https://generativelanguage.googleapis.com"
    f"/v1/{_EMBED_MODEL}:embedContent"
)

# Module-level state (one active session)
_index: Optional[faiss.IndexFlatIP] = None
_chunk_store: list[tuple[str, str]] = []   # [(candidate_id, chunk_text)]
_candidate_chunk_idx: dict[str, list[int]] = {}
_dim: int = 3072  # gemini-embedding-2 output dimension


def _embed(text: str, task: str = "RETRIEVAL_DOCUMENT") -> np.ndarray:
    """Call Gemini v1 REST endpoint directly to avoid SDK v1beta routing."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    response = httpx.post(
        _EMBED_URL,
        params={"key": api_key},
        json={
            "model": _EMBED_MODEL,
            "content": {"parts": [{"text": text}]},
            "taskType": task,
        },
        timeout=30.0,
    )
    response.raise_for_status()
    values = response.json()["embedding"]["values"]
    return np.array(values, dtype=np.float32)


def build_index(candidates: dict[str, list[str]]) -> None:
    """
    Build (or rebuild) the FAISS index.
    candidates: {candidate_id: [chunk1, chunk2, ...]}
    """
    global _index, _chunk_store, _candidate_chunk_idx, _dim

    _chunk_store = []
    _candidate_chunk_idx = {}
    all_embeddings: list[np.ndarray] = []

    for cid, chunks in candidates.items():
        _candidate_chunk_idx[cid] = []
        for chunk in chunks:
            if not chunk.strip():
                continue
            emb = _embed(chunk, task="RETRIEVAL_DOCUMENT")
            idx = len(_chunk_store)
            _chunk_store.append((cid, chunk))
            _candidate_chunk_idx[cid].append(idx)
            all_embeddings.append(emb)

    if not all_embeddings:
        _index = None
        return

    _dim = all_embeddings[0].shape[0]
    matrix = np.vstack(all_embeddings)
    faiss.normalize_L2(matrix)

    _index = faiss.IndexFlatIP(_dim)
    _index.add(matrix)


def search(query: str, top_k: int = 8) -> list[tuple[str, str, float]]:
    """
    Semantic search over all chunks.
    Returns [(candidate_id, chunk_text, score)] sorted by score desc.
    """
    if _index is None or _index.ntotal == 0:
        return []

    q_emb = _embed(query, task="RETRIEVAL_QUERY").reshape(1, -1)
    faiss.normalize_L2(q_emb)

    scores, indices = _index.search(q_emb, min(top_k, _index.ntotal))

    results: list[tuple[str, str, float]] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx >= 0:
            cid, chunk = _chunk_store[idx]
            results.append((cid, chunk, float(score)))

    return results


def get_candidate_full_text(candidate_id: str) -> str:
    """Reconstruct all chunks for a specific candidate."""
    indices = _candidate_chunk_idx.get(candidate_id, [])
    return "\n\n".join(_chunk_store[i][1] for i in indices)
