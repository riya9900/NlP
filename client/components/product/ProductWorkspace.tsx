"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Sparkles,
  Star,
} from "lucide-react";
import { analyzeReviews, ApiError, fetchReviews } from "@/lib/api";
import type { Review, ReviewAnnotation, SummaryResponse } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import SummaryCard from "./SummaryCard";
import ThemeChart from "./ThemeChart";
import ReviewList from "./ReviewList";

export default function ProductWorkspace({
  productId,
  title,
}: {
  productId: string;
  title?: string;
}) {
  const toast = useToast();

  const [resolvedProductId, setResolvedProductId] = useState<string>(productId);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [reviewsError, setReviewsError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  const [analysis, setAnalysis] = useState<SummaryResponse | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  const [filterSpam, setFilterSpam] = useState<boolean>(true);
  const [summaryLang, setSummaryLang] = useState<string>("en");
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);

  const analyzeAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeToastIdRef = useRef<string | null>(null);
  const hasCompletedFirstAnalysisRef = useRef<boolean>(false);

  const runAnalyze = useCallback(
    async (
      reviewsInput: Review[],
      nextFilterSpam: boolean,
      nextLang: string,
      isFirstRun: boolean,
    ) => {
      if (reviewsInput.length === 0) return;

      analyzeAbortRef.current?.abort();
      const controller = new AbortController();
      analyzeAbortRef.current = controller;

      if (activeToastIdRef.current) {
        toast.dismiss(activeToastIdRef.current);
      }

      setAnalyzing(true);
      setAnalyzeError(null);

      const toastId = toast.loading(
        "Analyzing reviews…",
        isFirstRun
          ? "First run loads NLP models (30–60 s). Reviews are usable now."
          : `Updating summary (${nextLang.toUpperCase()}${nextFilterSpam ? ", spam filtered" : ", all reviews"})`,
      );
      activeToastIdRef.current = toastId;

      try {
        // /api/analyze accepts at most 2000 reviews
        const payloadReviews = reviewsInput.slice(0, 2000);
        const res = await analyzeReviews(
          {
            reviews: payloadReviews,
            filter_spam: nextFilterSpam,
            lang: nextLang,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        hasCompletedFirstAnalysisRef.current = true;
        setAnalysis(res);
        setSelectedThemeId((prev) =>
          prev !== null && res.themes.some((t) => t.id === prev) ? prev : null,
        );

        toast.update(toastId, {
          variant: "success",
          title: "Analysis complete",
          description: `Analyzed ${res.analyzed_reviews} of ${res.total_reviews} reviews · ${res.spam_removed} flagged as spam`,
          duration: 3500,
        });
        activeToastIdRef.current = null;
      } catch (err) {
        if (controller.signal.aborted) {
          toast.dismiss(toastId);
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : "Analysis service is starting or unavailable. Reviews are still shown.";
        const detail = err instanceof ApiError ? err.detail : undefined;
        setAnalyzeError({ message, detail });
        toast.update(toastId, {
          variant: "warning",
          title: message,
          description: detail,
          duration: 6000,
        });
        activeToastIdRef.current = null;
      } finally {
        if (!controller.signal.aborted) {
          setAnalyzing(false);
        }
      }
    },
    [toast],
  );

  // Step 1: Load reviews on mount, then immediately trigger analysis
  useEffect(() => {
    const fetchController = new AbortController();
    const loadToastId = toast.loading(
      productId === "demo" ? "Loading demo reviews…" : "Fetching product reviews…",
    );

    fetchReviews(productId, fetchController.signal)
      .then((res) => {
        if (fetchController.signal.aborted) return;
        toast.dismiss(loadToastId);

        setResolvedProductId(res.product_id || productId);
        const normalized = res.reviews.map((r, idx) => ({
          ...r,
          id: r.id ?? String(idx),
        }));
        setReviews(normalized);
        setReviewsLoading(false);

        if (normalized.length > 0) {
          runAnalyze(normalized, true, "en", true);
        }
      })
      .catch((err) => {
        if (fetchController.signal.aborted) {
          toast.dismiss(loadToastId);
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : "Couldn’t fetch from the review source";
        const detail = err instanceof ApiError ? err.detail : undefined;
        setReviewsError({ message, detail });
        setReviewsLoading(false);
        toast.update(loadToastId, {
          variant: "error",
          title: message,
          description: detail,
          duration: 6000,
        });
      });

    return () => {
      fetchController.abort();
      analyzeAbortRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      toast.dismiss(loadToastId);
      if (activeToastIdRef.current) {
        toast.dismiss(activeToastIdRef.current);
      }
    };
  }, [productId, runAnalyze, toast]);

  const scheduleReanalyze = useCallback(
    (nextFilterSpam: boolean, nextLang: string) => {
      if (reviews.length === 0) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        runAnalyze(
          reviews,
          nextFilterSpam,
          nextLang,
          !hasCompletedFirstAnalysisRef.current,
        );
      }, 350);
    },
    [reviews, runAnalyze],
  );

  const handleToggleSpam = (next: boolean) => {
    setFilterSpam(next);
    scheduleReanalyze(next, summaryLang);
  };

  const handleChangeLang = (next: string) => {
    setSummaryLang(next);
    scheduleReanalyze(filterSpam, next);
  };

  const annotationsMap = useMemo(() => {
    const map = new Map<string, ReviewAnnotation>();
    if (analysis?.annotations) {
      for (const ann of analysis.annotations) {
        map.set(ann.id, ann);
      }
    }
    return map;
  }, [analysis]);

  const selectedTheme = useMemo(() => {
    if (selectedThemeId === null || !analysis?.themes) return null;
    return analysis.themes.find((t) => t.id === selectedThemeId) ?? null;
  }, [selectedThemeId, analysis]);

  const averageRating = useMemo(() => {
    const rated = reviews.filter((r) => typeof r.rating === "number");
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / rated.length;
  }, [reviews]);

  const isDemo = productId === "demo";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Product Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-md border border-neutral-300 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs text-neutral-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Search
            </Link>
            <span>/</span>
            <span>Product Analysis</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              {isDemo
                ? "Aurora X1 Wireless Headphones"
                : (title || `Product #${resolvedProductId}`)}
            </h1>
            {isDemo && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Multilingual Demo Dataset
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {averageRating !== null && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-neutral-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{averageRating.toFixed(2)} avg rating</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
            <span>{reviewsLoading ? "Loading…" : `${reviews.length} reviews`}</span>
          </div>
          <Link
            href="/evaluation"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
            Model Metrics
          </Link>
        </div>
      </div>

      {/* Reviews Fetch Error */}
      {reviewsError && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50/80 p-5 text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold">{reviewsError.message}</p>
            {reviewsError.detail && reviewsError.detail !== reviewsError.message && (
              <p className="mt-1 text-xs text-red-700">{reviewsError.detail}</p>
            )}
            <div className="mt-3 flex gap-2">
              <Link
                href="/"
                className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Return home
              </Link>
              {!isDemo && (
                <Link
                  href="/product/demo"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Open demo product
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Stack */}
      {!reviewsError && (reviewsLoading || reviews.length > 0) && (
        <div className="space-y-6">
          {/* 1. Summary Card */}
          <SummaryCard
            analysis={analysis}
            analyzing={analyzing}
            reviewCount={reviews.length}
            analyzeError={analyzeError}
            filterSpam={filterSpam}
            onToggleSpam={handleToggleSpam}
            summaryLang={summaryLang}
            onChangeLang={handleChangeLang}
            selectedThemeId={selectedThemeId}
            onSelectTheme={setSelectedThemeId}
            onRetryAnalyze={() =>
              runAnalyze(
                reviews,
                filterSpam,
                summaryLang,
                !hasCompletedFirstAnalysisRef.current,
              )
            }
            hasReviews={reviews.length > 0}
          />

          {/* 2. Theme Chart (shown once reviews exist & either analyzing or themes available) */}
          {(analyzing || (analysis && analysis.themes.length > 0)) && (
            <ThemeChart
              themes={analysis?.themes ?? []}
              analyzing={analyzing}
              selectedThemeId={selectedThemeId}
              onSelectTheme={setSelectedThemeId}
            />
          )}

          {/* 3. Review List (rendered immediately as soon as reviews load!) */}
          <ReviewList
            reviews={reviews}
            annotationsMap={annotationsMap}
            loading={reviewsLoading}
            selectedTheme={selectedTheme}
            onClearTheme={() => setSelectedThemeId(null)}
          />
        </div>
      )}

      {/* Empty Reviews when fetch succeeded with 0 reviews */}
      {!reviewsError && !reviewsLoading && reviews.length === 0 && (
        <ReviewList
          reviews={[]}
          annotationsMap={annotationsMap}
          loading={false}
          selectedTheme={null}
          onClearTheme={() => setSelectedThemeId(null)}
        />
      )}
    </main>
  );
}
