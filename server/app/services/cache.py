from cachetools import TTLCache

from app.config import get_settings

# Process memory only; wiped on restart. No database, no persistence.
_cache: TTLCache = TTLCache(maxsize=256, ttl=get_settings().cache_ttl_seconds)


def cache_get(key: str):
    return _cache.get(key)


def cache_set(key: str, value) -> None:
    _cache[key] = value
