"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyze = analyze;
const openai_adapter_1 = require("./openai-adapter");
const anthropic_adapter_1 = require("./anthropic-adapter");
async function analyze(options) {
    const { provider, model, files, acceptabilityLevel } = options;
    if (provider === "openai") {
        const key = options.openaiApiKey;
        if (!key) {
            throw new Error("OPENAI_API_KEY is required when provider is openai");
        }
        return (0, openai_adapter_1.analyzeWithOpenAI)(key, model, files, acceptabilityLevel);
    }
    if (provider === "anthropic") {
        const key = options.anthropicApiKey;
        if (!key) {
            throw new Error("ANTHROPIC_API_KEY is required when provider is anthropic");
        }
        return (0, anthropic_adapter_1.analyzeWithAnthropic)(key, model, files, acceptabilityLevel);
    }
    throw new Error(`Unknown provider: ${provider}`);
}
//# sourceMappingURL=adapter.js.map