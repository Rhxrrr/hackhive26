"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import Link from "next/link"
import { TrendingUp, AlertTriangle, ExternalLink, ArrowRight, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"

const agents = [
  { id: "marcus-chen", name: "Marcus Chen" },
  { id: "sarah-mitchell", name: "Sarah Mitchell" },
]

const chartConfig = {
  score: { label: "QA Score", color: "#60a5fa" },
}

const radarChartConfig = { score: { label: "Score", color: "#60a5fa" } }

const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Current"]

const radarSubjects = ["Greeting", "Active", "Problem", "Product", "Empathy", "Call"] as const

/** Sarah Mitchell's rubric: Current column = [94, 78, 80, 86, 76, 78]. Avg = 82. */
const rubricSarah: { category: string; scores: number[] }[] = [
  { category: "Greeting & Introduction", scores: [88, 90, 92, 94, 92, 94, 94] },
  { category: "Active Listening", scores: [70, 72, 74, 76, 74, 78, 78] },
  { category: "Problem Resolution", scores: [72, 74, 76, 78, 76, 80, 80] },
  { category: "Product Knowledge", scores: [78, 80, 82, 84, 82, 86, 86] },
  { category: "Empathy & Rapport", scores: [68, 70, 72, 74, 72, 76, 76] },
  { category: "Call Closure", scores: [70, 72, 74, 76, 74, 78, 78] },
]

/** Marcus Chen's rubric: Current column = [92, 75, 80, 85, 70, 78]. Display score 78. */
const rubricMarcus: { category: string; scores: number[] }[] = [
  { category: "Greeting & Introduction", scores: [85, 88, 90, 92, 90, 92, 92] },
  { category: "Active Listening", scores: [65, 68, 70, 72, 70, 75, 75] },
  { category: "Problem Resolution", scores: [70, 72, 74, 76, 74, 80, 80] },
  { category: "Product Knowledge", scores: [75, 78, 80, 82, 80, 85, 85] },
  { category: "Empathy & Rapport", scores: [60, 62, 64, 66, 65, 70, 70] },
  { category: "Call Closure", scores: [68, 70, 72, 74, 72, 78, 78] },
]

function getRubricByAgent(agentId: string): { category: string; scores: number[] }[] {
  if (agentId === "sarah-mitchell") return rubricSarah
  return rubricMarcus
}

/** QA score = average of the "Current" (last) column of rubric, rounded. */
function calcQAScore(rubric: { category: string; scores: number[] }[]): number {
  const curr = rubric.map((r) => r.scores[r.scores.length - 1])
  const sum = curr.reduce((a, b) => a + b, 0)
  return Math.round(sum / curr.length)
}

/** Radar uses Current (last) column. */
function rubricToRadarData(rubric: { category: string; scores: number[] }[]): { subject: string; score: number; fullMark: 100 }[] {
  return rubric.map((r, i) => ({
    subject: radarSubjects[i],
    score: r.scores[r.scores.length - 1],
    fullMark: 100 as const,
  }))
}

/** Score progression: for each month Aug–Jan, average all rubric categories for that month. */
function rubricToScoreProgression(rubric: { category: string; scores: number[] }[]): { month: string; score: number }[] {
  const monthLabels = months.slice(0, 6) // Aug, Sep, Oct, Nov, Dec, Jan (exclude Current)
  return monthLabels.map((monthName, colIndex) => {
    const sum = rubric.reduce((acc, row) => acc + row.scores[colIndex], 0)
    return { month: monthName, score: Math.round(sum / rubric.length) }
  })
}

/** KPI per agent: previousScore (for "from X") in percent change. */
const kpiByAgent: Record<string, { previousScore: number }> = {
  "marcus-chen": { previousScore: 72 },
  "sarah-mitchell": { previousScore: 78 },
}

function getScoreBadgeClass(score: number): string {
  if (score < 60) return "bg-red-700/70 text-red-100"
  if (score < 70) return "bg-red-500/70 text-red-100"
  if (score < 80) return "bg-amber-500/70 text-amber-100"
  if (score < 90) return "bg-emerald-600/70 text-emerald-100"
  return "bg-emerald-500/70 text-emerald-100"
}

type RecentCallRow = { date: string; customer: string; hasWarning: boolean; score: number; status: "Needs Attention" | "Completed" }

const recentCallsByAgent: Record<string, RecentCallRow[]> = {
  "marcus-chen": [
    { date: "Jan 23", customer: "Sarah Williams", hasWarning: true, score: 78, status: "Needs Attention" },
    { date: "Jan 21", customer: "Amanda Foster", hasWarning: true, score: 65, status: "Needs Attention" },
    { date: "Jan 19", customer: "James Mitchell", hasWarning: false, score: 82, status: "Completed" },
    { date: "Jan 17", customer: "Rebecca Torres", hasWarning: false, score: 88, status: "Completed" },
    { date: "Jan 15", customer: "Daniel Kim", hasWarning: true, score: 75, status: "Completed" },
    { date: "Jan 13", customer: "Michelle Brown", hasWarning: false, score: 80, status: "Completed" },
  ],
  "sarah-mitchell": [
    { date: "Jan 24", customer: "Michael Brown", hasWarning: false, score: 84, status: "Completed" },
    { date: "Jan 22", customer: "Lisa Anderson", hasWarning: true, score: 79, status: "Needs Attention" },
    { date: "Jan 20", customer: "David Park", hasWarning: false, score: 88, status: "Completed" },
    { date: "Jan 18", customer: "Jennifer Lee", hasWarning: false, score: 91, status: "Completed" },
    { date: "Jan 16", customer: "Robert Martinez", hasWarning: true, score: 72, status: "Needs Attention" },
    { date: "Jan 14", customer: "Amanda White", hasWarning: false, score: 86, status: "Completed" },
  ],
}

function getRecentCallScoreBadgeClass(score: number): string {
  return getScoreBadgeClass(score)
}

function getQABoxClass(score: number): string {
  if (score >= 80) return "bg-emerald-600/90 text-emerald-50"
  if (score >= 70) return "bg-amber-600/90 text-amber-50"
  return "bg-red-600/90 text-red-50"
}

export default function AgentPerformancePage() {
  const [agent, setAgent] = useState("marcus-chen")
  const currentAgent = agents.find((a) => a.id === agent) ?? agents[0]
  const rubric = getRubricByAgent(agent)
  const qaScore = calcQAScore(rubric)
  const radarData = rubricToRadarData(rubric)
  const scoreProgressionData = rubricToScoreProgression(rubric)
  const kpi = kpiByAgent[agent] ?? kpiByAgent["marcus-chen"]
  const pctChange = kpi.previousScore ? ((qaScore - kpi.previousScore) / kpi.previousScore) * 100 : 0
  const recentCalls = recentCallsByAgent[agent] ?? recentCallsByAgent["marcus-chen"]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl w-full px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Performance</h1>
            <p className="text-sm text-muted-foreground">Track QA scores and coaching insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">QA Review</Link>
            </Button>
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-20 w-24 shrink-0 items-center justify-center rounded-lg text-3xl font-bold ${getQABoxClass(qaScore)}`}>
              {qaScore}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current QA Score</p>
              <p className="text-lg font-semibold text-foreground">{currentAgent.name}</p>
              <div className="flex items-center gap-2">
                {pctChange >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : null}
                <span className={`text-sm font-medium ${pctChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">from {kpi.previousScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Score Progression</CardTitle>
              <CardDescription>Monthly average QA scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <LineChart data={scoreProgressionData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="white" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "white", fontSize: 12 }} />
                  <YAxis domain={[50, 100]} tickLine={false} axisLine={false} ticks={[50, 65, 80, 100]} tick={{ fill: "white", fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
                  <Line type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#60a5fa", stroke: "hsl(var(--background))", strokeWidth: 2 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Brain className="h-5 w-5 text-foreground" />
                Rubric Breakdown
              </CardTitle>
              <CardDescription>Current performance across all rubric categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={radarChartConfig} className="h-[260px] w-full">
                <RadarChart data={radarData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <defs>
                    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.15} />
                    </radialGradient>
                  </defs>
                  <PolarGrid stroke="white" strokeOpacity={0.5} strokeWidth={1} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "white", fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "white", fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="#60a5fa" strokeWidth={2} fill="url(#radarFill)" dot={{ r: 5, fill: "#60a5fa", stroke: "white", strokeWidth: 1.5 }} />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Rubric Breakdown table */}
        <Card className="mb-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Rubric Breakdown</CardTitle>
            <CardDescription>Category scores across months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="pb-3 pr-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                    {months.map((m) => (
                      <th key={m} className="px-2 pb-3 text-center text-sm font-medium text-muted-foreground">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rubric.map((row) => (
                    <tr key={row.category}>
                      <td className="border-t border-border py-3 pr-4 text-sm text-foreground">{row.category}</td>
                      {row.scores.map((s, i) => (
                        <td key={i} className="border-t border-border px-2 py-3 text-center">
                          <span className={`inline-flex min-w-[2.5rem] justify-center rounded-lg px-3 py-1.5 text-sm ${getScoreBadgeClass(s)}`}>
                            {s}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-700/70" />&lt;60
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />60-69
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />70-79
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600/70" />80-89
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />90+
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Calls</CardTitle>
            <CardDescription>Latest reviewed calls for this agent</CardDescription>
            <CardAction>
              <Link href={`/call-reviews?agent=${encodeURIComponent(agent)}`} className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="pb-3 pr-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 pr-4 text-left text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="pb-3 px-2 text-center text-sm font-medium text-muted-foreground">Score</th>
                    <th className="pb-3 px-2 text-center text-sm font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pl-2 text-right text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((row) => (
                    <tr key={`${row.date}-${row.customer}`} className="border-t border-border">
                      <td className="py-3 pr-4 text-sm text-foreground">{row.date}</td>
                      <td className="py-3 pr-4 text-sm text-foreground">
                        <span className="flex items-center gap-1.5">
                          {row.customer}
                          {row.hasWarning && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex min-w-[2.25rem] justify-center rounded-lg px-2.5 py-1 text-sm font-medium ${getRecentCallScoreBadgeClass(row.score)}`}>
                          {row.score}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-medium ${
                            row.status === "Needs Attention" ? "bg-amber-600/90 text-amber-100" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <Link href="/" className="inline-flex text-muted-foreground hover:text-foreground transition-colors" aria-label="View call">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
