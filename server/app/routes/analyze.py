from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

import reviewnlp
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
    # heavy CPU/GPU work: keep it off the event loop
    return await run_in_threadpool(
        reviewnlp.analyze, reviews, filter_spam=body.filter_spam, lang=body.lang
    )
