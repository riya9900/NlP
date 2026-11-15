"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, RotateCcw, SendHorizontal, Wrench, X } from "lucide-react";
import type { ProductContext } from "@/lib/agent-context";

const SUGGESTIONS = [
  "Should I buy this?",
  "What do shoppers complain about most?",
  "How trustworthy are these ratings?",
  "What are the strongest pros?",
];

const TOOL_LABELS: Record<string, string> = {
  "tool-get_product_overview": "overview",
  "tool-get_pros_and_cons": "pros & cons",
  "tool-get_theme_evidence": "review evidence",
  "tool-get_rating_and_sentiment_stats": "rating stats",
  "tool-get_spam_report": "spam report",
};

/** Floating assistant: a launcher button (bottom-right) that opens a chat dialog. */
export default function ProductAgent({ context }: { context: ProductContext | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, setMessages, status, error } = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const ready = context !== null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, status, open]);

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("open-assistant", openIt);
    return () => window.removeEventListener("open-assistant", openIt);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t || busy || !context) return;
    sendMessage({ text: t }, { body: { context } });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
    setInput("");
  };

  return (
    <>
      <div
        role="dialog"
        aria-label="Product assistant"
        aria-hidden={!open}
        className={`fixed bottom-24 right-4 z-50 flex h-[34rem] max-h-[calc(100vh-8rem)] w-[26rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-md border border-neutral-300 bg-white shadow-2xl transition duration-150 motion-reduce:transition-none sm:right-6 ${
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
        }`}
      >
        <header className="flex items-center gap-3 border-b border-neutral-300 bg-neutral-100 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-neutral-900">Review assistant</h2>
            <p className="truncate text-xs text-neutral-500">Answers use only this page&apos;s analysis</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={busy}
              title="New chat"
              aria-label="Start a new chat"
              className="rounded-md border border-neutral-300 bg-white p-1.5 text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Close"
            aria-label="Close assistant"
            className="rounded-md border border-neutral-300 bg-white p-1.5 text-neutral-600 hover:bg-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                {ready
                  ? "Ask about the pros, cons, ratings or spam filtering for this product."
                  : "The analysis is still running. You can ask as soon as it finishes."}
              </p>
              <div className="flex flex-col items-start gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!ready || busy}
                    onClick={() => ask(s)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[92%] space-y-1.5 rounded-md border px-3.5 py-2.5 text-sm ${
                  m.role === "user"
                    ? "border-blue-200 bg-blue-50 text-blue-950"
                    : "border-neutral-300 bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <p key={`${m.id}-${i}`} className="whitespace-pre-wrap leading-relaxed">
                        {part.text}
                      </p>
                    );
                  }
                  if (part.type.startsWith("tool-")) {
                    return (
                      <span
                        key={`${m.id}-${i}`}
                        className="mr-1.5 inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-[11px] text-neutral-500"
                      >
                        <Wrench className="h-3 w-3" />
                        checked {TOOL_LABELS[part.type] ?? part.type.replace("tool-", "")}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading the analysis…
            </div>
          )}

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {parseError(error.message)}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 border-t border-neutral-300 p-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!ready}
            maxLength={300}
            placeholder={ready ? "Ask about this product…" : "Available once the analysis is ready"}
            className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-neutral-100 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!ready || busy || !input.trim()}
            aria-label="Send"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white shadow-lg hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        {open ? "Close" : "Ask AI"}
        {!open && ready && messages.length === 0 && (
          <span className="h-2 w-2 rounded-md bg-white" aria-hidden />
        )}
      </button>
    </>
  );
}

function parseError(msg: string): string {
  try {
    const j = JSON.parse(msg);
    if (j?.error) return j.error;
  } catch {
    /* plain text */
  }
  return msg || "The assistant request failed.";
}
