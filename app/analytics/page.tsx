"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"
import { mockAgentAnalytics, getStatusColor, getStatusLabel, type AgentAnalytics } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const chartConfig = {
  score: { label: "Score", color: "oklch(0.65 0.18 250)" },
}

function ScoreTrend({ trend, percentage, previousScore }: { trend: "up" | "down" | "stable"; percentage: number; previousScore: number }) {
  if (trend === "up") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-success">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">+{percentage.toFixed(1)}%</span>
        </div>
        <span className="text-sm text-muted-foreground">from {previousScore}</span>
      </div>
    )
  }
  if (trend === "down") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-destructive">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">-{percentage.toFixed(1)}%</span>
        </div>
        <span className="text-sm text-muted-foreground">from {previousScore}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">No change</span>
      </div>
      <span className="text-sm text-muted-foreground">from {previousScore}</span>
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 85) return "bg-success text-success-foreground"
  if (score >= 70) return "bg-warning text-warning-foreground"
  return "bg-destructive text-destructive-foreground"
}

function getHeatmapColor(score: number) {
  if (score >= 90) return "bg-success/90"
  if (score >= 80) return "bg-success/50"
  if (score >= 70) return "bg-warning/70"
  if (score >= 60) return "bg-warning/40"
  return "bg-destructive/60"
}

function getHeatmapTextColor(score: number) {
  if (score >= 80) return "text-foreground"
  if (score >= 60) return "text-foreground"
  return "text-foreground"
}

export default function AnalyticsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState(mockAgentAnalytics[0].agent.id)
  const selectedAnalytics = mockAgentAnalytics.find((a) => a.agent.id === selectedAgentId)!

  const lineChartData = selectedAnalytics.monthlyHistory.map((m) => ({
    month: m.month.split(" ")[0],
    fullMonth: m.month,
    score: m.overallScore,
    calls: m.callsReviewed,
  }))

  // Prepare heatmap data: rows are categories, columns are months
  const categories = selectedAnalytics.currentRubricBreakdown.map((r) => r.category)
  const months = selectedAnalytics.monthlyHistory.map((m) => m.month.split(" ")[0])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-56">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Agent Performance</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track QA scores and coaching insights
              </p>
            </div>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {mockAgentAnalytics.map((analytics) => (
                  <SelectItem key={analytics.agent.id} value={analytics.agent.id}>
                    {analytics.agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score Hero + Trend */}
          <div className="mb-8 flex items-start gap-8">
            {/* Current Score */}
            <div className="flex items-center gap-6">
              <div className={cn("flex h-24 w-24 items-center justify-center rounded-2xl text-4xl font-bold", getScoreColor(selectedAnalytics.currentScore))}>
                {selectedAnalytics.currentScore}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current QA Score</p>
                <p className="mt-1 text-lg font-semibold">{selectedAnalytics.agent.name}</p>
                <div className="mt-2">
                  <ScoreTrend
                    trend={selectedAnalytics.trend}
                    percentage={selectedAnalytics.trendPercentage}
                    previousScore={selectedAnalytics.previousMonthScore}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="ml-auto flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-semibold">{selectedAnalytics.totalCallsReviewed}</p>
                <p className="text-muted-foreground">Total Calls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">{selectedAnalytics.aiConfidenceMetrics.highConfidence}%</p>
                <p className="text-muted-foreground">High Confidence</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-destructive">{selectedAnalytics.aiConfidenceMetrics.totalFlagged}</p>
                <p className="text-muted-foreground">Flagged</p>
              </div>
            </div>
          </div>

          {/* Score Progression Chart */}
          <Card className="mb-8 border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Score Progression</CardTitle>
              <CardDescription>Monthly average QA scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: "oklch(0.50 0 0)", fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    domain={[50, 100]} 
                    tick={{ fill: "oklch(0.50 0 0)", fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    width={35}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-lg">
                          <p className="text-sm font-medium">{data.fullMonth}</p>
                          <p className="text-sm text-muted-foreground">
                            Score: <span className="font-semibold text-foreground">{data.score}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Calls: <span className="font-medium text-foreground">{data.calls}</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="oklch(0.65 0.18 250)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.65 0.18 250)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "oklch(0.65 0.18 250)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Rubric Heatmap */}
          <Card className="mb-8 border-border/50 bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Rubric Breakdown</CardTitle>
              <CardDescription>Category scores across months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">Category</th>
                      {months.map((month) => (
                        <th key={month} className="px-2 pb-3 text-center text-xs font-medium text-muted-foreground">
                          {month}
                        </th>
                      ))}
                      <th className="pb-3 pl-4 text-center text-xs font-medium text-muted-foreground">Current</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const currentScore = selectedAnalytics.currentRubricBreakdown.find((r) => r.category === category)?.score || 0
                      return (
                        <tr key={category}>
                          <td className="py-1.5 pr-4 text-sm text-foreground">{category}</td>
                          {selectedAnalytics.monthlyHistory.map((m, i) => {
                            const score = m.categoryScores[category] || 0
                            return (
                              <td key={i} className="px-1 py-1.5">
                                <div
                                  className={cn(
                                    "mx-auto flex h-9 w-12 items-center justify-center rounded text-xs font-medium",
                                    getHeatmapColor(score),
                                    getHeatmapTextColor(score)
                                  )}
                                >
                                  {score}
                                </div>
                              </td>
                            )
                          })}
                          <td className="py-1.5 pl-4">
                            <div
                              className={cn(
                                "mx-auto flex h-9 w-14 items-center justify-center rounded text-sm font-semibold",
                                getHeatmapColor(currentScore),
                                getHeatmapTextColor(currentScore)
                              )}
                            >
                              {currentScore}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Legend */}
              <div className="mt-4 flex items-center justify-end gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-destructive/60" />
                  <span>{"<60"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-warning/40" />
                  <span>60-69</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-warning/70" />
                  <span>70-79</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-success/50" />
                  <span>80-89</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-success/90" />
                  <span>90+</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call History */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">Recent Calls</CardTitle>
                  <CardDescription>Latest reviewed calls for this agent</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/reviews">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Score</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAnalytics.recentCalls.map((call) => (
                    <TableRow key={call.id} className="border-border/50">
                      <TableCell className="text-sm">
                        {new Date(call.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          {call.customerName}
                          {call.flagged && (
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex h-7 w-10 items-center justify-center rounded text-sm font-medium",
                          call.score >= 85 ? "bg-success/20 text-success" :
                          call.score >= 70 ? "bg-warning/20 text-warning" :
                          "bg-destructive/20 text-destructive"
                        )}>
                          {call.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(call.status))}>
                          {getStatusLabel(call.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/review/${call.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
