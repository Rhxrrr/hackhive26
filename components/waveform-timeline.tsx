"use client";

import React from "react";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Marker {
  timestamp: number;
  type: "good" | "bad" | "uncertain";
  category: string;
  description: string;
  confidence: number;
}

interface WaveformTimelineProps {
  audioFile: File | null;
  markers: Marker[];
  onMarkerClick: (marker: Marker) => void;
  selectedMarker: Marker | null;
}

export function WaveformTimeline({
  audioFile,
  markers,
  onMarkerClick,
  selectedMarker,
}: WaveformTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate waveform data from audio file
  useEffect(() => {
    if (!audioFile) {
      setWaveformData([]);
      setAudioUrl(null);
      return;
    }

    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);

    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200;
        const blockSize = Math.floor(channelData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          filteredData.push(sum / blockSize);
        }

        const maxVal = Math.max(...filteredData);
        const normalized = filteredData.map((val) => val / maxVal);
        setWaveformData(normalized);
      } catch (error) {
        // Generate placeholder waveform if decode fails
        const placeholderData = Array.from(
          { length: 200 },
          () => 0.2 + Math.random() * 0.6,
        );
        setWaveformData(placeholderData);
      }
    };

    reader.readAsArrayBuffer(audioFile);

    return () => {
      URL.revokeObjectURL(url);
      audioContext.close();
    };
  }, [audioFile]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const drawWaveform = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      const barWidth = rect.width / waveformData.length;
      const centerY = rect.height / 2;
      const maxBarHeight = rect.height * 0.8;

      // Draw background bars
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      waveformData.forEach((val, i) => {
        const barHeight = val * maxBarHeight;
        const x = i * barWidth;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
      });

      // Draw progress bars
      if (duration > 0) {
        const progressRatio = currentTime / duration;
        const progressWidth = progressRatio * rect.width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        waveformData.forEach((val, i) => {
          const x = i * barWidth;
          if (x < progressWidth) {
            const barHeight = val * maxBarHeight;
            ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
          }
        });
      }
    };

    drawWaveform();
  }, [waveformData, currentTime, duration]);

  // Audio playback handling
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updateTime);
      }
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!audioRef.current || !canvasRef.current || duration === 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const newTime = ratio * duration;

      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration],
  );

  const handleMarkerClickInternal = useCallback(
    (marker: Marker, e: React.MouseEvent) => {
      e.stopPropagation();
      if (audioRef.current) {
        audioRef.current.currentTime = marker.timestamp;
        setCurrentTime(marker.timestamp);
      }
      onMarkerClick(marker);
    },
    [onMarkerClick],
  );

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getMarkerPosition = (timestamp: number) => {
    if (duration === 0) return 0;
    return (timestamp / duration) * 100;
  };

  return (
    <div className="space-y-4">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => {
            setIsPlaying(true);
            animationRef.current = requestAnimationFrame(updateTime);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Playback controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlayback}
          disabled={!audioUrl}
          className="p-2.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={!audioUrl}
          className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <div className="text-sm font-mono text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Waveform with markers */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-24 rounded-lg bg-secondary/50 cursor-pointer"
        />

        {/* Markers */}
        {markers.map((marker, index) => (
          <button
            key={index}
            onClick={(e) => handleMarkerClickInternal(marker, e)}
            style={{ left: `${getMarkerPosition(marker.timestamp)}%` }}
            className={cn(
              "absolute top-0 -translate-x-1/2 transition-transform hover:scale-110 cursor-pointer",
              selectedMarker === marker && "scale-125",
            )}
          >
            {marker.type === "good" && (
              <div className="flex flex-col items-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="text-success"
                >
                  <path fill="currentColor" d="M12 4L4 14h16L12 4z" />
                </svg>
                <div className="w-0.5 h-20 bg-success/50" />
              </div>
            )}
            {marker.type === "bad" && (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-20 bg-destructive/50" />
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="text-destructive rotate-180"
                >
                  <path fill="currentColor" d="M12 4L4 14h16L12 4z" />
                </svg>
              </div>
            )}
            {marker.type === "uncertain" && (
              <div className="flex flex-col items-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="text-warning"
                >
                  <path fill="currentColor" d="M12 2L2 20h20L12 2z" />
                  <text
                    x="12"
                    y="17"
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-warning-foreground"
                  >
                    !
                  </text>
                </svg>
                <div className="w-0.5 h-20 bg-warning/50" />
              </div>
            )}
          </button>
        ))}

        {/* Playhead */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="text-success"
          >
            <path fill="currentColor" d="M12 4L4 14h16L12 4z" />
          </svg>
          <span className="text-muted-foreground">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="text-destructive rotate-180"
          >
            <path fill="currentColor" d="M12 4L4 14h16L12 4z" />
          </svg>
          <span className="text-muted-foreground">Needs Improvement</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="text-warning"
          >
            <path fill="currentColor" d="M12 2L2 20h20L12 2z" />
            <text
              x="12"
              y="17"
              textAnchor="middle"
              className="text-[8px] font-bold fill-warning-foreground"
            >
              !
            </text>
          </svg>
          <span className="text-muted-foreground">Uncertain</span>
        </div>
      </div>
    </div>
  );
}
