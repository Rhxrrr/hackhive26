/**
 * Shared QA rubrics storage (localStorage) and helpers.
 * Used by Dashboard and QA page so rubrics persist across sessions and pages.
 */

export const QA_RUBRICS_KEY = "qa-rubrics";

export type SavedRubric = {
  id: string;
  name: string;
  categories: string[];
  fileName?: string;
  createdAt: string;
};

export type RubricsStore = { rubrics: SavedRubric[]; activeId: string | null };

export function loadRubricsStore(): RubricsStore {
  if (typeof window === "undefined" || !window.localStorage) {
    return { rubrics: [], activeId: null };
  }
  try {
    const raw = localStorage.getItem(QA_RUBRICS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as RubricsStore;
      if (Array.isArray(p?.rubrics)) return p;
    }
  } catch {
    // ignore
  }
  return { rubrics: [], activeId: null };
}

export function saveRubricsStore(store: RubricsStore): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  localStorage.setItem(QA_RUBRICS_KEY, JSON.stringify(store));
}

/** Migrate from legacy qa-rubric-file into qa-rubrics. Returns true if a migration was performed. */
export function migrateLegacyRubric(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  const legacy = localStorage.getItem("qa-rubric-file");
  if (!legacy) return false;
  const store = loadRubricsStore();
  if (store.rubrics.length > 0) return false;
  try {
    const p = JSON.parse(legacy) as {
      categories?: string[];
      fileName?: string;
    };
    if (!Array.isArray(p?.categories) || p.categories.length === 0)
      return false;
    const id = crypto.randomUUID();
    const r: SavedRubric = {
      id,
      name: (p.fileName || "Saved rubric").replace(/\.(csv|xlsx|xls)$/i, ""),
      categories: p.categories,
      fileName: p.fileName,
      createdAt: new Date().toISOString(),
    };
    saveRubricsStore({ rubrics: [r], activeId: id });
    return true;
  } catch {
    return false;
  }
}

function parseRubricCsvToCategories(csvText: string): string[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const firstCol = lines.map((line) => {
    const cell = line.split(/,|\t|;/)[0] ?? "";
    return cell.replace(/^["']|["']$/g, "").trim();
  });
  return firstCol
    .map((v) => v.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((v) => v.length > 0)
    .filter(
      (v) => v.toLowerCase() !== "category" && v.toLowerCase() !== "categories",
    );
}

function parseRubricRowsToCategories(rows: unknown[][]): string[] {
  return rows
    .map((r) => {
      const v = (r?.[0] ?? "") as unknown;
      return String(v)
        .replace(/^["']|["']$/g, "")
        .trim();
    })
    .map((v) => v.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((v) => v.length > 0)
    .filter(
      (v) => v.toLowerCase() !== "category" && v.toLowerCase() !== "categories",
    );
}

/**
 * Parse a rubric file (CSV or Excel), append to qa-rubrics, set as active,
 * write qa-rubric-file, and dispatch rubric-updated.
 * Use from Dashboard and QA page so uploads are always persisted.
 */
export async function persistRubricFromFile(
  file: File,
): Promise<{ saved: SavedRubric; categories: string[] } | { error: string }> {
  if (typeof window === "undefined" || !window.localStorage) {
    return { error: "Storage is not available." };
  }

  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv") || file.type === "text/csv";
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

  if (!isCsv && !isExcel) {
    return {
      error: "Please upload an Excel file (.xlsx) or CSV export (.csv).",
    };
  }

  let categories: string[] = [];

  if (isCsv) {
    try {
      const text = await file.text();
      categories = parseRubricCsvToCategories(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `Could not read CSV: ${msg}` };
    }
  } else {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: "array" });
      const sheetName = workbook.SheetNames?.[0];
      const sheet = sheetName ? workbook.Sheets?.[sheetName] : null;
      const rows = sheet
        ? (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][])
        : [];
      categories = parseRubricRowsToCategories(rows);
    } catch (e) {
      if (e && typeof (e as { message?: string }).message === "string") {
        const m = (e as { message: string }).message;
        if (/Failed to fetch|import|xlsx/i.test(m)) {
          return {
            error:
              "To use .xlsx files, ensure the `xlsx` package is installed, or export as CSV.",
          };
        }
      }
      return {
        error:
          "To upload .xlsx files, install the `xlsx` package or export the file as CSV (.csv).",
      };
    }
  }

  if (categories.length === 0) {
    return {
      error:
        "No categories found. Put category names in the first column and try again.",
    };
  }

  const rubricName =
    file.name.replace(/\.(csv|xlsx|xls)$/i, "").trim() || "Uploaded rubric";
  const id = crypto.randomUUID();
  const saved: SavedRubric = {
    id,
    name: rubricName,
    categories,
    fileName: file.name,
    createdAt: new Date().toISOString(),
  };

  const next = loadRubricsStore();
  const rubrics = [...next.rubrics, saved];
  const store: RubricsStore = { rubrics, activeId: id };

  try {
    saveRubricsStore(store);
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return {
        error: "Storage is full. Please free some space and try again.",
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Could not save rubric: ${msg}` };
  }

  try {
    localStorage.setItem(
      "qa-rubric-file",
      JSON.stringify({ categories, fileName: file.name }),
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return {
        error: "Storage is full. Please free some space and try again.",
      };
    }
    // qa-rubrics was saved; best-effort to write qa-rubric-file
    const msg = e instanceof Error ? e.message : String(e);
    return {
      error: `Rubric saved to library but could not set active: ${msg}`,
    };
  }

  window.dispatchEvent(new Event("rubric-updated"));
  return { saved, categories };
}
