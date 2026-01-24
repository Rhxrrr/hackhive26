import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const scoreSchema = z.object({
  score: z
    .number()
    .min(-1)
    .max(1)
    .describe("Sentiment from -1 (very negative) to 1 (very positive), 0 = neutral"),
  sentiment: z
    .string()
    .describe("1-2 sentence summary of the emotional sentiment and intent"),
});

const SCORE_RULES = `**Score scale (-1 to 1):**
- **-1 to -0.5**: strong negativity — frustration, anger, irritation, disappointment, complaint, sarcasm, impatience, rudeness, anxiety, sadness
- **-0.5 to -0.2**: mild negativity — slight irritation, concern, coolness
- **-0.2 to 0.2**: neutral — purely factual, logistical, or blank affect; mild politeness with no warmth or edge
- **0.2 to 0.5**: mild positivity — politeness, light interest, slight warmth
- **0.5 to 1**: strong positivity — warmth, gratitude, approval, enthusiasm, relief, encouragement, satisfaction, kindness

Avoid clustering at 0. Use the full gradient when there is any emotional signal.`;

function parseScoreJson(raw: string): { score: number; sentiment: string } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { score: 0, sentiment: "" };
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>;
    const s = typeof o?.score === "number" ? o.score : typeof o?.score === "string" ? parseFloat(o.score) : NaN;
    const score = Number.isFinite(s) ? Math.max(-1, Math.min(1, s)) : 0;
    const sentiment = typeof o?.sentiment === "string" ? o.sentiment : "";
    return { score, sentiment };
  } catch {
    return { score: 0, sentiment: "" };
  }
}

/** Build a short rate-limit message; optionally use "try again in X" from the raw error (e.g. "1m26.4s"). */
function formatRateLimitError(raw: string): string {
  const m = raw.match(/(?:please\s+)?try again in\s+([\d][\d.ms]*)\s*[.\s]?/i);
  const when = m && m[1] ? m[1].trim().replace(/\.$/, "") : null;
  return when
    ? `Rate limit reached. Try again in ${when}.`
    : "Rate limit reached. Try again in a few minutes.";
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local for tone/sentiment." },
      { status: 500 }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";

  // --- Audio: multipart/form-data with "audio" file -> gpt-4o-audio-preview
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return Response.json({ error: "Invalid multipart body" }, { status: 400 });
    }
    const file = formData.get("audio");
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return Response.json(
        { error: "Form must include 'audio' (non-empty file)" },
        { status: 400 }
      );
    }
    const segmentSpeaker = String(formData.get("segmentSpeaker") || "1");
    const fullTranscript = String(formData.get("fullTranscript") || "").trim();
    const focusCustomer = formData.get("focusCustomer") === "true" || formData.get("segmentSpeaker") !== null;
    const focusPrompt = focusCustomer
      ? `\n**Important:** Focus on the CUSTOMER's (Speaker 2's) sentiment and tone, not the agent's. This segment is from Speaker ${segmentSpeaker}. If from the customer, analyze their tone; if from the agent, infer the customer's likely sentiment or use neutral.\n`
      : "";

    const contextBlock =
      fullTranscript.length > 0
        ? `**Full conversation (for context):**\n${fullTranscript}\n\nThe audio you are hearing is the segment to measure. Focus on the customer's sentiment in that segment.\n\n`
        : "";

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const audioPrompt = `${contextBlock}Analyze the tone and sentiment of this audio. Use the voice and delivery, not just words.${focusPrompt}

${SCORE_RULES}

Return ONLY a JSON object with two keys:
- "score": a number from -1 (very negative) to 1 (very positive), 0 = neutral
- "sentiment": 1-2 sentences describing the emotional tone and intent

No other text, no markdown, no explanation.`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-audio-preview",
          messages: [
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: audioPrompt },
                {
                  type: "input_audio" as const,
                  input_audio: { data: base64, format: "wav" as const },
                },
              ],
            },
          ],
        }),
      });
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string; code?: string } | string;
      };
      if (!res.ok) {
        const msg =
          (typeof data?.error === "string" ? data.error : data?.error?.message) ??
          `OpenAI ${res.status}`;
        const isRateLimit =
          res.status === 429 ||
          /rate limit|RPD|requests per day|gpt-4o-realtime|gpt-4o-audio/i.test(msg);
        return Response.json(
          { error: isRateLimit ? formatRateLimitError(msg) : msg },
          { status: res.status }
        );
      }
      const text = data?.choices?.[0]?.message?.content ?? "";
      const { score, sentiment } = parseScoreJson(text);
      return Response.json({ score, sentiment });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      const isRateLimit = /rate limit|RPD|429|gpt-4o-realtime|gpt-4o-audio/i.test(err);
      return Response.json(
        { error: isRateLimit ? formatRateLimitError(err) : err },
        { status: 500 }
      );
    }
  }

  // --- Text: application/json with "text" -> gpt-4o-mini + structured output
  let body: { text?: string; fullTranscript?: string; focusCustomer?: boolean; segmentSpeaker?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body?.text?.trim();
  if (!text) {
    return Response.json(
      { error: "Body must include 'text' (non-empty string)" },
      { status: 400 }
    );
  }

  const fullTranscript = (body?.fullTranscript ?? "").trim();
  const focusCustomer = body?.focusCustomer === true || typeof body?.segmentSpeaker === "string";
  const segmentSpeaker = typeof body?.segmentSpeaker === "string" ? body.segmentSpeaker : "1";
  const focusPrompt = focusCustomer
    ? `\n**Important:** Focus on the CUSTOMER's (Speaker 2's) sentiment and tone, not the agent's. This segment is from Speaker ${segmentSpeaker}. If it is from the customer, analyze their tone directly. If it is from the agent, infer the customer's likely sentiment from context or use neutral when unclear.\n`
    : "";

  const contextBlock =
    fullTranscript.length > 0
      ? `**Full conversation (for context):**\n${fullTranscript}\n\n**Segment to measure — focus on the customer's sentiment in this part:**\n`
      : "Transcript:\n";

  try {
    const result = await generateText({
      model: openai.responses("gpt-4o-mini"),
      output: Output.object({ schema: scoreSchema }),
      prompt: `Analyze the tone and sentiment of the following.${focusPrompt}

${SCORE_RULES}

${contextBlock}${text}

Return:
1. score: a number from -1 (very negative) to 1 (very positive), 0 = neutral. Use the full gradient.
2. sentiment: 1-2 sentences describing the emotional tone and intent`,
    });

    // AI SDK can put structured output in result.output or result.object; fallback to result.text
    const fromOutput = (result as { output?: { score?: number; sentiment?: string } }).output;
    const fromObject = (result as { object?: { score?: number; sentiment?: string } }).object;
    const obj = fromOutput ?? fromObject;
    const raw = typeof obj?.score === "number" ? obj.score : NaN;
    let score = Number.isFinite(raw) ? Math.max(-1, Math.min(1, raw)) : 0;
    let sentiment = typeof obj?.sentiment === "string" ? obj.sentiment : "";
    if (!Number.isFinite(raw) || !sentiment) {
      const parsed = parseScoreJson((result as { text?: string }).text ?? "");
      if (Number.isFinite(parsed.score)) score = Math.max(-1, Math.min(1, parsed.score));
      if (parsed.sentiment) sentiment = parsed.sentiment;
    }
    return Response.json({
      score,
      sentiment,
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const isRateLimit = /rate limit|RPD|429|gpt-4o-realtime|gpt-4o-audio/i.test(err);
    return Response.json(
      { error: isRateLimit ? formatRateLimitError(err) : err },
      { status: 500 }
    );
  }
}
