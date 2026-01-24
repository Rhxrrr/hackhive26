"use client";

import React from "react";

import { useState } from "react";
import {
  Upload,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Play,
  Pause,
  BookOpen,
  FileText,
  Download,
  Volume2,
  VolumeX,
  Search,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const transcript = [
  {
    id: 1,
    speaker: "agent",
    text: "Hi, thank you for calling TechSupport. My name is Sarah. How can I help you today?",
    time: "0:00",
  },
  {
    id: 2,
    speaker: "customer",
    text: "Yeah hi, I've been having issues with my internet connection for the past two days.",
    time: "0:08",
  },
  {
    id: 3,
    speaker: "agent",
    text: "I'm really sorry to hear that. Let me look into this for you right away. Can I have your account number please?",
    time: "0:15",
  },
  { id: 4, speaker: "customer", text: "Sure, it's 4582-9931.", time: "0:24" },
  {
    id: 5,
    speaker: "agent",
    text: "Thank you. I can see your account here. So you mentioned the internet has been down for two days?",
    time: "0:30",
  },
  {
    id: 6,
    speaker: "customer",
    text: "Yes, it keeps disconnecting every few minutes. It's very frustrating.",
    time: "0:38",
  },
  {
    id: 7,
    speaker: "agent",
    text: "I completely understand how frustrating that must be. Let me run a diagnostic on your line.",
    time: "0:45",
  },
  { id: 8, speaker: "customer", text: "Okay, thanks.", time: "0:52" },
  {
    id: 9,
    speaker: "agent",
    text: "Hmm, I'm seeing some signal issues on our end. Have you tried restarting your router?",
    time: "0:55",
  },
  {
    id: 10,
    speaker: "customer",
    text: "Yes, I've done that multiple times already.",
    time: "1:05",
  },
  {
    id: 11,
    speaker: "agent",
    text: "Okay, well... let me just... I think I need to transfer you to technical support.",
    time: "1:10",
  },
  {
    id: 12,
    speaker: "customer",
    text: "Wait, I thought this WAS technical support? I've already been transferred twice!",
    time: "1:18",
  },
  {
    id: 13,
    speaker: "agent",
    text: "I apologize for the confusion. You're right, let me handle this myself. I'm going to reset your connection from our end.",
    time: "1:25",
  },
  { id: 14, speaker: "customer", text: "Finally, thank you.", time: "1:35" },
  {
    id: 15,
    speaker: "agent",
    text: "Done! Your connection should be restored now. Can you check if it's working?",
    time: "1:40",
  },
  {
    id: 16,
    speaker: "customer",
    text: "Yes! It's working now. Much better speed too.",
    time: "1:50",
  },
  {
    id: 17,
    speaker: "agent",
    text: "I'm glad to hear that. Is there anything else I can help you with today?",
    time: "1:58",
  },
  {
    id: 18,
    speaker: "customer",
    text: "No, that's all. Thanks for your help.",
    time: "2:05",
  },
  {
    id: 19,
    speaker: "agent",
    text: "You're welcome! Thank you for choosing TechSupport. Have a great day!",
    time: "2:10",
  },
];

const goodMoments = [
  {
    time: "0:00",
    message: "Professional greeting with name introduction",
    lineId: 1,
    rubric: "Opening Protocol",
    rubricSection: "1.1",
    rubricDescription:
      "Agent must greet customer professionally, state company name, provide their own name, and offer assistance.",
  },
  {
    time: "0:15",
    message: "Showed empathy and took immediate action",
    lineId: 3,
    rubric: "Empathy & Acknowledgment",
    rubricSection: "2.3",
    rubricDescription:
      "Agent demonstrates genuine empathy by acknowledging customer's situation and commits to immediate resolution.",
  },
  {
    time: "0:45",
    message: "Validated customer's frustration appropriately",
    lineId: 7,
    rubric: "Empathy & Acknowledgment",
    rubricSection: "2.1",
    rubricDescription:
      "Agent validates customer emotions without being dismissive or over-apologetic.",
  },
  {
    time: "1:25",
    message: "Recovered well after mistake, took ownership",
    lineId: 13,
    rubric: "Error Recovery",
    rubricSection: "5.2",
    rubricDescription:
      "When mistakes occur, agent takes ownership, apologizes sincerely, and immediately works toward resolution.",
  },
  {
    time: "2:10",
    message: "Strong closing with brand mention",
    lineId: 19,
    rubric: "Closing Protocol",
    rubricSection: "6.1",
    rubricDescription:
      "Agent thanks customer, reinforces brand, and ends call on positive note.",
  },
];

const badMoments = [
  {
    time: "1:10",
    message: "Attempted unnecessary transfer, showed uncertainty",
    lineId: 11,
    rubric: "Call Handling",
    rubricSection: "3.4",
    rubricDescription:
      "Agent should attempt to resolve issues within their capability before considering transfer. Avoid unnecessary transfers.",
  },
  {
    time: "0:55",
    message: "Asked about router restart without checking notes first",
    lineId: 9,
    rubric: "Troubleshooting Protocol",
    rubricSection: "4.2",
    rubricDescription:
      "Agent must review account notes and previous troubleshooting steps before asking customer to repeat actions.",
  },
];

const needsImprovementMoments = [
  {
    time: "0:30",
    message:
      "Could have acknowledged the duration of the issue more empathetically",
    lineId: 5,
    rubric: "Empathy & Acknowledgment",
    rubricSection: "2.2",
    rubricDescription:
      "When customers mention extended issues, agent should specifically acknowledge the duration and inconvenience caused.",
  },
  {
    time: "1:40",
    message: "Should have explained what was done to fix the issue",
    lineId: 15,
    rubric: "Resolution Communication",
    rubricSection: "5.4",
    rubricDescription:
      "Agent should explain the resolution steps taken so customer understands what was fixed and can reference if issue recurs.",
  },
];

const uncertainMoments = [
  {
    time: "0:52",
    message:
      "Short customer response - unclear if tone was satisfied or dismissive",
    lineId: 8,
    rubric: "Customer Sentiment",
    rubricSection: "7.1",
    rubricDescription:
      "AI could not determine customer sentiment from brief response. Manual review recommended to assess tone.",
  },
  {
    time: "1:35",
    message: "Customer tone unclear - could be genuine relief or sarcasm",
    lineId: 14,
    rubric: "Customer Sentiment",
    rubricSection: "7.2",
    rubricDescription:
      "The phrase 'Finally, thank you' could indicate frustration or genuine appreciation. Context and audio tone needed for accurate assessment.",
  },
];

const fullReport = {
  callId: "CALL-2024-01-15-0847",
  agent: "Sarah Mitchell",
  customer: "Account #4582-9931",
  date: "January 15, 2024",
  duration: "2:15",
  overallScore: 78,
  categoryScores: {
    opening: 95,
    empathy: 85,
    troubleshooting: 65,
    resolution: 70,
    closing: 90,
  },
  summary:
    "Sarah demonstrated strong opening and closing protocols with professional demeanor throughout most of the call. Her empathy skills are solid, particularly when validating customer frustration. However, the attempt to transfer the call unnecessarily and asking about router restart without checking notes shows areas for improvement in call handling and troubleshooting protocols. The recovery from the transfer mistake was handled well, showing adaptability.",
  recommendations: [
    "Review troubleshooting protocol section 4.2 regarding checking account notes before asking customers to repeat steps",
    "Practice confident decision-making to avoid unnecessary transfer attempts",
    "Include brief explanation of resolution steps when fixing issues",
  ],
};

export default function QADashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [highlightedTimePosition, setHighlightedTimePosition] = useState<
    number | null
  >(null);
  const [goodOpen, setGoodOpen] = useState(true);
  const [badOpen, setBadOpen] = useState(true);
  const [improvementOpen, setImprovementOpen] = useState(true);
  const [uncertainOpen, setUncertainOpen] = useState(true);

  const filteredTranscript = transcript.filter((line) =>
    line.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalDuration = 135; // 2:15 in seconds

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseTimeToSeconds = (time: string) => {
    const parts = time.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const scrollToLine = (lineId: number, time?: string) => {
    setHighlightedLine(lineId);
    const element = document.getElementById(`line-${lineId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (time) {
      const timeInSeconds = parseTimeToSeconds(time);
      setCurrentTime(timeInSeconds);
      setHighlightedTimePosition(timeInSeconds);
      setTimeout(() => setHighlightedTimePosition(null), 2000);
    }

    setTimeout(() => setHighlightedLine(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadTranscript = () => {
    const text = transcript
      .map(
        (line) => `[${line.time}] ${line.speaker.toUpperCase()}: ${line.text}`,
      )
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "call-transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Voice Call QA Review
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of customer service calls
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTranscript}>
              <Download className="w-4 h-4 mr-2" />
              Download Transcript
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Full Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Full QA Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Call ID:</span>
                      <span className="ml-2 text-foreground">
                        {fullReport.callId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agent:</span>
                      <span className="ml-2 text-foreground">
                        {fullReport.agent}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="ml-2 text-foreground">
                        {fullReport.customer}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 text-foreground">
                        {fullReport.duration}
                      </span>
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-foreground">
                        {fullReport.overallScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${fullReport.overallScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Category Scores</h4>
                    {Object.entries(fullReport.categoryScores).map(
                      ([category, score]) => (
                        <div key={category} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground capitalize w-32">
                            {category}
                          </span>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                score >= 80
                                  ? "bg-emerald-500"
                                  : score >= 60
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">
                            {score}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {fullReport.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {fullReport.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex gap-2"
                        >
                          <span className="text-foreground">{i + 1}.</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg border border-border transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {file ? file.name : "Upload Call"}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Audio Bar */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-transparent"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <span className="text-sm font-mono text-muted-foreground w-12">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <div className="h-2 bg-secondary rounded-full">
                <div
                  className="h-2 bg-foreground/50 rounded-full transition-all"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={totalDuration}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
              />
              {/* Markers on timeline */}
              {goodMoments.map((m, i) => {
                const timeInSeconds =
                  parseInt(m.time.split(":")[0]) * 60 +
                  parseInt(m.time.split(":")[1]);
                return (
                  <div
                    key={`good-${i}`}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${(timeInSeconds / totalDuration) * 100}%`,
                    }}
                    onClick={() => {
                      setCurrentTime(timeInSeconds);
                      scrollToLine(m.lineId);
                    }}
                    title={m.message}
                  />
                );
              })}
              {badMoments.map((m, i) => {
                const timeInSeconds =
                  parseInt(m.time.split(":")[0]) * 60 +
                  parseInt(m.time.split(":")[1]);
                return (
                  <div
                    key={`bad-${i}`}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${(timeInSeconds / totalDuration) * 100}%`,
                    }}
                    onClick={() => {
                      setCurrentTime(timeInSeconds);
                      scrollToLine(m.lineId);
                    }}
                    title={m.message}
                  />
                );
              })}
              {needsImprovementMoments.map((m, i) => {
                const timeInSeconds =
                  parseInt(m.time.split(":")[0]) * 60 +
                  parseInt(m.time.split(":")[1]);
                return (
                  <div
                    key={`improve-${i}`}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${(timeInSeconds / totalDuration) * 100}%`,
                    }}
                    onClick={() => {
                      setCurrentTime(timeInSeconds);
                      scrollToLine(m.lineId);
                    }}
                    title={m.message}
                  />
                );
              })}
              {uncertainMoments.map((m, i) => {
                const timeInSeconds =
                  parseInt(m.time.split(":")[0]) * 60 +
                  parseInt(m.time.split(":")[1]);
                return (
                  <div
                    key={`uncertain-${i}`}
                    className="absolute top-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${(timeInSeconds / totalDuration) * 100}%`,
                    }}
                    onClick={() => {
                      setCurrentTime(timeInSeconds);
                      scrollToLine(m.lineId);
                    }}
                    title={m.message}
                  >
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-purple-500 relative">
                      <span className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 text-[6px] font-bold text-purple-500">
                        !
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Highlight indicator */}
              {highlightedTimePosition !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full animate-ping"
                  style={{
                    left: `${(highlightedTimePosition / totalDuration) * 100}%`,
                  }}
                />
              )}
            </div>
            <span className="text-sm font-mono text-muted-foreground w-12">
              {formatTime(totalDuration)}
            </span>
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (Number(e.target.value) > 0) setIsMuted(false);
                }}
                className="w-20 h-1 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
              />
            </div>
            <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue placeholder="Speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcript - iMessage Style */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Call Transcript
              </h2>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
            <div className="h-[500px] overflow-y-auto space-y-3 pr-2">
              {filteredTranscript.map((line) => {
                const isGood = goodMoments.some((m) => m.lineId === line.id);
                const isBad = badMoments.some((m) => m.lineId === line.id);
                const isImprovement = needsImprovementMoments.some(
                  (m) => m.lineId === line.id,
                );
                const isUncertain = uncertainMoments.some(
                  (m) => m.lineId === line.id,
                );
                const isAgent = line.speaker === "agent";

                return (
                  <div
                    key={line.id}
                    id={`line-${line.id}`}
                    className={`flex ${isAgent ? "justify-start" : "justify-end"} transition-all duration-300 ${
                      highlightedLine === line.id ? "scale-105" : ""
                    }`}
                  >
                    <div
                      className={`max-w-[80%] relative ${isAgent ? "pr-6" : "pl-6"}`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isAgent
                            ? isGood
                              ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30"
                              : isBad
                                ? "bg-red-500/20 text-red-100 border border-red-500/30"
                                : isImprovement
                                  ? "bg-amber-500/20 text-amber-100 border border-amber-500/30"
                                  : "bg-secondary text-foreground"
                            : isUncertain
                              ? "bg-purple-500/20 text-purple-100 border border-purple-500/30"
                              : "bg-blue-600 text-white"
                        } ${isAgent ? "rounded-bl-md" : "rounded-br-md"}`}
                      >
                        {line.text}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 mt-1 ${isAgent ? "" : "justify-end"}`}
                      >
                        <span className="text-[10px] text-muted-foreground">
                          {line.time}
                        </span>
                        {isGood && (
                          <ArrowUp className="w-3 h-3 text-emerald-500" />
                        )}
                        {isBad && (
                          <ArrowDown className="w-3 h-3 text-red-500" />
                        )}
                        {isImprovement && (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                        {isUncertain && (
                          <HelpCircle className="w-3 h-3 text-purple-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis Columns */}
          <div className="grid grid-cols-1 gap-4 h-[540px]">
            {/* Good */}
            <Collapsible
              open={goodOpen}
              onOpenChange={setGoodOpen}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl overflow-hidden flex flex-col"
            >
              <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-emerald-500/5 transition-colors">
                <ChevronDown
                  className={`w-4 h-4 text-emerald-500 transition-transform ${goodOpen ? "" : "-rotate-90"}`}
                />
                <ArrowUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-medium text-emerald-400">Good</h3>
                <span className="ml-auto text-xs text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {goodMoments.length} moments
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 overflow-y-auto">
                <div className="space-y-2">
                  {goodMoments.map((moment, i) => (
                    <div key={i} className="space-y-1">
                      <button
                        onClick={() => scrollToLine(moment.lineId, moment.time)}
                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                      >
                        <span className="text-xs font-mono text-emerald-500 bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                          {moment.time}
                        </span>
                        <span className="text-sm text-emerald-100/80 group-hover:text-emerald-100">
                          {moment.message}
                        </span>
                      </button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Rubric {moment.rubricSection}: {moment.rubric}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-emerald-400">
                              Section {moment.rubricSection}: {moment.rubric}
                            </DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {moment.rubricDescription}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Bad */}
            <Collapsible
              open={badOpen}
              onOpenChange={setBadOpen}
              className="bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden flex flex-col"
            >
              <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-red-500/5 transition-colors">
                <ChevronDown
                  className={`w-4 h-4 text-red-500 transition-transform ${badOpen ? "" : "-rotate-90"}`}
                />
                <ArrowDown className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-red-400">Bad</h3>
                <span className="ml-auto text-xs text-red-500/70 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {badMoments.length} moments
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 overflow-y-auto max-h-32">
                <div className="space-y-2">
                  {badMoments.map((moment, i) => (
                    <div key={i} className="space-y-1">
                      <button
                        onClick={() => scrollToLine(moment.lineId, moment.time)}
                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-red-500/10 transition-colors group"
                      >
                        <span className="text-xs font-mono text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded shrink-0">
                          {moment.time}
                        </span>
                        <span className="text-sm text-red-100/80 group-hover:text-red-100">
                          {moment.message}
                        </span>
                      </button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Rubric {moment.rubricSection}: {moment.rubric}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-red-400">
                              Section {moment.rubricSection}: {moment.rubric}
                            </DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {moment.rubricDescription}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Needs Improvement */}
            <Collapsible
              open={improvementOpen}
              onOpenChange={setImprovementOpen}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden flex flex-col"
            >
              <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-amber-500/5 transition-colors">
                <ChevronDown
                  className={`w-4 h-4 text-amber-500 transition-transform ${improvementOpen ? "" : "-rotate-90"}`}
                />
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium text-amber-400">
                  Needs Improvement
                </h3>
                <span className="ml-auto text-xs text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {needsImprovementMoments.length} moments
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 overflow-y-auto max-h-32">
                <div className="space-y-2">
                  {needsImprovementMoments.map((moment, i) => (
                    <div key={i} className="space-y-1">
                      <button
                        onClick={() => scrollToLine(moment.lineId, moment.time)}
                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-amber-500/10 transition-colors group"
                      >
                        <span className="text-xs font-mono text-amber-500 bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                          {moment.time}
                        </span>
                        <span className="text-sm text-amber-100/80 group-hover:text-amber-100">
                          {moment.message}
                        </span>
                      </button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Rubric {moment.rubricSection}: {moment.rubric}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-amber-400">
                              Section {moment.rubricSection}: {moment.rubric}
                            </DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {moment.rubricDescription}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Uncertain */}
            <Collapsible
              open={uncertainOpen}
              onOpenChange={setUncertainOpen}
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl overflow-hidden flex flex-col"
            >
              <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-purple-500/5 transition-colors">
                <ChevronDown
                  className={`w-4 h-4 text-purple-500 transition-transform ${uncertainOpen ? "" : "-rotate-90"}`}
                />
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-purple-500 relative">
                    <span className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-purple-500">
                      !
                    </span>
                  </div>
                </div>
                <h3 className="font-medium text-purple-400">Uncertain</h3>
                <span className="ml-auto text-xs text-purple-500/70 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  {uncertainMoments.length} moments
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 overflow-y-auto max-h-32">
                <div className="space-y-2">
                  {uncertainMoments.map((moment, i) => (
                    <div key={i} className="space-y-1">
                      <button
                        onClick={() => scrollToLine(moment.lineId, moment.time)}
                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-purple-500/10 transition-colors group"
                      >
                        <span className="text-xs font-mono text-purple-500 bg-purple-500/20 px-1.5 py-0.5 rounded shrink-0">
                          {moment.time}
                        </span>
                        <span className="text-sm text-purple-100/80 group-hover:text-purple-100">
                          {moment.message}
                        </span>
                      </button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Rubric {moment.rubricSection}: {moment.rubric}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-purple-400">
                              Section {moment.rubricSection}: {moment.rubric}
                            </DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {moment.rubricDescription}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
