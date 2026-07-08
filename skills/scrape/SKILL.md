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
- `--query "GIS analyst remote"` — override search query
- `--limit 20` — results per query

## What it does

1. Reads search queries from `library/context/career_goals.md` (or uses `--query`).
2. Calls TinyFish Search API for each query.
3. Fetches full JDs via TinyFish Fetch API.
4. Normalizes to canonical `Job` schema.
5. Deduplicates and saves to `workspace/jobs/normalized/{id}.json`.

## Prerequisites

- `TINYFISH_API_KEY` in `.env` (unless using `--mock`)
- `library/context/career_goals.md` with `## Search Queries` section

## After scrape

Run `npm run rank` to classify, filter, optimize, and tier the discovered jobs.

## Agent role

Run the command, report how many jobs were saved, and suggest `npm run rank` next.
