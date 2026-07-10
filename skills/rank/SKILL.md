---
name: rank
description: Run full job intelligence pipeline — hard filters, resume optimization, tier classification. Triggers on /rank.
---

# rank

Run the deterministic job intelligence engine on normalized jobs.

## Run

```bash
npm run rank
```

Options:
- `--tier S,A` — show only specific tiers in output
- `--max-scrape-age-days <n>` — skip jobs whose `scraped_at` is older than N days (default: `SCRAPE_MAX_POSTING_AGE_DAYS` or 10)

## Pipeline stages (in order)

0. **Scrape freshness gate** — skip normalized jobs with stale `scraped_at` (safety net if rank runs long after scrape)
1. **Classify** job function (GeospatialEngineering, GISAnalyst, GeoAIResearch, EnvironmentalDS, Other)
2. **Hard filters** — visa, entry-level experience rule, structural blockers
3. **Resume optimization plan** — profile selection, keyword alignment, bullet promotion (no fabrication)
4. **Competitiveness assessment** — post-optimization only
5. **Tier classification** — S/A/B/C/D with mandatory decision report

## Outputs

- `workspace/jobs/ranked/{id}/job.json`
- `workspace/jobs/ranked/{id}/decision-report.json`
- `workspace/jobs/ranked/{id}/optimized-resume-plan.json`
- `workspace/jobs/rejected/{id}.json` — hard-filtered jobs with reasons

## Decision report format

Every job includes:
- Hard filter check result
- Entry-level rule check result
- Visa/sponsorship check result
- Optimization summary
- Final tier + 3–6 bullet justification

## Rules

- **Never reject on fixable mismatches before optimization.**
- Hard-filtered jobs skip optimization and land in `rejected/`.
- Do NOT run company research during rank.

## After rank

Present Tier S/A jobs to the user. For selected job: `npm run apply <jobId>`.
