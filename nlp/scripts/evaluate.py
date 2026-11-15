"""Evaluation used for the paper. Run from server/:  uv run python ../nlp/scripts/evaluate.py
Writes docs/eval_results.json. Everything reported in the paper comes from this file.

1. Spam classifier vs baselines on a held-out split of the public fake-review corpus.
2. Spam signals (classifier / MinHash+rules / all) on the bundled multilingual demo set with planted spam.
3. Theme discovery + label quality on the demo set (ground-truth aspects): LLM labels vs keyword labels.
4. Sentiment accuracy per language on the Multilingual Amazon Reviews Corpus (test split sample).
5. End-to-end latency on CPU.
"""

import io
import json
import time
from pathlib import Path

import httpx
import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "eval_results.json"
OUT.parent.mkdir(exist_ok=True)
results: dict = {}


def prf(y, pred):
    p, r, f, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
    return {"precision": round(float(p), 3), "recall": round(float(r), 3), "f1": round(float(f), 3)}


# ------------------------------------------------------------------ 1. spam classifier vs baselines
print("[1] spam classifier on the fake-review corpus ...", flush=True)
URL = "https://huggingface.co/datasets/theArijitDas/Fake-Reviews-Dataset/resolve/main/data/train-00000-of-00001.parquet"
df = pd.read_parquet(io.BytesIO(httpx.get(URL, follow_redirects=True, timeout=120).content))[["text", "label"]].dropna()
df["y"] = (df.label == 1).astype(int)
train, test = train_test_split(df, test_size=0.15, stratify=df.y, random_state=0)  # identical split to train_spam.py
rows = {}
maj = DummyClassifier(strategy="most_frequent").fit(train.text, train.y)
rows["Majority class"] = {"accuracy": round(accuracy_score(test.y, maj.predict(test.text)), 3), **prf(test.y, maj.predict(test.text)), "roc_auc": 0.5}
word = make_pipeline(TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True), LogisticRegression(max_iter=300, C=4.0)).fit(train.text, train.y)
pw = word.predict_proba(test.text)[:, 1]
rows["Word TF-IDF + LR"] = {"accuracy": round(accuracy_score(test.y, pw > 0.5), 3), **prf(test.y, pw > 0.5), "roc_auc": round(roc_auc_score(test.y, pw), 3)}
char = joblib.load(ROOT / "nlp" / "models" / "spam.joblib")
pc = char.predict_proba(test.text)[:, 1]
rows["Char n-gram TF-IDF + LR (ours)"] = {"accuracy": round(accuracy_score(test.y, pc > 0.5), 3), **prf(test.y, pc > 0.5), "roc_auc": round(roc_auc_score(test.y, pc), 3)}
results["spam_corpus"] = {"n_train": len(train), "n_test": len(test), "fake_share": round(float(df.y.mean()), 3), "models": rows}
print(json.dumps(rows, indent=1), flush=True)

# ------------------------------------------------------------------ 2/3. demo set (synthetic, planted spam + gold aspects)
print("[2,3] demo set ...", flush=True)
from reviewnlp import Review, analyze, spam as S
from reviewnlp.config import get_nlp_settings
from reviewnlp.preprocess import preprocess

demo = json.load(open(ROOT / "server" / "data" / "demo" / "headphones.json", encoding="utf8"))["reviews"]
revs = [Review(id=r["id"], text=r["text"], rating=r["rating"], author=r["author"]) for r in demo]
truth = {r["id"]: r["is_spam"] for r in demo}
ids = list(truth)
y = [int(truth[i]) for i in ids]
cfg = get_nlp_settings()
thr = cfg.spam_threshold

pre = preprocess(revs)
texts = [r.text for r in pre]
by_id = {r.id: k for k, r in enumerate(pre)}

S._classifier.cache_clear()
probs = S.classifier_probs(texts)
clf_only = [int(probs[by_id[i]] >= thr) for i in ids]
full = S.score_reviews(pre)
all_sig = [int(full[i].score >= thr) for i in ids]
orig_path = cfg.spam_model_path
cfg.spam_model_path = "/nonexistent"
S._classifier.cache_clear()
rules = S.score_reviews(pre)
rules_only = [int(rules[i].score >= thr) for i in ids]
cfg.spam_model_path = orig_path
S._classifier.cache_clear()
results["spam_demo"] = {
    "n": len(ids), "n_spam": int(sum(y)), "threshold": thr,
    "classifier_only": prf(y, clf_only), "minhash_and_rules": prf(y, rules_only), "all_signals": prf(y, all_sig),
}
print(json.dumps(results["spam_demo"], indent=1), flush=True)

# themes + labels: with the small LLM, and with the keyword fallback
SYN = {
    "battery": ["batter", "akku", "bater", "autonom", "電池", "バッテリー", "power", "life"],
    "sound": ["sound", "klang", "sonido", "son ", "音", "audio", "bass", "clarity"],
    "comfort": ["comfort", "bequem", "cómod", "confort", "快適", "fit", "wear"],
    "mic": ["mic", "mikro", "micr", "マイク", "call"],
    "bluetooth": ["bluetooth", "connect", "verbind", "conex", "connexion", "接続", "pairing"],
}
EXPECTED = {"battery": 1, "sound": 1, "comfort": 1, "mic": -1, "bluetooth": -1}
gold = {a: {r["id"] for r in demo if not r["is_spam"] and a in r["aspects"]} for a in EXPECTED}


def theme_eval(res):
    out = []
    for a, sign in EXPECTED.items():
        best, bj = None, 0.0
        for t in res.themes:
            ids_t = set(t.review_ids)
            j = len(gold[a] & ids_t) / max(1, len(gold[a] | ids_t))
            if j > bj:
                best, bj = t, j
        if best is None:
            out.append({"aspect": a, "jaccard": 0.0, "sign_ok": False, "label": "", "label_ok": False})
            continue
        lab = best.label.lower()
        out.append({
            "aspect": a, "jaccard": round(bj, 3), "label": best.label,
            "sign_ok": bool((best.sentiment > 0) == (sign > 0)),
            "label_ok": any(s in lab for s in SYN[a]),
        })
    return out


t0 = time.time()
cfg.llm_enabled = True
res_llm = analyze(revs, filter_spam=True, lang="en")
t_first = time.time() - t0
t0 = time.time()
res_llm = analyze(revs, filter_spam=True, lang="en")
t_warm = time.time() - t0
ev_llm = theme_eval(res_llm)
cfg.llm_enabled = False
res_kw = analyze(revs, filter_spam=True, lang="en")
ev_kw = theme_eval(res_kw)
cfg.llm_enabled = True


def summ(ev):
    return {
        "aspect_coverage_jaccard>=0.3": round(float(np.mean([e["jaccard"] >= 0.3 for e in ev])), 3),
        "mean_best_jaccard": round(float(np.mean([e["jaccard"] for e in ev])), 3),
        "sentiment_sign_accuracy": round(float(np.mean([e["sign_ok"] for e in ev])), 3),
        "label_accuracy": round(float(np.mean([e["label_ok"] for e in ev])), 3),
    }


results["themes_demo"] = {
    "n_aspects": len(EXPECTED), "n_themes_llm": len(res_llm.themes), "n_themes_keyword": len(res_kw.themes),
    "llm_labels": {"summary": summ(ev_llm), "per_aspect": ev_llm},
    "keyword_labels": {"summary": summ(ev_kw), "per_aspect": ev_kw},
    "pipeline": {
        "reviews": res_llm.total_reviews, "analysed": res_llm.analyzed_reviews, "spam_removed": res_llm.spam_removed,
        "languages": res_llm.languages,
    },
}
results["latency_demo_cpu_s"] = {"first_call_incl_model_load": round(t_first, 1), "warm": round(t_warm, 1), "reviews": len(revs)}
print(json.dumps(results["themes_demo"]["llm_labels"]["summary"]), json.dumps(results["themes_demo"]["keyword_labels"]["summary"]), flush=True)
print("latency", results["latency_demo_cpu_s"], flush=True)

# ------------------------------------------------------------------ 4. sentiment per language
print("[4] sentiment per language ...", flush=True)
from reviewnlp.sentiment import sentiment_scores

per_lang = {}
for lang in ["en", "de", "es", "fr", "ja"]:
    rows_, last_err = [], None
    for offset in (0, 1500, 3000, 4500):
        for attempt in range(3):
            try:
                r = httpx.get(
                    "https://datasets-server.huggingface.co/rows",
                    params={"dataset": "mteb/amazon_reviews_multi", "config": lang, "split": "test", "offset": offset, "length": 50},
                    timeout=60,
                )
                r.raise_for_status()
                rows_ += [x["row"] for x in r.json()["rows"]]
                break
            except Exception as e:  # noqa: BLE001
                last_err = e
                time.sleep(2)
    d = pd.DataFrame(rows_)
    d["stars"] = d["label"] + 1  # label 0..4
    d = d[d.stars != 3]
    ytrue = (d.stars >= 4).astype(int).to_numpy()
    sc = sentiment_scores([t[:500] for t in d.text.tolist()])
    ypred = (sc > 0).astype(int)
    per_lang[lang] = {
        "n": int(len(d)), "accuracy": round(float(accuracy_score(ytrue, ypred)), 3),
        "macro_f1": round(float(f1_score(ytrue, ypred, average="macro")), 3),
        "positive_share": round(float(ytrue.mean()), 3),
    }
    print(lang, per_lang[lang], flush=True)
results["sentiment_by_language"] = per_lang

OUT.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf8")
print("saved", OUT, flush=True)
