import httpx
from fastapi import APIRouter, HTTPException

from app.nlp import pipeline
from app.schemas import AnalyzeRequest, SummaryResponse
from app.services import serpapi

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=SummaryResponse)
async def analyze(body: AnalyzeRequest):
    reviews = body.reviews
    if reviews is None:
        if not body.product_id:
            raise HTTPException(422, "Provide either reviews or product_id")
        reviews = await serpapi.fetch_reviews(body.product_id)
    if not reviews:
        return SummaryResponse()
    try:
        return await pipeline.analyze(reviews, filter_spam=body.filter_spam, lang=body.lang)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(503, "GPU worker rejected the token. Check WORKER_TOKEN in .env.") from e
        raise HTTPException(503, f"GPU worker error (HTTP {e.response.status_code}).") from e
    except httpx.HTTPError as e:  # Colab worker down / tunnel expired
        raise HTTPException(
            503, "GPU worker unreachable. Is the Colab notebook running and NLP_REMOTE_URL current?"
        ) from e
    except ImportError as e:  # torch / sentence-transformers not installed (no `gpu` group)
        raise HTTPException(
            503, f"NLP dependencies missing ({e.name}). Install with `uv sync --group gpu`."
        ) from e
