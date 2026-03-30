"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWithOpenAI = analyzeWithOpenAI;
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("../prompts");
const parse_findings_1 = require("../parse-findings");
const delay_1 = require("./delay");
const retry_1 = require("./retry");
const MAX_TOKENS = 4096;
async function analyzeWithOpenAI(apiKey, model, files, acceptabilityLevel) {
    const client = new openai_1.default({ apiKey });
    const allFindings = [];
    for (let i = 0; i < files.length; i++) {
        if (i > 0) {
            await (0, delay_1.delay)(delay_1.DELAY_BETWEEN_REQUESTS_MS);
        }
        const { path, content } = files[i];
        const truncated = content.length > 12000
            ? content.slice(0, 12000) + "\n/* ... truncated */"
            : content;
        const prompt = (0, prompts_1.buildAnalysisPrompt)(path, truncated, acceptabilityLevel);
        const response = await (0, retry_1.withRetry)(() => client.chat.completions.create({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: MAX_TOKENS,
            temperature: 0.2,
        }));
        const text = response.choices[0]?.message?.content ?? "";
        const findings = (0, parse_findings_1.parseFindingsFromResponse)(text, path);
        allFindings.push(...findings);
    }
    return allFindings;
}
//# sourceMappingURL=openai-adapter.js.map