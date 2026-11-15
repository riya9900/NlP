"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

// Stages mirror the server pipeline. Progress is time-based (the API is a single request),
// so each stage gets an estimated duration; the last stage stays active until the response arrives.
const STAGES = [
  { label: "Cleaning reviews and detecting languages", ms: 2500 },
  { label: "Filtering spam and near-duplicate reviews", ms: 4000 },
  { label: "Embedding sentences with BGE-M3", ms: 8000 },
  { label: "Scoring sentiment per sentence", ms: 7000 },
  { label: "Clustering themes and ranking by sentiment", ms: 5000 },
  { label: "Writing the summary with Qwen2.5-7B", ms: Infinity },
];

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => (v < text.length ? v + 1 : v)), 22);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, n)}
      <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-neutral-900" />
    </span>
  );
}

export default function AnalysisProgress({ reviewCount }: { reviewCount: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(id);
  }, []);

  let acc = 0;
  let active = STAGES.length - 1;
  for (let i = 0; i < STAGES.length; i++) {
    acc += STAGES[i].ms;
    if (elapsed < acc) {
      active = i;
      break;
    }
  }
  const secs = Math.floor(elapsed / 1000);

  return (
    <div className="rounded-md border border-neutral-300 bg-neutral-100 p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-neutral-600">
        <span className="font-semibold text-neutral-900">
          Analyzing {reviewCount > 0 ? `${reviewCount} reviews` : "reviews"}…
        </span>
        <span className="tabular-nums">{secs}s</span>
      </div>
      <ol className="space-y-2">
        {STAGES.map((s, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={s.label}
              className={`flex items-center gap-2.5 text-sm ${
                done ? "text-neutral-500" : current ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {done ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : current ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <span className="h-4 w-4 rounded-md border border-neutral-300 bg-white" />
              )}
              {current ? <Typewriter text={s.label + "…"} /> : <span>{s.label}</span>}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-neutral-500">
        The first run after the server starts also loads the models (30–60 s). The full review
        list below is already usable.
      </p>
    </div>
  );
}
