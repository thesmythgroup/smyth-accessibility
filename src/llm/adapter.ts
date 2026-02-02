import type { Finding } from "../types";
import type { FileToAnalyze } from "../types";
import type { AcceptabilityLevel } from "../types";
import type { Provider } from "../types";
import { analyzeWithOpenAI } from "./openai-adapter";
import { analyzeWithAnthropic } from "./anthropic-adapter";

export type AnalyzeOptions = {
  provider: Provider;
  model: string;
  files: FileToAnalyze[];
  acceptabilityLevel: AcceptabilityLevel;
  openaiApiKey?: string;
  anthropicApiKey?: string;
};

export async function analyze(options: AnalyzeOptions): Promise<Finding[]> {
  const { provider, model, files, acceptabilityLevel } = options;

  if (provider === "openai") {
    const key = options.openaiApiKey;
    if (!key) {
      throw new Error("OPENAI_API_KEY is required when provider is openai");
    }
    return analyzeWithOpenAI(key, model, files, acceptabilityLevel);
  }

  if (provider === "anthropic") {
    const key = options.anthropicApiKey;
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY is required when provider is anthropic"
      );
    }
    return analyzeWithAnthropic(key, model, files, acceptabilityLevel);
  }

  throw new Error(`Unknown provider: ${provider}`);
}
