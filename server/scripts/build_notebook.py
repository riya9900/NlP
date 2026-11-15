"""Builds notebooks/pipeline_colab.ipynb. Run: uv run python scripts/build_notebook.py"""

import json
from pathlib import Path

cells: list[dict] = []


def md(s: str):
    cells.append({"cell_type": "markdown", "metadata": {}, "source": s.strip("\n").splitlines(True)})


def code(s: str):
    cells.append({"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [],
                  "source": s.strip("\n").splitlines(True)})


md("""
# Multilingual Review Summarizer: full pipeline, training & evaluation (Colab, L4)

**Runtime → Change runtime type → L4 GPU + High-RAM.**

Sections
1. Setup (get the `server/` code, install deps)
2. Train the spam classifier (XLM-RoBERTa-base) and save it to `models/spam-xlmr`
3. Start the LLM (Qwen2.5-7B-Instruct-AWQ via vLLM)
4. Run the full pipeline on the demo data
5. Evaluation: spam detection, sentiment per language, theme extraction, summary quality
6. Export results for the report

The notebook imports the **same package the FastAPI server uses** (`app.nlp.*`), so nothing is written twice.
""")

md("## 1. Setup")
code("""
import subprocess, sys, os, torch
print(subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv"], capture_output=True, text=True).stdout)
assert torch.cuda.is_available(), "Switch the runtime to a GPU (L4)"
""")
code("""
# Get the project code into /content/server.  Option C is active; A/B are alternatives (comment C out if you use them).

# Option A (alternative): upload a zip of the `server/` folder (excluding .venv)
# from google.colab import files; files.upload()   # upload server.zip
# !unzip -q -o server.zip -d /content

# Option B (alternative): Google Drive (put the server/ folder at MyDrive/nlp/server)
# from google.colab import drive; drive.mount('/content/drive')
# !cp -r /content/drive/MyDrive/nlp/server /content/server

# Option C (default): GitHub. Re-running pulls the latest code.
REPO = "https://github.com/ronitrai27/NlP.git"
if os.path.isdir("/content/repo/.git"):
    !git -C /content/repo pull -q
else:
    !git clone -q {REPO} /content/repo
!mkdir -p /content/server && cp -r /content/repo/server/. /content/server/   # copy over (keeps models/ trained later)

os.chdir("/content/server"); sys.path.insert(0, "/content/server")
print(os.listdir("."))
""")
code("""
%%capture
!pip install -q sentence-transformers transformers accelerate datasets evaluate rouge-score bert-score \\
    datasketch lingua-language-detector scikit-learn fastapi httpx pydantic-settings cachetools matplotlib seaborn
!pip install -q vllm
""")
code("""
import json, numpy as np, pandas as pd, matplotlib.pyplot as plt, seaborn as sns
from pathlib import Path
Path("data/demo").mkdir(parents=True, exist_ok=True)
if not Path("data/demo/headphones.json").exists():
    !python scripts/make_demo_data.py
DEMO = json.load(open("data/demo/headphones.json", encoding="utf8"))
print(DEMO["product"], len(DEMO["reviews"]), "reviews")
pd.DataFrame(DEMO["reviews"]).language.value_counts()
""")

md("""
## 2. Spam classifier: fine-tune `xlm-roberta-base`

Training data: English fake-review corpus `theArijitDas/Fake-Reviews-Dataset` (≈40k reviews; label 1 = computer-generated/fake).
XLM-R is multilingual, so the classifier transfers zero-shot to German/Spanish/French/Japanese, which we measure in §5.
""")
code("""
from datasets import load_dataset
ds = load_dataset("theArijitDas/Fake-Reviews-Dataset", split="train")
df = ds.to_pandas()[["text", "label"]].dropna()
print(df.label.value_counts())
# sanity check of the label meaning: fake/CG reviews tend to be generic and repetitive
for lab in (0, 1):
    print(f"--- label {lab} ---"); print(df[df.label == lab].text.sample(3, random_state=1).str[:160].to_string())
""")
code("""
FAKE_LABEL = 1   # <- flip to 0 if the samples above show label 0 is the generic/computer-generated one
from sklearn.model_selection import train_test_split
df["y"] = (df.label == FAKE_LABEL).astype(int)
train_df, test_df = train_test_split(df, test_size=0.15, stratify=df.y, random_state=0)
train_df, val_df = train_test_split(train_df, test_size=0.1, stratify=train_df.y, random_state=0)
len(train_df), len(val_df), len(test_df)
""")
code("""
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

BASE = "FacebookAI/xlm-roberta-base"
tok = AutoTokenizer.from_pretrained(BASE)
def enc(b): return tok(b["text"], truncation=True, max_length=192)
mk = lambda d: Dataset.from_pandas(d[["text", "y"]].rename(columns={"y": "labels"}), preserve_index=False).map(enc, batched=True)
tr, va, te = mk(train_df), mk(val_df), mk(test_df)

model = AutoModelForSequenceClassification.from_pretrained(
    BASE, num_labels=2, id2label={0: "genuine", 1: "fake"}, label2id={"genuine": 0, "fake": 1})

def metrics(p):
    pred = p.predictions.argmax(-1)
    pr, rc, f1, _ = precision_recall_fscore_support(p.label_ids, pred, average="binary")
    return {"acc": accuracy_score(p.label_ids, pred), "precision": pr, "recall": rc, "f1": f1}

args = TrainingArguments(
    output_dir="/content/spam-run", num_train_epochs=2, per_device_train_batch_size=32,
    per_device_eval_batch_size=64, learning_rate=2e-5, warmup_ratio=0.06, weight_decay=0.01,
    bf16=True, eval_strategy="epoch", save_strategy="no", logging_steps=100, report_to="none")
trainer = Trainer(model=model, args=args, train_dataset=tr, eval_dataset=va, processing_class=tok,
                  compute_metrics=metrics)
trainer.train()
""")
code("""
test_out = trainer.predict(te)
spam_test_metrics = metrics(test_out)
print("held-out English test:", spam_test_metrics)
Path("models").mkdir(exist_ok=True)
trainer.save_model("models/spam-xlmr"); tok.save_pretrained("models/spam-xlmr")
del trainer, model; import gc; gc.collect(); torch.cuda.empty_cache()
""")

md("""
## 3. Start the LLM (vLLM, Qwen2.5-7B-Instruct-AWQ)
Served as an OpenAI-compatible endpoint on port 8001, the same interface the FastAPI server uses.
`--gpu-memory-utilization 0.55` leaves ~10 GB of the L4's 24 GB for BGE-M3 + XLM-R.
""")
code("""
import subprocess, time, httpx
LLM = "Qwen/Qwen2.5-7B-Instruct-AWQ"
vllm = subprocess.Popen(
    ["vllm", "serve", LLM, "--port", "8001", "--max-model-len", "8192",
     "--gpu-memory-utilization", "0.55", "--dtype", "half"],
    stdout=open("/content/vllm.log", "w"), stderr=subprocess.STDOUT)
for _ in range(120):
    try:
        if httpx.get("http://localhost:8001/v1/models", timeout=2).status_code == 200: break
    except Exception: pass
    time.sleep(5)
else:
    print(open("/content/vllm.log").read()[-2000:]); raise RuntimeError("vLLM did not start")
print("vLLM ready")
""")

md("## 4. Run the full pipeline on the demo product")
code("""
os.environ.update(LLM_BASE_URL="http://localhost:8001/v1", LLM_MODEL=LLM, SPAM_MODEL_DIR="models/spam-xlmr")
from app.config import get_settings; get_settings.cache_clear()
from app.schemas import Review
from app.nlp import pipeline

reviews = [Review(id=r["id"], text=r["text"], rating=r["rating"], author=r["author"]) for r in DEMO["reviews"]]
res = await pipeline.analyze(reviews, filter_spam=True, lang="en")
print("LLM used:", res.llm_used, "| spam removed:", res.spam_removed, "/", res.total_reviews)
print("\\nBLURB:", res.blurb)
print("\\nPROS:", [(t.label, t.mentions, t.sentiment) for t in res.pros])
print("CONS:", [(t.label, t.mentions, t.sentiment) for t in res.cons])
print("LANGS:", res.languages)
""")
code("""
# Same review set, summary generated in German / Japanese (multilingual output)
for lang in ("de", "ja"):
    r = await pipeline.analyze(reviews, filter_spam=True, lang=lang)
    print(lang, "->", r.blurb, "|", [t.label for t in r.pros], [t.label for t in r.cons])
""")

md("## 5. Evaluation")
md("### 5.1 Spam detection (multilingual demo set with a planted campaign)")
code("""
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
truth = {r["id"]: r["is_spam"] for r in DEMO["reviews"]}
ann = {a.id: a for a in res.annotations}
ids = list(truth)
y = [truth[i] for i in ids]; pred = [ann[i].is_spam for i in ids]; sc = [ann[i].spam_score for i in ids]
print(classification_report(y, pred, target_names=["genuine", "spam"], digits=3))
print("ROC-AUC:", round(roc_auc_score(y, sc), 3))
sns.heatmap(confusion_matrix(y, pred), annot=True, fmt="d", cmap="Blues",
            xticklabels=["genuine", "spam"], yticklabels=["genuine", "spam"]); plt.title("Spam confusion matrix"); plt.show()

# ablation: which signal matters?
from app.nlp import spam as S
from app.config import get_settings
def run(use_clf):
    S._classifier.cache_clear()
    get_settings().spam_model_dir = "models/spam-xlmr" if use_clf else "/nonexistent"
    out = S.score_reviews(pipeline.preprocess(reviews))
    p = [out[i].score >= get_settings().spam_threshold for i in ids]
    from sklearn.metrics import precision_recall_fscore_support as f
    return dict(zip(["precision", "recall", "f1"], f(y, p, average="binary")[:3]))
ablation = pd.DataFrame({"classifier + minhash + heuristics": run(True), "minhash + heuristics only": run(False)}).T
S._classifier.cache_clear(); get_settings().spam_model_dir = "models/spam-xlmr"
ablation
""")
md("### 5.2 Sentiment accuracy per language (Amazon reviews, 1-2★ = negative, 4-5★ = positive)")
code("""
from datasets import load_dataset
from app.nlp.sentiment import sentiment_scores
rows = []
for lang in ["en", "de", "es", "fr", "ja"]:
    d = load_dataset("mteb/amazon_reviews_multi", lang, split="test").to_pandas()
    d["stars"] = d.label + 1                      # label is 0..4
    d = d[d.stars != 3].sample(300, random_state=0)
    s = sentiment_scores(d.text.str[:400].tolist())
    acc = ((s > 0) == (d.stars >= 4)).mean()
    rows.append({"lang": lang, "accuracy": round(float(acc), 3), "n": len(d)})
sent_eval = pd.DataFrame(rows); print(sent_eval)
sent_eval.plot.bar(x="lang", y="accuracy", legend=False, ylim=(0.5, 1)); plt.title("Sentiment accuracy by language"); plt.show()
""")
md("### 5.3 Theme extraction (ground-truth aspects in the demo set)")
code("""
EXPECTED = {"battery": 1, "sound": 1, "comfort": 1, "mic": -1, "bluetooth": -1}   # expected sentiment sign
aspects = {r["id"]: set(r["aspects"]) for r in DEMO["reviews"] if not r["is_spam"]}
rows = []
for a, sign in EXPECTED.items():
    gold = {i for i, s in aspects.items() if a in s}
    best = max(res.themes, key=lambda t: len(gold & set(t.review_ids)) / max(1, len(gold | set(t.review_ids))), default=None)
    if best is None: continue
    jac = len(gold & set(best.review_ids)) / len(gold | set(best.review_ids))
    rows.append({"aspect": a, "best_theme": best.label, "jaccard": round(jac, 3),
                 "sentiment": best.sentiment, "sign_correct": (best.sentiment > 0) == (sign > 0)})
theme_eval = pd.DataFrame(rows); print(theme_eval)
print("aspect recall (jaccard>=0.3):", (theme_eval.jaccard >= 0.3).mean(), "| sign accuracy:", theme_eval.sign_correct.mean())
""")
md("### 5.4 Summary quality (ROUGE / BERTScore vs. reference summaries)")
code("""
# Hand-written reference summary for the demo product (extend with more products for a stronger evaluation)
REFERENCES = {
    "en": "Shoppers love the long battery life, strong sound quality and comfortable fit. "
          "The most common complaints are poor microphone quality and Bluetooth connection drops.",
}
import evaluate
rouge = evaluate.load("rouge"); bert = evaluate.load("bertscore")
cand = res.blurb or "; ".join(t.label for t in res.pros + res.cons)
r = rouge.compute(predictions=[cand], references=[REFERENCES["en"]])
b = bert.compute(predictions=[cand], references=[REFERENCES["en"]], model_type="xlm-roberta-large")
summ_eval = {**{k: round(float(v), 3) for k, v in r.items()}, "bertscore_f1": round(float(b["f1"][0]), 3)}
print(cand, "\\n", summ_eval)
""")

md("## 6. Export results for the report")
code("""
out = {
    "spam_english_test": spam_test_metrics,
    "spam_demo": {"report": classification_report(y, pred, output_dict=True), "ablation": ablation.to_dict()},
    "sentiment_by_language": sent_eval.to_dict("records"),
    "themes": theme_eval.to_dict("records"),
    "summary": summ_eval,
}
Path("docs").mkdir(exist_ok=True)
json.dump(out, open("docs/evaluation_results.json", "w"), indent=2, default=float)
# Download the fine-tuned spam model + results (so the local app can use them):
!zip -qr spam-xlmr.zip models/spam-xlmr docs/evaluation_results.json
# from google.colab import files; files.download("spam-xlmr.zip")
print("saved docs/evaluation_results.json and spam-xlmr.zip")
""")

md("""
## 7. Start the GPU worker and get its public URL
Your **FastAPI server runs on your own machine**; this notebook is only the GPU worker. It serves
embeddings (BGE-M3), sentiment, the spam classifier and the LLM (proxied to vLLM) behind **one** URL, protected
by a random token, through a free Cloudflare quick tunnel (no account needed).

Run after section 3 (vLLM must be running). Then paste the two printed lines into `server/.env` on your machine and restart
the local server. The URL and token change every session; the session ends when Colab disconnects.
""")
code("""
import os, re, secrets, subprocess, time, httpx
WORKER_TOKEN = secrets.token_urlsafe(24)
env = {**os.environ, "WORKER_TOKEN": WORKER_TOKEN, "VLLM_URL": "http://localhost:8001/v1",
       "SPAM_MODEL_DIR": "models/spam-xlmr", "NLP_REMOTE_URL": ""}
worker = subprocess.Popen(["python", "-m", "uvicorn", "app.inference_server:app", "--host", "127.0.0.1", "--port", "9000"],
                          env=env, cwd="/content/server", stdout=open("/content/worker.log", "w"), stderr=subprocess.STDOUT)
H = {"X-Worker-Token": WORKER_TOKEN}
for _ in range(60):
    try:
        if httpx.get("http://localhost:9000/health", headers=H, timeout=2).status_code == 200: break
    except Exception: time.sleep(2)
else:
    print(open("/content/worker.log").read()[-2000:]); raise RuntimeError("worker did not start")
print("worker is up on :9000")
""")
code("""
# Warm-up: loads BGE-M3 + XLM-R onto the GPU so the first real request is fast
t = time.time()
e = httpx.post("http://localhost:9000/embed", json={"texts": ["warm up", "Der Akku hält ewig."]}, headers=H, timeout=300).json()
s = httpx.post("http://localhost:9000/sentiment", json={"texts": ["great", "terrible"]}, headers=H, timeout=300).json()
p = httpx.post("http://localhost:9000/spam", json={"texts": ["BEST PRODUCT EVER!!!"]}, headers=H, timeout=300).json()
l = httpx.post("http://localhost:9000/v1/chat/completions", headers=H, timeout=300,
               json={"model": LLM, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5}).json()
print(f"{time.time()-t:.0f}s | embed shape {e['shape']} | sentiment {s['scores']} | spam {p['probs']} | llm {l['choices'][0]['message']['content']!r}")
""")
code("""
!wget -q -O /content/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && chmod +x /content/cloudflared
tunnel = subprocess.Popen(["/content/cloudflared", "tunnel", "--url", "http://localhost:9000", "--no-autoupdate"],
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
PUBLIC_URL = None
for line in tunnel.stdout:
    m = re.search(r"https://[a-z0-9-]+[.]trycloudflare[.]com", line)
    if m: PUBLIC_URL = m.group(0); break
print("Paste these two lines into server/.env on your machine, then restart the local server:\\n")
print(f"NLP_REMOTE_URL={PUBLIC_URL}")
print(f"WORKER_TOKEN={WORKER_TOKEN}")
""")
code("""
# Optional check from outside: the token must be required
print("without token:", httpx.post(f"{PUBLIC_URL}/embed", json={"texts": ["x"]}, timeout=30).status_code, "(expected 401)")
print("with token:   ", httpx.post(f"{PUBLIC_URL}/embed", json={"texts": ["x"]}, headers=H, timeout=60).status_code, "(expected 200)")
# Keep the Colab session alive while you use the app: this cell must stay running or the runtime must stay connected.
""")

nb = {
    "cells": cells,
    "metadata": {
        "accelerator": "GPU",
        "colab": {"gpuType": "L4", "provenance": []},
        "kernelspec": {"display_name": "Python 3", "name": "python3"},
        "language_info": {"name": "python"},
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}
out = Path(__file__).resolve().parent.parent / "notebooks" / "pipeline_colab.ipynb"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf8")
print("wrote", out, len(cells), "cells")
