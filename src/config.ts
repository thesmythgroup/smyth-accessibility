import * as core from "@actions/core";
import * as github from "@actions/github";
import type {
  ActionConfig,
  Scope,
  Provider,
  AcceptabilityLevel,
  FailOn,
} from "./types";

/** Must match `file-patterns` default in action.yml. */
const DEFAULT_FILE_PATTERNS_JSON =
  '["**/*.{html,htm,tsx,jsx,vue,svelte,css,scss,less}"]';

const VALID_SCOPES: Scope[] = ["pr", "full"];
const VALID_PROVIDERS: Provider[] = ["openai", "anthropic"];
const VALID_ACCEPTABILITY: AcceptabilityLevel[] = [
  "wcag-a",
  "wcag-aa",
  "wcag-aaa",
  "custom",
];
const VALID_FAIL_ON: FailOn[] = ["none", "warn", "error"];

function parseScope(value: string): Scope {
  const lower = value.toLowerCase().trim();
  if (VALID_SCOPES.includes(lower as Scope)) {
    return lower as Scope;
  }
  throw new Error(
    `Invalid scope: ${value}. Must be one of: ${VALID_SCOPES.join(", ")}`
  );
}

function parseProvider(value: string): Provider {
  const lower = value.toLowerCase().trim();
  if (VALID_PROVIDERS.includes(lower as Provider)) {
    return lower as Provider;
  }
  throw new Error(
    `Invalid provider: ${value}. Must be one of: ${VALID_PROVIDERS.join(", ")}`
  );
}

function parseAcceptabilityLevel(value: string): AcceptabilityLevel {
  const lower = value.toLowerCase().trim();
  if (VALID_ACCEPTABILITY.includes(lower as AcceptabilityLevel)) {
    return lower as AcceptabilityLevel;
  }
  throw new Error(
    `Invalid acceptability-level: ${value}. Must be one of: ${VALID_ACCEPTABILITY.join(
      ", "
    )}`
  );
}

function parseFailOn(value: string): FailOn {
  const lower = value.toLowerCase().trim();
  if (VALID_FAIL_ON.includes(lower as FailOn)) {
    return lower as FailOn;
  }
  return "warn";
}

function parseFilePatternsInput(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return parseFilePatternsInput(DEFAULT_FILE_PATTERNS_JSON);
  }
  if (trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      throw new Error(
        'Invalid file-patterns: could not parse JSON array (e.g. ["apps/web/**/*.tsx"])'
      );
    }
    if (!Array.isArray(parsed)) {
      throw new Error(
        'file-patterns: when using JSON, value must be an array of glob strings'
      );
    }
    const out = parsed
      .map((x) => String(x).trim())
      .filter(Boolean);
    if (out.length === 0) {
      return parseFilePatternsInput(DEFAULT_FILE_PATTERNS_JSON);
    }
    return out;
  }
  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return parseFilePatternsInput(DEFAULT_FILE_PATTERNS_JSON);
  }
  return lines;
}

function getBaseRefFromContext(): string {
  const payload = github.context.payload;
  const pr = payload.pull_request as { base?: { sha?: string } } | undefined;
  const baseSha = pr?.base?.sha;
  if (typeof baseSha === "string" && baseSha) {
    return baseSha;
  }
  return "HEAD^";
}

export function getConfig(): ActionConfig {
  const scopeRaw = core.getInput("scope", { required: true });
  const providerRaw = core.getInput("provider", { required: true });
  const model = core.getInput("model", { required: true }).trim();
  const acceptabilityLevelRaw =
    core.getInput("acceptability-level") || "wcag-aa";
  const filePatternsRaw = core.getInput("file-patterns");
  const filePatterns = parseFilePatternsInput(filePatternsRaw);
  const baseRefInput = core.getInput("base-ref").trim();
  const failOnRaw = core.getInput("fail-on") || "warn";
  const postPrCommentRaw = core.getInput("post-pr-comment") || "false";
  const githubToken = core.getInput("github-token").trim();

  const scope = parseScope(scopeRaw);
  const provider = parseProvider(providerRaw);
  const acceptabilityLevel = parseAcceptabilityLevel(acceptabilityLevelRaw);
  const failOn = parseFailOn(failOnRaw);
  const baseRef =
    baseRefInput || (scope === "pr" ? getBaseRefFromContext() : "");
  const postPrComment =
    postPrCommentRaw.toLowerCase() === "true" || postPrCommentRaw === "1";

  if (!model) {
    throw new Error('Input "model" is required and must be non-empty');
  }

  return {
    scope,
    provider,
    model,
    acceptabilityLevel,
    filePatterns,
    baseRef,
    failOn,
    postPrComment,
    githubToken,
  };
}

export function getEnvForProvider(provider: Provider): {
  openaiApiKey?: string;
  anthropicApiKey?: string;
} {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (provider === "openai" && !openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required when provider is openai"
    );
  }
  if (provider === "anthropic" && !anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required when provider is anthropic"
    );
  }

  return {
    openaiApiKey,
    anthropicApiKey,
  };
}
