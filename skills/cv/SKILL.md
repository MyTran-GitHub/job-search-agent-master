---
name: cv
description: Tailor a one-page CV from role-specific master resume templates + experience database evidence. Never rebuild from scratch.
---

# cv

Adapt a **role-specific master resume template** to a job description using evidence from the **master experience database**. Do not write a CV from a blank page or reconstruct bullets from memory.

## Architecture (three layers)

| Layer | Path | Role |
|-------|------|------|
| **Ground truth** | `library/context/experience/` | Authoritative evidence — projects, internships, research, tools, outcomes |
| **Presentation** | `library/context/master_resumes/` | Role-specific resume templates (wording, section order, keyword emphasis) |
| **Framing hints** | `library/profiles/` | Bullet promotion, terminology swaps, section priorities |

**Ground truth files to prioritize:**
- `master_portfolio_fuego_earth.md` — wildfire / geospatial backend
- `master_portfolio_eo.md` — Earth observation pipelines, STAC, embeddings
- `master_portfolio_awd.md` — suitability mapping, hydrology, GEE
- `master_portfolio_capstone.md` — causal inference, wildfire research
- Any other `master_portfolio_*.md` or structured experience files

`library/context/master-cv.md` is a **legacy aggregate fallback only** — do not treat it as source of truth.

## Master resume templates

| Job function | Template |
|--------------|----------|
| GeospatialEngineering | `Geospatial_Engineer_master-cv.md` |
| GISAnalyst | `GIS_master_cv.md` |
| GeoAIResearch | `GeoAi_master_cv.md` |
| EnvironmentalDS | `Geospatial_Engineer_master-cv.md` |
| Other / ambiguous | `Geospatial_Engineer_master-cv.md` |

When `optimized-resume-plan.json` specifies `master_resume_template`, use that file.

## Before you start (cold-start check)

- If `library/context/experience/` is empty or FILL-ME → ask user to paste resume, run `skills/setup/`, then tailor.
- Read `library/context/positioning.md` for target track (ask if FILL-ME).
- **Ranked pipeline:** read `verdict.json` → `optimized-resume-plan.json` from `verdict.plan_path`.
  - Use `master_resume_template`, `section_order`, `bullets_to_promote`, `terminology_swaps`, `keywords_to_mirror`
  - Review `capability_alignment.matched` / `.missing` — mirror matched capabilities; flag true gaps, never invent

## Steps

### 1. Load inputs

- Application folder: `job.md` or `application.md` (JD + fixed facts)
- `verdict.json` + `optimized-resume-plan.json` if present
- `decision-report.json` from ranked folder (optional — tier, capability alignment, selected master resume)

### 2. Select master resume template

From plan `master_resume_template`, or classify job function and pick from table above.

Read the full template from `library/context/master_resumes/{template}`.

**This is your starting document.** Preserve its structure (Summary, Skills, Experience, Projects, Education). Adapt — do not rewrite from scratch.

### 3. Load evidence from experience database

Read relevant files under `library/context/experience/`:

- Match `bullets_to_promote` from optimization plan when present
- For each bullet you keep or strengthen, verify facts against portfolio files (`master_portfolio_*.md`) or structured experience entries
- Scan portfolio **Keyword Matrix** / **Resume Evidence Matrix** sections when present — use them for ATS mirroring

Read selected `library/profiles/{profile}` for framing (terminology swaps, bullet priorities).

For behavioral color: scan ROSTER lines in `stories/*.md`; read full body of 1–2 matches only if needed.

### 4. Tailor (adapt template → job-specific CV)

**Allowed:**
- Keyword paraphrasing and terminology alignment (e.g. "geospatial processing" → "raster/vector analysis" when GDAL/Rasterio evidence exists)
- Reordering emphasis within sections per `section_order`
- Selecting strongest evidence bullets for this JD
- Applying `terminology_swaps` from plan or profile

**Forbidden:**
- Inventing tools, employers, years, credentials, or responsibilities not in `experience/`
- Inflating seniority or scope beyond portfolio evidence
- Copying JD requirements as if the candidate did them without supporting evidence

**Optimization plan rules (when present):**
- `section_order` → section ordering
- `bullets_to_promote` → lead with these experience entries
- `terminology_swaps` → honest rewording only
- `keywords_to_mirror` → embed in metric bullets where experience is real
- `capability_alignment.missing` → flag to user as gaps; do not fabricate to close them

**JD-driven emphasis:**
- If JD values AI/EO/research and candidate has strong portfolio evidence, promote that section high — even above older internships
- Dense bullets: action → mechanism → quantified outcome in one line

### 5. ATS keyword pass

Read `resources/ats.md` on first draft and after major edits.

- Mirror JD must-have terms **only where experience database supports them**
- Exact-match target job title in summary when honest
- Embed skills in metric bullets — not a keyword cloud
- If JD asks for capability the candidate has under different wording (e.g. "raster analysis" vs Rasterio/GDAL), use JD terminology in bullets backed by portfolio evidence

### 6. Format

Per `resources/format.md`: single column, standard headings, `Month YYYY` dates.

### 7. Self-critique

- [ ] Started from correct master resume template, not blank
- [ ] Every bullet traceable to `experience/` or `master_portfolio_*.md`
- [ ] Leads with what THIS JD values most
- [ ] Title mirrored; must-have keywords present where honest
- [ ] No invented experience; true gaps flagged
- [ ] One page US default (up to two for Canadian roles with real tenure)

### 8. Write output

`workspace/applications/{company}-{role}/cv-v1.md` (bump to `cv-v2.md` only for distinct drafts).

Offer `skills/doc-export/` for PDF/DOCX and `skills/cover-letter/` for the letter. Bump tracker to `ready` when both are done.

## The output goal is the markdown

The deliverable is a sharp tailored CV — a **role-specific adaptation** of the master template, not a generic rewrite. Iterate until content is right; then `doc-export` renders ATS-safe PDF.

## Rules

- One page US default. Canadian roles may run 1–2 pages with real tenure.
- Real experience only — flag gaps, never fake them.
- GPA only if > 3.5/4.0 (international grades: show US equivalent in parentheses).
- Quebec roles: highlight French fluency; Canadian spelling. See `resources/ats.md`.
- Iterate on markdown until right — don't rush to export.
