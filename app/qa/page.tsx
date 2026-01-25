"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const INITIAL_TRANSCRIPT = [
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

type Moment = {
  time: string;
  message: string;
  lineId: number;
  rubric: string;
  rubricSection: string;
  rubricDescription: string;
  rubricExact?: string;
};
type MomentCategory = "good" | "bad" | "improvement" | "uncertain";

const INITIAL_REPORT = {
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
  conversationSummary:
    "The customer reported intermittent internet disconnections over the past two days. The agent verified the account, ran a line diagnostic, and asked if the customer had tried restarting the router—they had. The agent initially suggested transferring to technical support, which frustrated the customer who had already been transferred twice. The agent apologized and reset the connection remotely instead. The customer confirmed the connection was restored and working, and the call ended with a standard closing.",
  recommendations: [
    "Review troubleshooting protocol section 4.2 regarding checking account notes before asking customers to repeat steps",
    "Practice confident decision-making to avoid unnecessary transfer attempts",
    "Include brief explanation of resolution steps when fixing issues",
  ],
};

export default function QADashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [highlightedTimePosition, setHighlightedTimePosition] = useState<
    number | null
  >(null);
  const [highlightedMomentType, setHighlightedMomentType] = useState<
    "good" | "bad" | "improvement" | "uncertain" | null
  >(null);
  const [goodOpen, setGoodOpen] = useState(true);
  const [badOpen, setBadOpen] = useState(true);
  const [improvementOpen, setImprovementOpen] = useState(true);
  const [uncertainOpen, setUncertainOpen] = useState(true);

  const [totalDuration, setTotalDuration] = useState(1);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [mediaObjectUrl, setMediaObjectUrl] = useState<string | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const rubricFileInputRef = useRef<HTMLInputElement>(null);
  const [transcript, setTranscript] = useState(INITIAL_TRANSCRIPT);
  const [report, setReport] = useState(INITIAL_REPORT);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(180);

  const [userNotes, setUserNotes] = useState<Record<number, string>>({});
  const [noteDialogLineId, setNoteDialogLineId] = useState<number | null>(null);
  const [editingMessageKey, setEditingMessageKey] = useState<string | null>(
    null,
  );
  const [editingMessageDraft, setEditingMessageDraft] = useState("");
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>([]);

  const parseTimeToSeconds = (time: string) => {
    const parts = time.split(":");
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };
  const sortByTime = (a: Moment, b: Moment) =>
    parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time);

  const formatTimeSec = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const findLineId = (
    tx: { id: number; time: string }[],
    ts: number
  ): number => {
    let best = 1;
    for (const line of tx) {
      if (parseTimeToSeconds(line.time) <= ts) best = line.id;
    }
    return best;
  };

  const buildReport = (
    a: Record<string, unknown>,
    durationSec: number
  ): typeof INITIAL_REPORT => ({
    callId: `CALL-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    agent: (typeof a.agent === "string" ? a.agent : null) ?? "—",
    customer: (typeof a.customer === "string" ? a.customer : null) ?? "—",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    duration: formatTimeSec(durationSec),
    overallScore: typeof a.overallScore === "number" ? a.overallScore : 0,
    categoryScores: (() => {
      const def = {
        opening: 0,
        empathy: 0,
        troubleshooting: 0,
        resolution: 0,
        closing: 0,
      };
      if (
        typeof a.categoryScores === "object" &&
        a.categoryScores !== null &&
        !Array.isArray(a.categoryScores)
      ) {
        const o = a.categoryScores as Record<string, number>;
        return {
          opening: typeof o.opening === "number" ? o.opening : def.opening,
          empathy: typeof o.empathy === "number" ? o.empathy : def.empathy,
          troubleshooting: typeof o.troubleshooting === "number" ? o.troubleshooting : def.troubleshooting,
          resolution: typeof o.resolution === "number" ? o.resolution : def.resolution,
          closing: typeof o.closing === "number" ? o.closing : def.closing,
        };
      }
      return def;
    })(),
    summary: typeof a.summary === "string" ? a.summary : "",
    conversationSummary:
      typeof a.conversationSummary === "string" ? a.conversationSummary : "",
    recommendations: Array.isArray(a.improvements)
      ? (a.improvements as string[])
      : [],
  });

  const mapMarkersToMoments = (
    markers: Array<{
      timestamp?: number;
      type?: string;
      category?: string;
      description?: string;
      rubricExact?: string;
    }>,
    tx: { id: number; time: string; speaker?: string }[]
  ) => {
    const good: Moment[] = [];
    const bad: Moment[] = [];
    const improvement: Moment[] = [];
    const uncertain: Moment[] = [];
    for (const m of markers ?? []) {
      const t = Number(m.timestamp) || 0;
      let lineId = findLineId(tx, t);
      const line = tx.find((l) => l.id === lineId);
      // If the timestamp maps to a customer line, attach to the nearest agent line instead of dropping.
      if (line?.speaker === "customer") {
        const idx = tx.findIndex((l) => l.id === lineId);
        const nextAgent = tx.slice(idx + 1).find((l) => l.speaker === "agent");
        const prevAgent = [...tx.slice(0, idx)].reverse().find((l) => l.speaker === "agent");
        const agentLine = nextAgent ?? prevAgent;
        if (!agentLine) continue; // no agent lines in transcript (edge case)
        lineId = agentLine.id;
      }
      const moment: Moment = {
        time: formatTimeSec(t),
        message: String(m.description ?? ""),
        lineId,
        rubric: String(m.category ?? ""),
        rubricSection: String(m.category ?? "—"),
        rubricDescription: String(m.description ?? ""),
        rubricExact: String(m.rubricExact ?? "").trim() || undefined,
      };
      if (m.type === "good") good.push(moment);
      else if (m.type === "bad") bad.push(moment);
      else if (m.type === "improvement") improvement.push(moment);
      else uncertain.push(moment);
    }
    return {
      good: good.sort(sortByTime),
      bad: bad.sort(sortByTime),
      improvement: improvement.sort(sortByTime),
      uncertain: uncertain.sort(sortByTime),
    };
  };

  const [momentsGood, setMomentsGood] = useState<Moment[]>(() => []);
  const [momentsBad, setMomentsBad] = useState<Moment[]>(() => []);
  const [momentsImprovement, setMomentsImprovement] = useState<Moment[]>(() => []);
  const [momentsUncertain, setMomentsUncertain] = useState<Moment[]>(() => []);

  const moveMoment = (
    moment: Moment,
    from: MomentCategory,
    to: MomentCategory,
  ) => {
    if (from === to) return;
    if (from === "good")
      setMomentsGood((p) => p.filter((m) => m.lineId !== moment.lineId));
    else if (from === "bad")
      setMomentsBad((p) => p.filter((m) => m.lineId !== moment.lineId));
    else if (from === "improvement")
      setMomentsImprovement((p) => p.filter((m) => m.lineId !== moment.lineId));
    else
      setMomentsUncertain((p) => p.filter((m) => m.lineId !== moment.lineId));

    if (to === "good") setMomentsGood((p) => [...p, moment].sort(sortByTime));
    else if (to === "bad")
      setMomentsBad((p) => [...p, moment].sort(sortByTime));
    else if (to === "improvement")
      setMomentsImprovement((p) => [...p, moment].sort(sortByTime));
    else setMomentsUncertain((p) => [...p, moment].sort(sortByTime));
  };

  const deleteMoment = (moment: Moment, from: MomentCategory) => {
    if (from === "good")
      setMomentsGood((p) =>
        p.filter(
          (m) =>
            !(
              m.lineId === moment.lineId &&
              m.rubricSection === moment.rubricSection
            ),
        ),
      );
    else if (from === "bad")
      setMomentsBad((p) =>
        p.filter(
          (m) =>
            !(
              m.lineId === moment.lineId &&
              m.rubricSection === moment.rubricSection
            ),
        ),
      );
    else if (from === "improvement")
      setMomentsImprovement((p) =>
        p.filter(
          (m) =>
            !(
              m.lineId === moment.lineId &&
              m.rubricSection === moment.rubricSection
            ),
        ),
      );
    else
      setMomentsUncertain((p) =>
        p.filter(
          (m) =>
            !(
              m.lineId === moment.lineId &&
              m.rubricSection === moment.rubricSection
            ),
        ),
      );
    setDeletedLineIds((prev) =>
      prev.includes(moment.lineId) ? prev : [...prev, moment.lineId],
    );
  };

  const updateMomentMessage = (
    cat: MomentCategory,
    index: number,
    newMessage: string,
  ) => {
    if (cat === "good")
      setMomentsGood((p) =>
        p.map((m, i) => (i === index ? { ...m, message: newMessage } : m)),
      );
    else if (cat === "bad")
      setMomentsBad((p) =>
        p.map((m, i) => (i === index ? { ...m, message: newMessage } : m)),
      );
    else if (cat === "improvement")
      setMomentsImprovement((p) =>
        p.map((m, i) => (i === index ? { ...m, message: newMessage } : m)),
      );
    else
      setMomentsUncertain((p) =>
        p.map((m, i) => (i === index ? { ...m, message: newMessage } : m)),
      );
  };

  const commitEdit = () => {
    if (!editingMessageKey) return;
    const [cat, idx] = editingMessageKey.split("|");
    updateMomentMessage(
      cat as MomentCategory,
      parseInt(idx, 10),
      editingMessageDraft,
    );
    setEditingMessageKey(null);
    setEditingMessageDraft("");
  };

  const cancelEdit = () => {
    setEditingMessageKey(null);
    setEditingMessageDraft("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      e.target.value = "";
      return;
    }
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setFile(selectedFile);
    setIsLoading(true);
    setAnalysisError(null);
    setHighlightedTimePosition(null);
    setHighlightedMomentType(null);
    setHighlightedLine(null);
    try {
      const trForm = new FormData();
      trForm.append("file", selectedFile);
      const trRes = await fetch("/api/transcribe", {
        method: "POST",
        body: trForm,
      });
      const trData = (await trRes.json().catch(() => ({}))) as {
        transcript?: { id: number; speaker: string; text: string; time: string }[];
        rawText?: string;
        duration?: number;
        error?: string;
      };
      if (!trRes.ok) {
        const err = trData.error || "Transcription failed";
        setAnalysisError(err);
        toast.error(err);
        return;
      }
      const tx = Array.isArray(trData.transcript) ? trData.transcript : [];
      const duration = trData.duration || 180;
      setCallDuration(duration);
      setTranscript(tx.length > 0 ? tx : INITIAL_TRANSCRIPT);

      const transcriptForAnalyze =
        tx.length > 0
          ? tx
              .map(
                (l) =>
                  `${l.speaker === "agent" ? "Agent" : "Customer"}: ${l.text}`
              )
              .join("\n")
          : (trData.rawText ?? tx.map((l) => l.text).join(" ")) || "";

      const anForm = new FormData();
      anForm.append("transcript", transcriptForAnalyze);
      anForm.append("duration", String(duration));
      if (rubricFile) {
        anForm.append("rubricFile", rubricFile);
        anForm.append("rubricFileName", rubricFile.name);
      }
      const anRes = await fetch("/api/analyze", { method: "POST", body: anForm });
      const anData = (await anRes.json().catch(() => ({}))) as Record<string, unknown> & {
        error?: string;
        markers?: unknown[];
      };
      if (!anRes.ok) {
        const err = anData.error || "Analysis failed";
        setAnalysisError(err);
        toast.error(err);
        return;
      }
      setReport(buildReport(anData, duration));
      const markers = (Array.isArray(anData.markers)
        ? anData.markers
        : []) as { timestamp?: number; type?: string; category?: string; description?: string; rubricExact?: string }[];
      const { good, bad, improvement, uncertain } = mapMarkersToMoments(
        markers,
        tx.length > 0 ? tx : INITIAL_TRANSCRIPT
      );
      setMomentsGood(good);
      setMomentsBad(bad);
      setMomentsImprovement(improvement);
      setMomentsUncertain(uncertain);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transcription or analysis failed";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      loadTimeoutRef.current = null;
    }
    e.target.value = "";
  };

  const handleRubricFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setRubricFile(f);
    // If a call is already loaded, re-run analysis with the new rubric
    if (!file || isLoading) return;
    setIsLoading(true);
    setAnalysisError(null);
    try {
      const transcriptForAnalyze =
        transcript.length > 0
          ? transcript
              .map(
                (l) =>
                  `${l.speaker === "agent" ? "Agent" : "Customer"}: ${l.text}`
              )
              .join("\n")
          : transcript.map((l) => l.text).join(" ").trim() || "";
      const anForm = new FormData();
      anForm.append("transcript", transcriptForAnalyze);
      anForm.append("duration", String(callDuration));
      anForm.append("rubricFile", f);
      anForm.append("rubricFileName", f.name);
      const anRes = await fetch("/api/analyze", { method: "POST", body: anForm });
      const anData = (await anRes.json().catch(() => ({}))) as Record<string, unknown> & {
        error?: string;
        markers?: unknown[];
      };
      if (!anRes.ok) {
        const err = anData.error || "Analysis with rubric failed";
        setAnalysisError(err);
        toast.error(err);
        return;
      }
      setReport(buildReport(anData, callDuration));
      const markers = (Array.isArray(anData.markers)
        ? anData.markers
        : []) as { timestamp?: number; type?: string; category?: string; description?: string; rubricExact?: string }[];
      const { good, bad, improvement, uncertain } = mapMarkersToMoments(
        markers,
        transcript
      );
      setMomentsGood(good);
      setMomentsBad(bad);
      setMomentsImprovement(improvement);
      setMomentsUncertain(uncertain);
      toast.success("Analysis updated with rubric");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis with rubric failed";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  // Set media source when file changes (use object URL in state so video/audio get src via prop; avoids ref timing)
  useEffect(() => {
    if (!file) {
      setMediaObjectUrl(null);
      setCurrentTime(0);
      setTotalDuration(1);
      return;
    }
    const url = URL.createObjectURL(file);
    setMediaObjectUrl(url);
    setCurrentTime(0);
    setTotalDuration(1);
    return () => {
      URL.revokeObjectURL(url);
      setMediaObjectUrl(null);
      if (mediaRef.current) {
        mediaRef.current.pause();
        mediaRef.current.removeAttribute("src");
      }
    };
  }, [file]);

  // Sync volume and mute to media element
  useEffect(() => {
    if (!mediaRef.current || !file) return;
    mediaRef.current.muted = isMuted;
    mediaRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted, file]);

  // Sync playback speed to media element
  useEffect(() => {
    if (!mediaRef.current || !file) return;
    mediaRef.current.playbackRate = parseFloat(playbackSpeed);
  }, [playbackSpeed, file]);

  // Generate waveform data from audio/video file
  useEffect(() => {
    if (!file) {
      setWaveformData([]);
      return;
    }
    let cancelled = false;
    const audioContext = new AudioContext();
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (cancelled) return;
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
        const maxVal = Math.max(...filteredData) || 1;
        const normalized = filteredData.map((val) => val / maxVal);
        if (!cancelled) setWaveformData(normalized);
      } catch {
        if (!cancelled)
          setWaveformData(
            Array.from({ length: 200 }, () => 0.2 + Math.random() * 0.6),
          );
      }
    };
    reader.readAsArrayBuffer(file);
    return () => {
      cancelled = true;
      audioContext.close();
    };
  }, [file]);

  // Draw sound-bar waveform on canvas
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || waveformData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const duration = totalDuration || 1;
    const progressWidth = (currentTime / duration) * rect.width;
    const centerY = rect.height / 2;
    const maxBarHeight = rect.height * 0.5;
    const barSlotWidth = rect.width / waveformData.length;
    const barGap = 1;
    const barWidth = Math.max(1, barSlotWidth - barGap);

    const defaultPlayed = "#E8E8E8";
    const defaultUnplayed = "#555555";
    const highlightColors: Record<
      "good" | "bad" | "improvement" | "uncertain",
      string
    > = {
      good: "#047857",
      bad: "#b91c1c",
      improvement: "#ca8a04",
      uncertain: "#6d28d9",
    };

    // Bar indices at the highlighted timestamp — only unplayed bars in this region get the accent
    const barCount = waveformData.length;
    const centerBar =
      highlightedTimePosition != null && highlightedMomentType
        ? Math.round((highlightedTimePosition / duration) * barCount)
        : -1;
    const highlightRadius = 4; // bars on each side of center to color
    const isInHighlight = (i: number) =>
      centerBar >= 0 && Math.abs(i - centerBar) <= highlightRadius;

    ctx.clearRect(0, 0, rect.width, rect.height);
    waveformData.forEach((val, i) => {
      const barHeight = val * maxBarHeight;
      const x = i * barSlotWidth;
      const isPlayed = x < progressWidth;
      const inHighlight = isInHighlight(i);
      // In the highlight: played bars stay default (no lighter accent); only unplayed bars get the color
      const accent =
        inHighlight && highlightedMomentType
          ? highlightColors[highlightedMomentType]
          : null;
      ctx.fillStyle =
        inHighlight && accent && !isPlayed
          ? accent
          : isPlayed
            ? defaultPlayed
            : defaultUnplayed;
      ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
    });
  }, [
    waveformData,
    currentTime,
    totalDuration,
    highlightedMomentType,
    highlightedTimePosition,
    isLoading,
  ]);

  const scrollToLine = (
    lineId: number,
    time?: string,
    momentType?: "good" | "bad" | "improvement" | "uncertain",
  ) => {
    setHighlightedLine(lineId);
    const element = document.getElementById(`line-${lineId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (time) {
      const timeInSeconds = parseTimeToSeconds(time);
      setCurrentTime(timeInSeconds);
      setHighlightedTimePosition(timeInSeconds);
      setHighlightedMomentType(momentType ?? null);
      if (mediaRef.current) mediaRef.current.currentTime = timeInSeconds;
    }

    setTimeout(() => setHighlightedLine(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadReport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const MARGIN = 20;
    const PAGE_W = 210;
    const PAGE_H = 297;
    const W = PAGE_W - 2 * MARGIN;
    const LINE = 5.5;

    let y = MARGIN;

    const needPage = () => {
      if (y > PAGE_H - MARGIN - 15) {
        doc.addPage();
        y = MARGIN;
      }
    };

    const addTitle = (title: string) => {
      needPage();
      y += 6;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, MARGIN, y);
      y += LINE + 2;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    };

    const addBody = (text: string) => {
      const lines = doc.splitTextToSize(text, W);
      for (const line of lines) {
        needPage();
        doc.text(line, MARGIN, y);
        y += LINE;
      }
    };

    const addBullet = (text: string, indent = 6) => {
      const lines = doc.splitTextToSize(text, W - indent);
      for (const line of lines) {
        needPage();
        doc.text(line, MARGIN + indent, y);
        y += LINE;
      }
    };

    const scoreColor = (s: number) => {
      if (s >= 80) return [76, 175, 80] as const;
      if (s >= 60) return [255, 193, 7] as const;
      return [244, 67, 54] as const;
    };

    // 1. Full Report & Quality Score (with visuals)
    addTitle("Full Report & Quality Score");
    needPage();
    doc.text(`Call ID: ${report.callId}`, MARGIN, y);
    y += LINE;
    doc.text(`Agent: ${report.agent}`, MARGIN, y);
    y += LINE;
    doc.text(`Customer: ${report.customer}`, MARGIN, y);
    y += LINE;
    doc.text(`Date: ${report.date}`, MARGIN, y);
    y += LINE;
    doc.text(`Duration: ${report.duration}`, MARGIN, y);
    y += LINE;
    y += 4;

    // Overall Score — horizontal bar (progress bar)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Overall Score", MARGIN, y);
    y += 2;
    doc.setFont("helvetica", "normal");
    const barW = W - 32;
    const barH = 8;
    needPage();
    doc.setFillColor(230, 230, 230);
    doc.rect(MARGIN, y, barW, barH, "F");
    const [r, g, b] = scoreColor(report.overallScore);
    doc.setFillColor(r, g, b);
    doc.rect(MARGIN, y, (report.overallScore / 100) * barW, barH, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`${report.overallScore}/100`, MARGIN + barW + 6, y + 5.5);
    doc.setFont("helvetica", "normal");
    y += barH + 10;

    // Category Scores — bar chart
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Category Breakdown", MARGIN, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const labelW = 48;
    const chartW = 75;
    const rowH = 8;
    for (const [cat, score] of Object.entries(report.categoryScores)) {
      needPage();
      doc.setFontSize(9);
      const disp = cat.charAt(0).toUpperCase() + cat.slice(1);
      doc.text(disp, MARGIN, y + 5);
      doc.setFillColor(235, 235, 235);
      doc.rect(MARGIN + labelW, y, chartW, rowH - 2, "F");
      const [cr, cg, cb] = scoreColor(score);
      doc.setFillColor(cr, cg, cb);
      doc.rect(MARGIN + labelW, y, (score / 100) * chartW, rowH - 2, "F");
      doc.setTextColor(0, 0, 0);
      doc.text(String(score), MARGIN + labelW + chartW + 4, y + 5);
      y += rowH + 2;
    }
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Green: 80+  |  Amber: 60–79  |  Red: <60", MARGIN, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 10;

    // Moment-based score: Good=1, Bad=0, Needs improvement=0.5
    const goodPts = momentsGood.length * 1;
    const badPts = momentsBad.length * 0;
    const impPts = momentsImprovement.length * 0.5;
    const momentTotal = goodPts + badPts + impPts;
    const momentN =
      momentsGood.length + momentsBad.length + momentsImprovement.length;
    needPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Moment-based score", MARGIN, y);
    y += LINE + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Good = 1, Bad = 0, Needs improvement = 0.5", MARGIN, y);
    y += LINE;
    doc.text(
      `Good (${momentsGood.length}) × 1 = ${goodPts}`,
      MARGIN,
      y,
    );
    y += LINE;
    doc.text(`Bad (${momentsBad.length}) × 0 = 0`, MARGIN, y);
    y += LINE;
    doc.text(
      `Needs improvement (${momentsImprovement.length}) × 0.5 = ${impPts}`,
      MARGIN,
      y,
    );
    y += LINE;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${momentTotal}`, MARGIN, y);
    y += LINE;
    if (momentN > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${momentTotal} / ${momentN} moments (max ${momentN} if all good)`,
        MARGIN,
        y,
      );
      doc.setTextColor(0, 0, 0);
      y += LINE;
    }
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("QA Summary:", MARGIN, y);
    y += LINE;
    doc.setFont("helvetica", "normal");
    const summaryText =
      report.summary ||
      (momentsGood.length + momentsBad.length + momentsImprovement.length > 0
        ? `Based on moment review: ${momentsGood.length} good, ${momentsBad.length} bad, ${momentsImprovement.length} needs improvement.`
        : "");
    if (summaryText) addBody(summaryText);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations:", MARGIN, y);
    y += LINE;
    doc.setFont("helvetica", "normal");
    const recs =
      report.recommendations.length > 0
        ? report.recommendations
        : [...momentsBad, ...momentsImprovement].map(
            (m) => `[${m.time}] (${m.rubric || "—"}): ${m.message}`
          );
    recs.forEach((r) => addBullet("• " + r));

    // 2. AI Generated Summary (conversation)
    addTitle("AI-Generated Call Summary");
    addBody(report.conversationSummary);

    // 3. Good Moments
    addTitle("Good Moments");
    momentsGood.forEach((m) => {
      addBullet(`[${m.time}] ${m.message}`);
      addBullet(
        `  Rubric: ${m.rubric} — ${m.rubricExact || m.rubricDescription}`,
        8,
      );
      y += 2;
    });

    // 4. Bad Moments
    addTitle("Bad Moments");
    momentsBad.forEach((m) => {
      addBullet(`[${m.time}] ${m.message}`);
      addBullet(
        `  Rubric: ${m.rubric} — ${m.rubricExact || m.rubricDescription}`,
        8,
      );
      y += 2;
    });

    // 5. Needs Improvement
    addTitle("Needs Improvement");
    momentsImprovement.forEach((m) => {
      addBullet(`[${m.time}] ${m.message}`);
      addBullet(
        `  Rubric: ${m.rubric} — ${m.rubricExact || m.rubricDescription}`,
        8,
      );
      y += 2;
    });

    // 6. Uncertain Moments
    addTitle("Uncertain (Manual Review Recommended)");
    momentsUncertain.forEach((m) => {
      addBullet(`[${m.time}] ${m.message}`);
      addBullet(
        `  Rubric: ${m.rubric} — ${m.rubricExact || m.rubricDescription}`,
        8,
      );
      y += 2;
    });

    // 7. Full Transcript (last)
    addTitle("Full Transcript");
    transcript.forEach((line) => {
      const txt = `[${line.time}] ${line.speaker.toUpperCase()}: ${line.text}`;
      addBody(txt);
      y += 2;
    });

    doc.save(`call-report-${report.callId}.pdf`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 flex-1 min-h-0 w-full">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Voice Call QA Review
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of customer service calls
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Full Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Full QA Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-7 py-5">
                  <div className="grid grid-cols-2 gap-5 text-sm">
                    <div>
                      <span className="text-muted-foreground">Call ID:</span>
                      <span className="ml-2 text-foreground">
                        {report.callId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agent:</span>
                      <span className="ml-2 text-foreground">
                        {report.agent}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="ml-2 text-foreground">
                        {report.customer}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 text-foreground">
                        {report.duration}
                      </span>
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-foreground">
                        {report.overallScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${report.overallScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Category Scores</h4>
                    {Object.entries(report.categoryScores).map(
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

                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="font-medium mb-1">Moment-based score</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Good = 1, Bad = 0, Needs improvement = 0.5
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span>Good ({momentsGood.length})</span>
                        <span>× 1 = {momentsGood.length * 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bad ({momentsBad.length})</span>
                        <span>× 0 = 0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Needs improvement ({momentsImprovement.length})</span>
                        <span>× 0.5 = {momentsImprovement.length * 0.5}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t border-border">
                        <span>Total</span>
                        <span>
                          {momentsGood.length * 1 +
                            momentsBad.length * 0 +
                            momentsImprovement.length * 0.5}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const total =
                        momentsGood.length * 1 +
                        momentsBad.length * 0 +
                        momentsImprovement.length * 0.5;
                      const n =
                        momentsGood.length +
                        momentsBad.length +
                        momentsImprovement.length;
                      return n > 0 ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          {total} / {n} moments (max {n} if all good)
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {(momentsGood.length > 0 ||
                    momentsBad.length > 0 ||
                    momentsImprovement.length > 0) && (
                    <>
                      {momentsGood.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Good</h4>
                          <ul className="space-y-2">
                            {momentsGood.map((m, i) => (
                              <li key={i} className="text-sm">
                                <span className="text-muted-foreground">
                                  [{m.time}]
                                </span>{" "}
                                {m.message}
                                {(m.rubric || m.rubricExact) && (
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    Rubric: {m.rubric}
                                    {m.rubricExact ? ` — ${m.rubricExact}` : ""}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {momentsBad.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Bad</h4>
                          <ul className="space-y-2">
                            {momentsBad.map((m, i) => (
                              <li key={i} className="text-sm">
                                <span className="text-muted-foreground">
                                  [{m.time}]
                                </span>{" "}
                                {m.message}
                                {(m.rubric || m.rubricExact) && (
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    Rubric: {m.rubric}
                                    {m.rubricExact ? ` — ${m.rubricExact}` : ""}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {momentsImprovement.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Needs Improvement</h4>
                          <ul className="space-y-2">
                            {momentsImprovement.map((m, i) => (
                              <li key={i} className="text-sm">
                                <span className="text-muted-foreground">
                                  [{m.time}]
                                </span>{" "}
                                {m.message}
                                {(m.rubric || m.rubricExact) && (
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    Rubric: {m.rubric}
                                    {m.rubricExact ? ` — ${m.rubricExact}` : ""}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.summary ||
                        (momentsGood.length +
                          momentsBad.length +
                          momentsImprovement.length >
                        0
                          ? `Based on moment review: ${momentsGood.length} good, ${momentsBad.length} bad, ${momentsImprovement.length} needs improvement.`
                          : "")}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {(
                        report.recommendations.length > 0
                          ? report.recommendations
                          : [
                              ...momentsBad,
                              ...momentsImprovement,
                            ].map(
                              (m) =>
                                `[${m.time}] (${m.rubric || "—"}): ${m.message}`
                            )
                      ).map((rec, i) => (
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
            <input
              ref={rubricFileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleRubricFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => rubricFileInputRef.current?.click()}
              title={rubricFile?.name}
            >
              <BookOpen className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate max-w-36 inline-block">
                {rubricFile ? rubricFile.name : "Upload rubric"}
              </span>
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-4 h-8 bg-secondary hover:bg-secondary/80 rounded-lg border border-border transition-colors min-w-0">
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground min-w-0 max-w-44 truncate">
                  {file ? file.name : "Upload Call"}
                </span>
              </div>
            </label>
          </div>
        </div>

        {analysisError && (
          <p className="text-sm text-destructive" role="alert">
            {analysisError}
          </p>
        )}

        {/* Audio Bar */}
        <div className="bg-card rounded-xl border border-border px-3 py-1 shrink-0">
          {!file ? (
            <div className="flex items-center justify-center gap-2 py-1.5 text-center">
              <Upload className="w-6 h-6 text-muted-foreground/50" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">No data</p>
                <p className="text-xs text-muted-foreground/80">
                  Upload a call to analyze
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 py-1.5 text-center">
              <Spinner className="w-6 h-6 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">
                  Analyzing call...
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Generating transcript and insights
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-8 w-8 bg-transparent"
                onClick={() => {
                  if (!mediaRef.current) return;
                  if (isPlaying) mediaRef.current.pause();
                  else mediaRef.current.play();
                }}
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
                <canvas
                  ref={waveformCanvasRef}
                  className="w-full h-14 rounded-lg bg-card"
                />
                <input
                  type="range"
                  min="0"
                  max={totalDuration || 1}
                  value={currentTime}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setCurrentTime(v);
                    if (mediaRef.current) mediaRef.current.currentTime = v;
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file && (
                  <div
                    className="absolute top-1/4 bottom-1/4 w-0 border-l border-white pointer-events-none"
                    style={{
                      left: `${(currentTime / (totalDuration || 1)) * 100}%`,
                    }}
                  />
                )}
                {/* Highlight indicator */}
                {highlightedTimePosition !== null && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full animate-ping z-10"
                    style={{
                      left: `${((highlightedTimePosition ?? 0) / (totalDuration || 1)) * 100}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-sm font-mono text-muted-foreground w-12">
                {formatTime(totalDuration)}
              </span>
              <div className="flex items-center gap-1.5 ml-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-8"
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
                  className="w-16 h-1 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                />
              </div>
              <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                <SelectTrigger className="w-16 h-8 text-xs">
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
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Transcript - iMessage Style */}
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-sm font-medium text-muted-foreground">
                Call Transcript
              </h2>
              {file && !isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAISummary((s) => !s)}
                  className="h-8 gap-1.5"
                >
                  {showAISummary ? (
                    <>
                      <FileText className="w-4 h-4" />
                      Full Transcript
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      AI Summary
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-2">
              {!file ? (
                <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[200px] text-center">
                  <Upload className="w-10 h-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No data</p>
                  <p className="text-xs text-muted-foreground/80">
                    Upload a call to analyze
                  </p>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[200px] text-center">
                  <Spinner className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing call...
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Generating transcript and insights
                  </p>
                </div>
              ) : showAISummary ? (
                <div className="flex flex-col gap-3 p-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {report.conversationSummary}
                  </p>
                </div>
              ) : (
                <>
                  {transcript.map((line) => {
                    const isAgent = line.speaker === "agent";
                    const isDeleted = deletedLineIds.includes(line.id);
                    // Comments (good/bad/improvement/uncertain) only on agent lines—never on customer (blue) messages.
                    const isGood = isAgent && momentsGood.some((m) => m.lineId === line.id);
                    const isBad = isAgent && momentsBad.some((m) => m.lineId === line.id);
                    const isImprovement = isAgent && momentsImprovement.some((m) => m.lineId === line.id);
                    const isUncertain = isAgent && momentsUncertain.some((m) => m.lineId === line.id);

                    return (
                      <div
                        key={line.id}
                        id={`line-${line.id}`}
                        className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] relative ${isAgent ? "pr-6" : "pl-6"}`}
                        >
                          <span
                            className={`text-[10px] font-medium text-muted-foreground mb-1 block ${isAgent ? "" : "text-right"}`}
                          >
                            {isAgent ? "Agent" : "Customer"}
                          </span>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm transition-all duration-300 ${
                              isDeleted
                                ? "bg-muted/60 text-muted-foreground border border-border"
                                : isAgent
                                  ? isGood
                                    ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30"
                                    : isBad
                                      ? "bg-red-500/20 text-red-100 border border-red-500/30"
                                      : isImprovement
                                        ? "bg-amber-500/20 text-amber-100 border border-amber-500/30"
                                        : "bg-secondary text-foreground"
                                  : "bg-blue-600 text-white"
                            } ${isAgent ? "rounded-bl-md" : "rounded-br-md"} ${
                              highlightedLine === line.id
                                ? "shadow-[inset_0_0_0_2px_rgba(251,191,36,0.5)]"
                                : ""
                            }`}
                          >
                            {line.text}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 mt-1 ${isAgent ? "" : "justify-end"}`}
                          >
                            <span className="text-[10px] text-muted-foreground">
                              {line.time}
                            </span>
                            {!isDeleted && isGood && (
                              <ArrowUp className="w-3 h-3 text-emerald-500" />
                            )}
                            {!isDeleted && isBad && (
                              <ArrowDown className="w-3 h-3 text-red-500" />
                            )}
                            {!isDeleted && isImprovement && (
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                            )}
                            {!isDeleted && isUncertain && (
                              <HelpCircle className="w-3 h-3 text-purple-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Analysis Columns */}
          <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-3 flex-1 min-h-[200px] text-center py-8">
                <Upload className="w-10 h-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No data</p>
                <p className="text-xs text-muted-foreground/80">
                  Upload a call to analyze
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 flex-1 min-h-[200px] text-center py-8">
                <Spinner className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Analyzing call...
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Generating transcript and insights
                </p>
              </div>
            ) : (
              <>
                {/* Good */}
                <Collapsible
                  open={momentsGood.length > 0 ? goodOpen : false}
                  onOpenChange={(open) => {
                    if (momentsGood.length === 0 && open) return;
                    setGoodOpen(open);
                  }}
                  className={cn(
                    "bg-emerald-500/10 border border-emerald-500/20 rounded-xl overflow-hidden flex flex-col",
                    (momentsGood.length > 0 ? goodOpen : false)
                      ? "flex-1 min-h-0"
                      : "shrink-0",
                  )}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-emerald-500/5 transition-colors shrink-0 cursor-pointer">
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-500 transition-transform ${(momentsGood.length > 0 ? goodOpen : false) ? "" : "-rotate-90"}`}
                    />
                    <ArrowUp className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-medium text-emerald-400">Good</h3>
                    <span className="ml-auto text-xs text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {momentsGood.length} moments
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                    <div className="space-y-2">
                      {momentsGood.map((moment, i) => (
                        <div
                          key={`${moment.lineId}-${moment.rubricSection}-${i}`}
                          className="space-y-1"
                        >
                          <div className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors group">
                            <button
                              onClick={() =>
                                scrollToLine(moment.lineId, moment.time, "good")
                              }
                              className="text-xs font-mono text-emerald-500 bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0 hover:bg-emerald-500/30 cursor-pointer"
                            >
                              {moment.time}
                            </button>
                            {editingMessageKey === `good|${i}` ? (
                              <Textarea
                                autoFocus
                                value={editingMessageDraft}
                                onChange={(e) =>
                                  setEditingMessageDraft(e.target.value)
                                }
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEdit();
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    commitEdit();
                                  }
                                }}
                                className="flex-1 min-w-0 text-sm text-emerald-100 bg-emerald-500/10 border-emerald-500/30 rounded py-1.5 px-2 resize-none"
                                rows={2}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                onDoubleClick={() => {
                                  setEditingMessageKey(`good|${i}`);
                                  setEditingMessageDraft(moment.message);
                                }}
                                className={cn(
                                  "flex-1 min-w-0 text-sm cursor-text min-h-5 block",
                                  moment.message
                                    ? "text-emerald-100/80 group-hover:text-emerald-100"
                                    : "text-emerald-400/50 italic",
                                )}
                                title="Double-click to edit"
                              >
                                {moment.message || "Add reasoning…"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  onClick={() => setNoteDialogLineId(moment.lineId)}
                                  title="Add note"
                                >
                                  <MessageSquare
                                    className={cn(
                                      "w-3.5 h-3.5",
                                      userNotes[moment.lineId] &&
                                        "fill-amber-500/50 text-amber-400",
                                    )}
                                  />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                      title="Move to different category"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "good", "bad")
                                  }
                                >
                                  Move to Bad
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "good", "improvement")
                                  }
                                >
                                  Move to Needs Improvement
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "good", "uncertain")
                                  }
                                >
                                  Move to Uncertain
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => deleteMoment(moment, "good")}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Rubric: {moment.rubric}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-emerald-400">
                                    {moment.rubric || "Rubric"}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="text-sm">
                                  <h4 className="font-medium text-foreground mb-1">Description (from rubric)</h4>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {moment.rubricExact || "—"}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Bad */}
                <Collapsible
                  open={momentsBad.length > 0 ? badOpen : false}
                  onOpenChange={(open) => {
                    if (momentsBad.length === 0 && open) return;
                    setBadOpen(open);
                  }}
                  className={cn(
                    "bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden flex flex-col",
                    (momentsBad.length > 0 ? badOpen : false)
                      ? "flex-1 min-h-0"
                      : "shrink-0",
                  )}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-red-500/5 transition-colors shrink-0 cursor-pointer">
                    <ChevronDown
                      className={`w-4 h-4 text-red-500 transition-transform ${(momentsBad.length > 0 ? badOpen : false) ? "" : "-rotate-90"}`}
                    />
                    <ArrowDown className="w-5 h-5 text-red-500" />
                    <h3 className="font-medium text-red-400">Bad</h3>
                    <span className="ml-auto text-xs text-red-500/70 bg-red-500/10 px-2 py-0.5 rounded-full">
                      {momentsBad.length} moments
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                    <div className="space-y-2">
                      {momentsBad.map((moment, i) => (
                        <div
                          key={`${moment.lineId}-${moment.rubricSection}-${i}`}
                          className="space-y-1"
                        >
                          <div className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-red-500/10 transition-colors group">
                            <button
                              onClick={() =>
                                scrollToLine(moment.lineId, moment.time, "bad")
                              }
                              className="text-xs font-mono text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded shrink-0 hover:bg-red-500/30 cursor-pointer"
                            >
                              {moment.time}
                            </button>
                            {editingMessageKey === `bad|${i}` ? (
                              <Textarea
                                autoFocus
                                value={editingMessageDraft}
                                onChange={(e) =>
                                  setEditingMessageDraft(e.target.value)
                                }
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEdit();
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    commitEdit();
                                  }
                                }}
                                className="flex-1 min-w-0 text-sm text-red-100 bg-red-500/10 border-red-500/30 rounded py-1.5 px-2 resize-none"
                                rows={2}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                onDoubleClick={() => {
                                  setEditingMessageKey(`bad|${i}`);
                                  setEditingMessageDraft(moment.message);
                                }}
                                className={cn(
                                  "flex-1 min-w-0 text-sm cursor-text min-h-5 block",
                                  moment.message
                                    ? "text-red-100/80 group-hover:text-red-100"
                                    : "text-red-400/50 italic",
                                )}
                                title="Double-click to edit"
                              >
                                {moment.message || "Add reasoning…"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-wrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => setNoteDialogLineId(moment.lineId)}
                              title="Add note"
                            >
                              <MessageSquare
                                className={cn(
                                  "w-3.5 h-3.5",
                                  userNotes[moment.lineId] &&
                                    "fill-amber-500/50 text-amber-400",
                                )}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Move to different category"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "bad", "good")
                                  }
                                >
                                  Move to Good
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "bad", "improvement")
                                  }
                                >
                                  Move to Needs Improvement
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "bad", "uncertain")
                                  }
                                >
                                  Move to Uncertain
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => deleteMoment(moment, "bad")}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Rubric: {moment.rubric}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-red-400">
                                    {moment.rubric || "Rubric"}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="text-sm">
                                  <h4 className="font-medium text-foreground mb-1">Description (from rubric)</h4>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {moment.rubricExact || "—"}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Needs Improvement */}
                <Collapsible
                  open={momentsImprovement.length > 0 ? improvementOpen : false}
                  onOpenChange={(open) => {
                    if (momentsImprovement.length === 0 && open) return;
                    setImprovementOpen(open);
                  }}
                  className={cn(
                    "bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden flex flex-col",
                    (momentsImprovement.length > 0 ? improvementOpen : false)
                      ? "flex-1 min-h-0"
                      : "shrink-0",
                  )}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-amber-500/5 transition-colors shrink-0 cursor-pointer">
                    <ChevronDown
                      className={`w-4 h-4 text-amber-500 transition-transform ${(momentsImprovement.length > 0 ? improvementOpen : false) ? "" : "-rotate-90"}`}
                    />
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-medium text-yellow-400">
                      Needs Improvement
                    </h3>
                    <span className="ml-auto text-xs text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {momentsImprovement.length} moments
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                    <div className="space-y-2">
                      {momentsImprovement.map((moment, i) => (
                        <div
                          key={`${moment.lineId}-${moment.rubricSection}-${i}`}
                          className="space-y-1"
                        >
                          <div className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-amber-500/10 transition-colors group">
                            <button
                              onClick={() =>
                                scrollToLine(
                                  moment.lineId,
                                  moment.time,
                                  "improvement",
                                )
                              }
                              className="text-xs font-mono text-amber-500 bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0 hover:bg-amber-500/30 cursor-pointer"
                            >
                              {moment.time}
                            </button>
                            {editingMessageKey === `improvement|${i}` ? (
                              <Textarea
                                autoFocus
                                value={editingMessageDraft}
                                onChange={(e) =>
                                  setEditingMessageDraft(e.target.value)
                                }
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEdit();
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    commitEdit();
                                  }
                                }}
                                className="flex-1 min-w-0 text-sm text-amber-100 bg-amber-500/10 border-amber-500/30 rounded py-1.5 px-2 resize-none"
                                rows={2}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                onDoubleClick={() => {
                                  setEditingMessageKey(`improvement|${i}`);
                                  setEditingMessageDraft(moment.message);
                                }}
                                className={cn(
                                  "flex-1 min-w-0 text-sm cursor-text min-h-5 block",
                                  moment.message
                                    ? "text-amber-100/80 group-hover:text-amber-100"
                                    : "text-amber-400/50 italic",
                                )}
                                title="Double-click to edit"
                              >
                                {moment.message || "Add reasoning…"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-wrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              onClick={() => setNoteDialogLineId(moment.lineId)}
                              title="Add note"
                            >
                              <MessageSquare
                                className={cn(
                                  "w-3.5 h-3.5",
                                  userNotes[moment.lineId] &&
                                    "fill-amber-500/50 text-amber-400",
                                )}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                  title="Move to different category"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "improvement", "good")
                                  }
                                >
                                  Move to Good
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "improvement", "bad")
                                  }
                                >
                                  Move to Bad
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(
                                      moment,
                                      "improvement",
                                      "uncertain",
                                    )
                                  }
                                >
                                  Move to Uncertain
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() =>
                                    deleteMoment(moment, "improvement")
                                  }
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Rubric: {moment.rubric}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-amber-400">
                                    {moment.rubric || "Rubric"}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="text-sm">
                                  <h4 className="font-medium text-foreground mb-1">Description (from rubric)</h4>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {moment.rubricExact || "—"}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Uncertain */}
                <Collapsible
                  open={momentsUncertain.length > 0 ? uncertainOpen : false}
                  onOpenChange={(open) => {
                    if (momentsUncertain.length === 0 && open) return;
                    setUncertainOpen(open);
                  }}
                  className={cn(
                    "bg-purple-500/10 border border-purple-500/20 rounded-xl overflow-hidden flex flex-col",
                    (momentsUncertain.length > 0 ? uncertainOpen : false)
                      ? "flex-1 min-h-0"
                      : "shrink-0",
                  )}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 p-4 w-full hover:bg-purple-500/5 transition-colors shrink-0 cursor-pointer">
                    <ChevronDown
                      className={`w-4 h-4 text-purple-500 transition-transform ${(momentsUncertain.length > 0 ? uncertainOpen : false) ? "" : "-rotate-90"}`}
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
                      {momentsUncertain.length} moments
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                    <div className="space-y-2">
                      {momentsUncertain.map((moment, i) => (
                        <div
                          key={`${moment.lineId}-${moment.rubricSection}-${i}`}
                          className="space-y-1"
                        >
                          <div className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-purple-500/10 transition-colors group">
                            <button
                              onClick={() =>
                                scrollToLine(
                                  moment.lineId,
                                  moment.time,
                                  "uncertain",
                                )
                              }
                              className="text-xs font-mono text-purple-500 bg-purple-500/20 px-1.5 py-0.5 rounded shrink-0 hover:bg-purple-500/30 cursor-pointer"
                            >
                              {moment.time}
                            </button>
                            {editingMessageKey === `uncertain|${i}` ? (
                              <Textarea
                                autoFocus
                                value={editingMessageDraft}
                                onChange={(e) =>
                                  setEditingMessageDraft(e.target.value)
                                }
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEdit();
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    commitEdit();
                                  }
                                }}
                                className="flex-1 min-w-0 text-sm text-purple-100 bg-purple-500/10 border-purple-500/30 rounded py-1.5 px-2 resize-none"
                                rows={2}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                onDoubleClick={() => {
                                  setEditingMessageKey(`uncertain|${i}`);
                                  setEditingMessageDraft(moment.message);
                                }}
                                className={cn(
                                  "flex-1 min-w-0 text-sm cursor-text min-h-5 block",
                                  moment.message
                                    ? "text-purple-100/80 group-hover:text-purple-100"
                                    : "text-purple-400/50 italic",
                                )}
                                title="Double-click to edit"
                              >
                                {moment.message || "Add reasoning…"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-wrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                              onClick={() => setNoteDialogLineId(moment.lineId)}
                              title="Add note"
                            >
                              <MessageSquare
                                className={cn(
                                  "w-3.5 h-3.5",
                                  userNotes[moment.lineId] &&
                                    "fill-amber-500/50 text-amber-400",
                                )}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                  title="Move to different category"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "uncertain", "good")
                                  }
                                >
                                  Move to Good
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(moment, "uncertain", "bad")
                                  }
                                >
                                  Move to Bad
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    moveMoment(
                                      moment,
                                      "uncertain",
                                      "improvement",
                                    )
                                  }
                                >
                                  Move to Needs Improvement
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() =>
                                    deleteMoment(moment, "uncertain")
                                  }
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Rubric: {moment.rubric}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-purple-400">
                                    {moment.rubric || "Rubric"}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="text-sm">
                                  <h4 className="font-medium text-foreground mb-1">Description (from rubric)</h4>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {moment.rubricExact || "—"}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>
        </div>

        {/* Note dialog for moments */}
        <Dialog
          open={noteDialogLineId !== null}
          onOpenChange={(o) => !o && setNoteDialogLineId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add note</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Add your notes for this moment..."
              value={
                (noteDialogLineId != null ? userNotes[noteDialogLineId] : "") ??
                ""
              }
              onChange={(e) => {
                if (noteDialogLineId == null) return;
                setUserNotes((p) => ({
                  ...p,
                  [noteDialogLineId]: e.target.value,
                }));
              }}
              className="min-h-24"
            />
            <Button onClick={() => setNoteDialogLineId(null)}>Done</Button>
          </DialogContent>
        </Dialog>

        {file &&
          (file.type.startsWith("video/") ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaObjectUrl || undefined}
              className="hidden"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                setTotalDuration(Number.isFinite(d) && d > 0 ? d : 1);
                if (Number.isFinite(d) && d > 0)
                  setReport((prev) => ({ ...prev, duration: formatTimeSec(d) }));
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaObjectUrl || undefined}
              className="hidden"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                setTotalDuration(Number.isFinite(d) && d > 0 ? d : 1);
                if (Number.isFinite(d) && d > 0)
                  setReport((prev) => ({ ...prev, duration: formatTimeSec(d) }));
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          ))}
      </div>
    </div>
  );
}
