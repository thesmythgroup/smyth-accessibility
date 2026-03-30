"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportFindings = reportFindings;
exports.buildSummaryMarkdown = buildSummaryMarkdown;
exports.setJobSummary = setJobSummary;
exports.postPrCommentIfRequested = postPrCommentIfRequested;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function emitAnnotation(finding) {
    const opts = { file: finding.file, line: finding.line };
    const msg = finding.code
        ? `${finding.message} (${finding.code})`
        : finding.message;
    if (finding.severity === "error") {
        core.error(msg, opts);
    }
    else {
        core.warning(msg, opts);
    }
}
function reportFindings(findings, failOn) {
    for (const f of findings) {
        emitAnnotation(f);
    }
    const errors = findings.filter((f) => f.severity === "error");
    const warnings = findings.filter((f) => f.severity === "warning");
    const total = findings.length;
    core.setOutput("findings-count", String(total));
    core.setOutput("has-errors", errors.length > 0 ? "true" : "false");
    core.setOutput("has-warnings", warnings.length > 0 ? "true" : "false");
    const shouldFail = (failOn === "error" && errors.length > 0) ||
        (failOn === "warn" && (errors.length > 0 || warnings.length > 0));
    if (shouldFail) {
        core.setFailed(`Accessibility check failed: ${errors.length} error(s), ${warnings.length} warning(s). fail-on=${failOn}`);
    }
}
function buildSummaryMarkdown(findings) {
    const errors = findings.filter((f) => f.severity === "error");
    const warnings = findings.filter((f) => f.severity === "warning");
    const lines = [
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
        const byFile = new Map();
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
function setJobSummary(summaryMarkdown) {
    core.summary.addRaw(summaryMarkdown).write();
}
async function postPrCommentIfRequested(summaryMarkdown, postPrComment, githubTokenInput) {
    if (!postPrComment) {
        return;
    }
    const { payload, repo } = github.context;
    const pr = payload.pull_request;
    const prNumber = pr?.number;
    if (prNumber == null) {
        return;
    }
    const token = githubTokenInput.trim() || process.env.GITHUB_TOKEN || "";
    if (!token) {
        core.warning("GITHUB_TOKEN not set; skipping PR comment. Pass github-token: ${{ secrets.GITHUB_TOKEN }} (and permissions: pull-requests: write) to post comments.");
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
//# sourceMappingURL=report.js.map