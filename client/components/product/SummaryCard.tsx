"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Languages,
  Quote,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { SUMMARY_LANGUAGES } from "@/lib/api";
import type { SummaryResponse, Theme } from "@/lib/types";
import LanguageMixBadge from "./LanguageMixBadge";
import AnalysisProgress from "./AnalysisProgress";

interface SummaryCardProps {
  analysis: SummaryResponse | null;
  analyzing: boolean;
  reviewCount?: number;
  analyzeError: { message: string; detail?: string } | null;
  filterSpam: boolean;
  onToggleSpam: (next: boolean) => void;
  summaryLang: string;
  onChangeLang: (next: string) => void;
  selectedThemeId: number | null;
  onSelectTheme: (themeId: number | null) => void;
  onRetryAnalyze: () => void;
  hasReviews: boolean;
}

export default function SummaryCard({
  analysis,
  analyzing,
  reviewCount = 0,
  analyzeError,
  filterSpam,
  onToggleSpam,
  summaryLang,
  onChangeLang,
  selectedThemeId,
  onSelectTheme,
  onRetryAnalyze,
  hasReviews,
}: SummaryCardProps) {
  const [expandedChip, setExpandedChip] = useState<{
    kind: "pro" | "con";
    theme: Theme;
  } | null>(null);

  const toggleChip = (kind: "pro" | "con", theme: Theme) => {
    setExpandedChip((prev) =>
      prev && prev.theme.id === theme.id && prev.kind === kind ? null : { kind, theme },
    );
  };

  return (
    <section className="rounded-md border border-neutral-300 bg-white shadow-xs">
      {/* Header & Controls Bar */}
      <div className="flex flex-col gap-4 border-b border-neutral-300 bg-gradient-to-r from-blue-50/60 via-white to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
            <Sparkles className="h-4.5 w-4.5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900">Review Summary & Insights</h2>
              {analyzing && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  <span className="h-2.5 w-2.5 animate-spin rounded-md border-2 border-blue-600 border-t-transparent" />
                  Analyzing reviews…
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Grounded themes traced directly to real customer sentences
            </p>
          </div>
        </div>

        {/* Controls: Spam Toggle + Summary Language */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Spam Filter Switch */}
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 shadow-2xs transition-colors hover:border-blue-300">
            <ShieldCheck
              className={`h-4 w-4 ${filterSpam ? "text-blue-600" : "text-neutral-400"}`}
            />
            <span className="text-xs font-semibold text-neutral-800">Filter suspected spam</span>
            <button
              type="button"
              role="switch"
              aria-checked={filterSpam}
              aria-label="Filter suspected spam"
              disabled={!hasReviews}
              onClick={() => onToggleSpam(!filterSpam)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                filterSpam ? "bg-blue-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-md bg-white shadow transition-transform ${
                  filterSpam ? "translate-x-4.5" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          {/* Summary Language Selector */}
          <div className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 shadow-2xs">
            <Languages className="h-4 w-4 text-blue-600" />
            <label htmlFor="summary-lang-select" className="text-xs font-medium text-neutral-500">
              Summary:
            </label>
            <select
              id="summary-lang-select"
              value={summaryLang}
              disabled={!hasReviews}
              onChange={(e) => onChangeLang(e.target.value)}
              className="cursor-pointer bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {SUMMARY_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Error Banner */}
        {analyzeError && !analyzing && (
          <div className="mb-4 flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50/90 p-4 text-neutral-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold">{analyzeError.message}</p>
                {analyzeError.detail && analyzeError.detail !== analyzeError.message && (
                  <p className="mt-0.5 text-xs text-neutral-600">{analyzeError.detail}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onRetryAnalyze}
              className="shrink-0 cursor-pointer rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              Retry analysis
            </button>
          </div>
        )}

        {/* Analyzing Skeleton (summary card only!) */}
        {analyzing && (
          <div className="space-y-5">
            <AnalysisProgress reviewCount={reviewCount} />
            <div className="space-y-2.5">
              <div className="h-4 w-full animate-pulse rounded-md bg-neutral-200" />
              <div className="h-4 w-11/12 animate-pulse rounded-md bg-neutral-100" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-neutral-100" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="h-3.5 w-20 animate-pulse rounded-md bg-emerald-100" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-32 animate-pulse rounded-md bg-emerald-50" />
                  <div className="h-8 w-28 animate-pulse rounded-md bg-emerald-50" />
                  <div className="h-8 w-36 animate-pulse rounded-md bg-emerald-50" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-20 animate-pulse rounded-md bg-red-100" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-32 animate-pulse rounded-md bg-red-50" />
                  <div className="h-8 w-28 animate-pulse rounded-md bg-red-50" />
                </div>
              </div>
            </div>
            <div className="h-16 w-full animate-pulse rounded-md bg-neutral-100" />
          </div>
        )}

        {/* Loaded Summary Content */}
        {!analyzing && analysis && (
          <div className="space-y-5">
            {/* Blurb (hidden when llm_used is false) */}
            {analysis.llm_used && analysis.blurb && (
              <div className="rounded-md border border-blue-100 bg-blue-50/40 p-4">
                <p className="text-sm leading-relaxed text-neutral-800">{analysis.blurb}</p>
              </div>
            )}

            {/* Pros & Cons Chips */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Pros */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Top Pros</span>
                  <span className="text-neutral-400 font-normal normal-case">
                    (hover or click for quotes)
                  </span>
                </div>
                {analysis.pros.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.pros.map((pro) => (
                      <ThemeChip
                        key={`pro-${pro.id}`}
                        kind="pro"
                        theme={pro}
                        isExpanded={
                          expandedChip?.kind === "pro" && expandedChip.theme.id === pro.id
                        }
                        isFiltered={selectedThemeId === pro.id}
                        onToggle={() => toggleChip("pro", pro)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">No strongly positive themes detected.</p>
                )}
              </div>

              {/* Cons */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>Top Cons</span>
                  <span className="text-neutral-400 font-normal normal-case">
                    (hover or click for quotes)
                  </span>
                </div>
                {analysis.cons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.cons.map((con) => (
                      <ThemeChip
                        key={`con-${con.id}`}
                        kind="con"
                        theme={con}
                        isExpanded={
                          expandedChip?.kind === "con" && expandedChip.theme.id === con.id
                        }
                        isFiltered={selectedThemeId === con.id}
                        onToggle={() => toggleChip("con", con)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">No strongly negative themes detected.</p>
                )}
              </div>
            </div>

            {/* Expanded Quote Drawer when a chip is clicked */}
            {expandedChip && (
              <div
                className={`rounded-md border p-4 ${
                  expandedChip.kind === "pro"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-red-200 bg-red-50/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Quote
                      className={`h-4 w-4 ${
                        expandedChip.kind === "pro" ? "text-emerald-700" : "text-red-700"
                      }`}
                    />
                    <span className="text-sm font-semibold text-neutral-900">
                      Supporting quotes for “{expandedChip.theme.label}”
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-300">
                      {expandedChip.theme.mentions} mentions
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectTheme(
                          selectedThemeId === expandedChip.theme.id
                            ? null
                            : expandedChip.theme.id,
                        )
                      }
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        selectedThemeId === expandedChip.theme.id
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      {selectedThemeId === expandedChip.theme.id
                        ? "Clear review filter"
                        : `Filter ${expandedChip.theme.review_ids.length} reviews`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedChip(null)}
                      className="cursor-pointer rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {expandedChip.theme.quotes.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {expandedChip.theme.quotes.slice(0, 3).map((q, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border border-neutral-300/80 bg-white px-3 py-2 text-xs leading-relaxed text-neutral-700"
                      >
                        “{q}”
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">No representative quotes returned.</p>
                )}
              </div>
            )}

            {/* Language Mix */}
            <LanguageMixBadge languages={analysis.languages} />

            {/* Footer line */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-300 pt-3 text-xs text-neutral-600">
              <p className="font-medium">
                Analyzed{" "}
                <span className="font-bold text-neutral-900">{analysis.analyzed_reviews}</span> of{" "}
                <span className="font-bold text-neutral-900">{analysis.total_reviews}</span> reviews
                {" · "}
                <span
                  className={
                    analysis.spam_removed > 0
                      ? "font-semibold text-amber-700"
                      : "font-semibold text-neutral-700"
                  }
                >
                  {analysis.spam_removed} flagged as spam
                </span>
              </p>
              {!analysis.llm_used && (
                <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                  Extractive cluster labels
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ThemeChip({
  kind,
  theme,
  isExpanded,
  isFiltered,
  onToggle,
}: {
  kind: "pro" | "con";
  theme: Theme;
  isExpanded: boolean;
  isFiltered: boolean;
  onToggle: () => void;
}) {
  const colorClasses =
    kind === "pro"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100/70"
      : "border-red-200 bg-red-50 text-red-900 hover:border-red-400 hover:bg-red-100/70";

  const countClasses =
    kind === "pro"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="group relative inline-block">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${colorClasses} ${
          isExpanded || isFiltered ? "ring-2 ring-blue-500/40" : ""
        }`}
      >
        <span>
          {theme.label} · {theme.mentions}
        </span>
        <span className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${countClasses}`}>
          {theme.sentiment >= 0 ? "+" : ""}
          {theme.sentiment.toFixed(2)}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 opacity-70" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        )}
      </button>

      {/* Hover Tooltip with 2-3 real quotes */}
      {theme.quotes.length > 0 && !isExpanded && (
        <div className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-80 rounded-md border border-neutral-300 bg-white p-3 opacity-0  transition-all duration-150 group-hover:visible group-hover:opacity-100">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            <Quote className="h-3 w-3" />
            <span>Sample Quotes</span>
          </div>
          <ul className="space-y-1.5">
            {theme.quotes.slice(0, 3).map((q, idx) => (
              <li key={idx} className="text-xs leading-snug text-neutral-700">
                “{q}”
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] font-medium text-neutral-400">
            Click chip to pin quotes or filter reviews
          </p>
        </div>
      )}
    </div>
  );
}
