import { generateText } from "ai";
import { groqModel, groqOptions } from "@/lib/groq";
import { ProductContextSchema } from "@/lib/agent-context";

export const maxDuration = 30;

const SYSTEM = `You write the review summary for a shopping page. You are given structured results from an NLP pipeline (themes with sentiment, ratings, spam filtering). Write a clear summary of what customers think.

Rules:
- Use ONLY the data provided. Do not invent features, prices or facts.
- 4 to 6 short sentences, plain English, simple common words (say "customers", never "shoppers"). Short sentences translate better.
- Cover: overall verdict, the strongest positives, the main complaints, and how reliable the reviews are (mention if many were removed as spam or if a theme has mixed opinions).
- No bullet points, no markdown, no headings, no emojis. Output only the summary text.`;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY is not set in client/.env.local" }, { status: 503 });
  }
  let body: { context?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ProductContextSchema.safeParse(body.context);
  if (!parsed.success) return Response.json({ error: "Missing analysis context" }, { status: 400 });
  const c = parsed.data;

  const facts = {
    product: c.title,
    averageRating: c.avgRating,
    reviews: { total: c.reviewCount, analysed: c.analyzedCount, removedAsSpam: c.spamRemoved },
    pros: c.pros.map((t) => ({ theme: t.label, reviewsMentioning: t.mentions, sentiment: t.sentiment })),
    cons: c.cons.map((t) => ({ theme: t.label, reviewsMentioning: t.mentions, sentiment: t.sentiment })),
    otherThemes: c.themes
      .filter((t) => !c.pros.some((p) => p.label === t.label) && !c.cons.some((x) => x.label === t.label))
      .map((t) => ({ theme: t.label, reviewsMentioning: t.mentions, sentiment: t.sentiment })),
    starCounts: c.ratingDistribution,
    reviewSentiment: c.sentimentCounts,
    spamReasons: c.spamReasons,
    languages: c.languages,
  };

  try {
    const { text } = await generateText({
      model: groqModel(),
      providerOptions: groqOptions,
      temperature: 0.3,
      system: SYSTEM,
      prompt: `Pipeline results (JSON):\n${JSON.stringify(facts)}`,
    });
    return Response.json({ summary: text.trim() });
  } catch (e) {
    return Response.json({ error: `Summary generation failed: ${e instanceof Error ? e.message : "unknown"}` }, { status: 502 });
  }
}
