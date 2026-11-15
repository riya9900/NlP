"""Spam / fake-review detection.

Three signals, combined with max():
  1. fine-tuned XLM-RoBERTa classifier (optional; trained in the notebook)
  2. MinHash-LSH near-duplicate groups (copy-paste / template campaigns)
  3. cheap heuristics (shouting, promo language, rating/text mismatch, author bursts)
"""

import os
import re
from collections import Counter
from dataclasses import dataclass, field
from functools import lru_cache

from datasketch import MinHash, MinHashLSH

from app.config import get_settings
from app.nlp import remote
from app.nlp.device import resolve_device
from app.schemas import Review

_CJK = re.compile(r"[぀-ヿ㐀-鿿가-힯]")
_PROMO = re.compile(
    r"(best (product|purchase) ever|highly recommend(ed)?|must buy|buy now|click (here|link)|"
    r"discount code|whatsapp|telegram|free gift|five stars?|5 stars?|amazing amazing)",
    re.I,
)


@dataclass
class SpamResult:
    score: float = 0.0
    reasons: list[str] = field(default_factory=list)


def _shingles(text: str) -> set[str]:
    t = text.lower()
    if _CJK.search(t):  # no whitespace tokenisation for CJK: use char 3-grams
        return {t[i : i + 3] for i in range(max(1, len(t) - 2))}
    w = re.findall(r"\w+", t)
    return {" ".join(w[i : i + 3]) for i in range(max(1, len(w) - 2))}


def _minhash(text: str, num_perm: int = 128) -> MinHash:
    m = MinHash(num_perm=num_perm)
    for s in _shingles(text):
        m.update(s.encode("utf8"))
    return m


def near_duplicate_groups(reviews: list[Review], threshold: float) -> dict[str, int]:
    """review id -> size of its near-duplicate group (1 = unique)."""
    lsh = MinHashLSH(threshold=threshold, num_perm=128)
    hashes: dict[str, MinHash] = {}
    for r in reviews:
        mh = _minhash(r.text)
        hashes[r.id] = mh
        lsh.insert(r.id, mh)
    return {rid: len(lsh.query(mh)) for rid, mh in hashes.items()}


@lru_cache
def _classifier():
    d = get_settings().spam_model_dir
    if not os.path.isdir(d):
        return None
    from transformers import pipeline

    dev = resolve_device()
    return pipeline(
        "text-classification",
        model=d,
        top_k=None,
        device=0 if dev == "cuda" else -1,
        truncation=True,
        max_length=256,
    )


def classifier_available() -> bool:
    return _classifier() is not None


def classifier_probs(texts: list[str]) -> list[float]:
    if not texts:
        return []
    if remote.enabled():
        out: list[float] = []
        for i in range(0, len(texts), 512):
            out += remote.post("/spam", {"texts": texts[i : i + 512]})["probs"]
        return out
    return classifier_probs_local(texts)


def classifier_probs_local(texts: list[str]) -> list[float]:
    clf = _classifier()
    if clf is None or not texts:
        return [0.0] * len(texts)
    out = []
    for probs in clf(texts, batch_size=64):
        d = {p["label"].lower(): p["score"] for p in probs}
        out.append(d.get("fake", d.get("label_1", 0.0)))
    return out


def heuristic(r: Review) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 0.0
    t = r.text
    letters = [c for c in t if c.isalpha()]
    if len(letters) > 12 and sum(c.isupper() for c in letters) / len(letters) > 0.6:
        score, reasons = max(score, 0.5), reasons + ["excessive capitals"]
    if t.count("!") >= 4:
        score, reasons = max(score, 0.45), reasons + ["excessive exclamation marks"]
    if _PROMO.search(t) and len(t) < 160:
        score, reasons = max(score, 0.5), reasons + ["generic promotional wording"]
    if len(t) < 15 and (r.rating or 0) >= 5:
        score, reasons = max(score, 0.3), reasons + ["very short 5-star"]
    return score, reasons


def score_reviews(reviews: list[Review]) -> dict[str, SpamResult]:
    s = get_settings()
    groups = near_duplicate_groups(reviews, s.minhash_threshold)
    authors = Counter(r.author for r in reviews if r.author)
    probs = classifier_probs([r.text for r in reviews])

    res: dict[str, SpamResult] = {}
    for r, p in zip(reviews, probs):
        out = SpamResult()
        if p > 0:
            out.score = p
            if p >= s.spam_threshold:
                out.reasons.append(f"classifier: likely fake ({p:.2f})")
        g = groups.get(r.id, 1)
        if g >= 2:
            dup = min(1.0, 0.7 + 0.1 * (g - 2))
            if len(r.text) < 40:  # short generic reviews ("Great product") legitimately repeat
                dup = min(dup, 0.5)
            out.score = max(out.score, dup)
            out.reasons.append(f"near-duplicate of {g - 1} other review(s)")
        h, hr = heuristic(r)
        out.score = max(out.score, h * 0.8)
        out.reasons += hr
        if r.author and authors[r.author] >= 4:
            out.score = max(out.score, 0.65)
            out.reasons.append(f"same author posted {authors[r.author]} reviews")
        res[r.id] = out
    return res


def add_rating_mismatch(res: SpamResult, rating: float | None, sentiment: float) -> None:
    """5-star with clearly negative text (or 1-star with glowing text)."""
    if rating is None:
        return
    if (rating >= 4.5 and sentiment < -0.5) or (rating <= 1.5 and sentiment > 0.6):
        res.score = max(res.score, 0.55)
        res.reasons.append("rating contradicts review text")
