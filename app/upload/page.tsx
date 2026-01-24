"use client"

import React from "react"

import { useState, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileAudio, 
  X, 
  CheckCircle2,
  Loader2,
  Mic,
  FileText,
  BarChart2,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type UploadState = "idle" | "uploading" | "processing" | "complete"
type ProcessingStep = "transcription" | "scoring" | "summary"

interface UploadedFile {
  name: string
  size: string
  state: UploadState
  progress: number
  currentStep?: ProcessingStep
}

const rubricCategories = [
  "Greeting & Introduction",
  "Active Listening",
  "Problem Resolution",
  "Product Knowledge",
  "Empathy & Rapport",
  "Call Closure",
]

const processingSteps: { key: ProcessingStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "transcription", label: "Transcription", icon: Mic },
  { key: "scoring", label: "Scoring", icon: BarChart2 },
  { key: "summary", label: "Summary", icon: FileText },
]

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const simulateUpload = useCallback((fileName: string, fileSize: string) => {
    const newFile: UploadedFile = {
      name: fileName,
      size: fileSize,
      state: "uploading",
      progress: 0,
    }
    
    setFiles(prev => [...prev, newFile])

    // Simulate upload progress
    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(uploadInterval)
        
        // Start processing simulation
        setFiles(prev => prev.map(f => 
          f.name === fileName 
            ? { ...f, state: "processing", progress: 100, currentStep: "transcription" }
            : f
        ))

        // Simulate processing steps
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.name === fileName 
              ? { ...f, currentStep: "scoring" }
              : f
          ))
        }, 2000)

        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.name === fileName 
              ? { ...f, currentStep: "summary" }
              : f
          ))
        }, 4000)

        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.name === fileName 
              ? { ...f, state: "complete" }
              : f
          ))
        }, 6000)
      }
      
      setFiles(prev => prev.map(f => 
        f.name === fileName && f.state === "uploading"
          ? { ...f, progress }
          : f
      ))
    }, 200)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    droppedFiles.forEach(file => {
      if (file.type === "audio/mpeg" || file.name.endsWith(".mp3")) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
        simulateUpload(file.name, `${sizeInMB} MB`)
      }
    })
  }, [simulateUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    selectedFiles.forEach(file => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      simulateUpload(file.name, `${sizeInMB} MB`)
    })
  }, [simulateUpload])

  const handleDemoUpload = () => {
    simulateUpload("support_call_2026-01-24.mp3", "4.2 MB")
  }

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="pl-56">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Upload Call</h1>
            <p className="text-sm text-muted-foreground">Upload MP3 recordings for AI analysis</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Upload Zone */}
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                <div
                  className={cn(
                    "relative rounded-lg border-2 border-dashed transition-colors p-12",
                    isDragging 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/50"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Upload Call Recording
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      Drag and drop your MP3 files here, or click to browse. 
                      AI will automatically transcribe, score, and summarize the call.
                    </p>
                    <div className="flex items-center gap-3">
                      <label>
                        <input
                          type="file"
                          accept=".mp3,audio/mpeg"
                          multiple
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                        <Button asChild>
                          <span className="cursor-pointer">
                            <FileAudio className="h-4 w-4 mr-2" />
                            Select Files
                          </span>
                        </Button>
                      </label>
                      <span className="text-muted-foreground text-sm">or</span>
                      <Button variant="outline" onClick={handleDemoUpload}>
                        Try Demo Upload
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Supported format: MP3 (max 100MB per file)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Uploaded Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {files.map((file) => (
                    <FileCard 
                      key={file.name} 
                      file={file} 
                      onRemove={() => removeFile(file.name)} 
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Applied Rubric */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Applied QA Rubric
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Calls will be scored against the following categories:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {rubricCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm text-foreground">{category}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function FileCard({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const getStepStatus = (step: ProcessingStep) => {
    if (file.state === "complete") return "complete"
    if (file.state !== "processing") return "pending"
    
    const stepIndex = processingSteps.findIndex(s => s.key === step)
    const currentIndex = processingSteps.findIndex(s => s.key === file.currentStep)
    
    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileAudio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">{file.size}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {file.state === "complete" ? (
            <Link href="/review/call-001">
              <Button size="sm" className="gap-2">
                Review Call
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {file.state === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="text-foreground">{Math.round(file.progress)}%</span>
          </div>
          <Progress value={file.progress} className="h-2" />
        </div>
      )}

      {(file.state === "processing" || file.state === "complete") && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            AI Pipeline
          </p>
          <div className="flex items-center gap-2">
            {processingSteps.map((step, index) => {
              const status = getStepStatus(step.key)
              const StepIcon = step.icon
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                    status === "complete" && "bg-success/10 text-success",
                    status === "active" && "bg-primary/10 text-primary",
                    status === "pending" && "bg-muted text-muted-foreground"
                  )}>
                    {status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < processingSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
