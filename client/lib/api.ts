import type {
  AnalyzeRequest,
  ProductSearchResponse,
  ReviewsResponse,
  SummaryResponse,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

const ANALYZE_TIMEOUT_MS = 180_000; // 3 minutes for first-run model loading

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** fetch() that turns network/CORS failures into a clear ApiError (status 0). */
async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (init.signal?.aborted) throw err;
    throw new ApiError(
      `Can’t reach the API at ${API_BASE_URL}. Is the server running?`,
      0,
      "Start it with: cd server && uv run python server.py",
    );
  }
}

async function parseErrorDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    if (data && typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // ignore non-JSON body
  }
  return undefined;
}

function mapErrorMessage(
  status: number,
  context: "search" | "reviews" | "analyze",
  detail?: string,
): string {
  if (status === 429) {
    return "Too many requests, retry in a minute";
  }
  if (status === 503 && context === "analyze") {
    return "Analysis service is starting or unavailable. Reviews are still shown.";
  }
  if (status === 502 && (context === "search" || context === "reviews")) {
    return "Couldn’t fetch from the review source";
  }
  if (detail) {
    return detail;
  }
  return `Request failed with status ${status}`;
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal,
): Promise<ProductSearchResponse> {
  const url = `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`;
  const res = await request(url, { signal, cache: "no-store" });
  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(mapErrorMessage(res.status, "search", detail), res.status, detail);
  }
  return res.json();
}

export async function fetchReviews(
  productId: string,
  signal?: AbortSignal,
): Promise<ReviewsResponse> {
  const endpoint =
    productId === "demo"
      ? `${API_BASE_URL}/api/demo/reviews`
      : `${API_BASE_URL}/api/products/${encodeURIComponent(productId)}/reviews`;
  const res = await request(endpoint, { signal, cache: "no-store" });
  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(mapErrorMessage(res.status, "reviews", detail), res.status, detail);
  }
  return res.json();
}

export async function analyzeReviews(
  payload: AnalyzeRequest,
  externalSignal?: AbortSignal,
): Promise<SummaryResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("Request timed out")), ANALYZE_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  try {
    const res = await request(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await parseErrorDetail(res);
      throw new ApiError(mapErrorMessage(res.status, "analyze", detail), res.status, detail);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

export const SUMMARY_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English (EN)" },
  { code: "de", label: "Deutsch (DE)" },
  { code: "es", label: "Español (ES)" },
  { code: "fr", label: "Français (FR)" },
  { code: "ja", label: "日本語 (JA)" },
  { code: "hi", label: "हिन्दी (HI)" },
  { code: "it", label: "Italiano (IT)" },
  { code: "pt", label: "Português (PT)" },
  { code: "zh", label: "中文 (ZH)" },
];
