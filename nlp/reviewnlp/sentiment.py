from functools import lru_cache

import numpy as np

from reviewnlp.config import get_nlp_settings
from reviewnlp.device import resolve_device


@lru_cache
def _pipe():
    from transformers import pipeline

    dev = resolve_device()
    return pipeline(
        "text-classification",
        model=get_nlp_settings().sentiment_model,
        top_k=None,
        device=0 if dev == "cuda" else -1,
        truncation=True,
        max_length=256,
    )


def sentiment_scores(texts: list[str], batch_size: int = 32) -> np.ndarray:
    """Score in [-1, 1] per text: P(positive) - P(negative) (multilingual XLM-R)."""
    if not texts:
        return np.zeros(0, dtype=np.float32)
    scores = []
    for probs in _pipe()(texts, batch_size=batch_size):
        d = {p["label"].lower(): p["score"] for p in probs}
        scores.append(d.get("positive", 0.0) - d.get("negative", 0.0))
    return np.asarray(scores, dtype=np.float32)
