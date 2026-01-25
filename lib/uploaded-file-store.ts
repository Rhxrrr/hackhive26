/**
 * In-memory store to pass an uploaded File from /upload to /qa after redirect.
 * Used when user selects a file on /upload and we redirect to /qa before the QA
 * page reads and processes it.
 */
let stored: File | null = null;

export function setUploadedFile(file: File): void {
  stored = file;
}

export function getAndClearUploadedFile(): File | null {
  const f = stored;
  stored = null;
  return f;
}
