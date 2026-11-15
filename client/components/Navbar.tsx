"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { BarChart3, Search, ShieldCheck, Sparkles } from "lucide-react";

function NavbarDynamicContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      <nav className="hidden md:flex items-center gap-1">
        <Link
          href="/"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-blue-50 text-blue-700"
              : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
          }`}
        >
          Search
        </Link>
        <Link
          href="/product/demo"
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            pathname === "/product/demo"
              ? "bg-blue-50 text-blue-700"
              : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Live Demo
        </Link>
        <Link
          href="/evaluation"
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            pathname === "/evaluation"
              ? "bg-blue-50 text-blue-700"
              : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
          Evaluation
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {pathname !== "/" && (
          <form onSubmit={handleSubmit} className="hidden sm:flex items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Quick product search"
                className="h-9 w-56 rounded-md border border-neutral-300 bg-neutral-100 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:w-64"
              />
            </div>
          </form>
        )}
        <Link
          href="/product/demo"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 md:hidden"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          Demo
        </Link>
        <Link
          href="/evaluation"
          className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 md:hidden"
        >
          Metrics
        </Link>
      </div>
    </>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-300 bg-white backdrop-blur supports-[backdrop-filter]:bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-sm ">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-neutral-900">
                ReviewLens
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                NLP
              </span>
            </div>
            <span className="hidden text-[11px] font-medium text-neutral-500 sm:block">
              Multilingual Review Intelligence
            </span>
          </div>
        </Link>

        <Suspense
          fallback={
            <div className="ml-auto flex items-center gap-2">
              <div className="h-8 w-20 animate-pulse rounded-md bg-neutral-100" />
              <div className="h-8 w-20 animate-pulse rounded-md bg-neutral-100" />
            </div>
          }
        >
          <NavbarDynamicContent />
        </Suspense>
      </div>
    </header>
  );
}
