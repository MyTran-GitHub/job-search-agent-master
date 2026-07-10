---
name: scrape
description: Discover jobs via TinyFish and normalize to canonical schema. Triggers on /scrape.
---

# scrape

Run the job discovery pipeline.

## Run

```bash
npm run scrape
```

Options:
- `--mock` — use fixture data (no API key needed, for testing)
- `--query "GIS analyst remote"` — override search query (skips query planner)
- `--limit 20` — results per query
- `--ats-only` — scrape curated ATS boards only (no TinyFish API key needed)
- `--no-prefetch-filter` — fetch every search hit without domain/seniority prefilter
- `--max-age-days 10` — keep jobs posted within N days (default: `SCRAPE_MAX_POSTING_AGE_DAYS` or 10)
- `--no-age-filter` — disable posting-age filter (include undated/stale jobs)

## Discovery priority (intended)

See `library/context/target_sources.md` for the full hierarchy:

1. Climate job boards (agent/manual — `discovery/climate_job_boards.md`)
2. VC portfolios (`discovery/vc_portfolios.md`)
3. Accelerators (`discovery/accelerators.md`)
4. Target employers (`discovery/target_companies.md`)
5. **Curated ATS boards** — automated (`discovery/ats_boards.md`)
6. **TinyFish search** — automated (`career_goals.md` + query planner)
7. Generic ATS — `find-job` skill, on demand

## What it does (automated path)

1. Builds a **query plan** from `career_goals.md` (roles + industries) + `experience/skills.md` + optional Search Queries extras + early-career bias (`ingestion/query_planner.ts`).
2. Calls TinyFish Search API for each planned query (`recency_minutes` = posting-age window).
3. **Pre-fetch filters** results using the climate ontology (domain + senior-title drop).
4. Fetches full JDs via TinyFish Fetch API (uses `published_date` when available).
5. Pulls curated **Greenhouse / Lever / Ashby** boards from `discovery/ats_boards.md`.
6. **Posting-age filter** drops jobs older than 10 days (or `SCRAPE_MAX_POSTING_AGE_DAYS` / `--max-age-days`).
7. **Snapshot hygiene:** clears `jobs/normalized/` at scrape start; prunes `ranked/` and `rejected/` to match this scrape's job IDs.
8. Normalizes to canonical `Job` schema (includes `seniority_label`, `domain_score`, `years_required`, `posting_age`, `scraped_at`).
9. Deduplicates and saves to `workspace/jobs/normalized/{id}.json`.

## Prerequisites

- `TINYFISH_API_KEY` in `.env` (unless using `--mock`)
- `library/context/career_goals.md` with Target Roles / Target Industries
- Optional: `library/context/discovery/ats_boards.md` for ATS scrape
- Ontology: `library/domain/climate_ontology.json`

## After scrape

Run `npm run rank` to classify, filter, optimize, and tier the discovered jobs.

For climate boards and VC/accelerator sweeps, use the agent with `discovery/*.md` configs before or after scrape.

## Agent role

Run the command, report how many jobs were saved (and query-plan / filter stats if useful), then suggest `npm run rank` next.
