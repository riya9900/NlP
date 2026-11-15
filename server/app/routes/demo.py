import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.schemas import Review, ReviewsResponse

router = APIRouter(prefix="/demo", tags=["demo"])
DEMO = Path(__file__).resolve().parents[2] / "data" / "demo" / "headphones.json"


@router.get("/reviews", response_model=ReviewsResponse)
async def demo_reviews():
    """Bundled multilingual sample (with a planted fake-review campaign) for demos without SerpAPI."""
    if not DEMO.exists():
        raise HTTPException(404, "Run `python scripts/make_demo_data.py` first")
    raw = json.loads(DEMO.read_text(encoding="utf8"))
    reviews = [
        Review(id=r["id"], text=r["text"], rating=r.get("rating"), language=r.get("language"),
               author=r.get("author"))
        for r in raw["reviews"]
    ]
    return ReviewsResponse(product_id="demo-headphones", count=len(reviews), reviews=reviews)
