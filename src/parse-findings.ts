import type { Finding, FindingSeverity } from "./types";

interface RawFinding {
  line?: number;
  severity?: string;
  message?: string;
  code?: string;
}

function parseJsonArray(text: string): RawFinding[] {
  const trimmed = text.trim();
  const withoutMarkdown = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(withoutMarkdown);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeSeverity(s: unknown): FindingSeverity {
  const str = String(s).toLowerCase();
  return str === "error" ? "error" : "warning";
}

export function parseFindingsFromResponse(
  responseText: string,
  filePath: string
): Finding[] {
  const findings: Finding[] = [];
  try {
    const raw = parseJsonArray(responseText);
    for (const r of raw) {
      const line = typeof r.line === "number" && r.line >= 1 ? r.line : 1;
      const severity = normalizeSeverity(r.severity ?? "warning");
      const message =
        typeof r.message === "string" && r.message.trim()
          ? r.message.trim()
          : "Accessibility issue";
      findings.push({
        file: filePath,
        line,
        severity,
        message,
        code: typeof r.code === "string" ? r.code : undefined,
      });
    }
  } catch {
    // Return empty on parse failure
  }
  return findings;
}
