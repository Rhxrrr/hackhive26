import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const feedbackSchema = z.object({
  tips: z
    .array(z.string())
    .max(3)
    .describe("0–3 coaching tips. Empty array if nothing important to improve."),
});

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: { transcript?: string; recentSentiments?: { score: number; sentiment: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript = (body?.transcript ?? "").trim();
  if (!transcript || transcript.length < 30) {
    return Response.json(
      { error: "Body must include 'transcript' (non-empty, at least ~30 chars)." },
      { status: 400 }
    );
  }

  const raw = Array.isArray(body?.recentSentiments) ? body.recentSentiments : [];
  const recentSentiments = raw
    .filter((s): s is { score: number; sentiment: string } => typeof s?.score === "number" && typeof s?.sentiment === "string")
    .slice(-3);

  const sentimentBlock =
    recentSentiments.length > 0
      ? `\n**Past ${recentSentiments.length} customer sentiment(s) (newest first):**\n${recentSentiments
          .map((s) => `- score ${s.score.toFixed(2)}: ${s.sentiment || "N/A"}`)
          .join("\n")}\n`
      : "";

  const prompt = `You are a real-time coach for a customer service call rep. The rep is on a live call. Suggest what they should IMPROVE—only when it matters.

**Transcript (Speaker 1 is usually the rep, Speaker 2 the customer):**
${transcript}
${sentimentBlock}

**Rules:**
- Coaching = what the rep should do better or change (empathy, clarity, de-escalation, acknowledgment, next steps, closing). Be specific and actionable.
- Return 1–3 tips ONLY when there is something meaningful to improve. If the rep is doing well, return an empty array.
- Do not praise. Do not state the obvious. Do not give tips when nothing needs improving.
- Each tip must be one short sentence. No bullet prefixes in the text.`;

  try {
    const result = await generateText({
      model: openai.responses("gpt-4o-mini"),
      output: Output.object({ schema: feedbackSchema }),
      prompt,
    });

    const obj = result.object as { tips?: string[] } | undefined;
    const tips = Array.isArray(obj?.tips) ? obj.tips : [];
    return Response.json({ tips });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return Response.json({ error: err }, { status: 500 });
  }
}
