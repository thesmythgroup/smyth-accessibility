import type { AcceptabilityLevel } from "../types";
import type { FileToAnalyze } from "../types";
import type { Finding } from "../types";
export declare function analyzeWithAnthropic(apiKey: string, model: string, files: FileToAnalyze[], acceptabilityLevel: AcceptabilityLevel): Promise<Finding[]>;
//# sourceMappingURL=anthropic-adapter.d.ts.map