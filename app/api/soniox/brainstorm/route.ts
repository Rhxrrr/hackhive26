import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const brainstormSchema = z.object({
  ideas: z
    .array(z.string())
    .max(4)
    .describe("0–4 solution ideas. Empty array if no customer problem is identified."),
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

  const prompt = `You are brainstorming solutions to help a call rep. Suggest concrete ideas the rep could offer—ONLY when the customer has a clear problem or issue.

**Transcript (Speaker 1 is usually the rep, Speaker 2 the customer):**
${transcript}
${sentimentBlock}

**Rules:**
- First identify: Does the customer have a specific problem, complaint, or unmet need from the conversation? (e.g. broken product, billing issue, want refund, need help with X.)
- If YES: return 1–4 concrete solution ideas (fixes, offers, workarounds, follow-up, escalation, alternatives). Be specific to that problem. One short sentence each. No bullet prefixes.
- If NO: return an empty array. Do not invent or assume problems. Do not suggest "exploratory" or generic ideas when no real issue exists.`;

  try {
    const result = await generateText({
      model: openai.responses("gpt-4o-mini"),
      output: Output.object({ schema: brainstormSchema }),
      prompt,
    });

    const obj = result.object as { ideas?: string[] } | undefined;
    const ideas = Array.isArray(obj?.ideas) ? obj.ideas : [];
    return Response.json({ ideas });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return Response.json({ error: err }, { status: 500 });
  }
}
