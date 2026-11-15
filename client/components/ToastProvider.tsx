"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastVariant = "loading" | "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastOptions {
  description?: string;
  duration?: number; // ms; 0 = persistent (default for loading)
}

interface ToastContextValue {
  show: (variant: ToastVariant, title: string, opts?: ToastOptions) => string;
  loading: (title: string, description?: string) => string;
  success: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
  update: (id: string, patch: Partial<Omit<ToastItem, "id">> & { duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seqRef = useRef(0);

  const clearTimer = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer],
  );

  const scheduleAutoDismiss = useCallback(
    (id: string, duration?: number) => {
      clearTimer(id);
      if (duration && duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [clearTimer, dismiss],
  );

  const show = useCallback(
    (variant: ToastVariant, title: string, opts?: ToastOptions) => {
      seqRef.current += 1;
      const id = `toast-${seqRef.current}`;
      const defaultDuration = variant === "loading" ? 0 : variant === "error" ? 6500 : 4000;
      const duration = opts?.duration ?? defaultDuration;

      setToasts((prev) => [...prev.slice(-3), { id, variant, title, description: opts?.description }]);
      scheduleAutoDismiss(id, duration);
      return id;
    },
    [scheduleAutoDismiss],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<ToastItem, "id">> & { duration?: number }) => {
      const { duration, ...fields } = patch;
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...fields } : t)),
      );
      if (duration !== undefined) {
        scheduleAutoDismiss(id, duration);
      } else if (fields.variant && fields.variant !== "loading") {
        scheduleAutoDismiss(id, fields.variant === "error" ? 6500 : 3500);
      }
    },
    [scheduleAutoDismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      loading: (title, description) => show("loading", title, { description, duration: 0 }),
      success: (title, description, duration) => show("success", title, { description, duration }),
      warning: (title, description, duration) => show("warning", title, { description, duration }),
      error: (title, description, duration) => show("error", title, { description, duration }),
      info: (title, description, duration) => show("info", title, { description, duration }),
      update,
      dismiss,
    }),
    [show, update, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastSpinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center"
    >
      <span className="absolute inset-0 rounded-md border-2 border-blue-100" />
      <span className="h-5 w-5 animate-spin rounded-md border-2 border-blue-600 border-t-transparent" />
    </span>
  );
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; accent: string; bgIcon: string }
> = {
  loading: {
    border: "border-blue-200",
    accent: "border-l-4 border-l-blue-600",
    bgIcon: "bg-blue-50",
  },
  success: {
    border: "border-emerald-200",
    accent: "border-l-4 border-l-emerald-600",
    bgIcon: "bg-emerald-50",
  },
  warning: {
    border: "border-amber-200",
    accent: "border-l-4 border-l-amber-400",
    bgIcon: "bg-amber-50",
  },
  error: {
    border: "border-red-200",
    accent: "border-l-4 border-l-red-600",
    bgIcon: "bg-red-50",
  },
  info: {
    border: "border-blue-200",
    accent: "border-l-4 border-l-blue-500",
    bgIcon: "bg-blue-50",
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const style = VARIANT_STYLES[toast.variant];

  return (
    <div
      className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-md border bg-white p-3.5   ${style.border} ${style.accent}`}
    >
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${style.bgIcon}`}>
        {toast.variant === "loading" && <ToastSpinner />}
        {toast.variant === "success" && <CheckCircle2 className="h-4.5 w-4.5" />}
        {toast.variant === "warning" && <AlertTriangle className="h-4.5 w-4.5" />}
        {toast.variant === "error" && <XCircle className="h-4.5 w-4.5" />}
        {toast.variant === "info" && <Info className="h-4.5 w-4.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
