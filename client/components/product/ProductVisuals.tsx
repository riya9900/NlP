"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageOff, Star } from "lucide-react";
import { searchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

function shortQuery(title: string): string {
  return title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}

export default function ProductVisuals({
  productId,
  title,
  image,
}: {
  productId: string;
  title?: string;
  image?: string;
}) {
  const [img, setImg] = useState<string | undefined>(image);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setImg(image);
    setSimilar([]);
    if (!title || productId === "demo") return;
    const ctrl = new AbortController();
    setLoading(true);
    searchProducts(shortQuery(title), ctrl.signal)
      .then((res) => {
        const self = res.products.find((p) => p.product_id === productId);
        if (self?.thumbnail) setImg((cur) => cur ?? self.thumbnail ?? undefined);
        const seen = new Set<string>([productId]);
        const out: Product[] = [];
        for (const p of res.products) {
          if (seen.has(p.product_id) || !p.thumbnail) continue;
          seen.add(p.product_id);
          out.push(p);
          if (out.length === 3) break;
        }
        setSimilar(out);
      })
      .catch(() => {
        /* decorative: ignore failures */
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [productId, title, image]);

  return (
    <>
      {/* Box 1: product image */}
      <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border border-neutral-300 bg-white p-3">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={title ?? "Product"} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-neutral-400">
            <ImageOff className="h-7 w-7" />
            <span className="text-xs">{loading ? "Loading image…" : "No image"}</span>
          </div>
        )}
      </div>

      {/* Box 2: similar products (max 3, scroll sideways) */}
      {(loading || similar.length > 0) && (
        <div className="rounded-md border border-neutral-300 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Similar products
          </p>
          <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2">
            {loading && similar.length === 0
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 w-36 shrink-0 animate-pulse rounded-md border border-neutral-300 bg-neutral-100"
                  />
                ))
              : similar.map((p) => (
                  <Link
                    key={p.product_id}
                    href={`/product/${encodeURIComponent(p.product_id)}?title=${encodeURIComponent(p.title)}${
                      p.thumbnail ? `&img=${encodeURIComponent(p.thumbnail)}` : ""
                    }`}
                    className="group flex w-36 shrink-0 snap-start flex-col rounded-md border border-neutral-300 bg-white p-2 hover:border-blue-400"
                    title={p.title}
                  >
                    <div className="mb-1.5 flex h-16 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.thumbnail ?? ""} alt="" className="h-full w-full object-contain" />
                    </div>
                    <span className="line-clamp-2 text-xs font-medium leading-snug text-neutral-800 group-hover:text-blue-700">
                      {p.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                      {p.price}
                      {p.rating ? (
                        <>
                          <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
                          {p.rating}
                        </>
                      ) : null}
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      )}
    </>
  );
}
