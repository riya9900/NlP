from pydantic import BaseModel, Field


class Product(BaseModel):
    product_id: str
    title: str
    price: str | None = None
    rating: float | None = None
    reviews_count: int | None = None
    thumbnail: str | None = None
    source: str | None = None


class Review(BaseModel):
    id: str | None = None
    text: str
    rating: float | None = None
    title: str | None = None
    date: str | None = None
    source: str | None = None
    language: str | None = None
    author: str | None = None  # optional, used only as a spam signal; never stored


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


class Theme(BaseModel):
    id: int
    label: str
    mentions: int
    sentiment: float  # -1..1 mean sentence sentiment
    score: float  # sentiment-weighted rank score
    quotes: list[str] = []
    review_ids: list[str] = []


class ReviewAnnotation(BaseModel):
    id: str
    language: str
    sentiment: float
    spam_score: float
    is_spam: bool
    spam_reasons: list[str] = []
    theme_ids: list[int] = []


class SummaryResponse(BaseModel):
    blurb: str = ""
    pros: list[Theme] = []
    cons: list[Theme] = []
    themes: list[Theme] = []
    languages: dict[str, float] = {}
    total_reviews: int = 0
    analyzed_reviews: int = 0
    spam_removed: int = 0
    annotations: list[ReviewAnnotation] = []
    llm_used: bool = False
