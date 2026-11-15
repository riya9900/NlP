"""GPU worker. Runs in Colab (or any GPU box); the local FastAPI server calls it.

    uvicorn app.inference_server:app --port 9000

Endpoints (all require header X-Worker-Token when WORKER_TOKEN is set):
    POST /embed      {texts}  -> base64 float16 matrix   (BAAI/bge-m3)
    POST /sentiment  {texts}  -> {scores in [-1, 1]}     (XLM-R)
    POST /spam       {texts}  -> {probs}                 (fine-tuned XLM-R, 0s if model missing)
    POST /v1/chat/completions -> proxied to the local vLLM server (Qwen)
"""

import logging
import os

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from app.nlp import remote
from app.nlp.embed import embed_local
from app.nlp.sentiment import sentiment_local
from app.nlp.spam import classifier_probs_local

log = logging.getLogger("worker")
VLLM_URL = os.environ.get("VLLM_URL", "http://localhost:8001/v1")
TOKEN = os.environ.get("WORKER_TOKEN", "")


def auth(x_worker_token: str | None = Header(default=None)):
    if TOKEN and x_worker_token != TOKEN:
        raise HTTPException(401, "Bad worker token")


app = FastAPI(title="Review NLP GPU worker", dependencies=[Depends(auth)])


class Texts(BaseModel):
    texts: list[str] = Field(max_length=1024)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/embed")
async def embed_route(body: Texts):
    vecs = await run_in_threadpool(embed_local, body.texts)
    return {"shape": list(vecs.shape), "data": remote.encode_f16(vecs)}


@app.post("/sentiment")
async def sentiment_route(body: Texts):
    scores = await run_in_threadpool(sentiment_local, body.texts)
    return {"scores": [float(x) for x in scores]}


@app.post("/spam")
async def spam_route(body: Texts):
    return {"probs": await run_in_threadpool(classifier_probs_local, body.texts)}


@app.post("/v1/chat/completions")
async def chat_proxy(request: Request):
    """Pass-through to vLLM so only one tunnel / one token is needed."""
    payload = await request.body()
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(
                f"{VLLM_URL}/chat/completions",
                content=payload,
                headers={"Content-Type": "application/json"},
            )
    except httpx.HTTPError as e:
        raise HTTPException(502, f"vLLM unreachable: {type(e).__name__}") from e
    return Response(content=r.content, status_code=r.status_code, media_type="application/json")
