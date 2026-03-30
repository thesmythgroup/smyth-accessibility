import type { Scope } from "./types";
export declare function resolveFilesToAnalyze(scope: Scope, filePatterns: string[], baseRef: string, workspaceRoot: string): Promise<string[]>;
export declare function readFileContents(paths: string[], workspaceRoot: string): {
    path: string;
    content: string;
}[];
