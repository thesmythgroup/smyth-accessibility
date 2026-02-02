import type { AcceptabilityLevel } from "./types";

const WCAG_BRIEF: Record<AcceptabilityLevel, string> = {
  "wcag-a": "WCAG 2.1 Level A (minimum: text alternatives, keyboard, etc.)",
  "wcag-aa": "WCAG 2.1 Level AA (contrast, labels, focus, etc.)",
  "wcag-aaa": "WCAG 2.1 Level AAA (enhanced contrast, sign language, etc.)",
  custom: "General accessibility best practices and semantic HTML/ARIA",
};

export function buildAnalysisPrompt(
  filePath: string,
  content: string,
  acceptabilityLevel: AcceptabilityLevel
): string {
  const levelBrief = WCAG_BRIEF[acceptabilityLevel];
  return `You are an accessibility auditor. Analyze the following web-related code for accessibility issues at: ${levelBrief}.

File: ${filePath}

\`\`\`
${content}
\`\`\`

Respond with a JSON array of findings only. Each finding must have:
- "line": number (1-based line in the file)
- "severity": "error" or "warning"
- "message": short description
- "code": optional snippet or rule id

If there are no issues, respond with: []

Output (JSON array only, no markdown):`;
}
