import type { Finding, FailOn } from "./types";
export declare function reportFindings(findings: Finding[], failOn: FailOn): void;
export declare function buildSummaryMarkdown(findings: Finding[]): string;
export declare function setJobSummary(summaryMarkdown: string): void;
export declare function postPrCommentIfRequested(summaryMarkdown: string, postPrComment: boolean, githubTokenInput: string): Promise<void>;
