---
name: upskill
description: Identify skill gaps from ranked Tier B/C jobs and generate a learning plan. Triggers on /upskill.
---

# upskill

Analyze skill gaps between ranked jobs and the candidate's `library/context/experience/skills.md`.

## Run

```bash
npm run upskill
```

Options:
- `--job-id <id>` — analyze a single ranked job

## Data sources

- **Jobs:** `workspace/jobs/ranked/` (Tier B/C by default in aggregate mode)
- **Profile:** `library/context/experience/skills.md`
- **NOT** `job_search_tracker.csv` (legacy — do not use)

## Agent workflow (after CLI gap report)

1. Run `npm run upskill` to get the gap heatmap.
2. For **Critical** and **High** gaps, run WebSearch for current study resources.
3. Build a learning plan with study direction tailored to existing background.
4. Save report to `workspace/upskill/report-YYYY-MM-DD.md`.

## Rules

1. Never fabricate resources — only cite WebSearch results.
2. Be generous matching skills already in `experience/skills.md`.
3. Omit Low-priority gaps from the learning plan unless user asks.
4. Print heatmap before resource search.

## Report location

`workspace/upskill/report-YYYY-MM-DD.md`
