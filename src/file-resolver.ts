import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { glob } from "node:fs/promises";
import { join } from "node:path";
import type { Scope } from "./types";

function normalizeRepoPath(p: string): string {
  return p.replace(/\\/g, "/");
}

async function collectGlobMatches(
  patterns: string[],
  cwd: string
): Promise<Set<string>> {
  const set = new Set<string>();
  for await (const rel of glob(patterns, { cwd })) {
    set.add(normalizeRepoPath(String(rel)));
  }
  return set;
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

export async function resolveFilesToAnalyze(
  scope: Scope,
  filePatterns: string[],
  baseRef: string,
  workspaceRoot: string
): Promise<string[]> {
  const globMatched = await collectGlobMatches(filePatterns, workspaceRoot);
  const rawPaths =
    scope === "pr"
      ? getPrChangedFiles(baseRef, workspaceRoot)
      : getFullRepoFiles(workspaceRoot);
  const filtered = rawPaths.filter((path) =>
    globMatched.has(normalizeRepoPath(path))
  );
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
