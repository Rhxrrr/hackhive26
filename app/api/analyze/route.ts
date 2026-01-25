import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import * as _X from "xlsx";
const XLSX = (_X as { default?: typeof _X }).default ?? _X;

const analysisSchema = z.object({
  overallScore: z
    .number()
    .describe(
      "Overall call quality score 0-100. When a rubric is provided, base on how well the agent met the rubric criteria.",
    ),
  summary: z
    .string()
    .describe(
      "Brief QA/performance summary. When a rubric is provided, reference which rubric criteria the agent met or missed.",
    ),
  conversationSummary: z
    .string()
    .describe(
      "Brief summary of what was discussed in the call—the actual conversation content, topics, and outcome. This is a neutral summary of the call for someone who wants to know what happened, not feedback for the agent.",
    ),
  markers: z
    .array(
      z.object({
        timestamp: z
          .number()
          .describe("Timestamp in seconds where this event occurs"),
        type: z
          .enum(["good", "bad", "uncertain", "improvement"])
          .describe(
            "good=positive moment; bad=clear issue; uncertain=ambiguous; improvement=needs improvement",
          ),
        category: z
          .string()
          .describe(
            "The EXACT section title/heading from the rubric—character-for-character, no paraphrasing. When no rubric: e.g. greeting, empathy, resolution.",
          ),
        rubricExact: z
          .string()
          .describe(
            "When rubric: copy the section's description exactly as it appears—no paraphrasing. When no rubric: \"\".",
          ),
        description: z
          .string()
          .describe(
            "Your comment about this specific message only: how this moment relates to the rubric. Unique to this message—do not repeat the rubric. When no rubric: explain what happened.",
          ),
        confidence: z.number().describe("AI confidence level from 0-100"),
      }),
    )
    .describe(
      "Markers for good, bad, improvement, or uncertain moments. Each must relate to a specific rubric section when a rubric is provided.",
    ),
  strengths: z
    .array(z.string())
    .describe(
      "List of things the agent did well. When a rubric is provided, each strength must cite the exact rubric section/criterion (e.g. '[Opening 1.1] Agent greeted professionally').",
    ),
  improvements: z
    .array(z.string())
    .describe(
      "List of areas for improvement. When a rubric is provided, each improvement must cite the exact rubric section/criterion (e.g. '[Troubleshooting 4.2] Agent should check notes before asking customer to repeat').",
    ),
  categoryScores: z
    .object({
      opening: z.number(),
      empathy: z.number(),
      troubleshooting: z.number(),
      resolution: z.number(),
      closing: z.number(),
    })
    .describe(
      "Scores 0-100 per category. When a rubric is provided, derive each from how well the agent met the rubric criteria that map to that category.",
    ),
  agent: z
    .string()
    .describe("Agent name if stated; use '—' when not stated"),
  customer: z
    .string()
    .describe(
      "Customer name or identifier if stated; use '—' when not stated",
    ),
});

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const transcript = (formData.get("transcript") as string)?.trim() ?? "";
    const duration = parseFloat(formData.get("duration") as string) || 180;
    let rubricText = (formData.get("rubric") as string)?.trim() ?? "";

    const rubricFile = formData.get("rubricFile");
    const rubricFileName = (formData.get("rubricFileName") as string) || "";
    if (
      rubricFile &&
      typeof (rubricFile as Blob).arrayBuffer === "function"
    ) {
      try {
        const buf = Buffer.from(await (rubricFile as Blob).arrayBuffer());
        const ext = (rubricFileName.split(".").pop() || "").toLowerCase();
        if (ext === "xlsx" || ext === "xls") {
          const wb = XLSX.read(buf, { type: "buffer" });
          const parts: string[] = [];
          const names = wb?.SheetNames;
          const sheets = wb?.Sheets;
          if (Array.isArray(names) && sheets) {
            for (const name of names) {
              const sheet = sheets[name];
              if (!sheet) continue;
              const aoa = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                raw: false,
              }) as (string | number)[][];
              if (!Array.isArray(aoa) || aoa.length === 0) {
                const csv = XLSX.utils.sheet_to_csv(sheet);
                if (csv?.trim()) parts.push(csv);
                continue;
              }
              const first = (aoa[0] || []) as (string | number)[];
              const firstStr = first.map((c) => String(c ?? "").toLowerCase());
              const looksLikeHeader = firstStr.some(
                (s) =>
                  /section|category|topic|description|criteria|criterion|requirement|#|number/i.test(
                    s
                  ) || (s.length <= 2 && /^\d+$/.test(s))
              );
              let titleCol = 0;
              let descCol = 1;
              if (looksLikeHeader && first.length >= 2) {
                for (let i = 0; i < first.length; i++) {
                  const t = String(first[i] ?? "").toLowerCase();
                  if (
                    /description|criteria|criterion|requirement|details|expectation|standard|notes/.test(
                      t
                    )
                  )
                    descCol = i;
                  else if (/section|category|topic|item/.test(t)) titleCol = i;
                }
              }
              const blocks: string[] = [];
              const start = looksLikeHeader ? 1 : 0;
              for (let r = start; r < aoa.length; r++) {
                const row = (aoa[r] || []) as (string | number)[];
                const title = String(row[titleCol] ?? "").trim();
                const desc = String(row[descCol] ?? "").trim();
                if (!desc) continue;
                blocks.push(
                  `---\nSection: ${title || `Item ${r + 1}`}\nDescription: ${desc}\n`
                );
              }
              if (blocks.length > 0) {
                parts.push(blocks.join("\n"));
              } else {
                const csv = XLSX.utils.sheet_to_csv(sheet);
                if (csv?.trim()) parts.push(csv);
              }
            }
          }
          rubricText = parts.join("\n\n");
        } else if (ext === "pdf") {
          const pdfjs = await import("pdfjs-dist");
          const pdf = await pdfjs.getDocument({
            data: new Uint8Array(buf),
          }).promise;
          const parts: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            parts.push(
              content.items
                .map((x: { str?: string }) => (x as { str?: string }).str ?? "")
                .join(" ")
            );
          }
          rubricText = parts.join("\n\n");
        } else {
          rubricText = buf.toString("utf-8");
        }
      } catch {
        // keep rubricText from "rubric" field or ""
      }
    }

    if (!transcript) {
      return Response.json(
        { error: "Transcript is required. Transcribe the audio first." },
        { status: 400 }
      );
    }

    const rubricSource = rubricFileName
      ? ` (extracted from the **uploaded rubric file** \`${rubricFileName}\`)`
      : "";

    const hasStructuredRubric =
      rubricText.includes("---") &&
      rubricText.includes("Section:") &&
      rubricText.includes("Description:");

    const rubricBlock = rubricText
      ? `

**Rubric${rubricSource} — copy exactly as written**

Copy the **description** exactly as it appears in the rubric—same words, punctuation, and order; no paraphrasing. \`category\` = section title. \`rubricExact\` = that section's description, exactly as written. ${
        hasStructuredRubric
          ? "If the rubric uses 'Description: X', use the exact text after 'Description: '."
          : "Use the longer criterion text, not the section title."
        } \`description\` = your comment only. Never leave \`rubricExact\` empty. Markers only for explicit criteria; strengths/improvements cite exact section titles; categoryScores from matching rubric criteria.

---

**RUBRIC:**

${rubricText}`
      : `

**Markers (no rubric):** For each marker, set "category" to a specific area (e.g. greeting, empathy, resolution, tone, compliance). Set \`rubricExact\` to \`""\`. In "description", explain what happened and which area it relates to.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: analysisSchema }),
      prompt: `You are a QA analyst reviewing a customer service call. Analyze the following call transcript and provide detailed feedback.

**Transcript format:** Each line is prefixed with "Agent:" or "Customer:". The **Agent** is the customer service representative (the employee being evaluated). The **Customer** is the person who called. Use these labels to know who said what.

**Critical – Agent vs Customer:** All evaluation (overall score, markers, strengths, improvements, categoryScores) applies to the **AGENT only**. The customer's words are for context. In every marker description and in strengths/improvements, attribute correctly: "The agent..." vs "The customer...". Do not credit or blame the customer for the agent's actions. If a line's label seems wrong from context (e.g. "Customer: How can I help you today?"), use content: the agent usually greets, offers help, apologizes, troubleshoots, and closes; the customer usually describes the problem and asks for help. Prefer content over the label when they conflict.

The call duration is ${duration} seconds. Create markers at various timestamps throughout the call (from 0 to ${duration} seconds).
${rubricBlock}

**Marker types (use exactly one per marker):** good | bad | improvement | uncertain.
- **good**: Positive moment; agent did something well.
- **bad**: Clear issue or failure.
- **improvement**: Needs improvement; could be better but not a failure.
- **uncertain**: Context is ambiguous; cannot clearly judge.

Transcript (Agent = employee being evaluated; Customer = caller):
${transcript}

Provide (all feedback is about the Agent only). When a rubric is provided, 1–7 must relate to it:
1. **overallScore** (0-100)
2. **summary** (QA/performance; which criteria met or missed)
3. **conversationSummary** (neutral: what was discussed, outcome)
4. **markers** (6-12): \`category\` = section title; \`rubricExact\` = that section's description copied exactly as in the rubric; \`description\` = your comment. No rubric: category e.g. greeting/empathy, \`rubricExact\` = \`""\`, description = what happened.
5. **strengths**: cite exact section titles; only from explicit rubric sections.
6. **improvements**: cite exact section titles; only from explicit rubric sections.
7. **categoryScores**: { opening, empathy, troubleshooting, resolution, closing } 0-100
8. **agent**: name if stated, else "—". 9. **customer**: name if stated, else "—"`,
    });

    const obj = result.object ?? (result as { output?: unknown }).output;
    if (obj == null) throw new Error("No analysis result from model");
    return Response.json(obj);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
