"use client";

import React, { useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Upload, Phone } from "lucide-react";
import { setUploadedFile } from "@/lib/uploaded-file-store";
import { cn } from "@/lib/utils";

const MAX_MB = 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function UploadCallPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setError(null);
      if (file.size > MAX_BYTES) {
        setError(`File exceeds ${MAX_MB}MB limit.`);
        return;
      }
      const isAudio = file.type.startsWith("audio/");
      const isVideo = file.type.startsWith("video/");
      const isM4a = file.name.toLowerCase().endsWith(".m4a");
      if (!isAudio && !isVideo && !isM4a) {
        setError("Please upload an audio or video file (e.g. MP3, M4A).");
        return;
      }
      setUploadedFile(file);
      router.push("/qa");
    },
    [router],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    processFile(f);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      processFile(f);
    },
    [processFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleZoneClick = () => inputRef.current?.click();

  return (
    <div className="min-h-screen bg-background relative">
      <AppSidebar />

      <main className="pl-56 relative z-10 h-screen flex flex-col">
        <div className="mx-auto max-w-6xl w-full flex-1 flex flex-col min-h-0 px-4 py-6 relative">
          {/* Header - aligned like Agent Performance */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Upload Call
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload call recordings for AI analysis
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="audio/*,video/*,.m4a,audio/mp4,audio/x-m4a"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Center the upload card in the viewport (parent), not just below the header */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
            <div className="rounded-2xl border border-border bg-card/50 shadow-sm p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleZoneClick}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground hover:bg-muted/20",
                )}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-white">
                    <Upload className="h-10 w-10 text-black" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Upload Call Recording
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      Drag and drop your MP3 or M4A file here, or click to
                      browse. You’ll be taken to the QA page to transcribe, then
                      click Analyze to score and summarize the call.
                    </p>
                  </div>

                  <div className="flex items-center justify-center mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black font-medium border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Phone className="h-4 w-4 text-black" />
                      Select File
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Supported formats: MP3, M4A (max {MAX_MB}MB per file)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="absolute bottom-6 left-0 right-0 text-center px-4">
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
