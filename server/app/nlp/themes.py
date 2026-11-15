"""Theme discovery: cluster sentence embeddings, then rank clusters by sentiment-weighted frequency."""

import math
from dataclasses import dataclass

import numpy as np
from sklearn.cluster import HDBSCAN, KMeans

from app.config import get_settings


@dataclass
class Cluster:
    id: int
    sent_idx: list[int]  # indices into the sentence arrays
    mentions: int  # number of distinct reviews
    sentiment: float
    score: float  # signed: log(1+mentions) * mean sentiment
    rep_idx: list[int]  # representative sentence indices (closest to centroid)


def cluster_sentences(
    emb: np.ndarray, sent_review: list[int], sentiments: np.ndarray
) -> list[Cluster]:
    s = get_settings()
    n = len(emb)
    if n == 0:
        return []

    if n >= s.min_cluster_size * 2:
        labels = HDBSCAN(
            min_cluster_size=s.min_cluster_size, min_samples=2, metric="euclidean"
        ).fit_predict(emb)
        # HDBSCAN can label everything as noise on small/uniform data: fall back to KMeans
        if (labels >= 0).sum() < s.min_cluster_size:
            k = max(2, min(s.max_themes, n // s.min_cluster_size))
            labels = KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(emb)
    else:
        labels = np.zeros(n, dtype=int)

    clusters: list[Cluster] = []
    for cid in sorted(set(labels) - {-1}):
        idx = np.where(labels == cid)[0]
        centroid = emb[idx].mean(axis=0)
        centroid /= np.linalg.norm(centroid) + 1e-9
        order = idx[np.argsort(-(emb[idx] @ centroid))]
        # prefer representatives from distinct reviews
        reps, seen = [], set()
        for j in order:
            if sent_review[j] not in seen:
                reps.append(int(j))
                seen.add(sent_review[j])
            if len(reps) == 4:
                break
        mentions = len({sent_review[j] for j in idx})
        sent = float(sentiments[idx].mean())
        clusters.append(
            Cluster(
                id=int(cid),
                sent_idx=[int(j) for j in idx],
                mentions=mentions,
                sentiment=sent,
                score=math.log1p(mentions) * sent,
                rep_idx=reps,
            )
        )
    clusters.sort(key=lambda c: abs(c.score), reverse=True)
    return clusters[: s.max_themes]
