"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFindingsFromResponse = parseFindingsFromResponse;
function parseJsonArray(text) {
    const trimmed = text.trim();
    const withoutMarkdown = trimmed
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
    const parsed = JSON.parse(withoutMarkdown);
    return Array.isArray(parsed) ? parsed : [];
}
function normalizeSeverity(s) {
    const str = String(s).toLowerCase();
    return str === "error" ? "error" : "warning";
}
function parseFindingsFromResponse(responseText, filePath) {
    const findings = [];
    try {
        const raw = parseJsonArray(responseText);
        for (const r of raw) {
            const line = typeof r.line === "number" && r.line >= 1 ? r.line : 1;
            const severity = normalizeSeverity(r.severity ?? "warning");
            const message = typeof r.message === "string" && r.message.trim()
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
    }
    catch {
        // Return empty on parse failure
    }
    return findings;
}
//# sourceMappingURL=parse-findings.js.map