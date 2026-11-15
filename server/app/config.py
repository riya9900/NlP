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

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
