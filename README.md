# Smyth Accessibility Action

GitHub Action for **LLM-based first-pass accessibility analysis** on web-related code. Supports configurable acceptability levels (e.g. WCAG A/AA/AAA), OpenAI and Anthropic as LLM providers, and two modes: **PR changeset only** or **full repo** (e.g. scheduled).

## Overview

- **First-pass a11y**: Uses an LLM to analyze web-related files for accessibility issues against a chosen acceptability level.
- **Acceptability levels**: `wcag-a`, `wcag-aa`, `wcag-aaa`, or `custom`.
- **Modes**: `scope: pr` analyzes only files changed in the PR; `scope: full` analyzes the entire repo (e.g. on a schedule).

## Configuration

### Environment variables

Set these as **secrets** or **repository/organization variables** in GitHub. Only the variables for the chosen `provider` are required.

| Variable            | Required                   | Used when |
| ------------------- | -------------------------- | --------- |
| `OPENAI_API_KEY`    | When `provider: openai`    | OpenAI    |
| `ANTHROPIC_API_KEY` | When `provider: anthropic` | Anthropic |

Files are analyzed **one at a time** (each request finishes before the next starts), with a **1 second delay between requests** to reduce rate-limit pressure. On **429 (rate limit / quota)** or **503**, the action retries that request up to 3 times with exponential backoff (2s, 4s, 8s). If you hit OpenAI quota limits, switch to `provider: anthropic` and set `ANTHROPIC_API_KEY`, or check your OpenAI plan and billing.

### Action inputs

| Input                 | Required | Default       | Description                                                              |
| --------------------- | -------- | ------------- | ------------------------------------------------------------------------ |
| `scope`               | Yes      | `pr`          | `pr` = changeset only, `full` = entire repo                              |
| `provider`            | Yes      | `openai`      | `openai` or `anthropic`                                                  |
| `model`               | Yes      | `gpt-4o`      | Model name (e.g. `gpt-4o`, `claude-3-5-sonnet`)                          |
| `acceptability-level` | No       | `wcag-aa`     | `wcag-a`, `wcag-aa`, `wcag-aaa`, or `custom`                             |
| `file-patterns`       | No       | (web-related) | Comma-separated globs/extensions, e.g. `*.tsx,*.jsx,*.html`              |
| `base-ref`            | No       | (PR base sha) | For PR mode only: override base ref for diff                             |
| `fail-on`             | No       | `warn`        | `none`, `warn`, or `error` — when to fail the job                        |
| `post-pr-comment`     | No       | `false`       | When `true` and event is `pull_request`, post a comment with the summary |

### Configure for PR (changeset only)

- Use `scope: pr`.
- Trigger on `pull_request` (e.g. `types: [opened, synchronize]`).
- Checkout with `fetch-depth: 0` so the diff is available.
- Set the secret for your chosen provider (e.g. `OPENAI_API_KEY`).

Example: see [.github/workflows/pr-accessibility.yml](.github/workflows/pr-accessibility.yml).

### Configure for full repo (periodic)

- Use `scope: full`.
- Trigger on `schedule` (cron) and/or `workflow_dispatch`.
- Optionally set `file-patterns` to restrict to certain paths (e.g. `src/**/*.tsx` via extensions like `*.tsx,*.jsx`).

Example: see [.github/workflows/accessibility-full.yml](.github/workflows/accessibility-full.yml).

## Run on PR (changeset only)

Minimal workflow to run on every PR, analyzing only changed files:

```yaml
name: Accessibility (PR)
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Smyth Accessibility
        uses: smythgroup/smyth-accessibility-action@main
        with:
          scope: pr
          provider: openai
          model: gpt-4o
          acceptability-level: wcag-aa
          fail-on: warn
          post-pr-comment: "true"
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Required secret: `OPENAI_API_KEY` (or the appropriate key for your `provider`). For PRs from forks, `base-ref` may need to be set if the default (PR base sha) is not available.

## Run on full repo (periodic)

Example: run weekly and optionally on manual trigger:

```yaml
name: Accessibility (full repo)
on:
  schedule:
    - cron: "0 2 * * 1"
  workflow_dispatch:
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Smyth Accessibility
        uses: smythgroup/smyth-accessibility-action@main
        with:
          scope: full
          provider: openai
          model: gpt-4o
          acceptability-level: wcag-aa
          file-patterns: "*.tsx,*.jsx,*.html,*.vue,*.svelte,*.css"
          fail-on: warn
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Use `file-patterns` to limit which files are analyzed (e.g. to stay within runner and API limits).

## Acceptability levels

| Value      | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| `wcag-a`   | WCAG 2.1 Level A (minimum: text alternatives, keyboard, etc.) |
| `wcag-aa`  | WCAG 2.1 Level AA (contrast, labels, focus, etc.)             |
| `wcag-aaa` | WCAG 2.1 Level AAA (enhanced contrast, sign language, etc.)   |
| `custom`   | General accessibility best practices and semantic HTML/ARIA   |

## Multi-provider

| Provider    | Env vars            | Example `model`                                        |
| ----------- | ------------------- | ------------------------------------------------------ |
| `openai`    | `OPENAI_API_KEY`    | `gpt-4o`, `gpt-4o-mini`                                |
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229` |

## Outputs

| Output           | Description                                  |
| ---------------- | -------------------------------------------- |
| `findings-count` | Total number of findings (errors + warnings) |
| `has-errors`     | `true` if any error-level findings           |
| `has-warnings`   | `true` if any warning-level findings         |

Findings are also emitted as **annotations** (file + line) and summarized in the **job summary**. With `post-pr-comment: true` and a `pull_request` event, a comment is posted on the PR with the summary.

## Development

```bash
npm install
npm run build
```

The action entrypoint is `dist/index.js` (built with `tsc` and `ncc`). The example workflows in this repo run `npm ci` and `npm run build` before `uses: ./` so `dist/` exists at runtime. If you use this action from another repo (e.g. `uses: smythgroup/smyth-accessibility-action@main`), that ref must contain a pre-built `dist/` (e.g. commit `dist/` after building, or use a release that includes it).
