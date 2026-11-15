from functools import lru_cache

import numpy as np

from app.config import get_settings
from app.nlp import remote
from app.nlp.device import resolve_device


@lru_cache
def _pipe():
    from transformers import pipeline

    dev = resolve_device()
    return pipeline(
        "text-classification",
        model=get_settings().sentiment_model,
        top_k=None,
        device=0 if dev == "cuda" else -1,
        torch_dtype="auto",
        truncation=True,
        max_length=256,
    )


def sentiment_scores(texts: list[str], batch_size: int = 64) -> np.ndarray:
    """Return score in [-1, 1] per text: P(positive) - P(negative)."""
    if not texts:
        return np.zeros(0, dtype=np.float32)
    if remote.enabled():
        vals: list[float] = []
        for i in range(0, len(texts), 512):
            vals += remote.post("/sentiment", {"texts": texts[i : i + 512]})["scores"]
        return np.asarray(vals, dtype=np.float32)
    return sentiment_local(texts, batch_size)


def sentiment_local(texts: list[str], batch_size: int = 64) -> np.ndarray:
    outs = _pipe()(texts, batch_size=batch_size)
    scores = []
    for probs in outs:
        d = {p["label"].lower(): p["score"] for p in probs}
        scores.append(d.get("positive", 0.0) - d.get("negative", 0.0))
    return np.asarray(scores, dtype=np.float32)
