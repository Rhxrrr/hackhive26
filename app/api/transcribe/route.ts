/**
 * Transcribe uploaded audio/video using Soniox (SONIOX_API_KEY) with speaker diarization
 * for accurate Agent/Customer separation. OpenAI is used only for analysis (see /api/analyze).
 */
const SONIOX_BASE = "https://api.soniox.com";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function cleanSegmentText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

type TranscriptLine = { id: number; speaker: "agent" | "customer"; text: string; time: string };

export async function POST(req: Request) {
  const sonioxKey = process.env.SONIOX_API_KEY;
  if (!sonioxKey) {
    return Response.json(
      { error: "SONIOX_API_KEY is not set. Add it to .env.local for audio transcription." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return Response.json(
      { error: "Form must include a non-empty 'file' (audio or video with audio)." },
      { status: 400 }
    );
  }

  const fileName = (file as File).name || "audio.mp4";

  try {
    const uploadForm = new FormData();
    uploadForm.append("file", file, fileName);

    const uploadRes = await fetch(`${SONIOX_BASE}/v1/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sonioxKey}` },
      body: uploadForm,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err?.message || `Soniox upload failed: ${uploadRes.status}`);
    }
    const { id: fileId } = (await uploadRes.json()) as { id?: string };
    if (!fileId) throw new Error("Soniox did not return file id");

    const createRes = await fetch(`${SONIOX_BASE}/v1/transcriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sonioxKey}`,
      },
      body: JSON.stringify({
        model: "stt-async-v3",
        file_id: fileId,
        enable_speaker_diarization: true,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.message || `Soniox create transcription failed: ${createRes.status}`);
    }
    const { id: transcriptionId } = (await createRes.json()) as { id?: string };
    if (!transcriptionId) throw new Error("Soniox did not return transcription id");

    for (let i = 0; i < 300; i++) {
      const statusRes = await fetch(`${SONIOX_BASE}/v1/transcriptions/${transcriptionId}`, {
        headers: { Authorization: `Bearer ${sonioxKey}` },
      });
      const statusData = (await statusRes.json()) as { status?: string; error_message?: string };
      if (statusData.status === "completed") break;
      if (statusData.status === "error") {
        throw new Error(statusData.error_message || "Soniox transcription failed");
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    const transcriptRes = await fetch(
      `${SONIOX_BASE}/v1/transcriptions/${transcriptionId}/transcript`,
      { headers: { Authorization: `Bearer ${sonioxKey}` } }
    );
    if (!transcriptRes.ok) {
      throw new Error(`Soniox get transcript failed: ${transcriptRes.status}`);
    }
    const { tokens, text } = (await transcriptRes.json()) as {
      tokens?: { text?: string; speaker?: string; start_ms?: number; end_ms?: number }[];
      text?: string;
    };

    const tok = Array.isArray(tokens) ? tokens : [];
    if (tok.length === 0) {
      const fallback = cleanSegmentText(text || "") || "(no speech detected)";
      return Response.json({
        transcript: [{ id: 1, speaker: "agent", text: fallback, time: "0:00" }],
        rawText: fallback,
        duration: 0,
      });
    }

    // Merge consecutive tokens with same speaker by concatenating raw token text (no extra spaces).
    // Soniox token text is meant to be appended directly; it may include leading spaces for word boundaries.
    const segments: { speakerId: string; text: string; startMs: number; endMs: number }[] = [];
    let cur = {
      speakerId: String(tok[0]?.speaker ?? "1"),
      text: tok[0]?.text ?? "",
      startMs: tok[0]?.start_ms ?? 0,
      endMs: tok[0]?.end_ms ?? 0,
    };

    for (let i = 1; i < tok.length; i++) {
      const t = tok[i];
      const sp = String(t?.speaker ?? "1");
      const startMs = t?.start_ms ?? 0;
      const endMs = t?.end_ms ?? 0;
      const raw = t?.text ?? "";
      if (sp === cur.speakerId) {
        cur.text += raw;
        cur.endMs = endMs || cur.endMs;
      } else {
        if (cur.text) segments.push({ ...cur });
        cur = { speakerId: sp, text: raw, startMs, endMs };
      }
    }
    if (cur.text) segments.push(cur);

    const firstSpeakerByTime = [...segments].sort((a, b) => a.startMs - b.startMs)[0]?.speakerId ?? "1";
    const agentSpeakerId = firstSpeakerByTime;

    const transcript: TranscriptLine[] = segments.map((s, i) => ({
      id: i + 1,
      speaker: s.speakerId === agentSpeakerId ? "agent" : "customer",
      text: cleanSegmentText(s.text),
      time: formatTime((s.startMs || 0) / 1000),
    }));

    const rawText = transcript.map((l) => l.text).join(" ").trim() || cleanSegmentText(text || "");
    const duration =
      segments.length > 0
        ? Math.max(0, ...segments.map((s) => s.endMs || 0)) / 1000
        : 0;

    return Response.json({ transcript, rawText, duration });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transcription failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
