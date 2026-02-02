import { describe, it, expect } from "vitest";
import { parseFindingsFromResponse } from "./parse-findings";

describe("parseFindingsFromResponse", () => {
  const filePath = "src/Example.tsx";

  it("returns empty array for empty JSON array", () => {
    const result = parseFindingsFromResponse("[]", filePath);
    expect(result).toEqual([]);
  });

  it("parses valid JSON array into Finding[] with file, line, severity, message", () => {
    const json = `[
      {"line": 5, "severity": "error", "message": "Missing alt on image"},
      {"line": 10, "severity": "warning", "message": "Low contrast"}
    ]`;
    const result = parseFindingsFromResponse(json, filePath);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      file: filePath,
      line: 5,
      severity: "error",
      message: "Missing alt on image",
      code: undefined,
    });
    expect(result[1]).toEqual({
      file: filePath,
      line: 10,
      severity: "warning",
      message: "Low contrast",
      code: undefined,
    });
  });

  it("includes optional code when present", () => {
    const json = `[{"line": 1, "severity": "warning", "message": "Issue", "code": "WCAG2.1.G94"}]`;
    const result = parseFindingsFromResponse(json, filePath);
    expect(result[0].code).toBe("WCAG2.1.G94");
  });

  it("strips markdown-wrapped JSON and parses", () => {
    const wrapped =
      '```json\n[{"line": 2, "severity": "error", "message": "Bad"}]\n```';
    const result = parseFindingsFromResponse(wrapped, filePath);
    expect(result).toHaveLength(1);
    expect(result[0].line).toBe(2);
    expect(result[0].severity).toBe("error");
    expect(result[0].message).toBe("Bad");
  });

  it("handles markdown code block with only ``` (no json label)", () => {
    const wrapped =
      '```\n[{"line": 3, "severity": "warning", "message": "Ok"}]\n```';
    const result = parseFindingsFromResponse(wrapped, filePath);
    expect(result).toHaveLength(1);
    expect(result[0].line).toBe(3);
  });

  it("returns empty array for malformed JSON", () => {
    const result = parseFindingsFromResponse("{ not valid }", filePath);
    expect(result).toEqual([]);
  });

  it("returns empty array for non-array JSON (object)", () => {
    const result = parseFindingsFromResponse('{"key": "value"}', filePath);
    expect(result).toEqual([]);
  });

  it("normalizes severity: 'error' and 'ERROR' become error", () => {
    const json = `[
      {"line": 1, "severity": "error", "message": "E"},
      {"line": 2, "severity": "ERROR", "message": "E2"}
    ]`;
    const result = parseFindingsFromResponse(json, filePath);
    expect(result[0].severity).toBe("error");
    expect(result[1].severity).toBe("error");
  });

  it("normalizes severity: anything else becomes warning", () => {
    const json = `[
      {"line": 1, "severity": "warning", "message": "W"},
      {"line": 2, "severity": "WARNING", "message": "W2"},
      {"line": 3, "severity": "info", "message": "I"},
      {"line": 4, "message": "No severity"}
    ]`;
    const result = parseFindingsFromResponse(json, filePath);
    expect(result.every((f) => f.severity === "warning")).toBe(true);
  });

  it("defaults missing or invalid line to 1", () => {
    const json = `[
      {"severity": "warning", "message": "No line"},
      {"line": 0, "severity": "warning", "message": "Zero"},
      {"line": -1, "severity": "warning", "message": "Negative"}
    ]`;
    const result = parseFindingsFromResponse(json, filePath);
    expect(result[0].line).toBe(1);
    expect(result[1].line).toBe(1);
    expect(result[2].line).toBe(1);
  });

  it("defaults missing or empty message to 'Accessibility issue'", () => {
    const json = `[
      {"line": 1, "severity": "warning"},
      {"line": 2, "severity": "warning", "message": ""},
      {"line": 3, "severity": "warning", "message": "   "}
    ]`;
    const result = parseFindingsFromResponse(json, filePath);
    expect(result[0].message).toBe("Accessibility issue");
    expect(result[1].message).toBe("Accessibility issue");
    expect(result[2].message).toBe("Accessibility issue");
  });

  it("uses filePath for every finding", () => {
    const json = `[{"line": 1, "severity": "warning", "message": "X"}]`;
    const result = parseFindingsFromResponse(json, "other/file.html");
    expect(result[0].file).toBe("other/file.html");
  });
});
