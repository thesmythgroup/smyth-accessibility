import type { AcceptabilityLevel } from "../types";
import type { FileToAnalyze } from "../types";
import type { Finding } from "../types";
export declare function analyzeWithOpenAI(apiKey: string, model: string, files: FileToAnalyze[], acceptabilityLevel: AcceptabilityLevel): Promise<Finding[]>;
//# sourceMappingURL=openai-adapter.d.ts.map