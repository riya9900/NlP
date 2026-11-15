"""End-to-end pipeline (shared by the FastAPI route and the Colab notebook).

preprocess -> spam filter -> sentences -> embeddings (BGE-M3) -> sentiment (XLM-R)
-> clustering -> sentiment-weighted ranking -> LLM labels + blurb (optional)
"""

from collections import Counter
from dataclasses import dataclass

import numpy as np
from fastapi.concurrency import run_in_threadpool

from app.config import get_settings
from app.nlp import llm, spam
from app.nlp.embed import embed
from app.nlp.preprocess import preprocess, split_sentences
from app.nlp.sentiment import sentiment_scores
from app.nlp.themes import Cluster, cluster_sentences
from app.schemas import Review, ReviewAnnotation, SummaryResponse, Theme

SENT_THRESHOLD = 0.15


@dataclass
class _Stage1:
    reviews: list[Review]
    spam: dict[str, spam.SpamResult]
    kept: list[Review]
    sentences: list[str]
    sent_review: list[int]  # index into `kept`
    clusters: list[Cluster]
    review_sent: dict[str, float]
    review_themes: dict[str, set[int]]


def _fallback_label(text: str) -> str:
    text = text.strip()
    return (text[:40] + "…") if len(text) > 40 else text


def _stage1(reviews: list[Review], filter_spam: bool) -> _Stage1:
    s = get_settings()
    reviews = preprocess(reviews)
    spam_res = spam.score_reviews(reviews)

    # sentence-level sentiment is needed for the rating-mismatch spam signal, so compute for all
    all_sents, all_rev = [], []
    for i, r in enumerate(reviews):
        for sent in split_sentences(r.text):
            all_sents.append(sent)
            all_rev.append(i)
    all_sent_scores = sentiment_scores(all_sents)

    per_review = {}
    for ri, sc in zip(all_rev, all_sent_scores):
        per_review.setdefault(ri, []).append(float(sc))
    review_sent = {reviews[i].id: float(np.mean(v)) for i, v in per_review.items()}
    for r in reviews:
        spam.add_rating_mismatch(spam_res[r.id], r.rating, review_sent.get(r.id, 0.0))

    is_spam = {rid: res.score >= s.spam_threshold for rid, res in spam_res.items()}
    kept = [r for r in reviews if not (filter_spam and is_spam[r.id])]
    kept_pos = {r.id: i for i, r in enumerate(kept)}

    sentences, sent_review, sent_scores = [], [], []
    for sent, ri, sc in zip(all_sents, all_rev, all_sent_scores):
        rid = reviews[ri].id
        if rid in kept_pos:
            sentences.append(sent)
            sent_review.append(kept_pos[rid])
            sent_scores.append(sc)
    sent_scores = np.asarray(sent_scores, dtype=np.float32)

    emb = embed(sentences)
    clusters = cluster_sentences(emb, sent_review, sent_scores)

    review_themes: dict[str, set[int]] = {}
    for c in clusters:
        for j in c.sent_idx:
            review_themes.setdefault(kept[sent_review[j]].id, set()).add(c.id)

    return _Stage1(reviews, spam_res, kept, sentences, sent_review, clusters, review_sent, review_themes)


def _theme(c: Cluster, st: _Stage1, label: str) -> Theme:
    return Theme(
        id=c.id,
        label=label,
        mentions=c.mentions,
        sentiment=round(c.sentiment, 3),
        score=round(c.score, 3),
        quotes=[st.sentences[j] for j in c.rep_idx[:3]],
        review_ids=sorted({st.kept[st.sent_review[j]].id for j in c.sent_idx}),
    )


async def analyze(reviews: list[Review], filter_spam: bool = True, lang: str = "en") -> SummaryResponse:
    st: _Stage1 = await run_in_threadpool(_stage1, reviews, filter_spam)
    s = get_settings()

    payload = [
        {
            "id": c.id,
            "mentions": c.mentions,
            "sentiment": c.sentiment,
            "quotes": [st.sentences[j] for j in c.rep_idx],
        }
        for c in st.clusters
    ]
    gen = await llm.label_and_summarize(payload, lang)
    labels = (gen or {}).get("labels", {})

    themes = [
        _theme(c, st, labels.get(c.id) or _fallback_label(st.sentences[c.rep_idx[0]]))
        for c in st.clusters
    ]
    pros = sorted([t for t in themes if t.sentiment > SENT_THRESHOLD], key=lambda t: -t.score)
    cons = sorted([t for t in themes if t.sentiment < -SENT_THRESHOLD], key=lambda t: t.score)

    langs = Counter(r.language for r in st.kept)
    total = max(1, sum(langs.values()))
    annotations = [
        ReviewAnnotation(
            id=r.id,
            language=r.language or "und",
            sentiment=round(st.review_sent.get(r.id, 0.0), 3),
            spam_score=round(st.spam[r.id].score, 3),
            is_spam=st.spam[r.id].score >= s.spam_threshold,
            spam_reasons=st.spam[r.id].reasons,
            theme_ids=sorted(st.review_themes.get(r.id, [])),
        )
        for r in st.reviews
    ]
    return SummaryResponse(
        blurb=(gen or {}).get("blurb", ""),
        pros=pros,
        cons=cons,
        themes=themes,
        languages={k: round(v / total, 3) for k, v in langs.most_common()},
        total_reviews=len(st.reviews),
        analyzed_reviews=len(st.kept),
        spam_removed=len(st.reviews) - len(st.kept),
        annotations=annotations,
        llm_used=gen is not None,
    )
