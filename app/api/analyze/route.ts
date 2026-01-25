import { generateText, Output } from "ai"
import { z } from "zod"

const analysisSchema = z.object({
  overallScore: z.number().describe("Overall call quality score from 0-100"),
  summary: z.string().describe("Brief summary of the call performance for QA/feedback"),
  conversationSummary: z.string().describe("Brief summary of what was discussed in the call—the actual conversation content, topics, and outcome. This is a neutral summary of the call for someone who wants to know what happened, not feedback for the agent."),
  markers: z.array(
    z.object({
      timestamp: z.number().describe("Timestamp in seconds where this event occurs"),
      type: z.enum(["good", "bad", "uncertain"]).describe("Type of marker - good for positive moments, bad for issues, uncertain when AI cannot determine"),
      category: z.string().describe("Category like greeting, empathy, resolution, tone, compliance, etc."),
      description: z.string().describe("Detailed explanation of what happened at this point"),
      confidence: z.number().describe("AI confidence level from 0-100"),
    })
  ).describe("List of timestamped markers indicating good, bad, or uncertain moments in the call"),
  strengths: z.array(z.string()).describe("List of things the agent did well"),
  improvements: z.array(z.string()).describe("List of areas for improvement"),
})

export async function POST(req: Request) {
  const formData = await req.formData()
  const transcript = formData.get("transcript") as string
  const duration = parseFloat(formData.get("duration") as string) || 180

  // Simulate AI analysis with realistic markers based on duration
  const result = await generateText({
    model: "openai/gpt-4o-mini",
    output: Output.object({ schema: analysisSchema }),
    prompt: `You are a QA analyst reviewing a customer service call. Analyze the following call transcript and provide detailed feedback.

The call duration is ${duration} seconds. Create markers at various timestamps throughout the call (from 0 to ${duration} seconds).

Transcript:
${transcript || "No transcript provided - generate a realistic sample analysis for a customer service call about a billing dispute. The agent handled the initial greeting well, struggled with empathy during the complaint, showed good problem-solving skills when offering solutions, but had an awkward closing."}

Provide:
1. An overall quality score (0-100)
2. A brief summary (QA/performance feedback for the agent)
3. A conversation summary: a neutral summary of what was actually discussed in the call—the topic, key points, resolution, and outcome—for someone who wants to know what happened in the conversation (not agent feedback)
4. Timestamped markers indicating good, bad, or uncertain moments (include at least 6-10 markers spread across the call)
5. List of strengths
6. List of areas for improvement

For uncertain markers, use them when the context is ambiguous or when you cannot definitively judge whether the agent's response was appropriate.`,
  })

  return Response.json(result.object)
}
