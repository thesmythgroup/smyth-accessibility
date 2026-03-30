import type { Finding } from "../types";
import type { FileToAnalyze } from "../types";
import type { AcceptabilityLevel } from "../types";
import type { Provider } from "../types";
export type AnalyzeOptions = {
    provider: Provider;
    model: string;
    files: FileToAnalyze[];
    acceptabilityLevel: AcceptabilityLevel;
    openaiApiKey?: string;
    anthropicApiKey?: string;
};
export declare function analyze(options: AnalyzeOptions): Promise<Finding[]>;
//# sourceMappingURL=adapter.d.ts.map