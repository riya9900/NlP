# ReviewLens: multilingual product review summarizer

Pros, cons, themes and a short summary for any product's reviews (any language), after filtering spam/fake reviews.
Everything runs locally on CPU. No database, no accounts, nothing is stored.

```
client/   Next.js UI                      http://localhost:3000
server/   FastAPI API (SerpAPI + routes)  http://localhost:8000   -> calls the nlp package R:\nlp\server>uv run python server.py
nlp/      reviewnlp: all the NLP code (own project, no web code)
```

## Run

First time only:

```bash
cd server && cp .env.example .env     # put your SERP_API_KEY in it
uv sync                               # installs the API + the nlp package (torch CPU etc.)
uv run python ../nlp/scripts/train_spam.py     # ~1 min, trains the spam classifier
uv run python scripts/make_demo_data.py        # bundled multilingual demo reviews
cd ../client && pnpm install
```

Every time (two terminals), or just double-click `start.bat`:

```bash
cd server && uv run python server.py     # API
cd client && pnpm dev                    # UI -> open http://localhost:3000
```

The first analysis downloads three small models (~2.5 GB, once) and takes a few minutes; later runs take 20-40 s.
Restart the server after code or `.env` changes.

## What the NLP package does (`nlp/reviewnlp`)

| Step | Model / method |
|---|---|
| Language ID | lingua |
| Spam / fake | TF-IDF + logistic regression (trained by `scripts/train_spam.py`) + MinHash near-duplicates + rules (same author, shouting, promo wording, rating/text mismatch) |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` (50+ languages) |
| Sentiment | `cardiffnlp/twitter-xlm-roberta-base-sentiment` |
| Themes | HDBSCAN on sentence embeddings, ranked by `log(1+mentions) x mean sentiment`; same-label clusters merged |
| Labels | `Qwen2.5-0.5B-Instruct` (local, small) with TF-IDF keyword fallback |
| Summary | built from the ranked pros/cons (faithful, no invented claims); optional LLM paraphrase with `LLM_BLURB=true` |

Config (all optional, in `server/.env`): `EMBED_MODEL`, `SENTIMENT_MODEL`, `LLM_MODEL`, `LLM_ENABLED`, `LLM_BLURB`, `DEVICE` (cpu/cuda), `SPAM_THRESHOLD`.
Live data: SerpAPI Walmart engines (1 credit per 20 reviews). Demo data: `/product/demo`.

## API

`GET /health`, `GET /api/products/search?q=`, `GET /api/products/{id}/reviews?pages=3`, `GET /api/demo/reviews`,
`POST /api/analyze` with `{reviews:[...]}` or `{product_id}`, `filter_spam`, `lang`.
