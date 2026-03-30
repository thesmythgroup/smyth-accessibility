export type Scope = "pr" | "full";
export type Provider = "openai" | "anthropic";
export type AcceptabilityLevel = "wcag-a" | "wcag-aa" | "wcag-aaa" | "custom";
export type FailOn = "none" | "warn" | "error";

export type FindingSeverity = "error" | "warning";

export interface Finding {
  file: string;
  line: number;
  severity: FindingSeverity;
  message: string;
  code?: string;
}

export interface ActionConfig {
  scope: Scope;
  provider: Provider;
  model: string;
  acceptabilityLevel: AcceptabilityLevel;
  filePatterns: string[];
  baseRef: string;
  failOn: FailOn;
  postPrComment: boolean;
  githubToken: string;
}

export interface FileToAnalyze {
  path: string;
  content: string;
}
