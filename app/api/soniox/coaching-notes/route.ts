import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const coachingNotesSchema = z.object({
  objections: z
    .array(z.string())
    .max(6)
    .describe("What the customer is objecting to, unhappy about, or finding problematic. For Notes. Empty if none."),
  solutions: z
    .array(z.string())
    .max(4)
    .describe("Concrete solutions the rep could offer for those problems. For Solutions. Empty if no problems or no feasible solutions."),
  coaching: z
    .array(z.string())
    .max(3)
    .describe("How to propose/offer those solutions to the customer. For Coaching. Empty if no solutions to propose."),
});

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
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

  const prompt = `You analyze a live customer service call and produce three outputs that work together.

**Transcript (Speaker 1 = rep, Speaker 2 = customer):**
${transcript}
${sentimentBlock}

**Step 1 – Objections (for Notes):**
Identify what the CUSTOMER is objecting to, unhappy about, or finding problematic: complaints, frustrations, unmet needs, things they say are wrong. One short phrase or sentence each. 0–6 items. If none, return [].

**Step 2 – Solutions (for Solutions):**
For the objections you identified, suggest 1–4 concrete solutions the rep could offer: fixes, offers, workarounds, follow-up, escalation, alternatives. Be specific to those problems. 0–4. If no objections or no feasible solutions, return []. Do not invent problems.

**Step 3 – Coaching (for Coaching):**
For the solutions above, write 1–3 coaching tips on HOW to propose or offer them to the customer: e.g. lead with empathy, frame as an option, offer choice, when to mention it, how to phrase it. This is the approach for proposing—not generic rep improvement. 0–3. If no solutions, return [].`;

  try {
    const result = await generateText({
      model: openai.responses("gpt-4o-mini"),
      output: Output.object({ schema: coachingNotesSchema }),
      prompt,
    });

    const obj = result.object as { objections?: string[]; solutions?: string[]; coaching?: string[] } | undefined;
    const objections = Array.isArray(obj?.objections) ? obj.objections : [];
    const solutions = Array.isArray(obj?.solutions) ? obj.solutions : [];
    const coaching = Array.isArray(obj?.coaching) ? obj.coaching : [];

    return Response.json({ objections, solutions, coaching });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return Response.json({ error: err }, { status: 500 });
  }
}
