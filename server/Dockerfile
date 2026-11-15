# GPU image for the review-summarizer API (embeddings + sentiment + spam run in-process).
# The LLM (Qwen2.5-7B-Instruct-AWQ) runs in a separate vLLM container: see docker-compose.yml.
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    HF_HOME=/hf-cache

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# dependencies first (cached layer); `gpu` group = torch, transformers, sentence-transformers
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --group gpu --python 3.12

COPY . .
RUN uv sync --frozen --group gpu

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s CMD curl -fs http://localhost:8000/health || exit 1

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
