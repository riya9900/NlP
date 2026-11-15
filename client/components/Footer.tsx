"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ArrowUp,
  Cpu,
  Globe2,
  Layers,
  Sparkles,
  BarChart3,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-neutral-300">
      {/* Top Banner / Status Strip */}
      <div className="border-b border-neutral-800/80 bg-neutral-900/60 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-medium text-neutral-200">
              Pipeline Status:
            </span>
            <span className="text-neutral-400">
              Stateless CPU Inference Engine Active (3 Models In-Memory)
            </span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Zero User Tracking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              100% Stateless
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              50+ Languages
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Navigation Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column (2 spans on desktop) */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">
                  ReviewLens
                </span>
                <span className="text-[11px] font-medium text-neutral-400">
                  Multilingual Review Intelligence
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              A high-precision, stateless NLP system that eliminates fake reviews,
              clusters multilingual customer feedback, and synthesizes grounded pros
              and cons with verbatim citation lineage.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-neutral-300">
                Lingua-py
              </span>
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-neutral-300">
                XLM-RoBERTa
              </span>
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-neutral-300">
                MiniLM-L12
              </span>
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-neutral-300">
                HDBSCAN
              </span>
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-neutral-300">
                Qwen2.5
              </span>
            </div>
          </div>

          {/* Navigation & Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-100">
              Platform & Tools
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  Product Search
                </Link>
              </li>
              <li>
                <Link
                  href="/product/demo"
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  Interactive Demo
                </Link>
              </li>
              <li>
                <Link
                  href="/evaluation"
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  Benchmark Metrics
                </Link>
              </li>
              <li>
                <Link
                  href="/search?q=wireless+headphones"
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  Headphones Dataset
                </Link>
              </li>
              <li>
                <Link
                  href="/search?q=mechanical+keyboard"
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  Keyboards Dataset
                </Link>
              </li>
            </ul>
          </div>

          {/* NLP Architecture */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-100">
              NLP Architecture
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>3-Signal Spam Classifier</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                <span>MinHash Near-Duplicates</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Cross-Lingual Vectors</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
                <span>HDBSCAN Theme Mining</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                <span>Fact-Grounded LLM</span>
              </li>
            </ul>
          </div>

          {/* Research & Principles */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-100">
              Principles & Specs
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
              <li>
                <span className="block font-medium text-neutral-200">
                  Stateless Execution
                </span>
                <span className="text-xs text-neutral-500">
                  No database, memory-only
                </span>
              </li>
              <li>
                <span className="block font-medium text-neutral-200">
                  CPU Optimized
                </span>
                <span className="text-xs text-neutral-500">
                  Runs on consumer laptops
                </span>
              </li>
              <li>
                <span className="block font-medium text-neutral-200">
                  Zero Hallucination
                </span>
                <span className="text-xs text-neutral-500">
                  Verbatim quote evidence
                </span>
              </li>
              <li>
                <span className="block font-medium text-neutral-200">
                  SerpAPI Powered
                </span>
                <span className="text-xs text-neutral-500">
                  Live Walmart e-commerce
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back-to-Top */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800/80 pt-8 sm:flex-row">
          <p className="text-xs text-neutral-500">
            &copy; 2026 ReviewLens. Designed for verified,
            stateless product intelligence.
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={scrollToTop}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
              aria-label="Back to top"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
