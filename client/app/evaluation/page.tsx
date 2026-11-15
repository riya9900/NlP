import fs from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { connection } from "next/server";
import EvaluationDashboard from "@/components/evaluation/EvaluationDashboard";
import type { EvaluationResults } from "@/lib/types";

function loadEvaluationResults(): {
  data: EvaluationResults | null;
  loadedFromPath: string | null;
} {
  const candidates = [
    path.resolve(process.cwd(), "docs", "evaluation_results.json"),
    path.resolve(process.cwd(), "..", "docs", "evaluation_results.json"),
    path.resolve(process.cwd(), "..", "server", "docs", "evaluation_results.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ candidate, "utf8");
        return {
          data: JSON.parse(raw) as EvaluationResults,
          loadedFromPath: candidate,
        };
      } catch {
        // Ignore malformed file and continue searching
      }
    }
  }

  return { data: null, loadedFromPath: null };
}

async function EvaluationContent() {
  await connection();
  const { data, loadedFromPath } = loadEvaluationResults();
  return <EvaluationDashboard initialData={data} loadedFromPath={loadedFromPath} />;
}

function EvaluationSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-28 animate-pulse rounded-md border border-neutral-300 bg-white" />
      <div className="h-56 animate-pulse rounded-md border border-neutral-300 bg-white" />
      <div className="h-72 animate-pulse rounded-md border border-neutral-300 bg-white" />
    </main>
  );
}

export default function EvaluationPage() {
  return (
    <Suspense fallback={<EvaluationSkeleton />}>
      <EvaluationContent />
    </Suspense>
  );
}
