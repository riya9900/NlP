from pydantic import BaseModel, Field

from reviewnlp.models import Review, ReviewAnnotation, SummaryResponse, Theme  # noqa: F401 (re-exported)


class Product(BaseModel):
    product_id: str
    title: str
    price: str | None = None
    rating: float | None = None
    reviews_count: int | None = None
    thumbnail: str | None = None
    source: str | None = None


class ProductSearchResponse(BaseModel):
    query: str
    products: list[Product]


class ReviewsResponse(BaseModel):
    product_id: str
    count: int
    reviews: list[Review]


class AnalyzeRequest(BaseModel):
    """Stateless: the client sends the reviews, or a product_id to fetch them."""

    product_id: str | None = None
    reviews: list[Review] | None = Field(default=None, max_length=2000)
    filter_spam: bool = True
    lang: str = "en"  # language of the generated summary
