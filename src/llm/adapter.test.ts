import { describe, it, expect } from "vitest";
import { analyze } from "./adapter";
import type { FileToAnalyze, Provider } from "../types";

const emptyFiles: FileToAnalyze[] = [];

describe("analyze", () => {
  it("throws when provider is openai and openaiApiKey is missing", async () => {
    await expect(
      analyze({
        provider: "openai",
        model: "gpt-4o",
        files: emptyFiles,
        acceptabilityLevel: "wcag-aa",
      })
    ).rejects.toThrow(/OPENAI_API_KEY is required/);
  });

  it("throws when provider is anthropic and anthropicApiKey is missing", async () => {
    await expect(
      analyze({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
        files: emptyFiles,
        acceptabilityLevel: "wcag-aa",
      })
    ).rejects.toThrow(/ANTHROPIC_API_KEY is required/);
  });

  it("throws for unknown provider", async () => {
    await expect(
      analyze({
        provider: "unknown" as Provider,
        model: "x",
        files: emptyFiles,
        acceptabilityLevel: "wcag-aa",
      })
    ).rejects.toThrow(/Unknown provider/);
  });
});
