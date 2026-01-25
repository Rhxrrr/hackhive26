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
            'When rubric: copy the section\'s description exactly as it appears—no paraphrasing. When no rubric: "".',
          ),
        description: z
          .string()
          .describe(
            "Your comment about the AGENT's message at this moment only: how the agent's words/actions relate to the rubric. Must be based solely on an Agent: line—never on a Customer: line. Never attribute the customer's words or behavior to the agent. When no rubric: explain what the agent did.",
          ),
        confidence: z.number().describe("AI confidence level from 0-100"),
      }),
    )
    .describe(
      "Markers for good, bad, improvement, or uncertain moments. Each marker must be tied to an Agent: line only—never to a Customer: line. Each must relate to a specific rubric section when a rubric is provided.",
    ),
  strengths: z
    .array(z.string())
    .describe(
      "List of things the agent did well, based only on Agent: lines. When a rubric is provided, each must cite the exact rubric section (e.g. '[Opening 1.1] Agent greeted professionally'). Never credit the agent for customer behavior.",
    ),
  improvements: z
    .array(z.string())
    .describe(
      "List of areas for improvement, based only on Agent: lines and rubric criteria. When a rubric is provided, each must cite the exact rubric section (e.g. '[Troubleshooting 4.2] Agent should check notes before asking customer to repeat'). Strictly about the agent's script vs the rubric—never the customer.",
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
  agent: z.string().describe("Agent name if stated; use '—' when not stated"),
  customer: z
    .string()
    .describe("Customer name or identifier if stated; use '—' when not stated"),
});

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const transcript = (formData.get("transcript") as string)?.trim() ?? "";
    const duration = parseFloat(formData.get("duration") as string) || 180;
    let rubricText = (formData.get("rubric") as string)?.trim() ?? "";

    const rubricFile = formData.get("rubricFile");
    const rubricFileName = (formData.get("rubricFileName") as string) || "";
    if (rubricFile && typeof (rubricFile as Blob).arrayBuffer === "function") {
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
                    s,
                  ) ||
                  (s.length <= 2 && /^\d+$/.test(s)),
              );
              let titleCol = 0;
              let descCol = 1;
              if (looksLikeHeader && first.length >= 2) {
                for (let i = 0; i < first.length; i++) {
                  const t = String(first[i] ?? "").toLowerCase();
                  if (
                    /description|criteria|criterion|requirement|details|expectation|standard|notes/.test(
                      t,
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
                  `---\nSection: ${title || `Item ${r + 1}`}\nDescription: ${desc}\n`,
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
                .join(" "),
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
        { status: 400 },
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
        } \`description\` = your comment on the agent's words/actions only (Agent: lines); never attribute customer lines to the agent. Never leave \`rubricExact\` empty. Markers only for Agent: lines and explicit rubric criteria; strengths/improvements cite exact section titles; categoryScores from matching rubric criteria.

---

**RUBRIC:**

${rubricText}`
      : `

**Markers (no rubric):** For each marker, use an **Agent:** line only. Set "category" to a specific area (e.g. greeting, empathy, resolution, tone, compliance). Set \`rubricExact\` to \`""\`. In "description", explain what the **agent** said or did and which area it relates to. Never base a marker on a Customer: line.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: analysisSchema }),
      prompt: `You are a QA analyst reviewing a customer service call. Analyze the following call transcript and provide detailed feedback.

**Transcript format:** Each line is prefixed with "Agent:" or "Customer:". The transcript is clearly separated—**trust these labels**. The **Agent** is the employee being evaluated. The **Customer** is the caller. Only **Agent:** lines are evaluated; **Customer:** lines are for context only.

**Agent-only evaluation (strict):**
- All feedback (overall score, markers, strengths, improvements, categoryScores) is about the **AGENT only** and must be based **only on Agent: lines**.
- **Markers:** Create each marker for an **Agent:** line only. The \`description\` must comment on what the **agent** said or did at that moment and how it relates to the rubric. **Never** base a marker on a Customer: line. **Never** attribute the customer's words or behavior to the agent (e.g. if the line is "Customer: Hi Alex, I'm calling because..."—the customer is addressing the agent and stating their reason; do not write "The agent introduced themselves" or "The agent fostered a personal connection"; that would be incorrect).
- **Strengths and improvements:** Only from the agent's words and actions; each must cite an exact rubric section. Do not credit or fault the agent for what the customer said or did.
- **Rubric:** When a rubric is provided, every marker, strength, and improvement must tie to a rubric section. Comments must be strictly about where the **agent's** script meets or misses the rubric—not the customer's.

The call duration is ${duration} seconds. Create markers at timestamps that correspond to **Agent:** lines (from 0 to ${duration} seconds).
${rubricBlock}

**Marker types (use exactly one per marker):** good | bad | improvement | uncertain.
- **good**: Agent did something well (from an Agent: line).
- **bad**: Clear issue or failure in the agent's response.
- **improvement**: Agent could do better; not a failure.
- **uncertain**: Context is ambiguous; cannot clearly judge.

Transcript (Agent = employee being evaluated; Customer = caller; evaluate only Agent: lines):
${transcript}

Provide (all feedback from Agent: lines only; relate strictly to the rubric when provided):
1. **overallScore** (0-100): from agent's performance vs rubric.
2. **summary** (QA/performance; which rubric criteria the agent met or missed).
3. **conversationSummary** (neutral: what was discussed, outcome).
4. **markers** (6-12): Each for an **Agent:** line only. \`category\` = rubric section title; \`rubricExact\` = that section's description copied exactly; \`description\` = your comment on the **agent's** words/actions and how they relate to the rubric. Never use a Customer: line as the basis for a marker's description.
5. **strengths**: cite exact rubric section titles; only from agent behavior on Agent: lines.
6. **improvements**: cite exact rubric section titles; only from agent behavior on Agent: lines.
7. **categoryScores**: { opening, empathy, troubleshooting, resolution, closing } 0-100 from rubric criteria.
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
