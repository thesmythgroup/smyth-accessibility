"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const delay_1 = require("./delay");
const RETRYABLE_STATUSES = [429, 503];
const MAX_ATTEMPTS = 3;
const INITIAL_DELAY_MS = 2000;
function isRetryable(error) {
    const status = error.status ??
        error.response?.status;
    return typeof status === "number" && RETRYABLE_STATUSES.includes(status);
}
async function withRetry(fn) {
    let lastError;
    let delayMs = INITIAL_DELAY_MS;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const canRetry = attempt < MAX_ATTEMPTS && isRetryable(error);
            if (!canRetry) {
                throw error;
            }
            await (0, delay_1.delay)(delayMs);
            delayMs *= 2;
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map