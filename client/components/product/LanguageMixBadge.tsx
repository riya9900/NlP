"use client";

import { Globe } from "lucide-react";

const SEGMENT_COLORS = [
  "bg-blue-700",
  "bg-blue-500",
  "bg-sky-400",
  "bg-amber-400",
  "bg-indigo-400",
  "bg-neutral-400",
];

const DOT_COLORS = [
  "bg-blue-700",
  "bg-blue-500",
  "bg-sky-400",
  "bg-amber-400",
  "bg-indigo-400",
  "bg-neutral-400",
];

export default function LanguageMixBadge({
  languages,
}: {
  languages: Record<string, number>;
}) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-md border border-neutral-300 bg-neutral-100 p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          <span>Language Mix</span>
        </div>
        <span className="text-xs font-medium text-neutral-500">
          {entries
            .slice(0, 4)
            .map(([code, ratio]) => `${code.toUpperCase()} ${Math.round(ratio * 100)}%`)
            .join(" · ")}
        </span>
      </div>

      {/* Stacked bar */}
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-md bg-neutral-200"
        role="img"
        aria-label="Language distribution"
      >
        {entries.map(([code, ratio], idx) => (
          <div
            key={code}
            style={{ width: `${Math.max(ratio * 100, 1.5)}%` }}
            title={`${code.toUpperCase()}: ${Math.round(ratio * 100)}%`}
            className={`${SEGMENT_COLORS[idx % SEGMENT_COLORS.length]} transition-all duration-300`}
          />
        ))}
      </div>

      {/* Compact code pills */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {entries.map(([code, ratio], idx) => (
          <span
            key={code}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-xs font-medium text-neutral-700"
          >
            <span className={`h-2 w-2 rounded-md ${DOT_COLORS[idx % DOT_COLORS.length]}`} />
            <span className="font-semibold text-neutral-900">{code.toUpperCase()}</span>
            <span className="text-neutral-500">{Math.round(ratio * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
