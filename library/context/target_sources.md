# Job Discovery Sources

Configuration for **climate-first** job discovery. Sources are ordered by signal quality — not all layers are automated yet.

## Search priority (intended order)

| # | Source | Config file | Automated today |
|---|--------|-------------|-----------------|
| 1 | Climate job boards | `discovery/climate_job_boards.md` | Agent / manual |
| 2 | VC portfolios | `discovery/vc_portfolios.md` | Agent / manual |
| 3 | Accelerators | `discovery/accelerators.md` | Agent / manual |
| 4 | Target employers | `discovery/target_companies.md` | Via TinyFish + agent |
| 5 | Curated ATS boards | `discovery/ats_boards.md` | **Yes** (`npm run scrape`) |
| 6 | TinyFish search | `career_goals.md` + query planner | **Yes** |
| 7 | Generic ATS discovery | `find-job` skill | Agent, on demand |

**Why this order:** Climate boards and VC/accelerator portfolios surface startups and analytics roles before they hit generic aggregators. Curated ATS boards give high-precision pulls from known employers. TinyFish broadens recall. Generic ATS sweeps are last resort.

## Configuration layout

```
library/context/
├── target_sources.md          ← this file (strategy + index)
├── career_goals.md            ← roles, industries, query planner inputs
└── discovery/
    ├── climate_job_boards.md  ← Climatebase, Terra.do, etc.
    ├── vc_portfolios.md       ← Breakthrough, Lowercarbon, …
    ├── accelerators.md        ← YC Climate, Elemental, …
    ├── target_companies.md    ← priority employers by category
    └── ats_boards.md          ← greenhouse / lever / ashby tokens
```

## What the scraper reads

`ingestion/sources/priority_ats.ts` loads the **`## Boards`** section from `discovery/ats_boards.md` (falls back to a `## Boards` section in this file for backward compatibility).

TinyFish queries come from `career_goals.md` via `ingestion/query_planner.ts`.

Climate boards, VC portfolios, and accelerators are **documentation + agent workflow** until dedicated ingest adapters exist.

## Quick links

- [Climate job boards](discovery/climate_job_boards.md)
- [VC portfolios](discovery/vc_portfolios.md)
- [Accelerators](discovery/accelerators.md)
- [Target companies](discovery/target_companies.md)
- [ATS boards](discovery/ats_boards.md)

## Maintainer rules

1. **Source first, companies second** — add a new discovery channel before dumping more company names.
2. **Keep ATS boards short** — only confirmed public tokens.
3. **Target companies ≠ ATS entries** — use `target_companies.md` for the watch list; promote to `ats_boards.md` when verified.
4. **Avoid hundred-line lists** — if a category grows, split by sub-sector in a new discovery file.
