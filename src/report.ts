import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Finding, FailOn } from "./types";

function emitAnnotation(finding: Finding): void {
  const opts = { file: finding.file, line: finding.line };
  const msg = finding.code
    ? `${finding.message} (${finding.code})`
    : finding.message;
  if (finding.severity === "error") {
    core.error(msg, opts);
  } else {
    core.warning(msg, opts);
  }
}

export function reportFindings(findings: Finding[], failOn: FailOn): void {
  for (const f of findings) {
    emitAnnotation(f);
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const total = findings.length;

  core.setOutput("findings-count", String(total));
  core.setOutput("has-errors", errors.length > 0 ? "true" : "false");
  core.setOutput("has-warnings", warnings.length > 0 ? "true" : "false");

  const shouldFail =
    (failOn === "error" && errors.length > 0) ||
    (failOn === "warn" && (errors.length > 0 || warnings.length > 0));
  if (shouldFail) {
    core.setFailed(
      `Accessibility check failed: ${errors.length} error(s), ${warnings.length} warning(s). fail-on=${failOn}`
    );
  }
}

export function buildSummaryMarkdown(findings: Finding[]): string {
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const lines: string[] = [
    "## Smyth Accessibility – First-pass results",
    "",
    `| Severity | Count |`,
    `| -------- | ----- |`,
    `| Error    | ${errors.length} |`,
    `| Warning  | ${warnings.length} |`,
    `| **Total** | **${findings.length}** |`,
    "",
  ];
  if (findings.length > 0) {
    lines.push("### Findings by file", "");
    const byFile = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = byFile.get(f.file) ?? [];
      list.push(f);
      byFile.set(f.file, list);
    }
    for (const [file, list] of byFile) {
      lines.push(`- **${file}**`);
      for (const f of list) {
        lines.push(`  - L${f.line} [${f.severity}]: ${f.message}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function setJobSummary(summaryMarkdown: string): void {
  core.summary.addRaw(summaryMarkdown).write();
}

export async function postPrCommentIfRequested(
  summaryMarkdown: string,
  postPrComment: boolean
): Promise<void> {
  if (!postPrComment) {
    return;
  }
  const { payload, repo } = github.context;
  const pr = payload.pull_request as { number?: number } | undefined;
  const prNumber = pr?.number;
  if (prNumber == null) {
    return;
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    core.warning("GITHUB_TOKEN not set; skipping PR comment");
    return;
  }
  const octokit = github.getOctokit(token);
  await octokit.rest.issues.createComment({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: prNumber,
    body: summaryMarkdown,
  });
}
