"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFilesToAnalyze = resolveFilesToAnalyze;
exports.readFileContents = readFileContents;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
function normalizeRepoPath(p) {
    return p.replace(/\\/g, "/");
}
async function collectGlobMatches(patterns, cwd) {
    const set = new Set();
    for await (const rel of (0, promises_1.glob)(patterns, { cwd })) {
        set.add(normalizeRepoPath(String(rel)));
    }
    return set;
}
function getPrChangedFiles(baseRef, cwd) {
    const ref = baseRef || "HEAD^";
    const out = (0, node_child_process_1.execSync)(`git diff --name-only ${ref}...HEAD`, {
        encoding: "utf-8",
        cwd,
    });
    return out
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
}
function getFullRepoFiles(cwd) {
    const out = (0, node_child_process_1.execSync)("git ls-files", { encoding: "utf-8", cwd });
    return out
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
}
async function resolveFilesToAnalyze(scope, filePatterns, baseRef, workspaceRoot) {
    const globMatched = await collectGlobMatches(filePatterns, workspaceRoot);
    const rawPaths = scope === "pr"
        ? getPrChangedFiles(baseRef, workspaceRoot)
        : getFullRepoFiles(workspaceRoot);
    const filtered = rawPaths.filter((path) => globMatched.has(normalizeRepoPath(path)));
    return filtered.filter((path) => {
        const fullPath = (0, node_path_1.join)(workspaceRoot, path);
        return (0, node_fs_1.existsSync)(fullPath);
    });
}
function readFileContents(paths, workspaceRoot) {
    const result = [];
    for (const path of paths) {
        const fullPath = (0, node_path_1.join)(workspaceRoot, path);
        try {
            const content = (0, node_fs_1.readFileSync)(fullPath, "utf-8");
            result.push({ path, content });
        }
        catch {
            // Skip unreadable files
        }
    }
    return result;
}
//# sourceMappingURL=file-resolver.js.map