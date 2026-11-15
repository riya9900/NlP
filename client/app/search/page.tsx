import { Suspense } from "react";
import SearchResultsView from "@/components/search/SearchResultsView";

function SearchSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 h-24 animate-pulse rounded-md border border-neutral-300 bg-white" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-md border border-neutral-300 bg-white" />
        ))}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResultsView />
    </Suspense>
  );
}
