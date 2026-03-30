"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELAY_BETWEEN_REQUESTS_MS = void 0;
exports.delay = delay;
/** Delay between API requests to reduce rate-limit (429) hits. */
exports.DELAY_BETWEEN_REQUESTS_MS = 1000;
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//# sourceMappingURL=delay.js.map