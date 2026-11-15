"""Data models shared by the NLP package and the API (single source of truth)."""

from pydantic import BaseModel


class Review(BaseModel):
    id: str | None = None
    text: str
    rating: float | None = None
    title: str | None = None
    date: str | None = None
    source: str | None = None
    language: str | None = None
    author: str | None = None  # optional spam signal; never stored


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
