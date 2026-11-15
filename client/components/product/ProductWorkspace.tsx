"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Play,
  Star,
} from "lucide-react";
import { analyzeReviews, ApiError, fetchReviews, generateSummary, translateTexts } from "@/lib/api";
import type { Review, ReviewAnnotation, SummaryResponse } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import SummaryCard from "./SummaryCard";
import ThemeChart from "./ThemeChart";
import ReviewList from "./ReviewList";
import ProductAgent from "./ProductAgent";
import ProductVisuals from "./ProductVisuals";
import type { ProductContext } from "@/lib/agent-context";

export default function ProductWorkspace({
  productId,
  title,
  image,
}: {
  productId: string;
  title?: string;
  image?: string;
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
            lang: "en", // summary language is handled client-side (Groq writes English, MarianMT translates)
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
    // No re-analysis: the English summary + labels are translated on the CPU (MarianMT).
    setSummaryLang(next);
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


  const averageRating = useMemo(() => {
    const rated = reviews.filter((r) => typeof r.rating === "number");
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / rated.length;
  }, [reviews]);

  const isDemo = productId === "demo";

  // What the assistant may use: only the NLP results shown on this page.
  const agentContext = useMemo<ProductContext | null>(() => {
    if (!analysis || analyzing) return null;
    const slim = (t: { label: string; mentions: number; sentiment: number; quotes: string[] }) => ({
      label: t.label,
      mentions: t.mentions,
      sentiment: t.sentiment,
      quotes: t.quotes.slice(0, 3),
    });
    const stars: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const r of reviews) {
      if (r.rating) stars[String(Math.min(5, Math.max(1, Math.round(r.rating))))] += 1;
    }
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const spamReasons: Record<string, number> = {};
    for (const a of analysis.annotations) {
      if (a.sentiment > 0.15) sentimentCounts.positive += 1;
      else if (a.sentiment < -0.15) sentimentCounts.negative += 1;
      else sentimentCounts.neutral += 1;
      if (a.is_spam) {
        const key = (a.spam_reasons[0] ?? "flagged").replace(/\s*\(.*\)$/, "").replace(/\d+/g, "N");
        spamReasons[key] = (spamReasons[key] ?? 0) + 1;
      }
    }
    return {
      title: isDemo ? "Aurora X1 Wireless Headphones" : title || `Product #${resolvedProductId}`,
      avgRating: averageRating,
      reviewCount: analysis.total_reviews,
      analyzedCount: analysis.analyzed_reviews,
      spamRemoved: analysis.spam_removed,
      languages: analysis.languages,
      summary: analysis.blurb,
      pros: analysis.pros.map(slim),
      cons: analysis.cons.map(slim),
      themes: analysis.themes.map(slim),
      ratingDistribution: stars,
      sentimentCounts,
      spamReasons,
    };
  }, [analysis, analyzing, reviews, averageRating, title, resolvedProductId, isDemo]);

  // ---- Summary: Groq writes it (English) from the NLP results; MarianMT (CPU) translates it ----
  const [summaryEn, setSummaryEn] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<{
    lang: string;
    summary: string;
    labels: Record<string, string>;
  } | null>(null);
  const [translating, setTranslating] = useState(false);
  const translationCache = useRef(
    new Map<string, { lang: string; summary: string; labels: Record<string, string> }>(),
  );

  useEffect(() => {
    if (!agentContext) return;
    const ctrl = new AbortController();
    setSummaryLoading(true);
    setSummaryError(null);
    generateSummary(agentContext, ctrl.signal)
      .then((text) => setSummaryEn(text))
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setSummaryEn("");
        setSummaryError(e instanceof Error ? e.message : "Summary failed");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setSummaryLoading(false);
      });
    return () => ctrl.abort();
  }, [agentContext]);

  useEffect(() => {
    if (summaryLang === "en" || !agentContext) {
      setTranslation(null);
      return;
    }
    const labels = Array.from(
      new Set([...agentContext.pros, ...agentContext.cons, ...agentContext.themes].map((t) => t.label)),
    );
    const texts = [summaryEn || "", ...labels];
    if (!texts.some(Boolean)) return;
    const key = `${summaryLang}|${texts.join("|")}`;
    const hit = translationCache.current.get(key);
    if (hit) {
      setTranslation(hit);
      return;
    }
    const ctrl = new AbortController();
    setTranslating(true);
    translateTexts(texts, summaryLang, ctrl.signal)
      .then((out) => {
        const val = {
          lang: summaryLang,
          summary: summaryEn ? out[0] : "",
          labels: Object.fromEntries(labels.map((l, i) => [l, out[i + 1] || l])),
        };
        translationCache.current.set(key, val);
        setTranslation(val);
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setTranslation(null);
        toast.error("Translation unavailable", e instanceof Error ? e.message : "Could not translate");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setTranslating(false);
      });
    return () => ctrl.abort();
  }, [summaryLang, summaryEn, agentContext, toast]);

  const displayAnalysis = useMemo<SummaryResponse | null>(() => {
    if (!analysis || summaryLang === "en" || !translation || translation.lang !== summaryLang) return analysis;
    const tl = (t: SummaryResponse["themes"][number]) => ({ ...t, label: translation.labels[t.label] ?? t.label });
    return { ...analysis, themes: analysis.themes.map(tl), pros: analysis.pros.map(tl), cons: analysis.cons.map(tl) };
  }, [analysis, summaryLang, translation]);

  const displaySummary =
    summaryLang === "en" ? summaryEn : translation && translation.lang === summaryLang ? translation.summary : "";

  const selectedTheme = useMemo(() => {
    if (selectedThemeId === null || !displayAnalysis?.themes) return null;
    return displayAnalysis.themes.find((t) => t.id === selectedThemeId) ?? null;
  }, [selectedThemeId, displayAnalysis]);

  return (
    <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12">
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
                <Play className="h-3 w-3" />
                Multilingual Demo Dataset
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {averageRating !== null && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-neutral-900">
              <Star className="h-4 w-4 fill-neutral-900 text-neutral-900" />
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
            <BarChart3 className="h-3.5 w-3.5" />
            Model Metrics
          </Link>
        </div>
      </div>

      {/* Reviews Fetch Error */}
      {reviewsError && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50/80 p-5 text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
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
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
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
        <>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-6">
          {/* 1. Summary Card */}
          <SummaryCard
            analysis={displayAnalysis}
            summary={{ text: displaySummary, loading: summaryLoading || translating, error: summaryError }}
            onChat={() => window.dispatchEvent(new Event("open-assistant"))}
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
              themes={displayAnalysis?.themes ?? []}
              analyzing={analyzing}
              selectedThemeId={selectedThemeId}
              onSelectTheme={setSelectedThemeId}
            />
          )}

          {/* 4. Review List (rendered immediately as soon as reviews load!) */}
          <ReviewList
            reviews={reviews}
            annotationsMap={annotationsMap}
            loading={reviewsLoading}
            selectedTheme={selectedTheme}
            onClearTheme={() => setSelectedThemeId(null)}
          />
        </div>

        {/* Right column: product image + similar products (assistant is the floating button) */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <ProductVisuals productId={productId} title={isDemo ? undefined : title} image={image} />
        </aside>
        </div>
        <ProductAgent context={agentContext} />
        </>
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
