"use client"

import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Marker {
  timestamp: number
  type: "good" | "bad" | "uncertain"
  category: string
  description: string
  confidence: number
}

interface Analysis {
  overallScore: number
  summary: string
  markers: Marker[]
  strengths: string[]
  improvements: string[]
}

interface AnalysisPanelProps {
  analysis: Analysis | null
  selectedMarker: Marker | null
  onMarkerSelect: (marker: Marker) => void
  isLoading: boolean
}

export function AnalysisPanel({
  analysis,
  selectedMarker,
  onMarkerSelect,
  isLoading,
}: AnalysisPanelProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/20"
    if (score >= 60) return "bg-warning/10 border-warning/20"
    return "bg-destructive/10 border-destructive/20"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-muted border-t-foreground animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Analyzing call recording...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center py-12 border border-dashed border-border rounded-lg">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Upload a voice call to see AI analysis
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className={cn("p-4 rounded-lg border", getScoreBg(analysis.overallScore))}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Overall Score
            </p>
            <p className={cn("text-4xl font-bold", getScoreColor(analysis.overallScore))}>
              {analysis.overallScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="text-right max-w-xs">
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* Selected Marker Detail */}
      {selectedMarker && (
        <div
          className={cn(
            "p-4 rounded-lg border",
            selectedMarker.type === "good" && "bg-success/10 border-success/20",
            selectedMarker.type === "bad" && "bg-destructive/10 border-destructive/20",
            selectedMarker.type === "uncertain" && "bg-warning/10 border-warning/20"
          )}
        >
          <div className="flex items-start gap-3">
            {selectedMarker.type === "good" && (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            )}
            {selectedMarker.type === "bad" && (
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            )}
            {selectedMarker.type === "uncertain" && (
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium capitalize">
                  {selectedMarker.category}
                </span>
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(selectedMarker.timestamp)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedMarker.description}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                AI Confidence: {selectedMarker.confidence}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markers List */}
      <div>
        <h3 className="text-sm font-medium mb-3">Call Timeline</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {analysis.markers.map((marker, index) => (
            <button
              key={index}
              onClick={() => onMarkerSelect(marker)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                selectedMarker === marker
                  ? "bg-secondary border-foreground/20"
                  : "bg-card border-border hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-3">
                {marker.type === "good" && (
                  <div className="p-1 rounded bg-success/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-success">
                      <path fill="currentColor" d="M12 4L4 14h16L12 4z" />
                    </svg>
                  </div>
                )}
                {marker.type === "bad" && (
                  <div className="p-1 rounded bg-destructive/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-destructive rotate-180">
                      <path fill="currentColor" d="M12 4L4 14h16L12 4z" />
                    </svg>
                  </div>
                )}
                {marker.type === "uncertain" && (
                  <div className="p-1 rounded bg-warning/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-warning">
                      <path fill="currentColor" d="M12 2L2 20h20L12 2z" />
                      <text x="12" y="17" textAnchor="middle" className="text-[8px] font-bold fill-warning-foreground">!</text>
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize truncate">
                      {marker.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono ml-2">
                      {formatTime(marker.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {marker.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-success/5 border border-success/10">
          <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </h4>
          <ul className="space-y-1">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                • {strength}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
          <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Areas to Improve
          </h4>
          <ul className="space-y-1">
            {analysis.improvements.map((improvement, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                • {improvement}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
