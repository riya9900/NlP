from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from reviewnlp import translate as tr

router = APIRouter(tags=["translate"])


class TranslateRequest(BaseModel):
    texts: list[str] = Field(max_length=40)
    target: str = Field(min_length=2, max_length=5)


class TranslateResponse(BaseModel):
    target: str
    translations: list[str]


@router.post("/translate", response_model=TranslateResponse)
async def translate(body: TranslateRequest):
    """English -> `target` with MarianMT on CPU (used for the summary and theme labels)."""
    if body.target != "en" and not tr.supported(body.target):
        raise HTTPException(422, f"Unsupported language '{body.target}'. Supported: en, {', '.join(sorted(tr.MODELS))}")
    texts = [t[:1500] for t in body.texts]
    out = await run_in_threadpool(tr.translate, texts, body.target)
    return TranslateResponse(target=body.target, translations=out)
