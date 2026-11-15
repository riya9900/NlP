"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Package,
  Search,
  Play,
  Star,
} from "lucide-react";
import { ApiError, searchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

export default function SearchResultsView() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  return <SearchResultsInner key={query} query={query} />;
}

function SearchResultsInner({ query }: { query: string }) {
  const router = useRouter();
  const toast = useToast();
  const isValidQuery = query.length >= 2;

  const [inputValue, setInputValue] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(isValidQuery);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    query.length > 0 && !isValidQuery
      ? { message: "Please enter at least 2 characters to search." }
      : null,
  );

  useEffect(() => {
    if (!isValidQuery) return;

    const controller = new AbortController();
    const toastId = toast.loading(
      `Searching for “${query}”…`,
      "Fetching product listings",
    );

    searchProducts(query, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setProducts(res.products);
        setLoading(false);
        toast.dismiss(toastId);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          toast.dismiss(toastId);
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : "Couldn’t fetch from the review source";
        const detail = err instanceof ApiError ? err.detail : undefined;
        setError({ message, detail });
        setLoading(false);
        toast.update(toastId, {
          variant: "error",
          title: message,
          description: detail,
        });
      });

    return () => {
      controller.abort();
      toast.dismiss(toastId);
    };
  }, [isValidQuery, query, toast]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Search Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-md border border-neutral-300 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {query ? `Search results for “${query}”` : "Product Search"}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Select a product card to fetch its reviews and run multilingual NLP analysis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto sm:min-w-[340px]">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50/70 p-4 text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{error.message}</p>
            {error.detail && error.detail !== error.message && (
              <p className="mt-1 text-xs text-red-700">{error.detail}</p>
            )}
            <div className="mt-3">
              <Link
                href="/product/demo"
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-amber-100"
              >
                <Play className="h-3.5 w-3.5" />
                Try the offline demo product instead
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-md border border-neutral-300 bg-white p-4 shadow-xs"
            >
              <div className="h-44 w-full animate-pulse rounded-md bg-neutral-100" />
              <div className="mt-4 h-4 w-4/5 animate-pulse rounded-md bg-neutral-200" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded-md bg-neutral-100" />
              <div className="mt-4 flex items-center justify-between">
                <div className="h-5 w-16 animate-pulse rounded-md bg-blue-50" />
                <div className="h-4 w-20 animate-pulse rounded-md bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && isValidQuery && products.length === 0 && (
        <div className="rounded-md border border-neutral-300 bg-white p-12 text-center shadow-xs">
          <Package className="mx-auto h-10 w-10 text-neutral-300" />
          <h2 className="mt-3 text-base font-semibold text-neutral-900">No products found</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Try a broader product name or test the built-in multilingual demo dataset.
          </p>
          <Link
            href="/product/demo"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Play className="h-4 w-4" />
            Open Demo Product
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>Showing {products.length} products</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p.product_id}
                href={`/product/${encodeURIComponent(p.product_id)}?title=${encodeURIComponent(p.title)}${p.thumbnail ? `&img=${encodeURIComponent(p.thumbnail)}` : ""}`}
                className="group flex flex-col overflow-hidden rounded-md border border-neutral-300 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-400 "
              >
                <div className="relative flex h-48 items-center justify-center border-b border-neutral-300 bg-white p-4">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-neutral-300" />
                  )}
                  {p.source && (
                    <span className="absolute right-3 top-3 rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                      {p.source}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-blue-700">
                    {p.title}
                  </h2>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-blue-700">
                        {p.price ?? "Price N/A"}
                      </span>

                      {p.rating != null ? (
                        <div className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                          <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
                          <span>{p.rating.toFixed(1)}</span>
                          {p.reviews_count != null && (
                            <span className="font-normal text-neutral-500">
                              ({p.reviews_count.toLocaleString()})
                            </span>
                          )}
                        </div>
                      ) : (
                        p.reviews_count != null && (
                          <span className="text-xs text-neutral-500">
                            {p.reviews_count.toLocaleString()} reviews
                          </span>
                        )
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-neutral-300 pt-3 text-xs font-semibold text-blue-600">
                      <span>Analyze reviews</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
