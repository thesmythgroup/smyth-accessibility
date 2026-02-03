import * as core from "@actions/core";
import { resolveFilesToAnalyze, readFileContents } from "./file-resolver";
import { getConfig, getEnvForProvider } from "./config";
import { analyze } from "./llm/adapter";
import {
  reportFindings,
  buildSummaryMarkdown,
  setJobSummary,
  postPrCommentIfRequested,
} from "./report";

async function run(): Promise<void> {
  const workspaceRoot = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const config = getConfig();
  const env = getEnvForProvider(config.provider);

  const paths = resolveFilesToAnalyze(
    config.scope,
    config.filePatterns,
    config.baseRef,
    workspaceRoot
  );

  if (paths.length === 0) {
    core.info("No web-related files to analyze.");
    core.setOutput("findings-count", "0");
    core.setOutput("has-errors", "false");
    core.setOutput("has-warnings", "false");
    return;
  }

  core.info(
    `Analyzing ${paths.length} file(s) with ${config.provider}/${config.model} (${config.acceptabilityLevel}).`
  );
  const files = readFileContents(paths, workspaceRoot);

  const findings = await analyze({
    provider: config.provider,
    model: config.model,
    files,
    acceptabilityLevel: config.acceptabilityLevel,
    openaiApiKey: env.openaiApiKey,
    anthropicApiKey: env.anthropicApiKey,
  });

  reportFindings(findings, config.failOn);
  const summaryMarkdown = buildSummaryMarkdown(findings);
  setJobSummary(summaryMarkdown);
  await postPrCommentIfRequested(
    summaryMarkdown,
    config.postPrComment,
    config.githubToken
  );
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
