/**
 * In-memory store for completed calls (e.g. from live call).
 * Used so the Call Reviews page shows recent calls and QA can open a call
 * with transcript + optional file already loaded.
 */

export type ReviewStatus = "Pending" | "Ready" | "In Progress" | "Completed";

export type CallRecord = {
  id: string;
  date: string;
  agent: string;
  customer: string;
  duration: string;
  status: ReviewStatus;
  /** Transcript in QA page format (id, speaker, text, time) */
  transcript: { id: number; speaker: string; text: string; time: string }[];
  /** Duration in seconds for QA */
  durationSec: number;
  /** Optional audio file for playback in QA (in-memory only) */
  file?: File;
};

const calls: CallRecord[] = [];
const filesByCallId = new Map<string, File>();

export function addCall(call: CallRecord): void {
  calls.unshift(call);
  if (call.file) filesByCallId.set(call.id, call.file);
}

export function getCalls(): CallRecord[] {
  return calls.map((c) => ({
    ...c,
    file: filesByCallId.get(c.id),
  }));
}

export function getCall(id: string): CallRecord | null {
  const call = calls.find((c) => c.id === id) ?? null;
  if (!call) return null;
  const file = filesByCallId.get(call.id);
  return { ...call, file };
}
