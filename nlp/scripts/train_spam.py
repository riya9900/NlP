"""Train the spam / fake-review classifier (TF-IDF char n-grams + logistic regression). ~1 minute on CPU.

    cd server && uv run python ../nlp/scripts/train_spam.py

Data: public fake-review corpus (theArijitDas/Fake-Reviews-Dataset, ~40k reviews; label 1 = computer-generated / fake).
Output: nlp/models/spam.joblib and nlp/models/spam_metrics.json
"""

import io
import json
from pathlib import Path

import httpx
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

URL = "https://huggingface.co/datasets/theArijitDas/Fake-Reviews-Dataset/resolve/main/data/train-00000-of-00001.parquet"
OUT = Path(__file__).resolve().parent.parent / "models"
OUT.mkdir(exist_ok=True)

print("downloading dataset ...")
raw = httpx.get(URL, follow_redirects=True, timeout=120).content
df = pd.read_parquet(io.BytesIO(raw))[["text", "label"]].dropna()
df["y"] = (df.label == 1).astype(int)  # check the printed samples below if you doubt the label meaning
print(df.y.value_counts().to_dict())
for lab in (0, 1):
    print(f"label {lab} sample:", df[df.y == lab].text.iloc[0][:120])

train, test = train_test_split(df, test_size=0.15, stratify=df.y, random_state=0)
model = make_pipeline(
    TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=3, sublinear_tf=True, max_features=300_000),
    LogisticRegression(max_iter=300, C=4.0),
)
print("training ...")
model.fit(train.text, train.y)
pred = model.predict(test.text)
proba = model.predict_proba(test.text)[:, 1]
report = classification_report(test.y, pred, target_names=["genuine", "fake"], output_dict=True)
metrics = {"roc_auc": roc_auc_score(test.y, proba), "report": report, "n_train": len(train), "n_test": len(test)}
print(classification_report(test.y, pred, target_names=["genuine", "fake"], digits=3))
print("ROC-AUC:", round(metrics["roc_auc"], 3))

joblib.dump(model, OUT / "spam.joblib")
(OUT / "spam_metrics.json").write_text(json.dumps(metrics, indent=2))
print("saved", OUT / "spam.joblib")
