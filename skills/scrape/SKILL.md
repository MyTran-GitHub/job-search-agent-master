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
- `--no-ats` — skip priority ATS boards in `library/context/target_sources.md`
- `--no-prefetch-filter` — fetch every search hit without domain/seniority prefilter

## What it does

1. Builds a **query plan** from `career_goals.md` (roles + industries) + `experience/skills.md` + optional Search Queries extras + early-career bias (`ingestion/query_planner.ts`).
2. Calls TinyFish Search API for each planned query.
3. **Pre-fetch filters** results using the climate ontology (domain + senior-title drop).
4. Fetches full JDs via TinyFish Fetch API.
5. Pulls priority **Greenhouse / Lever / Ashby** boards from `target_sources.md`.
6. Normalizes to canonical `Job` schema (includes `seniority_label`, `domain_score`, `years_required`).
7. Deduplicates and saves to `workspace/jobs/normalized/{id}.json`.

## Prerequisites

- `TINYFISH_API_KEY` in `.env` (unless using `--mock`)
- `library/context/career_goals.md` with Target Roles / Target Industries
- Optional: `library/context/target_sources.md` for ATS boards
- Ontology: `library/domain/climate_ontology.json`

## After scrape

Run `npm run rank` to classify, filter, optimize, and tier the discovered jobs.

## Agent role

Run the command, report how many jobs were saved (and query-plan / filter stats if useful), then suggest `npm run rank` next.
