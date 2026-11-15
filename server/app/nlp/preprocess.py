"""Cleaning, language ID and sentence splitting."""

import re
import unicodedata
from functools import lru_cache

from app.schemas import Review

_WS = re.compile(r"\s+")
_URL = re.compile(r"https?://\S+|www\.\S+")
# split after sentence punctuation (Latin + CJK); keeps it dependency-free
_SENT = re.compile(r"(?<=[.!?…])\s+|(?<=[。！？])|\n+")


def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = _URL.sub(" ", text)
    return _WS.sub(" ", text).strip()


@lru_cache
def _detector():
    from lingua import LanguageDetectorBuilder

    return LanguageDetectorBuilder.from_all_spoken_languages().with_preloaded_language_models().build()


def detect_language(text: str) -> str:
    lang = _detector().detect_language_of(text)
    return lang.iso_code_639_1.name.lower() if lang else "und"


def split_sentences(text: str, min_chars: int = 12) -> list[str]:
    parts = [p.strip() for p in _SENT.split(text) if p and p.strip()]
    # merge fragments that are too short into the previous sentence
    out: list[str] = []
    for p in parts:
        if out and len(p) < min_chars:
            out[-1] = f"{out[-1]} {p}"
        else:
            out.append(p)
    return out


def preprocess(reviews: list[Review]) -> list[Review]:
    """Clean text, drop empties, fill missing language/ids."""
    out: list[Review] = []
    for i, r in enumerate(reviews):
        text = clean_text(r.text)
        if len(text) < 3:
            continue
        # exact/near duplicates are kept here and flagged by the spam stage
        out.append(
            r.model_copy(
                update={
                    "id": r.id or str(i),
                    "text": text,
                    "language": r.language or detect_language(text),
                }
            )
        )
    return out
