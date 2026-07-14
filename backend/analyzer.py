import json
import os
import re
from typing import Optional
import anthropic
from dotenv import load_dotenv

load_dotenv()

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


SYSTEM_PROMPT = """You are an expert HR analyst and talent acquisition specialist.
You evaluate candidates ONLY based on skills, experience, and qualifications.
You never reference names, gender, age, nationality, or any personal information.
All candidates are identified by ID only (Candidate A, B, C...).

For ranking: return a JSON array ordered by match score (highest first):
[{
  "candidate_id": "A",
  "score": 87,
  "summary": "1-2 sentence overview of the candidate's profile and suitability for the role.",
  "strengths": ["Python 5 years", "ML experience", "Team lead"],
  "gaps": ["No cloud experience"]
}]

For chat questions: return a clear, structured answer referencing candidate IDs only.
Always end with: "⚖️ This assessment is based solely on qualifications."
"""


def rank_candidates(
    job_description: str, candidates: dict[str, str]
) -> list[dict]:
    """
    Rank candidates against the job description.
    candidates: {candidate_id: anonymized_cv_text}
    Returns a list of ranking dicts sorted by score desc.
    """
    client = _get_client()

    # Truncate each CV to ~2 000 chars to stay within token limits
    blocks = []
    for cid, text in candidates.items():
        blocks.append(f"=== Candidate {cid} ===\n{text[:2000]}")

    prompt = (
        f"Job Description:\n{job_description}\n\n"
        f"Candidates:\n" + "\n\n".join(blocks) +
        "\n\nRank ALL candidates by match score (0-100). "
        "Return ONLY a valid JSON array with no extra text."
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text

    # Extract JSON array even if Claude wraps it in markdown fences
    json_match = re.search(r"\[.*\]", raw, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    return []


def chat_with_candidates(
    question: str,
    rag_chunks: list[tuple[str, str, float]],
) -> str:
    """
    Answer an HR question using RAG-retrieved chunks.
    rag_chunks: [(candidate_id, chunk_text, score)]
    """
    client = _get_client()

    context_parts = []
    for cid, chunk, _ in rag_chunks:
        context_parts.append(f"[Candidate {cid}]:\n{chunk}")

    context = "\n\n---\n\n".join(context_parts)

    prompt = (
        f"Context from CVs:\n{context}\n\n"
        f"HR Question: {question}\n\n"
        "Answer based solely on the CV context above. "
        "Reference candidates by their ID only. "
        "IMPORTANT: Return your answer as clear human-readable text using markdown formatting "
        "(headers, bullet points, bold). Do NOT return JSON arrays or code blocks."
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text
