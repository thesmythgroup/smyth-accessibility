import { describe, it, expect } from "vitest";
import { buildAnalysisPrompt } from "./prompts";

describe("buildAnalysisPrompt", () => {
  it("includes filePath and content in the prompt", () => {
    const filePath = "src/App.tsx";
    const content = "<button>Click</button>";
    const result = buildAnalysisPrompt(filePath, content, "wcag-aa");
    expect(result).toContain("File: src/App.tsx");
    expect(result).toContain("<button>Click</button>");
  });

  it("includes WCAG level text for wcag-a", () => {
    const result = buildAnalysisPrompt("x.html", "body", "wcag-a");
    expect(result).toContain("WCAG 2.1 Level A");
    expect(result).toContain("text alternatives");
  });

  it("includes WCAG level text for wcag-aa", () => {
    const result = buildAnalysisPrompt("x.html", "body", "wcag-aa");
    expect(result).toContain("WCAG 2.1 Level AA");
    expect(result).toContain("contrast");
  });

  it("includes WCAG level text for wcag-aaa", () => {
    const result = buildAnalysisPrompt("x.html", "body", "wcag-aaa");
    expect(result).toContain("WCAG 2.1 Level AAA");
    expect(result).toContain("enhanced contrast");
  });

  it("includes WCAG level text for custom", () => {
    const result = buildAnalysisPrompt("x.html", "body", "custom");
    expect(result).toContain("General accessibility best practices");
    expect(result).toContain("semantic HTML/ARIA");
  });

  it("includes required structure: JSON array, line, severity", () => {
    const result = buildAnalysisPrompt("x.tsx", "code", "wcag-aa");
    expect(result).toContain("JSON array");
    expect(result).toContain("line");
    expect(result).toContain("severity");
    expect(result).toContain("message");
    expect(result).toContain("error");
    expect(result).toContain("warning");
  });
});
