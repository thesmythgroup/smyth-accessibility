"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.getEnvForProvider = getEnvForProvider;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
/** Must match `file-patterns` default in action.yml. */
const DEFAULT_FILE_PATTERNS_JSON = '["**/*.{html,htm,tsx,jsx,vue,svelte,css,scss,less}"]';
const VALID_SCOPES = ["pr", "full"];
const VALID_PROVIDERS = ["openai", "anthropic"];
const VALID_ACCEPTABILITY = [
    "wcag-a",
    "wcag-aa",
    "wcag-aaa",
    "custom",
];
const VALID_FAIL_ON = ["none", "warn", "error"];
function parseScope(value) {
    const lower = value.toLowerCase().trim();
    if (VALID_SCOPES.includes(lower)) {
        return lower;
    }
    throw new Error(`Invalid scope: ${value}. Must be one of: ${VALID_SCOPES.join(", ")}`);
}
function parseProvider(value) {
    const lower = value.toLowerCase().trim();
    if (VALID_PROVIDERS.includes(lower)) {
        return lower;
    }
    throw new Error(`Invalid provider: ${value}. Must be one of: ${VALID_PROVIDERS.join(", ")}`);
}
function parseAcceptabilityLevel(value) {
    const lower = value.toLowerCase().trim();
    if (VALID_ACCEPTABILITY.includes(lower)) {
        return lower;
    }
    throw new Error(`Invalid acceptability-level: ${value}. Must be one of: ${VALID_ACCEPTABILITY.join(", ")}`);
}
function parseFailOn(value) {
    const lower = value.toLowerCase().trim();
    if (VALID_FAIL_ON.includes(lower)) {
        return lower;
    }
    return "warn";
}
function parseFilePatternsInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return parseFilePatternsInput(DEFAULT_FILE_PATTERNS_JSON);
    }
    if (trimmed.startsWith("[")) {
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch {
            throw new Error('Invalid file-patterns: could not parse JSON array (e.g. ["apps/web/**/*.tsx"])');
        }
        if (!Array.isArray(parsed)) {
            throw new Error('file-patterns: when using JSON, value must be an array of glob strings');
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
function getBaseRefFromContext() {
    const payload = github.context.payload;
    const pr = payload.pull_request;
    const baseSha = pr?.base?.sha;
    if (typeof baseSha === "string" && baseSha) {
        return baseSha;
    }
    return "HEAD^";
}
function getConfig() {
    const scopeRaw = core.getInput("scope", { required: true });
    const providerRaw = core.getInput("provider", { required: true });
    const model = core.getInput("model", { required: true }).trim();
    const acceptabilityLevelRaw = core.getInput("acceptability-level") || "wcag-aa";
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
    const baseRef = baseRefInput || (scope === "pr" ? getBaseRefFromContext() : "");
    const postPrComment = postPrCommentRaw.toLowerCase() === "true" || postPrCommentRaw === "1";
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
function getEnvForProvider(provider) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (provider === "openai" && !openaiApiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required when provider is openai");
    }
    if (provider === "anthropic" && !anthropicApiKey) {
        throw new Error("ANTHROPIC_API_KEY environment variable is required when provider is anthropic");
    }
    return {
        openaiApiKey,
        anthropicApiKey,
    };
}
//# sourceMappingURL=config.js.map