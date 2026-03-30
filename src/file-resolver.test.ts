import { describe, it, expect } from "vitest";
import { parseFilePatterns, filterPathsByPatterns } from "./file-resolver";

describe("parseFilePatterns", () => {
  it("returns default web extensions when input is empty", () => {
    const result = parseFilePatterns("");
    expect(result).toContain("*.html");
    expect(result).toContain("*.tsx");
    expect(result).toContain("*.jsx");
    expect(result).toContain("*.vue");
    expect(result).toContain("*.css");
  });

  it("returns default web extensions when input is whitespace only", () => {
    const result = parseFilePatterns("   \n  ");
    expect(result).toContain("*.html");
  });

  it("parses comma-separated patterns and trims", () => {
    const result = parseFilePatterns("*.tsx, *.jsx , *.html");
    expect(result).toEqual(["*.tsx", "*.jsx", "*.html"]);
  });

  it("filters out empty segments", () => {
    const result = parseFilePatterns("*.tsx,,*.html,");
    expect(result).toEqual(["*.tsx", "*.html"]);
  });
});

describe("filterPathsByPatterns", () => {
  const paths = [
    "src/App.tsx",
    "src/App.jsx",
    "lib/utils.js",
    "index.html",
    "styles/main.css",
    "README.md",
  ];

  it("filters by extension patterns", () => {
    const result = filterPathsByPatterns(paths, "*.tsx,*.jsx");
    expect(result).toContain("src/App.tsx");
    expect(result).toContain("src/App.jsx");
    expect(result).not.toContain("lib/utils.js");
    expect(result).not.toContain("index.html");
    expect(result).not.toContain("styles/main.css");
    expect(result).not.toContain("README.md");
  });

  it("matches extension case-insensitively", () => {
    const result = filterPathsByPatterns(
      ["page.HTML", "page.htm"],
      "*.html,*.htm"
    );
    expect(result).toContain("page.HTML");
    expect(result).toContain("page.htm");
  });

  it("uses default web patterns when patternInput is empty", () => {
    const result = filterPathsByPatterns(paths, "");
    expect(result).toContain("src/App.tsx");
    expect(result).toContain("src/App.jsx");
    expect(result).toContain("index.html");
    expect(result).toContain("styles/main.css");
    expect(result).not.toContain("lib/utils.js");
    expect(result).not.toContain("README.md");
  });

  it("returns empty array when no paths match", () => {
    const result = filterPathsByPatterns(paths, "*.py,*.rb");
    expect(result).toEqual([]);
  });
});
