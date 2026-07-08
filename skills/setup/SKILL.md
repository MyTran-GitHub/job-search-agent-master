---
name: setup
description: Onboard candidate profile into experience database, profiles, and constraints. Triggers on /setup.
---

# setup

Initialize the candidate profile for the job intelligence pipeline.

## Run

```bash
npm run setup
```

For full CV parsing into `library/context/experience/`, guide the user through structured onboarding:

1. **Read or collect** the user's CV/resume.
2. **Split into** `library/context/experience/`:
   - `projects.md`, `internships.md`, `research.md`, `skills.md`, `achievements.md`
3. **Generate function profiles** in `library/profiles/` (geospatial_engineer, gis_analyst, geoai_researcher, environmental_ds, software_engineer).
4. **Fill** `library/context/constraints.md` — visa, location, experience ceiling.
5. **Fill** `library/context/career_goals.md` — target roles, industries, geography (Search Queries are optional extras; scrape builds queries from roles × industries × skills).
6. **Optionally edit** `library/context/target_sources.md` — priority Greenhouse/Lever/Ashby boards for climate employers.
7. **Aggregate** `library/context/master-cv.md` from experience/ for backward compatibility with existing skills.

## Cold-start check

Before rank/apply, verify `experience/` files are filled (not FILL-ME) and `constraints.md` reflects the candidate's visa situation.

## Paths

- Source of truth: `library/context/experience/`
- Presentation layers: `library/profiles/`
- Hard filters: `library/context/constraints.md`
