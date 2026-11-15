"use client";

import React, { useMemo, useState } from "react";
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
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileJson,
  GitBranch,
  Layers,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import type { EvaluationResults } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

interface EvaluationDashboardProps {
  initialData: EvaluationResults | null;
  loadedFromPath: string | null;
}

const PIPELINE_STEPS = [
  {
    step: "1. Preprocess",
    title: "Reviews & Language ID",
    detail: "Unicode normalization, URL stripping, sentence splitting & Lingua language detection.",
    model: "lingua-language-detector",
    icon: Layers,
    accent: "blue",
  },
  {
    step: "2. Spam Filter",
    title: "3-Signal Fake Detection",
    detail: "Fine-tuned XLM-R classifier + MinHash-LSH near-duplicates + rating-mismatch heuristics.",
    model: "xlm-roberta-base + MinHash",
    icon: ShieldCheck,
    accent: "yellow",
  },
  {
    step: "3. Encode",
    title: "Embeddings & Sentiment",
    detail: "Multilingual sentence vectors and cross-lingual positive/negative sentiment scoring.",
    model: "BAAI/bge-m3 + XLM-R Sentiment",
    icon: Cpu,
    accent: "blue",
  },
  {
    step: "4. Cluster",
    title: "Theme Ranking",
    detail: "HDBSCAN density clusters ranked by log(1 + mentions) × mean sentiment.",
    model: "HDBSCAN / KMeans fallback",
    icon: GitBranch,
    accent: "blue",
  },
  {
    step: "5. Synthesize",
    title: "LLM Summary",
    detail: "Cluster labels & grounded pros/cons blurb generated in the requested output language.",
    model: "Qwen2.5-7B-Instruct-AWQ",
    icon: Sparkles,
    accent: "yellow",
  },
];

function fmtPct(v?: number | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v?: number | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return v.toFixed(3);
}

/**
 * Derive 2x2 confusion matrix [[tn, fp], [fn, tp]] if explicit matrix is present,
 * or if genuine/spam precision, recall, and support are available.
 */
function deriveConfusionMatrix(
  spamDemo?: EvaluationResults["spam_demo"],
): { tn: number; fp: number; fn: number; tp: number } | null {
  if (!spamDemo) return null;
  if (
    Array.isArray(spamDemo.confusion_matrix) &&
    spamDemo.confusion_matrix.length === 2 &&
    spamDemo.confusion_matrix[0].length === 2 &&
    spamDemo.confusion_matrix[1].length === 2
  ) {
    return {
      tn: spamDemo.confusion_matrix[0][0],
      fp: spamDemo.confusion_matrix[0][1],
      fn: spamDemo.confusion_matrix[1][0],
      tp: spamDemo.confusion_matrix[1][1],
    };
  }
  const gen = spamDemo.report?.genuine;
  const spam = spamDemo.report?.spam;
  if (gen && spam && gen.support > 0 && spam.support > 0) {
    const tn = Math.round(gen.recall * gen.support);
    const fp = Math.max(0, gen.support - tn);
    const tp = Math.round(spam.recall * spam.support);
    const fn = Math.max(0, spam.support - tp);
    return { tn, fp, fn, tp };
  }
  return null;
}

export default function EvaluationDashboard({
  initialData,
  loadedFromPath,
}: EvaluationDashboardProps) {
  const toast = useToast();
  const [data, setData] = useState<EvaluationResults | null>(initialData);
  const [sourceLabel, setSourceLabel] = useState<string | null>(loadedFromPath);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as EvaluationResults;
      setData(parsed);
      setSourceLabel(`Loaded from ${file.name} (session memory)`);
      toast.success("Evaluation results loaded", file.name);
    } catch {
      toast.error("Invalid JSON file", "Could not parse evaluation_results.json");
    }
    e.target.value = "";
  };

  const cm = useMemo(() => deriveConfusionMatrix(data?.spam_demo), [data]);
  const spamReport = data?.spam_demo?.report;
  const ablation = data?.spam_demo?.ablation;
  const sentimentRows = data?.sentiment_by_language ?? [];
  const themeRows = useMemo(() => data?.themes ?? [], [data]);
  const summaryScores = data?.summary ?? {};

  const aspectRecall = useMemo(() => {
    if (themeRows.length === 0) return null;
    const hits = themeRows.filter((t) => t.jaccard >= 0.3).length;
    return hits / themeRows.length;
  }, [themeRows]);

  const signAccuracy = useMemo(() => {
    if (themeRows.length === 0) return null;
    const hits = themeRows.filter((t) => t.sign_correct).length;
    return hits / themeRows.length;
  }, [themeRows]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-md border border-neutral-300 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
            <FileJson className="h-3.5 w-3.5" />
            <span>Model Evaluation & Pipeline Architecture</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            NLP Evaluation Metrics
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Offline benchmark metrics exported from{" "}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 tabular-nums text-xs text-blue-700">
              server/notebooks/pipeline_colab.ipynb
            </code>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sourceLabel && (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
              {sourceLabel}
            </span>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100">
            <Upload className="h-3.5 w-3.5" />
            <span>Load evaluation_results.json</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Missing file notice */}
      {!data && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-5 text-neutral-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              No <code className="tabular-nums">docs/evaluation_results.json</code> file found on disk yet
            </p>
            <p className="text-xs leading-relaxed text-neutral-700">
              Run <code className="tabular-nums">server/notebooks/pipeline_colab.ipynb</code> in Google
              Colab and save the exported file to{" "}
              <code className="tabular-nums">docs/evaluation_results.json</code> (or{" "}
              <code className="tabular-nums">server/docs/evaluation_results.json</code>), or use the{" "}
              <strong>Load evaluation_results.json</strong> button above to inspect your exported
              metrics in this session.
            </p>
          </div>
        </div>
      )}

      {/* 1. How It Works Pipeline Diagram */}
      <section className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-bold text-neutral-900">How It Works: 5-Stage NLP Pipeline</h2>
          <p className="text-xs text-neutral-500">
            reviews → spam filter → embeddings and sentiment → themes → LLM summary
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          {PIPELINE_STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="relative flex items-stretch">
                <div className="flex w-full flex-col rounded-md border border-neutral-300 bg-neutral-100 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      {s.step}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                        s.accent === "yellow"
                          ? "border-amber-200 bg-amber-50 text-amber-600"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-neutral-900">{s.title}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-neutral-600">{s.detail}</p>
                  <code className="mt-3 block truncate rounded-md border border-neutral-300 bg-white px-2 py-1 tabular-nums text-[10px] font-medium text-blue-800">
                    {s.model}
                  </code>
                </div>

                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden items-center justify-center px-1 text-blue-400 lg:flex">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Metrics Sections (rendered when JSON is loaded) */}
      {data && (
        <>
          {/* 2. Spam Detection: Confusion Matrix + P/R/F1 + Ablation */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Confusion Matrix */}
            <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Spam Confusion Matrix</h2>
                  <p className="text-xs text-neutral-500">
                    Multilingual demo evaluation (genuine vs. planted fake campaign)
                  </p>
                </div>
                {data.spam_demo?.roc_auc !== undefined && (
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                    ROC-AUC {fmtNum(data.spam_demo.roc_auc)}
                  </span>
                )}
              </div>

              {cm ? (
                <div className="mt-4">
                  <div className="mb-2 grid grid-cols-3 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    <div />
                    <div>Predicted Genuine</div>
                    <div>Predicted Spam</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex items-center justify-end pr-3 text-xs font-semibold text-neutral-600">
                      Actual Genuine
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                      <p className="text-2xl font-bold text-blue-900">{cm.tn}</p>
                      <p className="text-[11px] font-medium text-blue-700">True Negative</p>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                      <p className="text-2xl font-bold text-amber-900">{cm.fp}</p>
                      <p className="text-[11px] font-medium text-amber-700">False Positive</p>
                    </div>

                    <div className="flex items-center justify-end pr-3 text-xs font-semibold text-neutral-600">
                      Actual Spam
                    </div>
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                      <p className="text-2xl font-bold text-red-900">{cm.fn}</p>
                      <p className="text-[11px] font-medium text-red-700">False Negative</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-2xl font-bold text-emerald-900">{cm.tp}</p>
                      <p className="text-[11px] font-medium text-emerald-700">True Positive</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  Confusion matrix data not present in JSON.
                </p>
              )}
            </div>

            {/* Precision / Recall / F1 + Ablation */}
            <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-neutral-900">
                Spam Precision, Recall & F1
              </h2>
              <p className="text-xs text-neutral-500">
                Held-out English test set and multilingual demo ablation
              </p>

              {/* Held-out English Test */}
              {data.spam_english_test && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    English Held-Out Test (XLM-R)
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Accuracy", val: data.spam_english_test.acc },
                      { label: "Precision", val: data.spam_english_test.precision },
                      { label: "Recall", val: data.spam_english_test.recall },
                      { label: "F1 Score", val: data.spam_english_test.f1 },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-md border border-neutral-300 bg-neutral-100 p-3 text-center"
                      >
                        <p className="text-lg font-bold text-blue-700">{fmtPct(m.val)}</p>
                        <p className="text-[11px] font-medium text-neutral-600">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Spam Report */}
              {spamReport?.spam && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Multilingual Demo Spam Class (n={spamReport.spam.support})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 text-center">
                      <p className="text-lg font-bold text-blue-900">
                        {fmtPct(spamReport.spam.precision)}
                      </p>
                      <p className="text-[11px] font-medium text-blue-700">Precision</p>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 text-center">
                      <p className="text-lg font-bold text-blue-900">
                        {fmtPct(spamReport.spam.recall)}
                      </p>
                      <p className="text-[11px] font-medium text-blue-700">Recall</p>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 text-center">
                      <p className="text-lg font-bold text-blue-900">
                        {fmtPct(spamReport.spam["f1-score"])}
                      </p>
                      <p className="text-[11px] font-medium text-blue-700">F1 Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ablation */}
              {ablation?.f1 && (
                <div className="mt-4 overflow-hidden rounded-md border border-neutral-300">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 text-neutral-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Ablation Variant</th>
                        <th className="px-3 py-2 font-semibold">Precision</th>
                        <th className="px-3 py-2 font-semibold">Recall</th>
                        <th className="px-3 py-2 font-semibold">F1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300">
                      {Object.keys(ablation.f1).map((variant) => (
                        <tr key={variant} className="bg-white">
                          <td className="px-3 py-2 font-medium text-neutral-900">{variant}</td>
                          <td className="px-3 py-2 text-neutral-700">
                            {fmtPct(ablation.precision?.[variant])}
                          </td>
                          <td className="px-3 py-2 text-neutral-700">
                            {fmtPct(ablation.recall?.[variant])}
                          </td>
                          <td className="px-3 py-2 font-semibold text-blue-700">
                            {fmtPct(ablation.f1?.[variant])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* 3. Sentiment Accuracy per Language + 4. ROUGE & BERTScore */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Bar Chart of Sentiment Accuracy per Language */}
            <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs lg:col-span-2">
              <h2 className="text-base font-bold text-neutral-900">
                Sentiment Accuracy per Language
              </h2>
              <p className="mb-4 text-xs text-neutral-500">
                Evaluated on Amazon Reviews Multi (1–2★ negative vs. 4–5★ positive)
              </p>

              {sentimentRows.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sentimentRows.map((r) => ({
                        ...r,
                        langUpper: r.lang.toUpperCase(),
                        accuracyPct: Number((r.accuracy * 100).toFixed(1)),
                      }))}
                      margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4d4d4" />
                      <XAxis
                        dataKey="langUpper"
                        tick={{ fill: "#171717", fontSize: 12, fontWeight: 600 }}
                        axisLine={{ stroke: "#a3a3a3" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fill: "#525252", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#eff6ff" }}
                        formatter={(value) => [`${value}%`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracyPct" radius={[6, 6, 0, 0]} barSize={40}>
                        {sentimentRows.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i % 2 === 0 ? "#2563eb" : "#1d4ed8"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No sentiment evaluation rows available.</p>
              )}
            </div>

            {/* ROUGE & BERTScore Values */}
            <div className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-neutral-900">Summary Quality</h2>
              <p className="mb-4 text-xs text-neutral-500">
                ROUGE and BERTScore F1 against reference summaries
              </p>

              {Object.keys(summaryScores).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(summaryScores).map(([metric, val]) => {
                    const isBert = metric.toLowerCase().includes("bert");
                    return (
                      <div
                        key={metric}
                        className={`flex items-center justify-between rounded-md border p-3.5 ${
                          isBert
                            ? "border-amber-200 bg-amber-50/70"
                            : "border-blue-100 bg-blue-50/40"
                        }`}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
                          {metric.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            isBert ? "text-amber-800" : "text-blue-700"
                          }`}
                        >
                          {fmtNum(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No summary metrics available.</p>
              )}
            </div>
          </section>

          {/* 5. Table of Theme Recall per Aspect */}
          <section className="rounded-md border border-neutral-300 bg-white p-6 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Theme Recall per Aspect</h2>
                <p className="text-xs text-neutral-500">
                  Best-matching extracted cluster vs. ground-truth product aspects (Jaccard overlap
                  and sentiment sign)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {aspectRecall !== null && (
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                    Aspect Recall (Jaccard ≥ 0.30): {fmtPct(aspectRecall)}
                  </span>
                )}
                {signAccuracy !== null && (
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                    Sentiment Sign Accuracy: {fmtPct(signAccuracy)}
                  </span>
                )}
              </div>
            </div>

            {themeRows.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-neutral-300">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    <tr>
                      <th className="px-4 py-3">Ground-Truth Aspect</th>
                      <th className="px-4 py-3">Matched Cluster Label</th>
                      <th className="px-4 py-3">Jaccard Overlap</th>
                      <th className="px-4 py-3">Cluster Sentiment</th>
                      <th className="px-4 py-3">Sign Correct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300 text-xs">
                    {themeRows.map((row) => (
                      <tr key={row.aspect} className="bg-white hover:bg-blue-50/20">
                        <td className="px-4 py-3 font-semibold capitalize text-neutral-900">
                          {row.aspect}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{row.best_theme}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 font-semibold ${
                              row.jaccard >= 0.3
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {row.jaccard.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-neutral-700">
                          {row.sentiment >= 0 ? "+" : ""}
                          {row.sentiment.toFixed(3)}
                        </td>
                        <td className="px-4 py-3">
                          {row.sign_correct ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Match
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                              <XCircle className="h-4 w-4" />
                              Mismatch
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">No theme evaluation rows available.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
