# Curated ATS Boards

**Priority: 5** — Public ATS endpoints scraped by `npm run scrape`.

Only employers with **API-verified** public Greenhouse, Lever, or Ashby JSON feeds belong in the Boards section below.

Format:

`- {ats}:{token} | {Company Display Name}`

Where `ats` is `greenhouse`, `lever`, or `ashby`.

## Boards

- greenhouse:planetlabs | Planet Labs
- ashby:watershed | Watershed
- greenhouse:tomorrow | Tomorrow.io
- ashby:formenergy | Form Energy

## Verified (API-tested)

| Company | Token | ATS | Endpoint |
|---------|-------|-----|----------|
| Planet Labs | `planetlabs` | Greenhouse | `boards-api.greenhouse.io/v1/boards/planetlabs/jobs` |
| Watershed | `watershed` | Ashby | `api.ashbyhq.com/posting-api/job-board/watershed` |
| Tomorrow.io | `tomorrow` | Greenhouse | `boards-api.greenhouse.io/v1/boards/tomorrow/jobs` |
| Form Energy | `formenergy` | Ashby | `api.ashbyhq.com/posting-api/job-board/formenergy` |

Last verified: 2026-07-09

## Pending (target employers — not in scrape yet)

These are in `target_companies.md` but lack a confirmed public ATS token. Discover via climate boards, VC portfolios, or agent search; add one line to `## Boards` when verified.

| Company | Known careers stack | Notes |
|---------|---------------------|-------|
| Descartes Labs | Was Lever; no public API found | Check Welcome to the Jungle / company site |
| Pachama | Workable (`apply.workable.com/pachama`) | Not supported by scrape adapter today |
| Floodbase | Unknown | Manual discovery |
| WindBorne Systems | Unknown | Manual discovery |
| Fervo Energy | Unknown | Manual discovery |
| Heirloom | Unknown | Manual discovery |

## Notes

- Tokens come from careers URLs (e.g. `job-boards.greenhouse.io/planetlabs` → `greenhouse:planetlabs`).
- Re-verify tokens quarterly — startups change ATS providers.
- Employers listed in `target_companies.md` are not auto-added here.
- Scraper applies senior-title prefilter; domain filter is relaxed for known climate boards.
