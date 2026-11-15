import { Suspense } from "react";
import ProductWorkspace from "@/components/product/ProductWorkspace";

function ProductPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      <div className="h-24 animate-pulse rounded-md border border-neutral-300 bg-white" />
      <div className="h-64 animate-pulse rounded-md border border-neutral-300 bg-white" />
      <div className="h-80 animate-pulse rounded-md border border-neutral-300 bg-white" />
    </main>
  );
}

async function ProductPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { id } = await params;
  const { title } = await searchParams;
  const decoded = decodeURIComponent(id);
  return <ProductWorkspace key={decoded} productId={decoded} title={title} />;
}

export default function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
