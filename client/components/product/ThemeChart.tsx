"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart2, MousePointerClick } from "lucide-react";
import type { Theme } from "@/lib/types";

interface ThemeChartProps {
  themes: Theme[];
  analyzing: boolean;
  selectedThemeId: number | null;
  onSelectTheme: (themeId: number | null) => void;
}

/** Maps sentiment (-1..1) across red -> grey -> green. */
function sentimentToColor(sentiment: number): string {
  const s = Math.max(-1, Math.min(1, sentiment));
  if (s >= 0.15) {
    // grey (#a3a3a3) -> green (#16a34a)
    const t = Math.min(1, (s - 0.15) / 0.85);
    const r = Math.round(148 + (22 - 148) * t);
    const g = Math.round(163 + (163 - 163) * t);
    const b = Math.round(184 + (74 - 184) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (s <= -0.15) {
    // grey (#a3a3a3) -> red (#dc2626)
    const t = Math.min(1, (-s - 0.15) / 0.85);
    const r = Math.round(148 + (220 - 148) * t);
    const g = Math.round(163 + (38 - 163) * t);
    const b = Math.round(184 + (38 - 184) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "#a3a3a3";
}

export default function ThemeChart({
  themes,
  analyzing,
  selectedThemeId,
  onSelectTheme,
}: ThemeChartProps) {
  const sortedThemes = useMemo(
    () => [...themes].sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
    [themes],
  );

  const chartHeight = Math.max(240, sortedThemes.length * 46 + 40);

  return (
    <section className="flex flex-col rounded-md border border-neutral-300 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-100">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Theme Mentions & Sentiment</h2>
            <p className="text-xs text-neutral-500">
              Sorted by impact (|score|). Bar length = mentions, color = sentiment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-md bg-red-600" /> Negative
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-md bg-neutral-400" /> Neutral
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-md bg-green-600" /> Positive
          </span>
        </div>
      </div>

      {analyzing ? (
        <div className="space-y-3 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-28 animate-pulse rounded-md bg-neutral-100" />
              <div
                className="h-6 animate-pulse rounded-r-md bg-blue-50"
                style={{ width: `${75 - i * 11}%` }}
              />
            </div>
          ))}
        </div>
      ) : sortedThemes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-100 p-8 text-center text-xs text-neutral-500">
          No recurring themes clustered yet.
        </div>
      ) : (
        <>
          <div style={{ width: "100%", height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedThemes}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d4d4d4" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#525252", fontSize: 12 }}
                  axisLine={{ stroke: "#a3a3a3" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={145}
                  tick={{ fill: "#171717", fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#eff6ff" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const t = payload[0].payload as Theme;
                    return (
                      <div className="rounded-md border border-neutral-300 bg-white p-3 text-xs ">
                        <p className="font-bold text-neutral-900">{t.label}</p>
                        <div className="mt-1.5 space-y-0.5 text-neutral-600">
                          <p>
                            Mentions: <span className="font-semibold text-neutral-900">{t.mentions}</span>
                          </p>
                          <p>
                            Sentiment:{" "}
                            <span className="font-semibold text-neutral-900">
                              {t.sentiment >= 0 ? "+" : ""}
                              {t.sentiment.toFixed(3)}
                            </span>
                          </p>
                          <p>
                            Impact score:{" "}
                            <span className="font-semibold text-neutral-900">
                              {t.score.toFixed(3)}
                            </span>
                          </p>
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-blue-600">
                          Click bar to filter reviews
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="mentions"
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const clickedId = (entry as unknown as Theme)?.id;
                    if (typeof clickedId === "number") {
                      onSelectTheme(selectedThemeId === clickedId ? null : clickedId);
                    }
                  }}
                >
                  {sortedThemes.map((entry) => {
                    const isSelected = selectedThemeId === entry.id;
                    const isDimmed = selectedThemeId !== null && !isSelected;
                    return (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={sentimentToColor(entry.sentiment)}
                        fillOpacity={isDimmed ? 0.32 : 1}
                        stroke={isSelected ? "#1d4ed8" : "none"}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <MousePointerClick className="h-3.5 w-3.5 text-blue-600" />
            <span>
              Click any bar to filter the review list below
              {selectedThemeId !== null ? " (click again to clear)" : ""}.
            </span>
          </div>
        </>
      )}
    </section>
  );
}
