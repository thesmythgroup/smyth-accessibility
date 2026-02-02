import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const coreMocks = vi.hoisted(() => ({
  getInput: vi.fn(),
}));

vi.mock("@actions/core", () => ({
  getInput: coreMocks.getInput,
}));

vi.mock("@actions/github", () => ({
  context: {
    payload: {},
  },
}));

import { getConfig, getEnvForProvider } from "./config";

function defaultInputs(
  overrides: Record<string, string> = {}
): Record<string, string> {
  return {
    scope: "pr",
    provider: "openai",
    model: "gpt-4o",
    "acceptability-level": "wcag-aa",
    "file-patterns": "",
    "base-ref": "",
    "fail-on": "warn",
    "post-pr-comment": "false",
    ...overrides,
  };
}

describe("getConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.getInput.mockImplementation(
      (name: string) => defaultInputs()[name] ?? ""
    );
  });

  it("returns config with valid inputs", () => {
    const config = getConfig();
    expect(config.scope).toBe("pr");
    expect(config.provider).toBe("openai");
    expect(config.model).toBe("gpt-4o");
    expect(config.acceptabilityLevel).toBe("wcag-aa");
    expect(config.failOn).toBe("warn");
    expect(config.postPrComment).toBe(false);
  });

  it("parses post-pr-comment true", () => {
    coreMocks.getInput.mockImplementation(
      (name: string) => defaultInputs({ "post-pr-comment": "true" })[name] ?? ""
    );
    const config = getConfig();
    expect(config.postPrComment).toBe(true);
  });

  it("throws for invalid scope", () => {
    coreMocks.getInput.mockImplementation(
      (name: string) => defaultInputs({ scope: "invalid" })[name] ?? ""
    );
    expect(() => getConfig()).toThrow(/Invalid scope/);
  });

  it("throws for invalid provider", () => {
    coreMocks.getInput.mockImplementation(
      (name: string) => defaultInputs({ provider: "azure" })[name] ?? ""
    );
    expect(() => getConfig()).toThrow(/Invalid provider/);
  });

  it("throws for invalid acceptability-level", () => {
    coreMocks.getInput.mockImplementation(
      (name: string) =>
        defaultInputs({ "acceptability-level": "invalid" })[name] ?? ""
    );
    expect(() => getConfig()).toThrow(/Invalid acceptability-level/);
  });

  it("throws when model is empty", () => {
    coreMocks.getInput.mockImplementation(
      (name: string) => defaultInputs({ model: "  " })[name] ?? ""
    );
    expect(() => getConfig()).toThrow(/model.*required/);
  });
});

describe("getEnvForProvider", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("throws for openai when OPENAI_API_KEY is missing", () => {
    expect(() => getEnvForProvider("openai")).toThrow(/OPENAI_API_KEY/);
  });

  it("throws for anthropic when ANTHROPIC_API_KEY is missing", () => {
    expect(() => getEnvForProvider("anthropic")).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("returns openaiApiKey when provider is openai and key is set", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const result = getEnvForProvider("openai");
    expect(result.openaiApiKey).toBe("sk-test");
    expect(result.anthropicApiKey).toBeUndefined();
  });

  it("returns anthropicApiKey when provider is anthropic and key is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const result = getEnvForProvider("anthropic");
    expect(result.anthropicApiKey).toBe("sk-ant-test");
    expect(result.openaiApiKey).toBeUndefined();
  });
});
