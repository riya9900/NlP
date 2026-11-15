from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Review Summarizer API"
    serp_api_key: str = ""
    serp_api_base: str = "https://serpapi.com/search.json"
    cors_origins: str = "http://localhost:3000"
    # in-memory only (nothing persisted): cache upstream responses briefly
    cache_ttl_seconds: int = 600
    rate_limit_per_minute: int = 60

    # ---- NLP models (all run on GPU if available, e.g. an L4) ----
    embed_model: str = "BAAI/bge-m3"
    sentiment_model: str = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
    spam_model_dir: str = "models/spam-xlmr"  # produced by the notebook; optional
    device: str = "auto"  # auto | cuda | cpu

    # Remote GPU worker (Colab). If set, embeddings / sentiment / spam classifier / LLM all run there
    # and this server only does preprocessing, MinHash/heuristics, clustering and orchestration.
    nlp_remote_url: str = ""  # e.g. https://xxxx.trycloudflare.com
    worker_token: str = ""  # shared secret, sent as X-Worker-Token

    # LLM served by vLLM (OpenAI-compatible endpoint). Optional: falls back to extractive.
    llm_base_url: str = "http://localhost:8001/v1"
    llm_model: str = "Qwen/Qwen2.5-7B-Instruct-AWQ"
    llm_enabled: bool = True
    llm_timeout: int = 120

    # pipeline knobs
    spam_threshold: float = 0.6
    minhash_threshold: float = 0.8
    min_cluster_size: int = 4
    max_themes: int = 8

    @property
    def llm_url(self) -> str:
        if self.nlp_remote_url:
            return self.nlp_remote_url.rstrip("/") + "/v1"
        return self.llm_base_url.rstrip("/")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
