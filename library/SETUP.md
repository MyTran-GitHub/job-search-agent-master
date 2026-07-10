# Library setup checklist

Your `library/` is the candidate profile the scrape → rank → apply pipeline reads. Use this checklist to finish onboarding.

## Status

| Area | Path | Status |
|------|------|--------|
| Experience (source of truth) | `context/experience/*.md` | Sample content — replace `[brackets]` with your real details |
| Master CV | `context/master-cv.md` | Bootstrapped from experience — add contact info & verify bullets |
| Career goals | `context/career_goals.md` | Ready (climate / EO / early-career) |
| Constraints | `context/constraints.md` | Ready (F-1 OPT, max 2 yrs) — confirm values |
| Positioning | `context/positioning.md` | Bootstrapped — refine one-liner if needed |
| Function profiles | `profiles/*.md` | Ready (5 geo/climate profiles) |
| Discovery config | `context/target_sources.md` + `context/discovery/` | Climate-first source hierarchy + curated ATS boards |
| Domain ontology | `domain/climate_ontology.json` | System file — edit only to tune discovery |
| Voice | `context/voice/` | Not set up — needed before cover letters |
| STAR stories | `context/stories/` | Examples only — add 2–3 of your own |

## Step 1 — Experience (required for rank/apply)

Edit these with **your** resume content (keep bullet IDs like `project-geoai-wetlands` — profiles reference them):

- `context/experience/projects.md`
- `context/experience/internships.md`
- `context/experience/research.md`
- `context/experience/skills.md`
- `context/experience/achievements.md`

Then refresh `context/master-cv.md` (or ask the agent to re-aggregate).

## Step 2 — Constraints (required for accurate filtering)

Edit YAML frontmatter in `context/constraints.md`:

```yaml
visa:
  requires_sponsorship: true   # false if US citizen / green card
  authorized: [F1-OPT, CPT]
location: [US, Remote-US]
experience:
  max_years_required: 2        # entry-level ceiling
```

## Step 3 — Career goals & discovery (required for scrape)

`context/career_goals.md` drives the query planner. Update:

- **Target Roles** — role families, not every possible title
- **Target Industries** — climate / EO / sustainability focus
- **Geographic Preferences** — remote, hybrid, relocation
- **Search Queries** — optional extras only

Edit `context/discovery/ats_boards.md` with confirmed Greenhouse/Lever/Ashby tokens. Use `context/discovery/target_companies.md` for the broader employer watch list. See `context/target_sources.md` for full search priority.

## Step 4 — Positioning (required for tailoring)

Short file used by `cv` and `cover-letter` skills: `context/positioning.md`.

## Step 5 — Voice (before cover letters)

1. Read `context/voice/README.md`
2. Fill `context/voice/identity.md`
3. Add writing samples to `context/voice/intake/corpus/`
4. Run the voice build → produces `context/voice/voice-profile.md`

## Step 6 — STAR stories (before interviews / behavioral prep)

Add 2–3 stories under `context/stories/` (copy `EXAMPLE-story.md` format). Keep a one-line **ROSTER** at the top of each file for token-efficient scanning.

## Verify

```bash
npm run setup    # shows experience fill status
npm run scrape   # needs TINYFISH_API_KEY or --mock
npm run rank     # needs normalized jobs from scrape
```

## What to paste for the agent

To finish setup quickly, paste:

1. Your full resume (PDF text or markdown)
2. Visa status confirmation (OPT/CPT dates if relevant)
3. 1–2 cover letters or emails you've written (for voice)
4. 5–10 target employers (for `discovery/target_companies.md` and `discovery/ats_boards.md`)
