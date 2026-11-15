from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PKG_ROOT = Path(__file__).resolve().parent.parent  # R:\nlp\nlp


class NLPSettings(BaseSettings):
    """Read from environment / the .env of whoever imports the package (the server)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # all models are small enough to run on CPU; set DEVICE=cuda if you have a GPU
    embed_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    sentiment_model: str = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
    llm_model: str = "Qwen/Qwen2.5-0.5B-Instruct"  # lightweight local transformer for labels + summary
    llm_enabled: bool = True
    llm_blurb: bool = False  # tiny models write weak prose; default = faithful template from the themes
    spam_model_path: str = str(PKG_ROOT / "models" / "spam.joblib")
    device: str = "auto"  # auto | cpu | cuda

    spam_threshold: float = 0.7
    minhash_threshold: float = 0.8
    min_cluster_size: int = 4
    max_themes: int = 8


@lru_cache
def get_nlp_settings() -> NLPSettings:
    return NLPSettings()
