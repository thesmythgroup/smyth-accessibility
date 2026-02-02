import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Scope } from "./types";

const DEFAULT_WEB_EXTENSIONS = [
  ".html",
  ".htm",
  ".tsx",
  ".jsx",
  ".vue",
  ".svelte",
  ".css",
  ".scss",
  ".less",
];

function getDefaultPatterns(): string[] {
  return DEFAULT_WEB_EXTENSIONS.map((ext) => `*${ext}`);
}

function parseFilePatterns(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return getDefaultPatterns();
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function extensionMatches(path: string, patterns: string[]): boolean {
  const lower = path.toLowerCase();
  const matches = patterns.some((p) => {
    if (p.startsWith("*.")) {
      const ext = p.slice(1);
      return lower.endsWith(ext);
    }
    if (p.includes("*")) {
      const re = new RegExp(
        "^" + p.replace(/\*/g, ".*").replace(/\./g, "\\.") + "$"
      );
      return re.test(path);
    }
    return path === p || path.endsWith(p);
  });
  return matches;
}

function filterByPatterns(paths: string[], patterns: string[]): string[] {
  return paths.filter((path) => extensionMatches(path, patterns));
}

function getPrChangedFiles(baseRef: string, cwd: string): string[] {
  const ref = baseRef || "HEAD^";
  const out = execSync(`git diff --name-only ${ref}...HEAD`, {
    encoding: "utf-8",
    cwd,
  });
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getFullRepoFiles(cwd: string): string[] {
  const out = execSync("git ls-files", { encoding: "utf-8", cwd });
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveFilesToAnalyze(
  scope: Scope,
  filePatternsInput: string,
  baseRef: string,
  workspaceRoot: string
): string[] {
  const patterns = parseFilePatterns(filePatternsInput);
  const rawPaths =
    scope === "pr"
      ? getPrChangedFiles(baseRef, workspaceRoot)
      : getFullRepoFiles(workspaceRoot);
  const filtered = filterByPatterns(rawPaths, patterns);
  return filtered.filter((path) => {
    const fullPath = join(workspaceRoot, path);
    return existsSync(fullPath);
  });
}

export function readFileContents(
  paths: string[],
  workspaceRoot: string
): { path: string; content: string }[] {
  const result: { path: string; content: string }[] = [];
  for (const path of paths) {
    const fullPath = join(workspaceRoot, path);
    try {
      const content = readFileSync(fullPath, "utf-8");
      result.push({ path, content });
    } catch {
      // Skip unreadable files
    }
  }
  return result;
}
