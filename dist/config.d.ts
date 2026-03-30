import type { ActionConfig, Provider } from "./types";
export declare function getConfig(): ActionConfig;
export declare function getEnvForProvider(provider: Provider): {
    openaiApiKey?: string;
    anthropicApiKey?: string;
};
