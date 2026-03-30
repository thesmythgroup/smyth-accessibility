import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const { execSyncMock } = vi.hoisted(() => ({
  execSyncMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execSync: (...args: unknown[]) =>
    execSyncMock(...args) as string | Buffer,
}));

import { resolveFilesToAnalyze } from "./file-resolver";

describe("resolveFilesToAnalyze", () => {
  let workspaceRoot: string;
  let mockPrDiffFiles: string[];
  let mockLsFiles: string[];

  beforeEach(() => {
    mockPrDiffFiles = [];
    mockLsFiles = [];

    workspaceRoot = mkdtempSync(join(tmpdir(), "file-resolver-"));
    mkdirSync(join(workspaceRoot, "src", "components"), { recursive: true });
    mkdirSync(join(workspaceRoot, "styles"), { recursive: true });
    mkdirSync(join(workspaceRoot, "docs"), { recursive: true });

    writeFileSync(join(workspaceRoot, "src", "App.tsx"), "export {};\n");
    writeFileSync(join(workspaceRoot, "src", "utils.ts"), "export const x = 1;\n");
    writeFileSync(
      join(workspaceRoot, "src", "components", "Box.tsx"),
      "export {};\n"
    );
    writeFileSync(join(workspaceRoot, "README.md"), "# doc\n");
    writeFileSync(join(workspaceRoot, "styles", "app.css"), "body {}\n");
    writeFileSync(join(workspaceRoot, "docs", "page.md"), "x\n");

    execSyncMock.mockReset();
    execSyncMock.mockImplementation((cmd: string) => {
      if (cmd.includes("git diff --name-only")) {
        return (
          mockPrDiffFiles.join("\n") + (mockPrDiffFiles.length ? "\n" : "")
        );
      }
      if (cmd.trim().startsWith("git ls-files")) {
        return mockLsFiles.join("\n") + (mockLsFiles.length ? "\n" : "");
      }
      throw new Error(`unexpected execSync command: ${cmd}`);
    });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  describe("scope pr (getPrChangedFiles)", () => {
    it("includes only changed paths that match glob patterns", async () => {
      mockPrDiffFiles = [
        "src/App.tsx",
        "README.md",
        "src/utils.ts",
      ];
      const result = await resolveFilesToAnalyze(
        "pr",
        ["**/*.{ts,tsx}"],
        "origin/main",
        workspaceRoot
      );
      expect(result.sort()).toEqual(
        ["src/App.tsx", "src/utils.ts"].sort()
      );
      expect(execSyncMock).toHaveBeenCalledWith(
        "git diff --name-only origin/main...HEAD",
        expect.objectContaining({ cwd: workspaceRoot, encoding: "utf-8" })
      );
      expect(
        execSyncMock.mock.calls.some((c) => String(c[0]).includes("git ls-files"))
      ).toBe(false);
    });

    it("uses HEAD^ when baseRef is empty", async () => {
      mockPrDiffFiles = ["src/App.tsx"];
      await resolveFilesToAnalyze("pr", ["**/*.tsx"], "", workspaceRoot);
      expect(execSyncMock).toHaveBeenCalledWith(
        "git diff --name-only HEAD^...HEAD",
        expect.objectContaining({ cwd: workspaceRoot })
      );
    });

    it("excludes changed files that do not match any pattern", async () => {
      mockPrDiffFiles = ["README.md", "styles/app.css"];
      const result = await resolveFilesToAnalyze(
        "pr",
        ["**/*.{ts,tsx}"],
        "HEAD^",
        workspaceRoot
      );
      expect(result).toEqual([]);
    });

    it("matches nested paths from the diff", async () => {
      mockPrDiffFiles = ["src/components/Box.tsx"];
      const result = await resolveFilesToAnalyze(
        "pr",
        ["**/*.tsx"],
        "main",
        workspaceRoot
      );
      expect(result).toEqual(["src/components/Box.tsx"]);
    });

    it("excludes paths in the diff that are not on disk", async () => {
      mockPrDiffFiles = ["src/deleted-only.ts"];
      const result = await resolveFilesToAnalyze(
        "pr",
        ["**/*.ts"],
        "HEAD^",
        workspaceRoot
      );
      expect(result).toEqual([]);
    });
  });

  describe("scope full (getFullRepoFiles)", () => {
    it("includes tracked paths that match glob patterns", async () => {
      mockLsFiles = [
        "src/App.tsx",
        "README.md",
        "src/utils.ts",
        "styles/app.css",
      ];
      const result = await resolveFilesToAnalyze(
        "full",
        ["**/*.{ts,tsx}"],
        "",
        workspaceRoot
      );
      expect(result.sort()).toEqual(
        ["src/App.tsx", "src/utils.ts"].sort()
      );
      expect(execSyncMock).toHaveBeenCalledWith(
        "git ls-files",
        expect.objectContaining({ cwd: workspaceRoot, encoding: "utf-8" })
      );
      expect(
        execSyncMock.mock.calls.some((c) =>
          String(c[0]).includes("git diff")
        )
      ).toBe(false);
    });

    it("applies multiple glob patterns", async () => {
      mockLsFiles = ["src/App.tsx", "styles/app.css", "README.md"];
      const result = await resolveFilesToAnalyze(
        "full",
        ["**/*.tsx", "**/*.css"],
        "",
        workspaceRoot
      );
      expect(result.sort()).toEqual(["src/App.tsx", "styles/app.css"].sort());
    });

    it("excludes ls-files entries that do not match globs", async () => {
      mockLsFiles = ["README.md", "docs/page.md"];
      const result = await resolveFilesToAnalyze(
        "full",
        ["**/*.{ts,tsx}"],
        "",
        workspaceRoot
      );
      expect(result).toEqual([]);
    });

    it("excludes ls-files paths with no on-disk file for the glob (unmatched by scan)", async () => {
      mockLsFiles = ["src/utils.ts", "phantom/only-in-git.ts"];
      const result = await resolveFilesToAnalyze(
        "full",
        ["**/*.ts"],
        "",
        workspaceRoot
      );
      expect(result).toEqual(["src/utils.ts"]);
    });
  });
});
