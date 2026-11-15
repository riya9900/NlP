import { z } from "zod";

/**
 * Everything the assistant is allowed to know: the NLP results already shown on the page.
 * The client builds this from the analysis response and sends it with each chat request;
 * the server validates it and exposes it to the model only through tools.
 */
const ThemeSchema = z.object({
  label: z.string().max(80),
  mentions: z.number(),
  sentiment: z.number(),
  quotes: z.array(z.string().max(300)).max(3),
});

export const ProductContextSchema = z.object({
  title: z.string().max(300),
  avgRating: z.number().nullable(),
  reviewCount: z.number(),
  analyzedCount: z.number(),
  spamRemoved: z.number(),
  languages: z.record(z.string(), z.number()),
  summary: z.string().max(1000),
  pros: z.array(ThemeSchema).max(12),
  cons: z.array(ThemeSchema).max(12),
  themes: z.array(ThemeSchema).max(16),
  ratingDistribution: z.record(z.string(), z.number()),
  sentimentCounts: z.object({ positive: z.number(), neutral: z.number(), negative: z.number() }),
  spamReasons: z.record(z.string(), z.number()),
});

export type ProductContext = z.infer<typeof ProductContextSchema>;
