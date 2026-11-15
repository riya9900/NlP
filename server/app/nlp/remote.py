"""Client for the Colab GPU worker (see app/inference_server.py)."""

import base64

import httpx
import numpy as np

from app.config import get_settings


def enabled() -> bool:
    return bool(get_settings().nlp_remote_url)


def _headers() -> dict:
    t = get_settings().worker_token
    return {"X-Worker-Token": t} if t else {}


def post(path: str, payload: dict, timeout: float = 300) -> dict:
    s = get_settings()
    r = httpx.post(
        s.nlp_remote_url.rstrip("/") + path, json=payload, headers=_headers(), timeout=timeout
    )
    r.raise_for_status()
    return r.json()


def encode_f16(a: np.ndarray) -> str:
    return base64.b64encode(a.astype(np.float16).tobytes()).decode()


def decode_f16(b64: str, shape: tuple[int, int]) -> np.ndarray:
    return np.frombuffer(base64.b64decode(b64), dtype=np.float16).reshape(shape).astype(np.float32)
