# Multilingual Review Summarizer: API / NLP server

FastAPI service that turns hundreds of product reviews (any language) into **pros, cons, themes and a short summary**,
after filtering likely spam/fake reviews. **Stateless: no database, no auth, no stored data.**
The only state is a 10-minute in-memory cache of SerpAPI responses.

## Architecture

```
Next.js client (localhost:3000)
      │
      ▼
FastAPI server (your machine, :8000)   ← preprocessing, language ID, MinHash/heuristic spam, clustering, ranking
      │  HTTPS + X-Worker-Token
      ▼
GPU worker (Google Colab, L4)          ← BGE-M3 embeddings, XLM-R sentiment, XLM-R spam classifier, Qwen2.5-7B via vLLM
```

Pipeline: clean + language ID (lingua) → spam filter (fine-tuned XLM-R + MinHash near-duplicates + heuristics) → sentences →
embeddings (`BAAI/bge-m3`) + sentiment (`cardiffnlp/twitter-xlm-roberta-base-sentiment`) → HDBSCAN theme clusters →
sentiment-weighted ranking `score = log(1+mentions) × mean sentiment` → LLM (`Qwen2.5-7B-Instruct-AWQ`) names the themes and
writes the blurb in the requested language. The LLM only *labels* clusters built from real review sentences, so every claim
traces back to quotes. Without a worker/LLM the API falls back to extractive labels.

Live data comes from SerpAPI's **Walmart** engines (search + paginated reviews, 20/page). A bundled multilingual demo set
(with a planted spam campaign) is served at `/api/demo/reviews`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | |
| GET | `/api/products/search?q=` | SerpAPI Walmart search |
| GET | `/api/products/{id}/reviews?pages=3` | SerpAPI Walmart reviews (1 credit per page) |
| GET | `/api/demo/reviews` | bundled multilingual sample |
| POST | `/api/analyze` | `{reviews:[...]}` or `{product_id}`, plus `filter_spam`, `lang` |

Interactive docs: `http://localhost:8000/docs`

## Setup

### 1. Run the local API

```bash
cd server
cp .env.example .env          # add SERP_API_KEY (live search); leave NLP_REMOTE_URL empty for now
uv sync                       # light dependencies only (no torch needed locally)
uv run python scripts/make_demo_data.py
uv run python server.py       # http://localhost:8000
```

Restart the server after code or `.env` changes (auto-reload is unreliable on Windows).
Without the worker, `/api/analyze` returns 503 and reviews still load.

### 2. Start the GPU worker in Google Colab

1. Open `notebooks/pipeline_colab.ipynb` in Colab (upload it, or open from GitHub) → **Runtime → L4 GPU + High-RAM**.
2. Run **section 1** (it clones this repo and installs dependencies).
3. *(Optional)* **Section 2** fine-tunes the spam classifier (saved to `models/spam-xlmr` inside Colab).
4. Run **section 3** (starts vLLM + Qwen).
5. Run **section 7**. It starts the worker, warms up the models, opens a free Cloudflare tunnel and prints:

   ```
   NLP_REMOTE_URL=https://xxxx.trycloudflare.com
   WORKER_TOKEN=...
   ```
6. Paste those two lines into `server/.env`, restart the local server, and open the client. The URL/token change every Colab session.

Sections 4–6 of the notebook run the full pipeline and evaluation (spam precision/recall/F1/ROC-AUC with ablation, sentiment
accuracy per language, theme recall, ROUGE/BERTScore) and write `docs/evaluation_results.json`.

### 3. Client

```bash
cd client
pnpm install
pnpm dev                      # http://localhost:3000  (API defaults to http://localhost:8000)
```

## Running everything on one GPU machine instead (Docker)

Needs Linux/WSL2 with an NVIDIA GPU (≥ 24 GB) and the NVIDIA Container Toolkit:

```bash
cd server
cp .env.example .env
docker compose up --build     # vLLM on :8001 + API on :8000 (models run in-process, NLP_REMOTE_URL stays empty)
```

First start downloads ~20 GB of models into the `hf-cache` volume. No GPU? Local CPU also works:
`uv sync --group gpu` and set `DEVICE=cpu`, `LLM_ENABLED=false` (slower, extractive labels, no blurb).

## Configuration (`.env`)

| Variable | Default | |
|---|---|---|
| `SERP_API_KEY` | | live search (server-side only; never put it in the client) |
| `CORS_ORIGINS` | `http://localhost:3000` | localhost/127.0.0.1 on any port is always allowed |
| `NLP_REMOTE_URL` / `WORKER_TOKEN` | empty | Colab GPU worker; when set, models run there |
| `EMBED_MODEL` | `BAAI/bge-m3` | or `intfloat/multilingual-e5-large` |
| `SENTIMENT_MODEL` | `cardiffnlp/twitter-xlm-roberta-base-sentiment` | |
| `SPAM_MODEL_DIR` | `models/spam-xlmr` | optional; MinHash + heuristics still run without it |
| `LLM_BASE_URL` / `LLM_MODEL` / `LLM_ENABLED` | vLLM @ `:8001`, Qwen AWQ, `true` | used only when no remote worker |
| `DEVICE` | `auto` | `cuda` / `cpu` (local model mode) |
| `SPAM_THRESHOLD` | `0.6` | |

## Layout

```
server.py                 app entry (local API)
app/routes/               health, products, analyze, demo
app/middleware.py         CORS, gzip, request id, in-memory rate limit, error handlers
app/services/             SerpAPI client + in-memory cache
app/nlp/                  preprocess, spam, embed, sentiment, themes, llm, pipeline, remote
app/inference_server.py   GPU worker (runs in Colab)
notebooks/                pipeline_colab.ipynb (setup, training, worker, evaluation)
scripts/                  make_demo_data.py, build_notebook.py (regenerates the notebook)
data/demo/                multilingual sample + ground truth
```

Regenerate the notebook after editing `scripts/build_notebook.py`: `uv run python scripts/build_notebook.py`.

## Security notes

The worker's tunnel URL is public; every route requires the `X-Worker-Token` header. Don't share the URL/token, and stop the
Colab runtime when done. The SerpAPI key lives only in `server/.env` (git-ignored).
