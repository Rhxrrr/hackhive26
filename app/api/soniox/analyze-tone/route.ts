import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const toneSchema = z.object({
  tone: z
    .enum(["positive", "negative", "neutral", "mixed"])
    .describe("Overall tone of the speech"),
  sentiment: z
    .string()
    .describe("1-2 sentence summary of the emotional sentiment and intent"),
});

const TONE_RULES = `**Tone rules (choose one, avoid defaulting to neutral):**
- **positive**: warmth, gratitude, approval, enthusiasm, relief, encouragement, satisfaction, kindness
- **negative**: frustration, anger, irritation, disappointment, complaint, sarcasm, impatience, rudeness, anxiety, sadness
- **mixed**: clear combination of positive and negative (e.g. grateful but frustrated, polite but annoyed)
- **neutral**: only when there is genuinely no emotional charge—purely factual, logistical, or blank affect. Do NOT use neutral for: mild politeness, slight irritation, light enthusiasm, or any hint of positive/negative. When in doubt between neutral and something else, choose the other.`;

function parseToneJson(raw: string): { tone: string; sentiment: string } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { tone: "neutral", sentiment: "" };
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>;
    const tone = typeof o?.tone === "string" ? o.tone : "neutral";
    const sentiment = typeof o?.sentiment === "string" ? o.sentiment : "";
    return { tone, sentiment };
  } catch {
    return { tone: "neutral", sentiment: "" };
  }
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
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const audioPrompt = `Analyze the tone and sentiment of this audio. Use the voice and delivery, not just words.

${TONE_RULES}

Return ONLY a JSON object with two keys:
- "tone": one of positive, negative, neutral, mixed
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
        error?: { message?: string };
      };
      if (!res.ok) {
        return Response.json(
          { error: data?.error?.message ?? `OpenAI ${res.status}` },
          { status: 500 }
        );
      }
      const text = data?.choices?.[0]?.message?.content ?? "";
      const { tone, sentiment } = parseToneJson(text);
      return Response.json({ tone, sentiment });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      return Response.json({ error: err }, { status: 500 });
    }
  }

  // --- Text: application/json with "text" -> gpt-4o-mini + structured output
  let body: { text?: string };
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

  try {
    const result = await generateText({
      model: openai.responses("gpt-4o-mini"),
      output: Output.object({ schema: toneSchema }),
      prompt: `Analyze the tone and sentiment of the following transcribed speech.

${TONE_RULES}

Transcript:
${text}

Return:
1. tone: one of positive, negative, neutral, mixed (prefer positive/negative/mixed when there is any emotional signal)
2. sentiment: 1-2 sentences describing the emotional tone and intent`,
    });

    const obj = result.object as { tone?: string; sentiment?: string } | undefined;
    return Response.json({
      tone: typeof obj?.tone === "string" ? obj.tone : "neutral",
      sentiment: typeof obj?.sentiment === "string" ? obj.sentiment : "",
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return Response.json({ error: err }, { status: 500 });
  }
}
