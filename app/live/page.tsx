"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Lightbulb,
  Clock,
  Volume2,
  Loader2,
  MessageSquare,
  Sparkles,
  Download,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { jsPDF } from "jspdf";

// --- Live-call (Soniox + tone) constants and helpers
const SONIOX_WS = "wss://stt-rt.soniox.com/transcribe-websocket";
const TARGET_SAMPLE_RATE = 16000;
const CHUNK_BYTES = 3200;
const TONE_MIN_CHARS = 20;
const TONE_MIN_PCM_BYTES = 16000;
const PHONE_NUMBER = "+1 (555) 123-4567";

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function cleanTokenText(s: string): string {
  return (s || "")
    .replace(/\<end\>/gi, " ")
    .replace(/\<fin\>/gi, " ")
    .replace(/\s+/g, " ");
}

type AiNotesByCategory = {
  information: string[];
  problems: string[];
  requests: string[];
  concerns: string[];
};

const EMPTY_AI_NOTES: AiNotesByCategory = {
  information: [],
  problems: [],
  requests: [],
  concerns: [],
};

/** Normalize a note for deduplication: strip common prefixes, lowercase, collapse spaces. */
function normalizeNote(s: string): string {
  const t = (s || "")
    .replace(
      /^(customer name:?|customer's name is|full name is|customer name is|customer employer:?|works for|problem:?|concern:?|concerned about|wants to understand|related to)\s*/gi,
      "",
    )
    .replace(
      /^(frustrated about|worried about|relies on|relies heavily on|feeling upset about|upset about|wants to|wants clarity on|needs clarification on|needs clarification|does not understand|feeling upset)\s*/gi,
      "",
    )
    .trim()
    .toLowerCase();
  return t.replace(/\s+/g, " ");
}

/** If the tone API returns a long rate-limit message, shorten it for the UI. */
function normalizeToneError(err: string | null | undefined): string {
  const s = String(err ?? "").trim();
  if (!s) return s;
  if (/rate limit|RPD|gpt-4o-realtime|gpt-4o-audio|requests per day/i.test(s)) {
    const m = s.match(/(?:please\s+)?try again in\s+([\d][\d.ms]*)\s*[.\s]?/i);
    const when = m?.[1]?.trim().replace(/\.$/, "");
    return when
      ? `Rate limit reached. Try again in ${when}.`
      : "Rate limit reached. Try again in a few minutes.";
  }
  return s;
}

/** Map score in [-1, 1] to dot and border classes (gradient). */
function scoreStyles(score: number): { dot: string; border: string } {
  if (score <= -0.5) return { dot: "bg-red-500", border: "border-red-500" };
  if (score <= -0.2)
    return { dot: "bg-orange-500", border: "border-orange-500" };
  if (score <= 0.2) return { dot: "bg-amber-500", border: "border-amber-500" };
  if (score <= 0.5)
    return { dot: "bg-emerald-400", border: "border-emerald-400" };
  return { dot: "bg-emerald-500", border: "border-emerald-500" };
}

/** Map score in [-1, 1] to 0–100 for the bar. */
function scoreToBar(score: number): number {
  return Math.round((score + 1) * 50);
}

function buildWavBlob(chunks: Uint8Array[]): Blob | null {
  const pcmLength = chunks.reduce((a, c) => a + c.length, 0);
  if (pcmLength < TONE_MIN_PCM_BYTES) return null;
  const pcm = new Uint8Array(pcmLength);
  let o = 0;
  for (const c of chunks) {
    pcm.set(c, o);
    o += c.length;
  }
  const fileSize = 36 + pcmLength;
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const u8 = new Uint8Array(header);
  const set = (s: string, i: number) => {
    for (let j = 0; j < s.length; j++) u8[i + j] = s.charCodeAt(j);
  };
  set("RIFF", 0);
  v.setUint32(4, fileSize, true);
  set("WAVE", 8);
  set("fmt ", 12);
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, TARGET_SAMPLE_RATE, true);
  v.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  set("data", 36);
  v.setUint32(40, pcmLength, true);
  return new Blob([header, pcm], { type: "audio/wav" });
}

function getSentimentColor(bar: number) {
  if (bar >= 70) return "text-emerald-400";
  if (bar >= 55) return "text-emerald-300";
  if (bar >= 45) return "text-amber-400";
  if (bar >= 30) return "text-orange-400";
  return "text-red-400";
}

function getSentimentBgColor(bar: number) {
  if (bar >= 70) return "bg-emerald-500";
  if (bar >= 55) return "bg-emerald-400";
  if (bar >= 45) return "bg-amber-500";
  if (bar >= 30) return "bg-orange-500";
  return "bg-red-500";
}

export default function LiveCallPage() {
  // --- Live-call state and refs
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "error"
  >("idle");
  const [transcriptBlocks, setTranscriptBlocks] = useState<
    { speaker: string; text: string; isProvisional?: boolean }[]
  >([]);
  const [sentimentResults, setSentimentResults] = useState<
    {
      score: number;
      sentiment: string;
      excerpt: string;
      insertAfterIndex: number;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [toneError, setToneError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredSentimentIndex, setHoveredSentimentIndex] = useState<
    number | null
  >(null);
  const callStartRef = useRef<number | null>(null);
  const [callDuration, setCallDuration] = useState("00:00");
  const [liveFeedback, setLiveFeedback] = useState<{ tips: string[] } | null>(
    null,
  );
  const [liveFeedbackLoading, setLiveFeedbackLoading] = useState(false);
  const [liveFeedbackError, setLiveFeedbackError] = useState<string | null>(
    null,
  );
  const [brainstormIdeas, setBrainstormIdeas] = useState<{
    ideas: string[];
  } | null>(null);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [aiNotes, setAiNotes] = useState<AiNotesByCategory>(() => ({
    ...EMPTY_AI_NOTES,
  }));
  const [aiNotesLoading, setAiNotesLoading] = useState(false);
  const [aiNotesError, setAiNotesError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const messagesRef = useRef<{ speaker: string; text: string }[]>([]);
  const currentBlockRef = useRef<{ speaker: string; text: string }>({
    speaker: "1",
    text: "",
  });
  const nonFinalRef = useRef<{ speaker: string; text: string } | null>(null);
  const toneBufferRef = useRef("");
  const toneSpeakerCountsRef = useRef<Record<string, number>>({});
  const toneAudioChunksRef = useRef<Uint8Array[]>([]);
  const audioBufferRef = useRef<number[]>([]);
  const isMutedRef = useRef(false);
  const lastProcessedFinalCountRef = useRef(0);
  const sentimentTimelineScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentimentTimelineScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sentimentResults.length]);

  useEffect(() => {
    if (status !== "live" || callStartRef.current == null) return;
    const tick = () =>
      setCallDuration(formatDuration(Date.now() - callStartRef.current!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Final blocks only (exclude provisional) so APIs get clean text
  const transcript = useMemo(
    () =>
      transcriptBlocks
        .filter((b) => !b.isProvisional)
        .map((b) => `Speaker ${b.speaker}: ${b.text || ""}`)
        .join("\n"),
    [transcriptBlocks],
  );

  const ranges = useMemo(() => {
    return sentimentResults
      .map((r, j) => {
        let start = j === 0 ? 0 : sentimentResults[j - 1].insertAfterIndex + 1;
        let end = r.insertAfterIndex;
        if (end < 0) return null;
        if (end < start) [start, end] = [end, start];
        return { start, end, sentiment: r, index: j };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);
  }, [sentimentResults]);

  const flushAudio = useCallback((ws: WebSocket) => {
    const buf = audioBufferRef.current;
    while (buf.length >= CHUNK_BYTES) {
      const chunk = buf.splice(0, CHUNK_BYTES);
      ws.send(new Uint8Array(chunk));
    }
  }, []);

  const analyzeTone = useCallback(
    async (
      text: string,
      insertAfterIndex: number,
      segmentSpeaker?: string,
      fullTranscript?: string,
    ) => {
      if (text.length < TONE_MIN_CHARS) return;
      setToneError(null);
      try {
        const body: Record<string, unknown> = {
          text,
          focusCustomer: true,
          segmentSpeaker: segmentSpeaker ?? "1",
        };
        if (fullTranscript != null && fullTranscript !== "")
          body.fullTranscript = fullTranscript;
        const res = await fetch("/api/soniox/analyze-tone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok && typeof data.score === "number") {
          setSentimentResults((prev) => [
            ...prev,
            {
              score: data.score,
              sentiment: data.sentiment || "",
              excerpt: text,
              insertAfterIndex,
            },
          ]);
        } else {
          setToneError(
            normalizeToneError(data?.error || `Tone API ${res.status}`),
          );
        }
      } catch (e) {
        setToneError(
          normalizeToneError(
            e instanceof Error ? e.message : "Tone request failed",
          ),
        );
      }
    },
    [],
  );

  const analyzeToneFromAudio = useCallback(
    async (
      audioBlob: Blob,
      insertAfterIndex: number,
      segmentSpeaker?: string,
      fullTranscript?: string,
    ) => {
      setToneError(null);
      try {
        const form = new FormData();
        form.append("audio", audioBlob);
        form.append("focusCustomer", "true");
        form.append("segmentSpeaker", segmentSpeaker ?? "1");
        if (fullTranscript != null && fullTranscript !== "")
          form.append("fullTranscript", fullTranscript);
        const res = await fetch("/api/soniox/analyze-tone", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (res.ok && typeof data.score === "number") {
          setSentimentResults((prev) => [
            ...prev,
            {
              score: data.score,
              sentiment: data.sentiment || "",
              excerpt: "From audio",
              insertAfterIndex,
            },
          ]);
        } else {
          setToneError(
            normalizeToneError(data?.error || `Tone API ${res.status}`),
          );
        }
      } catch (e) {
        setToneError(
          normalizeToneError(
            e instanceof Error ? e.message : "Tone from audio failed",
          ),
        );
      }
    },
    [],
  );

  const fetchNotesAndCoaching = useCallback(
    async (
      transcript: string,
      transcriptBlocks: {
        speaker: string;
        text: string;
        isProvisional?: boolean;
      }[],
      notes: AiNotesByCategory,
      recentSentiments: { score: number; sentiment: string }[],
      previousCoaching: string[],
      previousSolutions: string[],
    ) => {
      if (transcript.length < 20) return;
      const finalCount = transcriptBlocks.filter(
        (b) => !b.isProvisional,
      ).length;
      if (finalCount <= lastProcessedFinalCountRef.current) return;
      lastProcessedFinalCountRef.current = finalCount;
      setAiNotesError(null);
      setLiveFeedbackError(null);
      setBrainstormError(null);
      setAiNotesLoading(true);
      setLiveFeedbackLoading(true);
      setBrainstormLoading(true);
      try {
        const res = await fetch("/api/soniox/notes-and-coaching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            notes: {
              information: notes.information,
              problems: notes.problems,
              requests: notes.requests,
              concerns: notes.concerns,
            },
            recentSentiments,
            previousCoaching,
            previousSolutions,
          }),
        });
        const data = (await res.json()) as {
          information?: string[];
          problems?: string[];
          requests?: string[];
          concerns?: string[];
          solutions?: string[];
          coaching?: string[];
          error?: string;
        };
        if (
          res.ok &&
          data &&
          typeof data === "object" &&
          !("error" in data && data.error)
        ) {
          const inf = Array.isArray(data.information) ? data.information : [];
          const pr = Array.isArray(data.problems) ? data.problems : [];
          const req = Array.isArray(data.requests) ? data.requests : [];
          const con = Array.isArray(data.concerns) ? data.concerns : [];
          setAiNotes((prev) => {
            const existingNorm = new Set<string>();
            const existingNormList: string[] = [];
            for (const x of [
              ...prev.information,
              ...prev.problems,
              ...prev.requests,
              ...prev.concerns,
            ]) {
              const n = normalizeNote(x);
              if (n) {
                existingNorm.add(n);
                existingNormList.push(n);
              }
            }
            const isDup = (c: string) =>
              existingNorm.has(c) ||
              (c.length >= 3 &&
                existingNormList.some((e) => e.includes(c) || c.includes(e)));
            const add = (c: string) => {
              existingNorm.add(c);
              existingNormList.push(c);
            };
            const merge = (arr: string[], from: string[]) => {
              const out = [...arr];
              for (const n of from) {
                const s = (n || "").trim();
                if (!s) continue;
                const c = normalizeNote(s);
                if (!c) continue;
                if (!isDup(c)) {
                  out.push(n);
                  add(c);
                }
              }
              return out;
            };
            return {
              information: merge(prev.information, inf),
              problems: merge(prev.problems, pr),
              requests: merge(prev.requests, req),
              concerns: merge(prev.concerns, con),
            };
          });
          setBrainstormIdeas({
            ideas: Array.isArray(data.solutions) ? data.solutions : [],
          });
          setLiveFeedback({
            tips: Array.isArray(data.coaching) ? data.coaching : [],
          });
        } else {
          const err = data?.error || `Notes & coaching API ${res.status}`;
          setAiNotesError(err);
          setLiveFeedbackError(err);
          setBrainstormError(err);
        }
      } catch (e) {
        const err =
          e instanceof Error ? e.message : "Notes & coaching request failed";
        setAiNotesError(err);
        setLiveFeedbackError(err);
        setBrainstormError(err);
      } finally {
        setAiNotesLoading(false);
        setLiveFeedbackLoading(false);
        setBrainstormLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (status !== "live") return;
    const recentSentiments = sentimentResults
      .slice(-3)
      .map((s) => ({ score: s.score, sentiment: s.sentiment }));
    fetchNotesAndCoaching(
      transcript,
      transcriptBlocks,
      aiNotes,
      recentSentiments,
      liveFeedback?.tips ?? [],
      brainstormIdeas?.ideas ?? [],
    );
    // aiNotes, liveFeedback?.tips, brainstormIdeas?.ideas from closure; omitted from deps to avoid array-size issues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    transcript,
    transcriptBlocks,
    sentimentResults,
    fetchNotesAndCoaching,
  ]);

  const downloadTranscript = useCallback(() => {
    const final = transcriptBlocks.filter((b) => !b.isProvisional);
    if (final.length === 0) return;
    const text = final
      .map((b) => `Speaker ${b.speaker}: ${b.text || ""}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcriptBlocks]);

  const downloadFullReport = useCallback(() => {
    const final = transcriptBlocks.filter((b) => !b.isProvisional);
    const date = new Date().toISOString().slice(0, 10);
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const margin = 20;
    const maxW = 210 - margin * 2;
    let y = 25;
    const lineH = 5.5;
    const pageH = 297;
    const bottomM = 25;

    const wrap = (text: string): string[] => {
      const out: string[] = [];
      for (const para of text.split(/\n/)) {
        const words = para.trim() ? para.split(/\s+/) : [""];
        let line = "";
        for (const w of words) {
          const cand = line ? `${line} ${w}` : w;
          if (doc.getTextWidth(cand) <= maxW) line = cand;
          else {
            if (line) out.push(line);
            line = w;
          }
        }
        if (line) out.push(line);
      }
      return out;
    };

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - bottomM) {
        doc.addPage();
        y = 25;
      }
    };

    const addLine = (str: string, opts?: { size?: number; bold?: boolean }) => {
      ensureSpace(opts?.size ? opts.size * 0.35 + 2 : lineH);
      if (opts?.size) doc.setFontSize(opts.size);
      if (opts?.bold) doc.setFont("helvetica", "bold");
      doc.text(str, margin, y);
      y += opts?.size ? opts.size * 0.35 + 2 : lineH;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    const addBlock = (text: string) => {
      for (const ln of wrap(text)) {
        ensureSpace(lineH);
        doc.text(ln, margin, y);
        y += lineH;
      }
    };

    const addSection = (title: string) => {
      ensureSpace(14);
      y += 4;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 70, 130);
      doc.text(title, margin, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 124);
    doc.text("Call Report", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 12;
    doc.setTextColor(0, 0, 0);

    // Transcript
    addSection("Transcript");
    if (final.length > 0) {
      const transcriptText = final
        .map((b) => `Speaker ${b.speaker}: ${b.text || ""}`)
        .join("\n");
      addBlock(transcriptText);
    } else addLine("(No transcript)");
    y += 4;

    // Notes
    addSection("Notes");
    const hasNotes =
      aiNotes.information.length > 0 ||
      aiNotes.problems.length > 0 ||
      aiNotes.requests.length > 0 ||
      aiNotes.concerns.length > 0;
    if (hasNotes) {
      if (aiNotes.information.length > 0) {
        addLine("Information", { bold: true });
        aiNotes.information.forEach((n) => addBlock(`• ${n}`));
      }
      if (aiNotes.problems.length > 0) {
        addLine("Problems", { bold: true });
        aiNotes.problems.forEach((n) => addBlock(`• ${n}`));
      }
      if (aiNotes.requests.length > 0) {
        addLine("Requests", { bold: true });
        aiNotes.requests.forEach((n) => addBlock(`• ${n}`));
      }
      if (aiNotes.concerns.length > 0) {
        addLine("Concerns", { bold: true });
        aiNotes.concerns.forEach((n) => addBlock(`• ${n}`));
      }
    } else addLine("(No notes)");
    y += 4;

    // Coaching & Solutions
    addSection("Coaching & Solutions");
    const tips = liveFeedback?.tips ?? [];
    const ideas = brainstormIdeas?.ideas ?? [];
    if (tips.length > 0 || ideas.length > 0) {
      if (tips.length > 0) {
        addLine("Coaching", { bold: true });
        tips.forEach((t) => addBlock(`• ${t}`));
      }
      if (ideas.length > 0) {
        addLine("Solutions", { bold: true });
        ideas.forEach((i) => addBlock(`• ${i}`));
      }
    } else addLine("(None)");
    y += 4;

    // Sentiment Timeline
    addSection("Sentiment Timeline");
    if (sentimentResults.length > 0) {
      sentimentResults.forEach((s, i) => {
        const bar = scoreToBar(s.score);
        addLine(
          `[${i + 1}] Score: ${bar}/100  (${s.score >= 0 ? "+" : ""}${s.score.toFixed(2)})`,
          { bold: true },
        );
        if (s.sentiment) addBlock(s.sentiment);
        y += 2;
      });
    } else addLine("(No sentiment data)");

    doc.save(`call-report-${date}.pdf`);
  }, [
    transcriptBlocks,
    aiNotes,
    liveFeedback?.tips,
    brainstormIdeas?.ideas,
    sentimentResults,
  ]);

  const startCall = async () => {
    setError(null);
    setTranscriptBlocks([]);
    setSentimentResults([]);
    setToneError(null);
    setLiveFeedback(null);
    setLiveFeedbackError(null);
    setBrainstormIdeas(null);
    setBrainstormError(null);
    setAiNotes({ ...EMPTY_AI_NOTES });
    setAiNotesError(null);
    setIsMuted(false);
    isMutedRef.current = false;
    setStatus("connecting");
    messagesRef.current = [];
    currentBlockRef.current = { speaker: "1", text: "" };
    nonFinalRef.current = null;
    toneBufferRef.current = "";
    toneSpeakerCountsRef.current = {};
    toneAudioChunksRef.current = [];
    audioBufferRef.current = [];
    lastProcessedFinalCountRef.current = 0;

    try {
      const keyRes = await fetch("/api/soniox/temp-key", { method: "POST" });
      const keyData = await keyRes.json();
      if (!keyRes.ok)
        throw new Error(keyData.error || "Failed to get temp key");
      const tempKey = keyData.api_key;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const rate = ctx.sampleRate;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      src.connect(processor);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      processor.connect(gain);
      gain.connect(ctx.destination);

      const ws = new WebSocket(SONIOX_WS);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              api_key: tempKey,
              model: "stt-rt-v3",
              audio_format: "pcm_s16le",
              sample_rate: TARGET_SAMPLE_RATE,
              num_channels: 1,
              enable_speaker_diarization: true,
              enable_endpoint_detection: true,
            }),
          );
          resolve();
        };
        ws.onerror = () => reject(new Error("WebSocket error"));
      });

      callStartRef.current = Date.now();
      setStatus("live");

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN || isMutedRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const inLen = input.length;
        const outLen = Math.floor((inLen * TARGET_SAMPLE_RATE) / rate);
        const out = new Int16Array(outLen);
        for (let i = 0; i < outLen; i++) {
          const idx = (i * rate) / TARGET_SAMPLE_RATE;
          const v = input[Math.floor(idx)];
          const s = Math.max(-32768, Math.min(32767, Math.floor(v * 32768)));
          out[i] = s;
        }
        const bytes = new Uint8Array(
          out.buffer,
          out.byteOffset,
          out.byteLength,
        );
        toneAudioChunksRef.current.push(new Uint8Array(bytes));
        for (let i = 0; i < bytes.length; i++)
          audioBufferRef.current.push(bytes[i]);
        flushAudio(ws);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.error_code) {
            setError(`${msg.error_code}: ${msg.error_message || "Unknown"}`);
            return;
          }
          const tokens = msg.tokens || [];
          nonFinalRef.current = null;

          for (const t of tokens) {
            const text = cleanTokenText(t.text ?? "");
            if (!text) continue;
            const sp = String(t.speaker ?? "1");

            if (t.is_final) {
              const cur = currentBlockRef.current;
              if (sp !== cur.speaker && cur.text) {
                messagesRef.current.push({ ...cur });
                toneSpeakerCountsRef.current[cur.speaker] =
                  (toneSpeakerCountsRef.current[cur.speaker] || 0) + 1;
                currentBlockRef.current = { speaker: sp, text: "" };
              }
              currentBlockRef.current.speaker = sp;
              currentBlockRef.current.text += text;
            } else {
              if (!nonFinalRef.current)
                nonFinalRef.current = { speaker: sp, text };
              else nonFinalRef.current.text += text;
            }
          }

          const finalParts = tokens
            .filter((t: { is_final?: boolean }) => t.is_final)
            .map((t: { text?: string }) => cleanTokenText(t.text ?? ""));
          if (finalParts.length) {
            const added = finalParts.join("");
            toneBufferRef.current += added;
            const finalTokens = tokens.filter(
              (t: { is_final?: boolean }) => t.is_final,
            );
            const segmentSpeaker = finalTokens.length
              ? String(finalTokens[finalTokens.length - 1]?.speaker ?? "1")
              : "1";
            const insertAfterIndex = messagesRef.current.length;
            if (added.length >= TONE_MIN_CHARS) {
              const fullTranscript = [
                ...messagesRef.current.map(
                  (m) => `Speaker ${m.speaker}: ${m.text}`,
                ),
                currentBlockRef.current.text
                  ? `Speaker ${currentBlockRef.current.speaker}: ${currentBlockRef.current.text}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n");
              // Use text-only (gpt-4o-mini) to avoid gpt-4o-audio-preview / gpt-4o-realtime rate limits
              analyzeTone(
                added,
                insertAfterIndex,
                segmentSpeaker,
                fullTranscript,
              );
              toneBufferRef.current = toneBufferRef.current.slice(
                0,
                toneBufferRef.current.length - added.length,
              );
              toneAudioChunksRef.current = [];
            }
          }

          const cur = currentBlockRef.current;
          const nf = nonFinalRef.current;
          setTranscriptBlocks([
            ...messagesRef.current.map((m) => ({ ...m })),
            ...(cur.text ? [{ ...cur }] : []),
            ...(nf?.text ? [{ ...nf, isProvisional: true }] : []),
          ]);
        } catch {}
      };

      ws.onclose = () => setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      stopCall();
    }
  };

  const stopCall = () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("");
      ws.close();
    }
    wsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (toneBufferRef.current.length >= TONE_MIN_CHARS) {
      const insertAfterIndex = messagesRef.current.length;
      const segmentSpeaker = currentBlockRef.current?.speaker ?? "2";
      const fullTranscript = [
        ...messagesRef.current.map((m) => `Speaker ${m.speaker}: ${m.text}`),
        currentBlockRef.current?.text
          ? `Speaker ${currentBlockRef.current.speaker}: ${currentBlockRef.current.text}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      // Use text-only to avoid gpt-4o-audio / gpt-4o-realtime rate limits
      analyzeTone(
        toneBufferRef.current,
        insertAfterIndex,
        segmentSpeaker,
        fullTranscript,
      );
    }
    callStartRef.current = null;
    setCallDuration("00:00");
    setStatus("idle");
  };

  const isConnected = status === "live";
  const latestSentiment = sentimentResults[sentimentResults.length - 1];
  const currentSentiment = latestSentiment
    ? scoreToBar(latestSentiment.score)
    : 50;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Grid: below nav only; top edge = first horizontal line, aligned with nav’s border-b */}
      <div
        className="fixed top-16 right-0 bottom-0 left-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 0 0",
        }}
      />

      {/* Header: solid bg (no grid); h-16 so grid’s top aligns with border-b */}
      <header className="relative z-10 h-16 flex items-center border-b border-border bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center w-full gap-x-8">
          {/* Left: Home / My Analytics / Live Call Assistant */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href="/analytics?view=agent"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              My Analytics
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold">Live Call Assistant</h1>
          </div>

          {/* Center: phone number and time */}
          <div className="flex-1 flex justify-center items-center gap-6 min-w-0">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{PHONE_NUMBER}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono">
                {isConnected ? callDuration : "—"}
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

          {/* Right: microphone and Connect button */}
          <div className="flex items-center gap-2 shrink-0">
            {!isConnected && transcriptBlocks.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTranscript}
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download transcript
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadFullReport}
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download report (PDF)
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                isMutedRef.current = !isMutedRef.current;
                setIsMuted(isMutedRef.current);
              }}
              className={
                isMuted ? "bg-red-500/10 border-red-500/30 text-red-400" : ""
              }
              disabled={!isConnected}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={isConnected ? stopCall : startCall}
              disabled={status === "connecting"}
              className="gap-2"
            >
              {status === "connecting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting…
                </>
              ) : isConnected ? (
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

      {/* Error banners */}
      {(error || toneError) && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-2">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {toneError && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
              Tone: {toneError}
            </div>
          )}
        </div>
      )}

      {/* Main Content - 2 Columns */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col max-w-7xl w-full mx-auto p-6">
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
          {/* Column 1: Coaching & Solutions (blue=feedback, green=solutions) + Notes */}
          <div className="flex flex-col h-full min-h-0 gap-6 pr-2">
            {/* --- Coaching & Solutions (combined, blue/green) --- */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                  <h2 className="font-medium">Coaching & Solutions</h2>
                <p className="text-xs text-muted-foreground">
                    Coaching (blue): how to propose solutions. Solutions
                    (green): ideas for the customer's problems.
                </p>
              </div>
            </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {liveFeedbackError || brainstormError ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {liveFeedbackError || brainstormError}
                </div>
                ) : liveFeedback?.tips?.length ||
                  brainstormIdeas?.ideas?.length ? (
                  <div className="space-y-1.5">
                    {(liveFeedback?.tips || []).map((tip, i) => (
                      <div
                        key={`f-${i}`}
                        className="flex gap-2 p-2.5 rounded-lg border-l-4 border-blue-500 bg-blue-500/5 text-sm"
                      >
                        <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-foreground">{tip}</p>
                      </div>
                    ))}
                    {(brainstormIdeas?.ideas || []).map((idea, i) => (
                      <div
                        key={`s-${i}`}
                        className="flex gap-2 p-2.5 rounded-lg border-l-4 border-emerald-500 bg-emerald-500/5 text-sm"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-foreground">{idea}</p>
                        </div>
                    ))}
                    {(liveFeedbackLoading || brainstormLoading) && (
                      <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                        Updating…
                      </div>
                    )}
                    </div>
                ) : liveFeedbackLoading || brainstormLoading ? (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <Loader2 className="w-6 h-6 text-muted-foreground mx-auto mb-1.5 animate-spin" />
                    <p className="text-sm text-muted-foreground">Analyzing…</p>
                    </div>
                ) : liveFeedback != null || brainstormIdeas != null ? (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No solutions or coaching to show yet.
                    </p>
                  </div>
                ) : !isConnected ? (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Start a call to see coaching and solution ideas.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {transcript.length < 20
                        ? "Say more to get coaching and solutions."
                        : "Coaching and solutions as the call progresses."}
                    </p>
                </div>
              )}
            </div>
          </div>

            {/* --- AI-Assisted Notes --- */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 rounded-lg bg-amber-500/10">
                  <StickyNote className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                  <h2 className="font-medium">Notes</h2>
                <p className="text-xs text-muted-foreground">
                    Essential info to assist during the call
                </p>
              </div>
            </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {aiNotesError && (
                  <p className="text-xs text-destructive">{aiNotesError}</p>
                )}
                {(() => {
                  const hasNotes =
                    aiNotes.information.length +
                      aiNotes.problems.length +
                      aiNotes.requests.length +
                      aiNotes.concerns.length >
                    0;
                  return hasNotes ? (
                    <div className="rounded-lg border border-border bg-card p-2.5 space-y-3">
                      {aiNotes.information.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Information
                          </p>
                          <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                            {aiNotes.information.map((n, i) => (
                              <li key={`inf-${i}`}>{n}</li>
                            ))}
                          </ul>
                </div>
                      )}
                      {aiNotes.problems.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Problems
                          </p>
                          <div className="space-y-2">
                            {aiNotes.problems.map((n, i) => (
                              <div
                                key={`pr-${i}`}
                                className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-sm text-muted-foreground"
                              >
                                {n}
                      </div>
                            ))}
                        </div>
                      </div>
                      )}
                      {aiNotes.requests.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Requests
                          </p>
                          <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                            {aiNotes.requests.map((n, i) => (
                              <li key={`req-${i}`}>{n}</li>
                            ))}
                          </ul>
                    </div>
                      )}
                      {aiNotes.concerns.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Concerns
                          </p>
                          <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                            {aiNotes.concerns.map((n, i) => (
                              <li key={`con-${i}`}>{n}</li>
                            ))}
                          </ul>
                  </div>
                      )}
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const hasNotes =
                    aiNotes.information.length +
                      aiNotes.problems.length +
                      aiNotes.requests.length +
                      aiNotes.concerns.length >
                    0;
                  return isConnected &&
                    !aiNotesLoading &&
                    !hasNotes &&
                    !aiNotesError ? (
                    <p className="text-xs text-muted-foreground py-1">
                      {transcript.length < 20
                        ? "Say more to capture notes."
                        : "No notes yet."}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const hasNotes =
                    aiNotes.information.length +
                      aiNotes.problems.length +
                      aiNotes.requests.length +
                      aiNotes.concerns.length >
                    0;
                  return aiNotesLoading && !hasNotes ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Analyzing…
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {/* Column 2: Customer Sentiment */}
          <div className="flex flex-col h-full min-h-0 gap-4">
            <div className="flex items-center gap-2 shrink-0">
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

            <div className="bg-card border border-border rounded-xl p-6 shrink-0">
              <div className="text-center mb-6">
                <div
                  className={`text-5xl font-bold mb-2 tabular-nums transition-all duration-500 ease-out ${getSentimentColor(currentSentiment)}`}
                >
                  {currentSentiment}
                </div>
                <div
                  className={`text-base font-medium tabular-nums transition-all duration-500 ease-out ${getSentimentColor(currentSentiment)}`}
                >
                  Score 0–100
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From live tone analysis
                </p>
              </div>
              <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-6">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${getSentimentBgColor(currentSentiment)}`}
                  style={{ width: `${currentSentiment}%` }}
                />
                {isConnected && (
                  <div
                    className="absolute top-0 h-full w-1 bg-white/50 animate-pulse transition-all duration-500 ease-out"
                    style={{ left: `${currentSentiment}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex flex-col flex-1 min-h-0">
              <h3 className="text-sm font-medium mb-3 shrink-0">
                Sentiment Timeline
              </h3>
              <div
                ref={sentimentTimelineScrollRef}
                className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-2"
              >
                {sentimentResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Updates as the call progresses.
                  </p>
                ) : (
                  sentimentResults.map((s, i) => {
                    const start =
                      i === 0
                        ? 0
                        : sentimentResults[i - 1].insertAfterIndex + 1;
                    const end = s.insertAfterIndex;
                    let blockLabel: string | null = null;
                    if (end >= 0)
                      blockLabel =
                        end >= start
                          ? `[${start + 1}–${end + 1}]`
                          : `[${end + 1}+]`;
                    const ri = ranges.findIndex((r) => r.sentiment === s);
                    const isHovered = ri >= 0 && hoveredSentimentIndex === ri;
                    const fromAudio = s.excerpt === "From audio";
                    return (
                      <div
                        key={i}
                        onMouseEnter={() =>
                          ri >= 0 && setHoveredSentimentIndex(ri)
                        }
                        onMouseLeave={() => setHoveredSentimentIndex(null)}
                        className={`border rounded-lg p-3 cursor-default transition-all ${isHovered ? "ring-2 ring-primary border-primary/50 bg-muted/60" : "border-border bg-muted/30"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${scoreStyles(s.score).dot}`}
                          />
                    <span
                            className={`text-xs font-medium ${getSentimentColor(scoreToBar(s.score))}`}
                    >
                            {scoreToBar(s.score)}
                    </span>
                          {blockLabel && (
                            <span className="text-[10px] text-muted-foreground">
                              {blockLabel}
                            </span>
                          )}
                          {fromAudio && (
                            <span className="text-[10px] text-muted-foreground">
                              (voice)
                            </span>
                          )}
                  </div>
                        <p className="text-xs text-muted-foreground">
                          {s.sentiment}
                        </p>
              </div>
                    );
                  })
                )}
            </div>
          </div>
        </div>
        </div>

        {/* Transcript */}
        <Collapsible className="group mt-6 shrink-0">
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50">
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
            <span>Transcript</span>
            <span className="text-[10px]">({transcript.length} chars)</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-border bg-muted/20 p-3 text-xs font-mono whitespace-pre-wrap break-words">
              {transcript || "(empty)"}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </main>
    </div>
  );
}
