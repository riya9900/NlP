"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Layers,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const SAMPLE_QUERIES = [
  "wireless headphones",
  "mechanical keyboard",
  "espresso machine",
  "4k webcam",
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setValidationError("Enter at least 2 characters to search products.");
      return;
    }
    setValidationError(null);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-300 bg-gradient-to-b from-blue-50/80 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-800 shadow-xs">
              <span className="h-2 w-2 rounded-md bg-amber-400" />
              Stateless Multilingual NLP Pipeline · Zero Data Stored
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Turn noisy product reviews into{" "}
              <span className="text-blue-700">verified intelligence</span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
              Filter coordinated spam campaigns, cluster multilingual feedback across languages, and
              generate grounded pros, cons, and theme breakdowns traced directly to real customer
              quotes.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mt-9">
              <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Search any product (e.g., Sony WH-1000XM5, mechanical keyboard)..."
                    aria-label="Search products"
                    className="h-12 w-full rounded-md border border-neutral-300 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm  transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 cursor-pointer"
                >
                  Search Products
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {validationError && (
                <p className="mt-2 text-xs font-medium text-red-600">{validationError}</p>
              )}
            </form>

            {/* Primary Demo CTA + Evaluation link */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/product/demo"
                className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-xs transition-all hover:border-amber-400 hover:bg-amber-100/80"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Try the demo product
                <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-blue-700 border border-amber-200">
                  No API key needed
                </span>
              </Link>

              <Link
                href="/evaluation"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700"
              >
                <BarChart3 className="h-4 w-4 text-blue-600" />
                View Model Evaluation
              </Link>
            </div>

            {/* Sample Search Chips */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
              <span>Popular searches:</span>
              {SAMPLE_QUERIES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(sample)}`)}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Capability Cards */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs transition-shadow ">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-neutral-900">
              3-Signal Spam & Campaign Filter
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Combines a fine-tuned XLM-RoBERTa classifier, MinHash-LSH near-duplicate detection,
              and rating-mismatch heuristics. Toggle spam filtering live to inspect the impact.
            </p>
          </div>

          <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs transition-shadow ">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-200">
              <Globe2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-neutral-900">
              Multilingual Embeddings & Sentiment
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Analyzes English, German, Spanish, French, Japanese, Hindi, and more in one unified
              vector space with <code className="text-xs tabular-nums text-blue-700">BAAI/bge-m3</code>{" "}
              and generates summaries in your chosen language.
            </p>
          </div>

          <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs transition-shadow ">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-neutral-900">
              Traceable Theme Clustering
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              HDBSCAN clusters real review sentences into ranked pros and cons. Click any theme bar
              or chip to inspect supporting quotes and jump to the exact source reviews.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
