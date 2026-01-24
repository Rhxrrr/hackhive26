"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Flag, 
  User, 
  Headphones,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TranscriptEntry } from "@/lib/mock-data"

interface TranscriptViewProps {
  entries: TranscriptEntry[]
  currentTime?: number
  onTimestampClick?: (timestamp: string) => void
}

function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

export function TranscriptView({ entries, currentTime = 0, onTimestampClick }: TranscriptViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeEntryRef = useRef<HTMLDivElement>(null)

  // Find the current entry based on time
  const currentEntryIndex = entries.findIndex((entry, i) => {
    const entryTime = timeToSeconds(entry.timestamp)
    const nextEntry = entries[i + 1]
    const nextTime = nextEntry ? timeToSeconds(nextEntry.timestamp) : Infinity
    return currentTime >= entryTime && currentTime < nextTime
  })

  useEffect(() => {
    if (activeEntryRef.current && containerRef.current) {
      activeEntryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      })
    }
  }, [currentEntryIndex])

  const getSentimentIcon = (sentiment?: "positive" | "neutral" | "negative") => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-3 w-3 text-success" />
      case "negative":
        return <TrendingDown className="h-3 w-3 text-destructive" />
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  return (
    <Card className="border-border bg-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Transcript
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {entries.length} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent ref={containerRef} className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-border">
          {entries.map((entry, index) => {
            const isActive = index === currentEntryIndex
            const isAgent = entry.speaker === "agent"

            return (
              <div
                key={entry.id}
                ref={isActive ? activeEntryRef : undefined}
                className={cn(
                  "p-4 transition-colors",
                  isActive && "bg-primary/5",
                  entry.flagged && "bg-warning/5 border-l-2 border-l-warning"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isAgent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {isAgent ? (
                      <Headphones className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-sm font-medium",
                        isAgent ? "text-primary" : "text-foreground"
                      )}>
                        {isAgent ? "Agent" : "Customer"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => onTimestampClick?.(entry.timestamp)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {entry.timestamp}
                      </Button>
                      {entry.sentiment && getSentimentIcon(entry.sentiment)}
                      {entry.flagged && (
                        <Badge 
                          variant="outline" 
                          className="h-5 gap-1 border-warning/50 text-warning text-xs"
                        >
                          <Flag className="h-3 w-3" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {entry.text}
                    </p>
                    {entry.relatedCategory && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Related to: <span className="text-primary">{entry.relatedCategory}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
