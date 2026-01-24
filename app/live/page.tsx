"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Zap,
  ArrowRight,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

// Simulated live data that updates during the call
const solutionSuggestions = [
  {
    id: 1,
    text: "Offer 10% discount on next bill for inconvenience",
    priority: "high",
    timestamp: "0:45",
  },
  {
    id: 2,
    text: "Check if customer is eligible for service upgrade",
    priority: "medium",
    timestamp: "1:02",
  },
  {
    id: 3,
    text: "Schedule technician visit if remote reset fails",
    priority: "low",
    timestamp: "1:15",
  },
];

const improvementTips = [
  {
    id: 1,
    text: "Slow down speaking pace - customer seems confused",
    type: "warning",
    timestamp: "0:32",
  },
  {
    id: 2,
    text: "Use customer's name more frequently",
    type: "tip",
    timestamp: "0:58",
  },
  {
    id: 3,
    text: "Avoid technical jargon - simplify explanations",
    type: "warning",
    timestamp: "1:20",
  },
  {
    id: 4,
    text: "Good job acknowledging the frustration!",
    type: "positive",
    timestamp: "1:35",
  },
];

const sentimentHistory = [
  { time: "0:00", score: 50, label: "Neutral" },
  { time: "0:15", score: 35, label: "Frustrated" },
  { time: "0:30", score: 30, label: "Frustrated" },
  { time: "0:45", score: 45, label: "Neutral" },
  { time: "1:00", score: 55, label: "Improving" },
  { time: "1:15", score: 40, label: "Concerned" },
  { time: "1:30", score: 65, label: "Satisfied" },
  { time: "1:45", score: 75, label: "Happy" },
];

export default function LiveCallPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(105); // 1:45 in seconds
  const [currentSentiment, setCurrentSentiment] = useState(75);
  const [sentimentLabel, setSentimentLabel] = useState("Happy");
  const [activeSolutions, setActiveSolutions] = useState(solutionSuggestions);
  const [activeTips, setActiveTips] = useState(improvementTips);
  const [pulseAnimation, setPulseAnimation] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);

      // Randomly fluctuate sentiment slightly
      setCurrentSentiment((prev) => {
        const change = Math.random() * 10 - 5;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Update sentiment label based on score
  useEffect(() => {
    if (currentSentiment >= 70) setSentimentLabel("Happy");
    else if (currentSentiment >= 55) setSentimentLabel("Satisfied");
    else if (currentSentiment >= 45) setSentimentLabel("Neutral");
    else if (currentSentiment >= 30) setSentimentLabel("Frustrated");
    else setSentimentLabel("Upset");
  }, [currentSentiment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 55) return "text-emerald-300";
    if (score >= 45) return "text-amber-400";
    if (score >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getSentimentBgColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    if (score >= 55) return "bg-emerald-400";
    if (score >= 45) return "bg-amber-500";
    if (score >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  const dismissSolution = (id: number) => {
    setActiveSolutions((prev) => prev.filter((s) => s.id !== id));
  };

  const dismissTip = (id: number) => {
    setActiveTips((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              QA Review
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold">Live Call Assistant</h1>
          </div>

          {/* Call Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Account #4582-9931</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-mono">
                {formatTime(callDuration)}
              </span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-emerald-400">Live</span>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={
                isMuted ? "bg-red-500/10 border-red-500/30 text-red-400" : ""
              }
            >
              {isMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={() => setIsConnected(!isConnected)}
              className="gap-2"
            >
              {isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Columns */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: AI Solution Brainstorming */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Lightbulb className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-medium">Solution Ideas</h2>
                <p className="text-xs text-muted-foreground">
                  AI-generated suggestions
                </p>
              </div>
            </div>

            <div className="space-y-3 h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {activeSolutions.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No active suggestions
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will suggest solutions as the call progresses
                  </p>
                </div>
              ) : (
                activeSolutions.map((solution) => (
                  <div
                    key={solution.id}
                    className={`bg-card border rounded-xl p-4 transition-all hover:border-blue-500/50 ${
                      solution.priority === "high"
                        ? "border-blue-500/30 bg-blue-500/5"
                        : solution.priority === "medium"
                          ? "border-border"
                          : "border-border opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              solution.priority === "high"
                                ? "bg-blue-500/20 text-blue-400"
                                : solution.priority === "medium"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {solution.priority.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {solution.timestamp}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {solution.text}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => dismissSolution(solution.id)}
                      >
                        <span className="sr-only">Dismiss</span>
                        &times;
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1 bg-transparent"
                      >
                        <Zap className="w-3 h-3" />
                        Use This
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-muted-foreground"
                      >
                        More Details
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {isConnected && activeSolutions.length > 0 && (
                <div className="flex items-center gap-2 p-3 text-muted-foreground">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                  <span className="text-xs">AI analyzing conversation...</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Live Improvement Tips */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-medium">Live Coaching</h2>
                <p className="text-xs text-muted-foreground">
                  Real-time feedback
                </p>
              </div>
            </div>

            <div className="space-y-3 h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {activeTips.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No coaching tips yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tips will appear as the call progresses
                  </p>
                </div>
              ) : (
                activeTips.map((tip) => (
                  <div
                    key={tip.id}
                    className={`border rounded-xl p-4 transition-all ${
                      tip.type === "positive"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : tip.type === "warning"
                          ? "bg-amber-500/5 border-amber-500/30"
                          : "bg-card border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 p-1.5 rounded-lg ${
                          tip.type === "positive"
                            ? "bg-emerald-500/20"
                            : tip.type === "warning"
                              ? "bg-amber-500/20"
                              : "bg-blue-500/20"
                        }`}
                      >
                        {tip.type === "positive" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : tip.type === "warning" ? (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Lightbulb className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-medium ${
                              tip.type === "positive"
                                ? "text-emerald-400"
                                : tip.type === "warning"
                                  ? "text-amber-400"
                                  : "text-blue-400"
                            }`}
                          >
                            {tip.type === "positive"
                              ? "Great Work!"
                              : tip.type === "warning"
                                ? "Suggestion"
                                : "Tip"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {tip.timestamp}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{tip.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => dismissTip(tip.id)}
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Customer Sentiment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Volume2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-medium">Customer Sentiment</h2>
                <p className="text-xs text-muted-foreground">
                  Voice & tone analysis
                </p>
              </div>
            </div>

            {/* Current Sentiment Display */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-center mb-6">
                <div
                  className={`text-6xl font-bold mb-2 ${getSentimentColor(currentSentiment)}`}
                >
                  {Math.round(currentSentiment)}
                </div>
                <div
                  className={`text-lg font-medium ${getSentimentColor(currentSentiment)}`}
                >
                  {sentimentLabel}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current sentiment score
                </p>
              </div>

              {/* Sentiment Bar */}
              <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-6">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-500 ${getSentimentBgColor(currentSentiment)}`}
                  style={{ width: `${currentSentiment}%` }}
                />
                {pulseAnimation && isConnected && (
                  <div
                    className="absolute top-0 h-full w-1 bg-white/50 animate-pulse"
                    style={{ left: `${currentSentiment}%` }}
                  />
                )}
              </div>

              {/* Sentiment Labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground mb-6">
                <span>Upset</span>
                <span>Frustrated</span>
                <span>Neutral</span>
                <span>Satisfied</span>
                <span>Happy</span>
              </div>

              {/* Voice Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Speaking Pace
                  </div>
                  <div className="text-sm font-medium">Normal</div>
                  <Progress value={60} className="h-1 mt-2" />
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Voice Volume
                  </div>
                  <div className="text-sm font-medium">Moderate</div>
                  <Progress value={55} className="h-1 mt-2" />
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Stress Level
                  </div>
                  <div className="text-sm font-medium text-amber-400">
                    Slightly Elevated
                  </div>
                  <Progress value={40} className="h-1 mt-2" />
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Engagement
                  </div>
                  <div className="text-sm font-medium text-emerald-400">
                    High
                  </div>
                  <Progress value={78} className="h-1 mt-2" />
                </div>
              </div>
            </div>

            {/* Sentiment History */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">Sentiment Timeline</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {sentimentHistory.map((point, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground w-10">
                      {point.time}
                    </span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getSentimentBgColor(point.score)}`}
                        style={{ width: `${point.score}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs w-16 text-right ${getSentimentColor(point.score)}`}
                    >
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
