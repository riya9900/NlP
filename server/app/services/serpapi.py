"""Live product + review source: SerpAPI Walmart engines.

(Google Shopping via SerpAPI only exposes 2-8 reviews per product, which is too few for NLP;
the Walmart reviews engine is paginated, 20 reviews/page.)
"""

import asyncio

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.schemas import Product, Review
from app.services.cache import cache_get, cache_set


async def _call(client: httpx.AsyncClient, params: dict) -> dict:
    s = get_settings()
    if not s.serp_api_key:
        raise HTTPException(503, "SERP_API_KEY is not configured on the server")
    key = repr(sorted(params.items()))
    if (hit := cache_get(key)) is not None:
        return hit
    try:
        r = await client.get(s.serp_api_base, params={**params, "api_key": s.serp_api_key})
        r.raise_for_status()
    except httpx.HTTPStatusError as e:
        code = e.response.status_code
        msg = "SerpAPI key rejected" if code in (401, 403) else (
            "SerpAPI quota exhausted" if code == 429 else f"SerpAPI returned HTTP {code}")
        raise HTTPException(502, msg) from e
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Could not reach SerpAPI ({type(e).__name__})") from e
    data = r.json()
    if "error" in data:
        raise HTTPException(502, f"SerpAPI: {data['error']}")
    cache_set(key, data)
    return data


def _price(p: dict) -> str | None:
    offer = p.get("primary_offer") or {}
    price = offer.get("offer_price") or offer.get("min_price")
    return f"${price}" if price is not None else None


async def search_products(query: str) -> list[Product]:
    async with httpx.AsyncClient(timeout=40) as client:
        data = await _call(client, {"engine": "walmart", "query": query})
    out: list[Product] = []
    seen: set[str] = set()
    for p in data.get("organic_results", []):
        pid = p.get("us_item_id")
        if not pid or str(pid) in seen:
            continue
        seen.add(str(pid))
        out.append(
            Product(
                product_id=str(pid),
                title=p.get("title", ""),
                price=_price(p),
                rating=p.get("rating"),
                reviews_count=p.get("reviews"),
                thumbnail=p.get("thumbnail"),
                source="Walmart",
            )
        )
    return out


async def fetch_reviews(product_id: str, pages: int = 3) -> list[Review]:
    """Fetch up to `pages` pages (20 reviews each) concurrently."""
    pages = max(1, min(pages, 10))
    async with httpx.AsyncClient(timeout=40) as client:
        first = await _call(client, {"engine": "walmart_product_reviews", "product_id": product_id})
        total_pages = len((first.get("pagination") or {}).get("other_pages") or {}) + 1
        rest = await asyncio.gather(
            *[
                _call(client, {"engine": "walmart_product_reviews", "product_id": product_id, "page": n})
                for n in range(2, min(pages, max(total_pages, 1)) + 1)
            ],
            return_exceptions=True,
        )
    out: list[Review] = []
    for page in [first, *[r for r in rest if isinstance(r, dict)]]:
        for r in page.get("reviews", []):
            text = (r.get("text") or "").strip()
            if not text:
                continue
            out.append(
                Review(
                    id=str(len(out)),
                    text=text,
                    rating=r.get("rating"),
                    title=r.get("title"),
                    date=r.get("date"),
                    source="Walmart",
                    author=r.get("user_nickname") or r.get("author"),
                )
            )
    return out
