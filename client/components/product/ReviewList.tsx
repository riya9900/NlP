"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquareOff,
  Search,
  ShieldAlert,
  Star,
  X,
} from "lucide-react";
import type { Review, ReviewAnnotation, Theme } from "@/lib/types";

interface ReviewListProps {
  reviews: Review[];
  annotationsMap: Map<string, ReviewAnnotation>;
  loading: boolean;
  selectedTheme: Theme | null;
  onClearTheme: () => void;
}

type SentimentFilter = "all" | "positive" | "neutral" | "negative";

const PAGE_SIZE = 25;

function sentimentDotInfo(sentiment?: number): {
  color: string;
  label: string;
} {
  if (sentiment === undefined) {
    return { color: "bg-neutral-300", label: "Pending analysis" };
  }
  if (sentiment > 0.15) {
    return { color: "bg-emerald-500", label: `Positive (${sentiment.toFixed(2)})` };
  }
  if (sentiment < -0.15) {
    return { color: "bg-red-500", label: `Negative (${sentiment.toFixed(2)})` };
  }
  return { color: "bg-neutral-400", label: `Neutral (${sentiment.toFixed(2)})` };
}

function highlightMatchingSentences(text: string, quotes: string[]): React.ReactNode {
  if (!quotes || quotes.length === 0) return text;

  const cleanedQuotes = quotes
    .map((q) => q.trim())
    .filter((q) => q.length >= 4);
  if (cleanedQuotes.length === 0) return text;

  // Escape regex specials and match longest quotes first
  const sorted = [...cleanedQuotes].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const isMatch = sorted.some((q) => q.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="rounded-md bg-amber-200/80 px-1 py-0.5 font-medium text-neutral-900"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export default function ReviewList({
  reviews,
  annotationsMap,
  loading,
  selectedTheme,
  onClearTheme,
}: ReviewListProps) {
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [pageState, setPageState] = useState<{ filterKey: string; page: number }>({
    filterKey: "",
    page: 1,
  });

  const filterKey = `${selectedTheme?.id ?? "none"}|${languageFilter}|${sentimentFilter}|${ratingFilter}|${searchText}`;
  const page = pageState.filterKey === filterKey ? pageState.page : 1;
  const setPage = (updater: number | ((prev: number) => number)) => {
    setPageState((prev) => {
      const current = prev.filterKey === filterKey ? prev.page : 1;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { filterKey, page: next };
    });
  };

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const r of reviews) {
      const ann = annotationsMap.get(r.id);
      const code = (ann?.language || r.language || "").toLowerCase();
      if (code && code !== "und") langs.add(code);
    }
    return Array.from(langs).sort();
  }, [reviews, annotationsMap]);

  const themeReviewSet = useMemo(() => {
    if (!selectedTheme) return null;
    return new Set(selectedTheme.review_ids);
  }, [selectedTheme]);

  const filteredReviews = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return reviews.filter((r) => {
      const ann = annotationsMap.get(r.id);
      const lang = (ann?.language || r.language || "und").toLowerCase();

      if (themeReviewSet && !themeReviewSet.has(r.id)) return false;
      if (languageFilter !== "all" && lang !== languageFilter) return false;

      if (sentimentFilter !== "all") {
        if (!ann) return false;
        if (sentimentFilter === "positive" && ann.sentiment <= 0.15) return false;
        if (sentimentFilter === "negative" && ann.sentiment >= -0.15) return false;
        if (
          sentimentFilter === "neutral" &&
          (ann.sentiment > 0.15 || ann.sentiment < -0.15)
        ) {
          return false;
        }
      }

      if (ratingFilter !== "all") {
        const target = Number(ratingFilter);
        if (r.rating == null || Math.round(r.rating) !== target) return false;
      }

      if (q) {
        const hay = `${r.title ?? ""} ${r.text} ${r.author ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    reviews,
    annotationsMap,
    themeReviewSet,
    languageFilter,
    sentimentFilter,
    ratingFilter,
    searchText,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedReviews = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredReviews.slice(start, start + PAGE_SIZE);
  }, [filteredReviews, safePage]);

  const hasActiveFilters =
    selectedTheme !== null ||
    languageFilter !== "all" ||
    sentimentFilter !== "all" ||
    ratingFilter !== "all" ||
    searchText.trim().length > 0;

  const resetAllFilters = () => {
    onClearTheme();
    setLanguageFilter("all");
    setSentimentFilter("all");
    setRatingFilter("all");
    setSearchText("");
  };

  return (
    <section className="rounded-md border border-neutral-300 bg-white shadow-xs">
      {/* Header + Filter Controls */}
      <div className="border-b border-neutral-300 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Customer Reviews</h2>
            <p className="text-xs text-neutral-500">
              {loading
                ? "Loading reviews from source…"
                : `Showing ${filteredReviews.length} of ${reviews.length} reviews`}
            </p>
          </div>

          {/* Active Theme Filter Chip + Clear Filter */}
          {selectedTheme && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-neutral-900">
                <Filter className="h-3 w-3 text-amber-600" />
                Theme: {selectedTheme.label}
              </span>
              <button
                type="button"
                onClick={onClearTheme}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search review text..."
              aria-label="Search reviews"
              className="h-9 w-full rounded-md border border-neutral-300 bg-neutral-100 pl-8 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <select
            aria-label="Filter by language"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="h-9 cursor-pointer rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All languages</option>
            {availableLanguages.map((code) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by sentiment"
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value as SentimentFilter)}
            className="h-9 cursor-pointer rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>

          <select
            aria-label="Filter by star rating"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 cursor-pointer rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 cursor-pointer rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton Rows */}
      {loading && (
        <div className="divide-y divide-neutral-300">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="space-y-2.5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 animate-pulse rounded-md bg-amber-100" />
                  <div className="h-5 w-10 animate-pulse rounded-md bg-blue-50" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded-md bg-neutral-100" />
              </div>
              <div className="h-4 w-full animate-pulse rounded-md bg-neutral-200" />
              <div className="h-4 w-4/5 animate-pulse rounded-md bg-neutral-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty Reviews State */}
      {!loading && reviews.length === 0 && (
        <div className="p-12 text-center">
          <MessageSquareOff className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-sm font-semibold text-neutral-900">No reviews found</p>
          <p className="mt-1 text-xs text-neutral-500">
            This product did not return any customer reviews.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && reviews.length > 0 && filteredReviews.length === 0 && (
        <div className="p-10 text-center">
          <p className="text-sm font-semibold text-neutral-900">No reviews match current filters</p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-3 cursor-pointer rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Review Rows */}
      {!loading && paginatedReviews.length > 0 && (
        <ul className="divide-y divide-neutral-300">
          {paginatedReviews.map((r) => {
            const ann = annotationsMap.get(r.id);
            const lang = (ann?.language || r.language || "und").toUpperCase();
            const isSpam = ann?.is_spam ?? false;
            const dot = sentimentDotInfo(ann?.sentiment);

            return (
              <li
                key={r.id}
                className={`p-5 transition-colors ${
                  isSpam ? "bg-neutral-100 opacity-60 hover:opacity-85" : "hover:bg-blue-50/20"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Star Rating */}
                    {r.rating != null && (
                      <div
                        className="inline-flex items-center gap-0.5"
                        aria-label={`${r.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.round(r.rating!)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-neutral-100 text-neutral-300"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs font-semibold text-neutral-700">
                          {r.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Language Badge */}
                    <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-800">
                      {lang}
                    </span>

                    {/* Sentiment Dot */}
                    <span
                      title={dot.label}
                      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-600"
                    >
                      <span className={`h-2 w-2 rounded-md ${dot.color}`} />
                      {ann ? (
                        <span>
                          {ann.sentiment > 0.15
                            ? "Positive"
                            : ann.sentiment < -0.15
                              ? "Negative"
                              : "Neutral"}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Pending</span>
                      )}
                    </span>

                    {/* Likely Fake Badge with tooltip */}
                    {isSpam && (
                      <div className="group relative inline-flex">
                        <span
                          tabIndex={0}
                          className="inline-flex cursor-help items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          Likely fake
                        </span>
                        {ann?.spam_reasons && ann.spam_reasons.length > 0 && (
                          <div className="pointer-events-none invisible absolute left-0 top-full z-30 mt-1.5 w-64 rounded-md border border-red-200 bg-white p-2.5 opacity-0  transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                            <p className="text-[11px] font-semibold text-red-700">
                              Spam signals ({(ann.spam_score * 100).toFixed(0)}%):
                            </p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-neutral-700">
                              {ann.spam_reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    {r.author && <span className="font-medium text-neutral-500">{r.author}</span>}
                    {r.source && <span>· {r.source}</span>}
                    {r.date && <span>· {r.date}</span>}
                  </div>
                </div>

                {r.title && (
                  <h3 className="mt-2 text-sm font-semibold text-neutral-900">{r.title}</h3>
                )}

                <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                  {selectedTheme
                    ? highlightMatchingSentences(r.text, selectedTheme.quotes)
                    : r.text}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-300 px-5 py-3.5 text-xs text-neutral-600">
          <span>
            Page <strong className="text-neutral-900">{safePage}</strong> of{" "}
            <strong className="text-neutral-900">{totalPages}</strong> ({filteredReviews.length}{" "}
            matching)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
