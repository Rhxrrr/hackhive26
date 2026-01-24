import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const schema = z.object({
  information: z.array(z.string()).max(2).describe("Only name and/or employer if stated. Plain: 'Jordan Smith', 'Northfield Electronics'. One each. No rephrasing."),
  problems: z.array(z.string()).max(1).describe("The single core issue. One phrase. Empty if none. No rephrasing."),
  requests: z.array(z.string()).max(1).describe("The single main ask. One phrase. Empty if unclear. No rephrasing."),
  concerns: z.array(z.string()).max(1).describe("The single critical concern. One phrase. Empty if none. No rephrasing."),
  solutions: z.array(z.string()).max(5).describe("Full list. Only concrete, necessary. Remove if dealt with. Add only when needed. No rephrasing."),
  coaching: z.array(z.string()).max(4).describe("Full list. Only necessary tips. Remove if dealt with. Add only when needed. No rephrasing."),
});

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  let body: {
    transcript?: string;
    recentSentiments?: { score: number; sentiment: string }[];
    notes?: { information?: string[]; problems?: string[]; requests?: string[]; concerns?: string[] };
    previousCoaching?: string[];
    previousSolutions?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript = (body?.transcript ?? "").trim();
  if (!transcript || transcript.length < 20) {
    return Response.json(
      { error: "Body must include 'transcript' (non-empty, at least ~20 chars)." },
      { status: 400 }
    );
  }

  const raw = Array.isArray(body?.recentSentiments) ? body.recentSentiments : [];
  const recentSentiments = raw
    .filter((s): s is { score: number; sentiment: string } => typeof s?.score === "number" && typeof s?.sentiment === "string")
    .slice(-3);
  const previousCoaching = Array.isArray(body?.previousCoaching) ? body.previousCoaching : [];
  const previousSolutions = Array.isArray(body?.previousSolutions) ? body.previousSolutions : [];

  const n = body?.notes && typeof body.notes === "object" ? body.notes : {};
  const info = Array.isArray(n.information) ? n.information.filter((x): x is string => typeof x === "string") : [];
  const probs = Array.isArray(n.problems) ? n.problems.filter((x): x is string => typeof x === "string") : [];
  const reqs = Array.isArray(n.requests) ? n.requests.filter((x): x is string => typeof x === "string") : [];
  const conc = Array.isArray(n.concerns) ? n.concerns.filter((x): x is string => typeof x === "string") : [];

  const existingNotesBlock =
    info.length > 0 || probs.length > 0 || reqs.length > 0 || conc.length > 0
      ? `\n**Existing notes (do NOT duplicate in information/problems/requests/concerns):**\n${
          info.length ? `Information: ${info.join("; ")}\n` : ""
        }${probs.length ? `Problems: ${probs.join("; ")}\n` : ""}${reqs.length ? `Requests: ${reqs.join("; ")}\n` : ""}${conc.length ? `Concerns: ${conc.join("; ")}` : ""
        }\n`
      : "";

  const notesForCoachingBlock =
    info.length > 0 || probs.length > 0 || reqs.length > 0 || conc.length > 0
      ? `\n**Notes (already captured—remove coaching/solutions that address something already resolved or answered in the transcript):**\n${
          info.length ? `Information: ${info.join("; ")}\n` : ""
        }${probs.length ? `Problems: ${probs.join("; ")}\n` : ""}${reqs.length ? `Requests: ${reqs.join("; ")}\n` : ""}${conc.length ? `Concerns: ${conc.join("; ")}` : ""
        }\n`
      : "";

  const sentimentBlock =
    recentSentiments.length > 0
      ? `\n**Recent customer sentiment(s):**\n${recentSentiments.map((s) => `- ${s.sentiment || "N/A"}`).join("\n")}\n`
      : "";

  const previousBlock =
    previousCoaching.length > 0 || previousSolutions.length > 0
      ? `\n**Current coaching and solutions (return full curated list—only add or remove, never reword):**\n${
          previousSolutions.length ? `Solutions:\n${previousSolutions.map((s) => `- ${s}`).join("\n")}\n` : ""
        }${previousCoaching.length ? `Coaching:\n${previousCoaching.map((c) => `- ${c}`).join("\n")}` : ""
        }\n`
      : "";

  const prompt = `Process a live call. Return minimal, non-repetitive output. One prompt = one pass: only what is strictly necessary.

**Transcript (Speaker 1 = rep, Speaker 2 = customer):**
${transcript}
${sentimentBlock}
${existingNotesBlock}
${notesForCoachingBlock}
${previousBlock}

---

**Part 1 – Notes (NEW items only; client merges):**
- **information:** Name and/or employer only if clearly stated. Max 2. Plain: "Jordan Smith", "Northfield Electronics". No "Customer is...", "Customer's full name is...". Do NOT repeat Existing. Do NOT rephrase the same fact.
- **problems:** The ONE core issue. Max 1. One short phrase. Empty if none. Do NOT list variations ("paycheck lower", "discrepancy in hours", "schedule change" → pick ONE). Do NOT repeat Existing.
- **requests:** The ONE main ask. Max 1. One phrase. Empty if unclear. Do NOT repeat Existing.
- **concerns:** The ONE critical concern. Max 1. One phrase. Empty if none. Do NOT repeat Existing.

**Part 2 – Coaching and Solutions (FULL lists; replace current):**
- **REMOVE** if dealt with in transcript or if it matches something in Notes as already resolved.
- **KEEP** if not dealt with—copy exactly. No rewording.
- **ADD** when the customer has an unresolved problem or concern: suggest at least one **solution** (concrete idea the rep can offer) and one **coaching** tip (how to propose it, e.g. lead with empathy, offer to escalate). Do not return both solutions and coaching empty when there is an open problem or concern in Notes or the transcript.
- **solutions:** Concrete ideas for the customer's problems. Max 5. One phrase each. Only when a real problem exists; do not invent.
- **coaching:** How to propose or deliver solutions. Max 4. One phrase each.

Rules: No rephrasing the same point. No "Customer is...". No lists of variations. When problems/concerns exist and are not resolved, always return at least one solution and one coaching tip.`;

  try {
    const result = await generateText({
      model: openai.responses("gpt-4o-mini"),
      output: Output.object({ schema }),
      prompt,
    });

    // AI SDK may put structured output in result.output or result.object
    const fromOutput = (result as { output?: unknown }).output as { information?: string[]; problems?: string[]; requests?: string[]; concerns?: string[]; solutions?: string[]; coaching?: string[] } | undefined;
    const fromObject = (result as { object?: unknown }).object as typeof fromOutput;
    const out = fromOutput ?? fromObject;
    const fallback = {
      information: [] as string[],
      problems: [] as string[],
      requests: [] as string[],
      concerns: [] as string[],
      solutions: [] as string[],
      coaching: [] as string[],
    };

    if (out && typeof out === "object") {
      fallback.information = Array.isArray(out.information) ? out.information.filter((x): x is string => typeof x === "string").slice(0, 2) : [];
      fallback.problems = Array.isArray(out.problems) ? out.problems.filter((x): x is string => typeof x === "string").slice(0, 1) : [];
      fallback.requests = Array.isArray(out.requests) ? out.requests.filter((x): x is string => typeof x === "string").slice(0, 1) : [];
      fallback.concerns = Array.isArray(out.concerns) ? out.concerns.filter((x): x is string => typeof x === "string").slice(0, 1) : [];
      fallback.solutions = Array.isArray(out.solutions) ? out.solutions.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
      fallback.coaching = Array.isArray(out.coaching) ? out.coaching.filter((x): x is string => typeof x === "string").slice(0, 4) : [];
    }
    // If structured output had no solutions/coaching, try parsing from result.text (e.g. SDK put full JSON in text)
    if (fallback.solutions.length === 0 && fallback.coaching.length === 0 && typeof (result as { text?: string }).text === "string") {
      try {
        const m = (result as { text: string }).text.match(/\{[\s\S]*\}/);
        if (m) {
          const o = JSON.parse(m[0]) as Record<string, unknown>;
          if (o && typeof o === "object") {
            if (Array.isArray(o.solutions)) fallback.solutions = o.solutions.filter((x): x is string => typeof x === "string").slice(0, 5);
            if (Array.isArray(o.coaching)) fallback.coaching = o.coaching.filter((x): x is string => typeof x === "string").slice(0, 4);
            // If we got nothing from output/object, also fill notes from text
            if (!out || typeof out !== "object") {
              if (Array.isArray(o.information)) fallback.information = o.information.filter((x): x is string => typeof x === "string").slice(0, 2);
              if (Array.isArray(o.problems)) fallback.problems = o.problems.filter((x): x is string => typeof x === "string").slice(0, 1);
              if (Array.isArray(o.requests)) fallback.requests = o.requests.filter((x): x is string => typeof x === "string").slice(0, 1);
              if (Array.isArray(o.concerns)) fallback.concerns = o.concerns.filter((x): x is string => typeof x === "string").slice(0, 1);
            }
          }
        }
      } catch {}
    }

    return Response.json(fallback);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return Response.json({ error: err }, { status: 500 });
  }
}
