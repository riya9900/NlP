from functools import lru_cache

import numpy as np

from app.config import get_settings
from app.nlp import remote
from app.nlp.device import resolve_device

CHUNK = 512


@lru_cache
def _model():
    from sentence_transformers import SentenceTransformer

    s = get_settings()
    dev = resolve_device()
    m = SentenceTransformer(s.embed_model, device=dev)
    if dev == "cuda":
        m.half()
    return m


def embed_local(texts: list[str], batch_size: int = 64) -> np.ndarray:
    vecs = _model().encode(
        texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False
    )
    return np.asarray(vecs, dtype=np.float32)


def embed(texts: list[str], batch_size: int = 64) -> np.ndarray:
    """L2-normalised multilingual embeddings (BGE-M3 by default); runs on the Colab worker if configured."""
    if not texts:
        return np.zeros((0, 1), dtype=np.float32)
    if not remote.enabled():
        return embed_local(texts, batch_size)
    parts = []
    for i in range(0, len(texts), CHUNK):
        out = remote.post("/embed", {"texts": texts[i : i + CHUNK]})
        parts.append(remote.decode_f16(out["data"], tuple(out["shape"])))
    return np.vstack(parts)
