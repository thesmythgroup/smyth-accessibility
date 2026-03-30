import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Finding } from "./types";

const coreMocks = vi.hoisted(() => ({
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("@actions/core", () => ({
  setOutput: coreMocks.setOutput,
  setFailed: coreMocks.setFailed,
  error: coreMocks.error,
  warning: coreMocks.warning,
}));

import { buildSummaryMarkdown, reportFindings } from "./report";

describe("buildSummaryMarkdown", () => {
  it("returns table with zeros and no Findings by file section when empty", () => {
    const result = buildSummaryMarkdown([]);
    expect(result).toContain("## Smyth Accessibility – First-pass results");
    expect(result).toContain("| Error    | 0 |");
    expect(result).toContain("| Warning  | 0 |");
    expect(result).toContain("| **Total** | **0** |");
    expect(result).not.toContain("### Findings by file");
  });

  it("returns correct counts and one file section for one file with multiple findings", () => {
    const findings: Finding[] = [
      { file: "a.tsx", line: 5, severity: "error", message: "Missing alt" },
      { file: "a.tsx", line: 10, severity: "warning", message: "Low contrast" },
    ];
    const result = buildSummaryMarkdown(findings);
    expect(result).toContain("| Error    | 1 |");
    expect(result).toContain("| Warning  | 1 |");
    expect(result).toContain("| **Total** | **2** |");
    expect(result).toContain("### Findings by file");
    expect(result).toContain("- **a.tsx**");
    expect(result).toContain("L5 [error]: Missing alt");
    expect(result).toContain("L10 [warning]: Low contrast");
  });

  it("groups multiple files and lists findings per file", () => {
    const findings: Finding[] = [
      { file: "b.html", line: 1, severity: "warning", message: "W1" },
      { file: "a.tsx", line: 2, severity: "error", message: "E1" },
      { file: "b.html", line: 3, severity: "warning", message: "W2" },
    ];
    const result = buildSummaryMarkdown(findings);
    expect(result).toContain("- **a.tsx**");
    expect(result).toContain("- **b.html**");
    expect(result).toContain("L2 [error]: E1");
    expect(result).toContain("L1 [warning]: W1");
    expect(result).toContain("L3 [warning]: W2");
  });
});

describe("reportFindings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets outputs and never calls setFailed when failOn is none", () => {
    const findings: Finding[] = [
      { file: "x.tsx", line: 1, severity: "error", message: "E" },
      { file: "x.tsx", line: 2, severity: "warning", message: "W" },
    ];
    reportFindings(findings, "none");
    expect(coreMocks.setOutput).toHaveBeenCalledWith("findings-count", "2");
    expect(coreMocks.setOutput).toHaveBeenCalledWith("has-errors", "true");
    expect(coreMocks.setOutput).toHaveBeenCalledWith("has-warnings", "true");
    expect(coreMocks.setFailed).not.toHaveBeenCalled();
  });

  it("calls setFailed when failOn is warn and there are errors or warnings", () => {
    const withError: Finding[] = [
      { file: "x.tsx", line: 1, severity: "error", message: "E" },
    ];
    reportFindings(withError, "warn");
    expect(coreMocks.setFailed).toHaveBeenCalled();

    vi.clearAllMocks();
    const withWarning: Finding[] = [
      { file: "x.tsx", line: 1, severity: "warning", message: "W" },
    ];
    reportFindings(withWarning, "warn");
    expect(coreMocks.setFailed).toHaveBeenCalled();
  });

  it("calls setFailed only when there are errors when failOn is error", () => {
    const withError: Finding[] = [
      { file: "x.tsx", line: 1, severity: "error", message: "E" },
    ];
    reportFindings(withError, "error");
    expect(coreMocks.setFailed).toHaveBeenCalled();

    vi.clearAllMocks();
    const onlyWarnings: Finding[] = [
      { file: "x.tsx", line: 1, severity: "warning", message: "W" },
    ];
    reportFindings(onlyWarnings, "error");
    expect(coreMocks.setFailed).not.toHaveBeenCalled();
  });

  it("sets has-errors and has-warnings to false when no findings", () => {
    reportFindings([], "warn");
    expect(coreMocks.setOutput).toHaveBeenCalledWith("findings-count", "0");
    expect(coreMocks.setOutput).toHaveBeenCalledWith("has-errors", "false");
    expect(coreMocks.setOutput).toHaveBeenCalledWith("has-warnings", "false");
  });
});
