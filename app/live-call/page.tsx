"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Phone, PhoneOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const SONIOX_WS = "wss://stt-rt.soniox.com/transcribe-websocket";
const TARGET_SAMPLE_RATE = 16000;
const CHUNK_BYTES = 3200; // ~100ms at 16kHz 16bit mono
const TONE_MIN_CHARS = 20;
const TONE_MIN_PCM_BYTES = 16000; // 0.5 sec at 16kHz 16bit mono – minimum to send for audio tone
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

/** If the tone API returns a long rate-limit message, shorten it for the UI. */
function normalizeToneError(err: string | null | undefined): string {
  const s = String(err ?? "").trim();
  if (!s) return s;
  if (/rate limit|RPD|gpt-4o-realtime|gpt-4o-audio|requests per day/i.test(s)) {
    const m = s.match(/(?:please\s+)?try again in\s+([\d][\d.ms]*)\s*[.\s]?/i);
    const when = m?.[1]?.trim().replace(/\.$/, "");
    return when ? `Rate limit reached. Try again in ${when}.` : "Rate limit reached. Try again in a few minutes.";
  }
  return s;
}

/** Map score in [-1, 1] to dot and border classes (gradient). */
function scoreStyles(score: number): { dot: string; border: string } {
  if (score <= -0.5) return { dot: "bg-red-500", border: "border-red-500" };
  if (score <= -0.2) return { dot: "bg-orange-500", border: "border-orange-500" };
  if (score <= 0.2) return { dot: "bg-amber-500", border: "border-amber-500" };
  if (score <= 0.5) return { dot: "bg-emerald-400", border: "border-emerald-400" };
  return { dot: "bg-emerald-500", border: "border-emerald-500" };
}

function scoreToBar(score: number): number {
  return Math.round((score + 1) * 50);
}

function getSentimentColor(bar: number): string {
  if (bar >= 70) return "text-emerald-400";
  if (bar >= 55) return "text-emerald-300";
  if (bar >= 45) return "text-amber-400";
  if (bar >= 30) return "text-orange-400";
  return "text-red-400";
}

/** Build a WAV Blob from PCM 16‑bit 16kHz mono chunks. Returns null if too short. */
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

export default function LiveCallPage() {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [transcriptBlocks, setTranscriptBlocks] = useState<{ speaker: string; text: string; isProvisional?: boolean }[]>([]);
  const [sentimentResults, setSentimentResults] = useState<
    { score: number; sentiment: string; excerpt: string; insertAfterIndex: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const messagesRef = useRef<{ speaker: string; text: string }[]>([]);
  const currentBlockRef = useRef<{ speaker: string; text: string }>({ speaker: "1", text: "" });
  const nonFinalRef = useRef<{ speaker: string; text: string } | null>(null);
  const toneBufferRef = useRef("");
  const toneSpeakerCountsRef = useRef<Record<string, number>>({});
  const toneAudioChunksRef = useRef<Uint8Array[]>([]);
  const audioBufferRef = useRef<number[]>([]);
  const [toneError, setToneError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [hoveredSentimentIndex, setHoveredSentimentIndex] = useState<number | null>(null);
  const callStartRef = useRef<number | null>(null);
  const [callDuration, setCallDuration] = useState("00:00");

  useEffect(() => {
    if (status !== "live" || callStartRef.current == null) return;
    const tick = () => setCallDuration(formatDuration(Date.now() - callStartRef.current!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Ranges for which transcript blocks each sentiment result covers: [start, end] (inclusive).
  // If end < start (e.g. race at stop), normalize to [end, start] so we can still highlight.
  const ranges = useMemo(() => {
    return sentimentResults
      .map((r, j) => {
        let start = j === 0 ? 0 : sentimentResults[j - 1].insertAfterIndex + 1;
        let end = r.insertAfterIndex;
        if (end < 0) return null;
        if (end < start) [start, end] = [end, start]; // normalize so highlight works
        return { start, end, sentiment: r, index: j };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);
  }, [sentimentResults]);

  function getBlockInfo(blockIndex: number): { sentiment: (typeof sentimentResults)[0]; rangeIndex: number; isFirst: boolean; isLast: boolean } | null {
    for (let j = 0; j < ranges.length; j++) {
      const r = ranges[j];
      if (blockIndex >= r.start && blockIndex <= r.end)
        return {
          sentiment: r.sentiment,
          rangeIndex: j,
          isFirst: blockIndex === r.start,
          isLast: blockIndex === r.end,
        };
    }
    return null;
  }

  const flushAudio = useCallback((ws: WebSocket) => {
    const buf = audioBufferRef.current;
    while (buf.length >= CHUNK_BYTES) {
      const chunk = buf.splice(0, CHUNK_BYTES);
      ws.send(new Uint8Array(chunk));
    }
  }, []);

  const analyzeTone = useCallback(async (text: string, insertAfterIndex: number) => {
    if (text.length < TONE_MIN_CHARS) return;
    setToneError(null);
    try {
      const res = await fetch("/api/soniox/analyze-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && typeof data.score === "number") {
        setSentimentResults((prev) => [
          ...prev,
          { score: data.score, sentiment: data.sentiment || "", excerpt: text, insertAfterIndex },
        ]);
      } else {
        setToneError(normalizeToneError(data?.error || `Tone API ${res.status}`));
      }
    } catch (e) {
      setToneError(normalizeToneError(e instanceof Error ? e.message : "Tone request failed"));
    }
  }, []);

  const analyzeToneFromAudio = useCallback(
    async (audioBlob: Blob, insertAfterIndex: number) => {
      setToneError(null);
      try {
        const form = new FormData();
        form.append("audio", audioBlob);
        const res = await fetch("/api/soniox/analyze-tone", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok && typeof data.score === "number") {
          setSentimentResults((prev) => [
            ...prev,
            { score: data.score, sentiment: data.sentiment || "", excerpt: "From audio", insertAfterIndex },
          ]);
        } else {
          setToneError(normalizeToneError(data?.error || `Tone API ${res.status}`));
        }
      } catch (e) {
        setToneError(normalizeToneError(e instanceof Error ? e.message : "Tone from audio failed"));
      }
    },
    []
  );

  const startCall = async () => {
    setError(null);
    setTranscriptBlocks([]);
    setSentimentResults([]);
    setToneError(null);
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

    try {
      const keyRes = await fetch("/api/soniox/temp-key", { method: "POST" });
      const keyData = await keyRes.json();
      if (!keyRes.ok) throw new Error(keyData.error || "Failed to get temp key");
      const tempKey = keyData.api_key;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
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
            })
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
        const bytes = new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
        toneAudioChunksRef.current.push(new Uint8Array(bytes));
        for (let i = 0; i < bytes.length; i++) audioBufferRef.current.push(bytes[i]);
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
          const finalParts: string[] = [];
          nonFinalRef.current = null;

          for (const t of tokens) {
            const text = cleanTokenText(t.text ?? "");
            if (!text) continue;
            const sp = String(t.speaker ?? "1");

            if (t.is_final) {
              finalParts.push(text);
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
              if (!nonFinalRef.current) nonFinalRef.current = { speaker: sp, text };
              else nonFinalRef.current.text += text;
            }
          }

          if (finalParts.length) {
            const added = finalParts.join("");
            toneBufferRef.current += added;
            const speakersWith2 = Object.entries(toneSpeakerCountsRef.current).filter(
              ([, c]) => c >= 2
            );
            if (
              speakersWith2.length >= 2 &&
              toneBufferRef.current.length >= TONE_MIN_CHARS
            ) {
              const toSend = toneBufferRef.current;
              const insertAfterIndex = messagesRef.current.length - 1;
              // Use text-only to avoid gpt-4o-audio-preview / gpt-4o-realtime RPD
              analyzeTone(toSend, insertAfterIndex);
              toneBufferRef.current = "";
              toneSpeakerCountsRef.current = {};
              toneAudioChunksRef.current = [];
            }
          }

          const cur = currentBlockRef.current;
          const nf = nonFinalRef.current;
          const display: { speaker: string; text: string; isProvisional?: boolean }[] = [
            ...messagesRef.current.map((m) => ({ ...m })),
            ...(cur.text ? [{ ...cur }] : []),
            ...(nf?.text ? [{ ...nf, isProvisional: true }] : []),
          ];
          setTranscriptBlocks(display);
        } catch {
          // ignore
        }
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
      const insertAfterIndex = messagesRef.current.length > 0 ? messagesRef.current.length - 1 : -1;
      // Use text-only to avoid gpt-4o-audio-preview / gpt-4o-realtime RPD
      analyzeTone(toneBufferRef.current, insertAfterIndex);
    }
    callStartRef.current = null;
    setCallDuration("00:00");
    setStatus("idle");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 0 0",
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10 space-y-6">
        {/* Top bar: call time, phone number, Mute, End call (or Start call when idle) */}
        <div className="flex items-center gap-4 py-3 px-4 rounded-lg border border-border bg-card">
          <span className="text-sm font-medium tabular-nums w-12">
            {status === "live" ? callDuration : "—"}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            {PHONE_NUMBER}
          </span>
          <div className="flex-1" />
          {status === "live" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  isMutedRef.current = !isMutedRef.current;
                  setIsMuted(isMutedRef.current);
                }}
              >
                {isMuted ? (
                  <Mic className="w-4 h-4 mr-1.5" />
                ) : (
                  <MicOff className="w-4 h-4 mr-1.5" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="destructive" size="sm" onClick={stopCall}>
                <PhoneOff className="w-4 h-4 mr-1.5" />
                End call
              </Button>
            </>
          ) : (
            <Button
              onClick={startCall}
              disabled={status === "connecting"}
              size="sm"
            >
              {status === "connecting" ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Phone className="w-4 h-4 mr-1.5" />
              )}
              {status === "connecting" ? "Connecting…" : "Start call"}
            </Button>
          )}
        </div>

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

        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium text-foreground">Transcript</h2>
          <div className="flex gap-4 mt-2 min-h-[180px] max-h-[360px]">
            <TooltipProvider delayDuration={200}>
              <div className="flex-1 min-w-0 overflow-y-auto flex flex-col gap-2">
                {transcriptBlocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {status === "idle" ? "Start a call to see the live transcript." : "…"}
                  </p>
                ) : (
                  transcriptBlocks.map((b, i) => {
                    const info = getBlockInfo(i);
                    const hovered = info && hoveredSentimentIndex === info.rangeIndex;
                    const styles = info ? scoreStyles(info.sentiment.score) : null;
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => info && setHoveredSentimentIndex(info.rangeIndex)}
                        onMouseLeave={() => setHoveredSentimentIndex(null)}
                        className={`flex gap-2 items-start transition-colors ${
                          hovered && styles
                            ? `${styles.border} border-l-2 pl-2 ${info.isFirst ? "rounded-tl" : ""} ${info.isLast ? "rounded-bl" : ""}`
                            : ""
                        } ${hovered ? "bg-muted/30" : ""}`}
                      >
                        <div className="w-6 shrink-0 flex justify-center pt-2.5">
                          {info ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 cursor-help ${styles!.dot}`}
                                  aria-label={`Score: ${scoreToBar(info.sentiment.score)}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[200px]">
                                <p className="font-medium">{scoreToBar(info.sentiment.score)}</p>
                                <p className="text-muted-foreground mt-0.5">{info.sentiment.sentiment}</p>
                                <p className="text-[10px] text-muted-foreground/80 mt-1">
                                  Section: blocks {ranges[info.rangeIndex].start + 1}–{ranges[info.rangeIndex].end + 1}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="w-2.5 h-2.5 shrink-0" aria-hidden />
                          )}
                        </div>
                        <div
                          className={`flex-1 flex min-w-0 ${Number(b.speaker) % 2 === 0 ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              Number(b.speaker) % 2 === 0
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            } ${b.isProvisional ? "opacity-80" : ""}`}
                          >
                            <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                              Speaker {b.speaker}
                              {b.isProvisional && " · …"}
                            </p>
                            <p className="whitespace-pre-wrap break-words">{b.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TooltipProvider>
            <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto border-l border-border pl-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide sticky top-0 bg-card pb-1">
                Sentiment
              </p>
              {sentimentResults.length === 0 ? (
                <p className="text-xs text-muted-foreground">After each 4 back‑and‑forth messages.</p>
              ) : (
                sentimentResults.map((s, i) => {
                  const start = i === 0 ? 0 : sentimentResults[i - 1].insertAfterIndex + 1;
                  const end = s.insertAfterIndex;
                  let blockLabel: string | null = null;
                  if (end >= 0) {
                    if (end >= start) blockLabel = `[blocks ${start + 1}–${end + 1}]`;
                    else blockLabel = `[block ${end + 1} onward]`;
                  }

                  const ri = ranges.findIndex((r) => r.sentiment === s);
                  const isHovered = ri >= 0 && hoveredSentimentIndex === ri;
                  const fromAudio = s.excerpt === "From audio";
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => ri >= 0 && setHoveredSentimentIndex(ri)}
                      onMouseLeave={() => setHoveredSentimentIndex(null)}
                      className={`rounded-lg border px-2.5 py-2 text-xs cursor-default transition-all ${
                        isHovered ? "ring-2 ring-primary border-primary/50 bg-muted/60" : "border-border bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${scoreStyles(s.score).dot}`} aria-hidden />
                        <p className={`font-medium ${getSentimentColor(scoreToBar(s.score))}`}>
                          {scoreToBar(s.score)}
                        </p>
                        {blockLabel != null && (
                          <span className="text-[10px] text-muted-foreground" title="Transcript section this applies to">
                            {blockLabel}
                          </span>
                        )}
                        {fromAudio && (
                          <span className="text-[10px] text-muted-foreground/90" title="Based on tone of voice, not just words">
                            (voice)
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">{s.sentiment}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground/80 line-clamp-2 italic">
                        {fromAudio ? (
                          <>From audio — based on <strong>tone of voice</strong></>
                        ) : (
                          <>&quot;{s.excerpt.length > 80 ? s.excerpt.slice(0, 80) + "…" : s.excerpt}&quot;</>
                        )}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
