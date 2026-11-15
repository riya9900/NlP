"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Globe2,
  Layers,
  Sparkles,
  Cpu,
  BarChart3,
  Quote,
  CheckCircle2,
  ArrowRight,
  Filter,
  Check,
  SlidersHorizontal,
  Fingerprint,
  Activity,
  Zap,
  Play,
  Languages,
} from "lucide-react";

export default function Features() {
  const [activeTab, setActiveTab] = useState<"spam" | "multilingual" | "themes" | "citations">("spam");
  const [filterSpamToggle, setFilterSpamToggle] = useState<boolean>(true);

  return (
    <section id="features" className="relative bg-white py-20 lg:py-28">
      {/* Subtle top divider accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Core Capabilities & NLP Pipeline
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
            Everything you need to turn raw reviews into verified truth
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Traditional star ratings and generic LLMs blindly swallow coordinated bots,
            fake praise, and translation nuances. ReviewLens applies a 5-stage
            stateless NLP pipeline to reveal what verified customers really experience.
          </p>
        </div>

        {/* 4-Step Interactive Pipeline Flow */}
        <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                End-to-End Pipeline
              </span>
              <h3 className="mt-1 text-xl font-bold text-neutral-900">
                How ReviewLens Processes Unstructured Reviews
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Stateless in-memory execution (No database required)
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                  01
                </span>
                <Languages className="h-4 w-4 text-neutral-400" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-neutral-900">
                Ingestion & Language ID
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Live Walmart SerpAPI ingestion or custom datasets. Lingua detects 50+
                languages natively with statistical language-model confidence.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">
                  02
                </span>
                <ShieldAlert className="h-4 w-4 text-neutral-400" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-neutral-900">
                3-Signal Anti-Spam Filter
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Trained char n-gram classifier (0.986 ROC-AUC), MinHash-LSH
                near-duplicate detection, and rating-sentiment mismatch rules.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                  03
                </span>
                <Layers className="h-4 w-4 text-neutral-400" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-neutral-900">
                Cross-Lingual HDBSCAN
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Multilingual MiniLM maps sentences into a single vector space.
                HDBSCAN groups related aspects across English, German, Japanese, etc.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                  04
                </span>
                <Quote className="h-4 w-4 text-neutral-400" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-neutral-900">
                Grounded Synthesis
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Synthesizes pros and cons ranked by mentions and sentiment. Every
                finding traces directly back to verifiable customer quote IDs.
              </p>
            </div>
          </div>
        </div>

        {/* Deep Dive Feature Showcase Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Spam Engine */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-800">
                  0.986 ROC-AUC
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                3-Signal Anti-Spam & Sybil Shield
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
                Eliminate bot campaigns, incentivized praise, and paid copy-paste reviews.
                Combines a machine-learning text classifier, MinHash-LSH near-duplicate
                detection across reviewers, and rating-sentiment discrepancy heuristics.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700">Trained on 40k+ reviews</span>
                <span className="font-semibold text-emerald-600">94.3% Precision</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full w-[94.3%] rounded-full bg-blue-600" />
              </div>
            </div>
          </div>

          {/* Card 2: Multilingual Support */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Globe2 className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                  50+ Languages
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                Native Multilingual Semantic Space
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
                No noisy machine-translation pipeline. Uses multilingual sentence
                transformers and cross-lingual XLM-RoBERTa sentiment models to analyze
                English, Spanish, German, French, Japanese, and Hindi in a unified latent space.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {["English", "Español", "Deutsch", "Français", "日本語", "हिन्दी", "Italiano"].map((lang) => (
                <span
                  key={lang}
                  className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                >
                  {lang}
                </span>
              ))}
              <span className="rounded-md border border-dashed border-neutral-300 bg-transparent px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                +45 more
              </span>
            </div>
          </div>

          {/* Card 3: Grounded Citations */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Quote className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  Zero Hallucinations
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                Verifiable Quote Grounding
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
                Generic LLMs regularly hallucinate features or exaggerate sentiment.
                ReviewLens enforces extract-then-summarize constraints: every single
                pro and con is hyperlinked directly to real customer sentences.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-3.5">
              <p className="italic text-[12px] text-neutral-600">
                &ldquo;Active noise cancelling eliminates low drone on transatlantic flights.&rdquo;
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-neutral-800">Review #14 (Verified)</span>
                <span className="text-emerald-600 font-medium">100% Grounded</span>
              </div>
            </div>
          </div>

          {/* Card 4: HDBSCAN Clustering */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-800">
                  Adaptive Clusters
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                Unsupervised Aspect Theme Mining
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
                HDBSCAN automatically discovers arbitrary density clusters without
                forcing arbitrary preset categories. Themes are ranked using mathematical
                salience: mentions scaled logarithmically by mean sentiment intensity.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700">Battery Life & Charging</span>
                <span className="font-semibold text-blue-600">+88% Pos</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-200">
                <div className="h-full w-[88%] rounded-full bg-blue-600" />
              </div>
            </div>
          </div>

          {/* Card 5: Stateless CPU Inference */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                  <Cpu className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-800">
                  CPU-Optimized
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                Stateless & Private In-Memory Engine
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
                Complete privacy by design. No SQL databases, no persistent customer
                storage, and no third-party telemetry. Runs locally on standard CPU hardware
                in 20-40 seconds with PyTorch and small quantized models.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-xs">
              <span className="text-neutral-600">Database dependency:</span>
              <span className="font-semibold text-neutral-900">None (Pure In-Memory)</span>
            </div>
          </div>

          {/* Card 6: Live E-Commerce Search */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                  <Zap className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
                  Live SerpAPI
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                Real-Time E-Commerce Ingestion
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
                Query any commercial product to fetch real Walmart catalog reviews
                in seconds, or test drive our bundled multilingual demo with authentic
                cross-lingual reviews and adversarial spam attacks.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/product/demo"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <Play className="h-3.5 w-3.5" />
                Launch Demo Product
              </Link>
              <span className="text-neutral-300">|</span>
              <Link
                href="/evaluation"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Benchmarks
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive Feature Sandbox Showcase */}
        <div className="mt-20 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-xs">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Interactive Demonstration
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Inspect how the intelligence layer works
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Toggle between the core algorithmic pillars to explore live behavior.
            </p>

            {/* Navigation Tabs */}
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("spam")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "spam"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Spam Defense
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("multilingual")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "multilingual"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Multilingual Space
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("themes")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "themes"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Aspect Clustering
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("citations")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "citations"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Quote Lineage
              </button>
            </div>
          </div>

          {/* Tab 1: Spam Defense */}
          {activeTab === "spam" && (
            <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Live Spam Filter Toggle Simulation
                  </h4>
                  <p className="mt-1 text-xs text-neutral-600">
                    See how coordinated bot campaigns distort product ratings when unfiltered.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterSpamToggle(!filterSpamToggle)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    filterSpamToggle
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Spam Filter: {filterSpamToggle ? "ACTIVE (Filtered)" : "DISABLED (Raw)"}
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500">
                      Calculated Product Score
                    </span>
                    <span className="text-xs font-semibold text-neutral-700">
                      {filterSpamToggle ? "94 Genuine Reviews" : "108 Total Reviews (14 Spam)"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-neutral-900">
                      {filterSpamToggle ? "3.8" : "4.7"}
                    </span>
                    <span className="text-xs text-neutral-500">out of 5.0</span>
                    <span
                      className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${
                        filterSpamToggle
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {filterSpamToggle ? "Verified Rating" : "Inflated by Spam"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-neutral-600">
                    {filterSpamToggle
                      ? "14 coordinated astroturfing reviews were identified and purged (MinHash-LSH match + sentiment divergence)."
                      : "Warning: Multiple duplicate promotional reviews from coordinated single-day posters are skewing the aggregate."}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5">
                  <span className="text-xs font-semibold text-neutral-800">
                    Adversarial Campaign Signals Flagged
                  </span>
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                      <span className="text-neutral-700">MinHash-LSH Near-Duplicates:</span>
                      <span className="font-semibold text-red-600">8 identical templates detected</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                      <span className="text-neutral-700">Rating-Text Mismatch:</span>
                      <span className="font-semibold text-amber-600">4 reviews (5-star with broken unit complaint)</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                      <span className="text-neutral-700">Trained TF-IDF Classifier:</span>
                      <span className="font-semibold text-blue-600">0.986 ROC-AUC confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Multilingual Space */}
          {activeTab === "multilingual" && (
            <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
              <h4 className="text-base font-bold text-neutral-900">
                Single Cross-Lingual Vector Space
              </h4>
              <p className="mt-1 text-xs text-neutral-600">
                Customer reviews written in different languages cluster together on the exact same latent concept without requiring translation.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                      DE
                    </span>
                    <span className="text-xs font-semibold text-neutral-900">German Review</span>
                  </div>
                  <p className="mt-2 text-xs italic text-neutral-700">
                    &ldquo;Der Akku hält problemlos über drei Tage bei normaler Nutzung.&rdquo;
                  </p>
                  <div className="mt-3 text-[11px] font-medium text-blue-600">
                    Clustered to: Battery Longevity (+0.92)
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                      JA
                    </span>
                    <span className="text-xs font-semibold text-neutral-900">Japanese Review</span>
                  </div>
                  <p className="mt-2 text-xs italic text-neutral-700">
                    &ldquo;バッテリーの持ちが非常に良く、充電の手間が減りました。&rdquo;
                  </p>
                  <div className="mt-3 text-[11px] font-medium text-blue-600">
                    Clustered to: Battery Longevity (+0.95)
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                      ES
                    </span>
                    <span className="text-xs font-semibold text-neutral-900">Spanish Review</span>
                  </div>
                  <p className="mt-2 text-xs italic text-neutral-700">
                    &ldquo;La batería dura muchísimo tiempo, excelente para viajar.&rdquo;
                  </p>
                  <div className="mt-3 text-[11px] font-medium text-blue-600">
                    Clustered to: Battery Longevity (+0.89)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Themes */}
          {activeTab === "themes" && (
            <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
              <h4 className="text-base font-bold text-neutral-900">
                HDBSCAN Sentence-Level Aspect Extraction
              </h4>
              <p className="mt-1 text-xs text-neutral-600">
                Rather than generic word frequency, HDBSCAN measures semantic density and ranks themes mathematically.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900">
                      Active Noise Cancellation (ANC)
                    </span>
                    <span className="font-bold text-emerald-600">42 mentions &bull; +0.86 Positive</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
                    <div className="h-full w-[86%] rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">
                    High praise for low-frequency rumble cancellation on planes and subways.
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900">
                      Microphone Wind Sensitivity
                    </span>
                    <span className="font-bold text-red-600">19 mentions &bull; -0.74 Negative</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
                    <div className="h-full w-[74%] rounded-full bg-red-500" />
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">
                    Callers note outdoor wind buffeting during cellular calls.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Citations */}
          {activeTab === "citations" && (
            <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
              <h4 className="text-base font-bold text-neutral-900">
                Citation Lineage & Grounding Proof
              </h4>
              <p className="mt-1 text-xs text-neutral-600">
                Every generated statement retains an immutable trace to original reviewer sentences.
              </p>

              <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Synthesized Insight
                    </span>
                    <p className="mt-1 text-sm font-medium text-neutral-900">
                      &ldquo;Earcups remain comfortable over multi-hour gaming sessions without ear fatigue.&rdquo;
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-neutral-500">Supporting Verbatim Citations:</span>
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono font-medium text-blue-700">
                        [Review #12: &quot;Wore them 6 hours straight...&quot;]
                      </span>
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono font-medium text-blue-700">
                        [Review #39: &quot;Memory foam padding is top tier&quot;]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              How ReviewLens compares to alternatives
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Why an aspect-based NLP pipeline outperforms raw LLM prompts and star ratings.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-xs">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-semibold text-neutral-700">
                <tr>
                  <th scope="col" className="px-6 py-4">Capability</th>
                  <th scope="col" className="px-6 py-4 text-blue-700 font-bold">ReviewLens</th>
                  <th scope="col" className="px-6 py-4 text-neutral-600">Generic LLM Prompt</th>
                  <th scope="col" className="px-6 py-4 text-neutral-600">Raw Star Averages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                <tr>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    Spam & Astroturf Campaign Defense
                  </td>
                  <td className="px-6 py-4 text-blue-700 font-medium">
                    3-Signal filter (0.986 ROC-AUC)
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Ingests all spam tokens blindly
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Easily skewed by purchased 5-stars
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    Cross-Lingual Clustering
                  </td>
                  <td className="px-6 py-4 text-blue-700 font-medium">
                    Native multilingual embeddings (50+ langs)
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Translation loss & token limits
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Isolated per-locale silo
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    Citation Lineage & Grounding
                  </td>
                  <td className="px-6 py-4 text-blue-700 font-medium">
                    100% cited verbatim quote IDs
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Prone to hallucinating specs
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    No qualitative evidence
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    Privacy & Storage Overhead
                  </td>
                  <td className="px-6 py-4 text-blue-700 font-medium">
                    Stateless CPU, zero databases
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Third-party cloud data logging
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    Ad trackers & customer profiling
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-20 overflow-hidden rounded-2xl bg-neutral-900 px-6 py-12 text-center text-white shadow-md sm:px-12 sm:py-16">
          <h3 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            Test drive the ReviewLens intelligence engine
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-300">
            Explore our bundled multilingual sample product, analyze real Walmart
            customer reviews, or inspect our scientific evaluation benchmarks.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/product/demo"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100"
            >
              <Play className="h-4 w-4" />
              Launch Demo Product
            </Link>
            <Link
              href="/evaluation"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              <BarChart3 className="h-4 w-4" />
              View Benchmark Metrics
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
