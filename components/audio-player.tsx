"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Flag,
  Rewind,
  FastForward
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { KeyMoment } from "@/lib/mock-data"

interface AudioPlayerProps {
  duration: string
  flaggedTimestamps: string[]
  keyMoments: KeyMoment[]
  onTimeChange?: (time: number) => void
}

function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

function secondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function AudioPlayer({ 
  duration, 
  flaggedTimestamps, 
  keyMoments,
  onTimeChange 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const totalSeconds = timeToSeconds(duration)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, totalSeconds])

  useEffect(() => {
    onTimeChange?.(currentTime)
  }, [currentTime, onTimeChange])

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0])
  }

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(totalSeconds, prev + seconds)))
  }

  const jumpToTimestamp = (timestamp: string) => {
    const seconds = timeToSeconds(timestamp)
    setCurrentTime(seconds)
  }

  const progress = (currentTime / totalSeconds) * 100

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-foreground">
          <span>Audio Player</span>
          <span className="text-muted-foreground">
            {secondsToTime(currentTime)} / {duration}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline with markers */}
        <div className="relative">
          <Slider
            value={[currentTime]}
            max={totalSeconds}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          {/* Flagged markers */}
          <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
            {flaggedTimestamps.map((timestamp, i) => {
              const position = (timeToSeconds(timestamp) / totalSeconds) * 100
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-warning rounded-full pointer-events-auto cursor-pointer hover:scale-150 transition-transform"
                  style={{ left: `${position}%`, marginLeft: "-4px" }}
                  onClick={() => jumpToTimestamp(timestamp)}
                  title={`Flagged at ${timestamp}`}
                />
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(-10)}
              className="h-8 w-8"
            >
              <Rewind className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(-5)}
              className="h-8 w-8"
            >
              <SkipBack className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(5)}
              className="h-8 w-8"
            >
              <SkipForward className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(10)}
              className="h-8 w-8"
            >
              <FastForward className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(v) => {
                setVolume(v[0])
                setIsMuted(false)
              }}
              className="w-24"
            />
          </div>
        </div>

        {/* Key Moments */}
        {keyMoments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Key Moments
            </p>
            <div className="flex flex-wrap gap-2">
              {keyMoments.map((moment) => (
                <Button
                  key={moment.id}
                  variant="outline"
                  size="sm"
                  onClick={() => jumpToTimestamp(moment.timestamp)}
                  className={cn(
                    "gap-2 text-xs h-7",
                    moment.type === "positive" && "border-success/50 hover:bg-success/10",
                    moment.type === "negative" && "border-destructive/50 hover:bg-destructive/10",
                    moment.type === "neutral" && "border-border"
                  )}
                >
                  <span className="font-mono">{moment.timestamp}</span>
                  <span className="text-muted-foreground">{moment.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
