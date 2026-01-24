"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Sparkles
} from "lucide-react"
import type { SentimentData } from "@/lib/mock-data"

interface CallSummaryProps {
  summary: string
  sentiment: SentimentData
  overallScore: number
}

export function CallSummary({ summary, sentiment, overallScore }: CallSummaryProps) {
  const getSentimentColor = (value: "positive" | "neutral" | "negative") => {
    switch (value) {
      case "positive":
        return "bg-success/20 text-success"
      case "negative":
        return "bg-destructive/20 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low":
        return "bg-success/20 text-success"
      case "medium":
        return "bg-warning/20 text-warning"
      case "high":
        return "bg-destructive/20 text-destructive"
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Call Summary
            <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">
              AI Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </CardContent>
      </Card>

      {/* Sentiment Overview */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            Sentiment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Overall Sentiment */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overall
              </p>
              <Badge className={getSentimentColor(sentiment.overall)}>
                {sentiment.overall.charAt(0).toUpperCase() + sentiment.overall.slice(1)}
              </Badge>
            </div>

            {/* Escalation Risk */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Escalation Risk
              </p>
              <Badge className={getRiskColor(sentiment.escalationRisk)}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {sentiment.escalationRisk.charAt(0).toUpperCase() + sentiment.escalationRisk.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3 pt-2">
            <MetricBar 
              label="Agent Tone" 
              value={sentiment.agentTone} 
            />
            <MetricBar 
              label="Customer Satisfaction" 
              value={sentiment.customerSatisfaction} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overall Score
              </p>
              <p className={`text-4xl font-bold mt-1 ${
                overallScore >= 80 ? "text-success" :
                overallScore >= 60 ? "text-warning" :
                "text-destructive"
              }`}>
                {overallScore}%
              </p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              overallScore >= 80 ? "bg-success/20 text-success" :
              overallScore >= 60 ? "bg-warning/20 text-warning" :
              "bg-destructive/20 text-destructive"
            }`}>
              {overallScore >= 70 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Needs Work" : "Poor"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return "bg-success"
    if (v >= 60) return "bg-warning"
    return "bg-destructive"
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
