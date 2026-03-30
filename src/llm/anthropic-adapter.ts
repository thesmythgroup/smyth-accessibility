import Anthropic from "@anthropic-ai/sdk";
import { buildAnalysisPrompt } from "../prompts";
import { parseFindingsFromResponse } from "../parse-findings";
import { delay, DELAY_BETWEEN_REQUESTS_MS } from "./delay";
import { withRetry } from "./retry";
import type { AcceptabilityLevel } from "../types";
import type { FileToAnalyze } from "../types";
import type { Finding } from "../types";

const MAX_TOKENS = 4096;

export async function analyzeWithAnthropic(
  apiKey: string,
  model: string,
  files: FileToAnalyze[],
  acceptabilityLevel: AcceptabilityLevel
): Promise<Finding[]> {
  const client = new Anthropic({ apiKey });
  const allFindings: Finding[] = [];

  for (let i = 0; i < files.length; i++) {
    if (i > 0) {
      await delay(DELAY_BETWEEN_REQUESTS_MS);
    }
    const { path, content } = files[i];
    const truncated =
      content.length > 12000
        ? content.slice(0, 12000) + "\n/* ... truncated */"
        : content;
    const prompt = buildAnalysisPrompt(path, truncated, acceptabilityLevel);
    const response = await withRetry(() =>
      client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      })
    );
    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const findings = parseFindingsFromResponse(text, path);
    allFindings.push(...findings);
  }

  return allFindings;
}
