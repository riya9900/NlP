from fastapi import APIRouter, Query

from app.schemas import ProductSearchResponse, ReviewsResponse
from app.services import serpapi

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/search", response_model=ProductSearchResponse)
async def search(q: str = Query(min_length=2)):
    return ProductSearchResponse(query=q, products=await serpapi.search_products(q))


@router.get("/{product_id}/reviews", response_model=ReviewsResponse)
async def reviews(product_id: str, pages: int = Query(3, ge=1, le=10, description="20 reviews per page")):
    items = await serpapi.fetch_reviews(product_id, pages)
    return ReviewsResponse(product_id=product_id, count=len(items), reviews=items)
