from functools import lru_cache

import numpy as np

from reviewnlp.config import get_nlp_settings
from reviewnlp.device import resolve_device


@lru_cache
def _model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(get_nlp_settings().embed_model, device=resolve_device())


def embed(texts: list[str], batch_size: int = 64) -> np.ndarray:
    """L2-normalised multilingual sentence embeddings."""
    if not texts:
        return np.zeros((0, 1), dtype=np.float32)
    vecs = _model().encode(
        texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False
    )
    return np.asarray(vecs, dtype=np.float32)
