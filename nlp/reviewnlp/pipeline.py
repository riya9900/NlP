"""End-to-end pipeline.

preprocess -> spam filter -> sentences -> embeddings + sentiment -> clustering
-> sentiment-weighted ranking -> labels + blurb (small local LLM, deterministic fallbacks)
"""

import logging
import math
from collections import Counter

import numpy as np

from reviewnlp import llm
from reviewnlp.config import get_nlp_settings
from reviewnlp.embed import embed
from reviewnlp.models import Review, ReviewAnnotation, SummaryResponse, Theme
from reviewnlp.preprocess import preprocess, split_sentences
from reviewnlp.sentiment import sentiment_scores
from reviewnlp import spam
from reviewnlp.themes import Cluster, cluster_sentences, keyword_labels

log = logging.getLogger("reviewnlp")
SENT_THRESHOLD = 0.15
BAD_LABELS = {"aspect", "topic", "label", "general", "n/a", "none", "product", "review", "reviews"}


def analyze(reviews: list[Review], filter_spam: bool = True, lang: str = "en") -> SummaryResponse:
    s = get_nlp_settings()
    reviews = preprocess(reviews)
    if not reviews:
        return SummaryResponse()

    # --- spam (text signals first; rating/sentiment mismatch added after sentiment) ---
    spam_res = spam.score_reviews(reviews)

    # --- sentences + sentiment for every review (needed for the mismatch signal) ---
    all_sents, all_rev = [], []
    for i, r in enumerate(reviews):
        for sent in split_sentences(r.text):
            all_sents.append(sent)
            all_rev.append(i)
    all_scores = sentiment_scores(all_sents)

    per_review: dict[int, list[float]] = {}
    for ri, sc in zip(all_rev, all_scores):
        per_review.setdefault(ri, []).append(float(sc))
    review_sent = {reviews[i].id: float(np.mean(v)) for i, v in per_review.items()}
    for r in reviews:
        spam.add_rating_mismatch(spam_res[r.id], r.rating, review_sent.get(r.id, 0.0))

    is_spam = {rid: res.score >= s.spam_threshold for rid, res in spam_res.items()}
    kept = [r for r in reviews if not (filter_spam and is_spam[r.id])]
    kept_pos = {r.id: i for i, r in enumerate(kept)}

    sentences, sent_review, sent_scores = [], [], []
    for sent, ri, sc in zip(all_sents, all_rev, all_scores):
        rid = reviews[ri].id
        if rid in kept_pos:
            sentences.append(sent)
            sent_review.append(kept_pos[rid])
            sent_scores.append(sc)
    sent_scores = np.asarray(sent_scores, dtype=np.float32)

    # --- themes ---
    emb = embed(sentences)
    clusters = cluster_sentences(emb, sent_review, sent_scores)

    review_themes: dict[str, set[int]] = {}
    for c in clusters:
        for j in c.sent_idx:
            review_themes.setdefault(kept[sent_review[j]].id, set()).add(c.id)

    # --- labels ---
    kw = keyword_labels({c.id: [sentences[j] for j in c.sent_idx] for c in clusters})
    labels: dict[int, str] = dict(kw)
    llm_used = False
    if s.llm_enabled:
        try:
            for c in clusters:
                got = llm.label_cluster([sentences[j] for j in c.rep_idx], lang)
                if got and got.lower() not in BAD_LABELS:
                    labels[c.id] = got
                    llm_used = True
        except Exception as e:  # never fail the request because of the generator
            log.warning("LLM labelling failed, using keyword labels: %s", e)

    # clusters that got the same label are the same theme: merge them
    groups: dict[str, list[Cluster]] = {}
    for c in clusters:
        groups.setdefault(labels.get(c.id, "General").lower(), []).append(c)
    merged: list[Cluster] = []
    for grp in groups.values():
        if len(grp) == 1:
            merged.append(grp[0])
            continue
        idx = sorted({j for c in grp for j in c.sent_idx})
        mentions = len({sent_review[j] for j in idx})
        sent = float(sent_scores[idx].mean())
        merged.append(Cluster(id=grp[0].id, sent_idx=idx, mentions=mentions, sentiment=sent,
                              score=math.log1p(mentions) * sent, rep_idx=[j for c in grp for j in c.rep_idx][:4]))
    clusters = sorted(merged, key=lambda c: abs(c.score), reverse=True)

    themes = [
        Theme(
            id=c.id,
            label=labels.get(c.id, "General"),
            mentions=c.mentions,
            sentiment=round(c.sentiment, 3),
            score=round(c.score, 3),
            quotes=[sentences[j] for j in c.rep_idx[:3]],
            review_ids=sorted({kept[sent_review[j]].id for j in c.sent_idx}),
        )
        for c in clusters
    ]
    pros = sorted([t for t in themes if t.sentiment > SENT_THRESHOLD], key=lambda t: -t.score)
    cons = sorted([t for t in themes if t.sentiment < -SENT_THRESHOLD], key=lambda t: t.score)

    # --- blurb ---
    blurb = ""
    if s.llm_enabled and s.llm_blurb and (pros or cons):
        try:
            blurb = llm.write_blurb(
                [(t.label, t.mentions) for t in pros[:4]], [(t.label, t.mentions) for t in cons[:4]], lang
            ) or ""
            llm_used = llm_used or bool(blurb)
        except Exception as e:
            log.warning("LLM blurb failed, using template: %s", e)
    if not blurb:
        blurb = llm.template_blurb([t.label for t in pros], [t.label for t in cons])

    langs = Counter(r.language for r in kept)
    total = max(1, sum(langs.values()))
    annotations = [
        ReviewAnnotation(
            id=r.id,
            language=r.language or "und",
            sentiment=round(review_sent.get(r.id, 0.0), 3),
            spam_score=round(spam_res[r.id].score, 3),
            is_spam=spam_res[r.id].score >= s.spam_threshold,
            spam_reasons=spam_res[r.id].reasons,
            theme_ids=sorted(review_themes.get(r.id, [])),
        )
        for r in reviews
    ]
    return SummaryResponse(
        blurb=blurb,
        pros=pros,
        cons=cons,
        themes=themes,
        languages={k: round(v / total, 3) for k, v in langs.most_common()},
        total_reviews=len(reviews),
        analyzed_reviews=len(kept),
        spam_removed=len(reviews) - len(kept),
        annotations=annotations,
        llm_used=llm_used,
    )
