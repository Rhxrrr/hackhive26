"use client"

import { useState, useCallback, use } from "react"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { AudioPlayer } from "@/components/audio-player"
import { CallSummary } from "@/components/call-summary"
import { Scorecard } from "@/components/scorecard"
import { TranscriptView } from "@/components/transcript-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  ArrowLeft, 
  FileText, 
  Download,
  CheckCircle2,
  User,
  Calendar,
  Clock,
  Flag
} from "lucide-react"
import { mockCalls, getStatusColor, getStatusLabel, type ScoreCategory } from "@/lib/mock-data"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CallReviewPage({ params }: PageProps) {
  const { id } = use(params)
  const call = mockCalls.find(c => c.id === id) ?? mockCalls[0]
  
  const [currentTime, setCurrentTime] = useState(0)
  const [categories, setCategories] = useState<ScoreCategory[]>(call.categories)
  const [activeTab, setActiveTab] = useState<"summary" | "transcript">("summary")

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleOverride = useCallback((categoryId: string, newScore: number, note: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, qaOverride: newScore, qaNote: note }
        : cat
    ))
  }, [])

  const handleJumpToTimestamp = useCallback((timestamp: string) => {
    const parts = timestamp.split(":").map(Number)
    const seconds = parts.length === 2 
      ? parts[0] * 60 + parts[1]
      : parts[0] * 3600 + parts[1] * 60 + parts[2]
    setCurrentTime(seconds)
  }, [])

  const flaggedTimestamps = categories
    .filter(c => c.flagged && c.timestamp)
    .map(c => c.timestamp!)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="pl-56">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <Link href="/reviews">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground">Call Review</h1>
                  <Badge className={getStatusColor(call.status)}>
                    {getStatusLabel(call.status)}
                  </Badge>
                  {call.flaggedItems > 0 && (
                    <Badge variant="outline" className="gap-1 border-warning/50 text-warning">
                      <Flag className="h-3 w-3" />
                      {call.flaggedItems} flagged
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {call.agentName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {call.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {call.duration}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Finalize Review
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Finalize Review?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This will mark the call review as complete. Your overrides and notes will be saved to the audit trail. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted/80">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction>
                      Confirm & Finalize
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        {/* Main Content - Split Layout */}
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Panel - Audio Player & Summary/Transcript */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border">
            {/* Audio Player */}
            <div className="p-4 border-b border-border">
              <AudioPlayer
                duration={call.duration}
                flaggedTimestamps={flaggedTimestamps}
                keyMoments={call.keyMoments}
                onTimeChange={handleTimeChange}
              />
            </div>

            {/* Tabs for Summary / Transcript */}
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <Tabs 
                value={activeTab} 
                onValueChange={(v) => setActiveTab(v as "summary" | "transcript")}
                className="flex-1 flex flex-col min-h-0"
              >
                <TabsList className="w-fit bg-muted mb-4">
                  <TabsTrigger value="summary" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="transcript" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Transcript
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="flex-1 mt-0 overflow-y-auto">
                  <CallSummary
                    summary={call.summary}
                    sentiment={call.sentiment}
                    overallScore={call.overallScore}
                  />
                </TabsContent>
                <TabsContent value="transcript" className="flex-1 mt-0 min-h-0">
                  <TranscriptView
                    entries={call.transcript}
                    currentTime={currentTime}
                    onTimestampClick={handleJumpToTimestamp}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel - Scorecard */}
          <div className="w-[420px] shrink-0 p-4 overflow-hidden">
            <Scorecard
              categories={categories}
              onOverride={handleOverride}
              onJumpToTimestamp={handleJumpToTimestamp}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
