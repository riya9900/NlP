import { groq } from "@ai-sdk/groq";

/** One model for the whole app, configured in .env.local (GROQ_MODEL). Server-side only. */
export function groqModel() {
  return groq(process.env.GROQ_MODEL || "openai/gpt-oss-120b");
}

/** Keep latency low: this model only has to read structured results, not reason deeply. */
export const groqOptions = { groq: { reasoningEffort: "low" as const, reasoningFormat: "hidden" as const } };
