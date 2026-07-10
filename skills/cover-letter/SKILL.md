---
name: cover-letter
description: Write a one-page cover letter from JD + tailored CV + experience database evidence, in the user's voice.
---

# cover-letter

Write a tight, one-page cover letter from the JD, the **tailored CV for this application**, and **verified evidence** from the experience database — in the user's voice. The letter is a narrative, not a CV recap.

## Architecture (what to read)

| Layer | Path | Role in the letter |
|-------|------|-------------------|
| **Ground truth** | `library/context/experience/` | Facts for the Proof story — projects, outcomes, tools (`master_portfolio_*.md` primary) |
| **Presentation** | `library/context/master_resumes/` | Framing context for how the candidate positions themselves |
| **This application** | `cv-v1.md` in application folder | Tailored resume companion — reference themes, do not re-list bullets |
| **Optimization plan** | `optimized-resume-plan.json` | `bullets_to_promote`, `capability_alignment`, `keywords_to_mirror` for Connection + Proof |
| **Voice** | `library/context/voice/` | Tone, register, anti-patterns |
| **Motivation** | `library/context/positioning.md`, `career_goals.md` | Target track and industry fit |

`library/context/master-cv.md` is a **legacy aggregate fallback** — do not use it when `experience/` or a tailored `cv-v1.md` exists.

## Before you start (cold-start check)

- If `library/context/experience/` is empty or FILL-ME → ask user to paste resume, run `skills/setup/`, then draft.
- If `library/context/voice/` still holds `[placeholder]` templates → voice isn't built. Run the voice build
  (`library/context/voice/README.md`) first, or gather one writing sample and seed the profile + pairs — don't
  draft against placeholders.
- **Ranked pipeline:** read `verdict.json` → `optimized-resume-plan.json` from `verdict.plan_path` for promoted
  bullets and capability alignment.
- If no tailored CV yet for this application → run `skills/cv/` first (letter should complement `cv-v1.md`, not
  duplicate or contradict it).

## Steps

### 1. Load inputs

Read from the application folder (`workspace/applications/{company}-{role}/`):

- `application.md` or `job.md` — JD + fixed facts
- `cv-v1.md` — tailored CV for this role (if present)
- `verdict.json` + `optimized-resume-plan.json` (if ranked pipeline)
- `research-brief-v1.md` — **required for a real Hook** when available

Read from library:

- Relevant `library/context/experience/` files — especially portfolios promoted in the optimization plan:
  - `master_portfolio_fuego_earth.md` — wildfire / geospatial backend
  - `master_portfolio_eo.md` — EO pipelines, STAC, embeddings
  - `master_portfolio_awd.md` — suitability mapping, hydrology, GEE
  - `master_portfolio_capstone.md` — causal inference, wildfire research
- `library/context/master_resumes/{master_resume_template}` — framing context (from plan or job function)
- `library/context/positioning.md`, `career_goals.md`
- Voice: `voice/identity.md` + `voice/voice-profile.md` + `voice/pairs/` (cover-letter register)
- Stories: scan ROSTER line of each `stories/*.md`; read full body of 1–2 best matches for Proof material

### 2. Select the proof thread

Pick **one** experience thread for Connection + Proof — not a tour of every job.

**Priority order:**
1. `bullets_to_promote` from optimization plan (verified against `experience/`)
2. Strongest `capability_alignment.matched` capability with a quantified outcome in portfolio files
3. One STAR story from `stories/` that maps to a JD must-have

**Rules:**
- Every claim in Connection/Proof must trace to `experience/` or `stories/` — never invent
- Use JD terminology where honest (e.g. "raster analysis" when portfolio shows Rasterio/GDAL work)
- Do not repeat the CV bullet-for-bullet; tell the **story behind one outcome** the recruiter should remember

### 3. Get Hook material

The Hook must be a **real, firm-specific observation** (see `resources/architecture.md`).

- Read `research-brief-v1.md` if it exists
- **If there's no research brief and you have nothing real to say about THIS company/mission, stop** — run
  `skills/company-research/` first or ask the user for a specific angle. Do not ship a generic climate truism
  ("satellite data is transforming sustainability") as the Hook.

Good hooks for climate/geospatial roles: a recent product launch, funding round tied to a mission, a technical
blog post, a published dataset/API, a partnership — something specific to **this** org.

### 4. Draft using HCPA

Structure per `resources/architecture.md`: **Hook → Connection → Proof → Ask**.

- **Hook:** firm-specific, ~30–50 words
- **Connection:** one granular thread from experience mapped to what this org does, ~40–60 words
- **Proof:** one quantified outcome in a sentence, ~20–40 words
- **Ask:** clean, direct, ~10–25 words

### 5. Apply voice + word ceiling

Apply voice rules from `voice-profile.md` and cover-letter pairs.

**Word ceilings** (`resources/architecture.md`):

| Target | Words | Max |
|--------|-------|-----|
| Climate tech / startup / mission-driven org | 120–160 | 180 |
| Larger corp / research lab | 150–180 | 200 |
| Consulting (if applicable) | 150–180 | 200 |

Shorter is stronger. Count words before showing the draft.

### 6. Self-critique

Fix any that fail before showing the draft:

- [ ] Hook is firm-specific — an LLM couldn't have guessed it without research?
- [ ] Word count within ceiling? (Count it. Over → cut.)
- [ ] Exactly ONE proof story with a quantified outcome? (Not a CV recap.)
- [ ] Every fact traceable to `experience/` or `stories/` — nothing invented?
- [ ] No buzzwords / no "I'd be a great fit" / no "I am writing to express interest"?
- [ ] Sounds like the user's voice (`voice/pairs/` + `voice-profile.md`), not generic AI?
  Run `skills/humanizer/` to strip generic-AI tells.
- [ ] Complements `cv-v1.md` without contradicting it or duplicating bullet lists?
- [ ] Would paragraph 1 make a busy recruiter read paragraph 2?

### 7. Write output

`workspace/applications/{company}-{role}/cover-letter-v1.md` (bump to `cover-letter-v2.md` only for distinct drafts).

Offer `skills/doc-export/`. Update tracker (`application-tracker`): `tailoring`, or `ready` if CV is done too.

## The output goal is the markdown

The deliverable is a sharp cover letter in the user's voice — that's what you're optimizing. Iterate: re-hook
the opening, sharpen the proof story, run the voice pass again, cut filler. When it's done, `doc-export`
renders a one-page PDF.

## Why the letter matters (climate / geospatial context)

At climate tech and mission-driven orgs, cover letters are often read by **humans** — hiring managers, founders,
or team leads evaluating motivation and domain fit, not ATS parsers. Structure and narrative cohesion matter more
than keyword density.

- **Startups / Series A–C:** letter signals mission alignment + ability to ship; one tight proof story beats a CV re-list
- **Research labs / EO companies:** show you understand their data stack or science problem, not generic GIS praise
- **Larger corps:** still indexed for keyword search — mirror 2–3 core JD terms naturally in Connection/Proof where honest
- Some postings say **resume only** — check the JD before drafting

The letter proves you care about **this** org's problem with **one** concrete outcome — it does not replace the CV.

## Rules

- Open with a real hook, not "I am writing to express my interest in...".
- Connect to THIS firm/role specifically (positioning + research brief).
- Prove with one concrete story backed by `experience/` — not adjectives.
- One page. No filler. Match the user's voice, not corporate boilerplate.
- Never fabricate tools, employers, outcomes, or mission alignment you can't support.
- Iterate on markdown until it lands — don't rush to export.

## Networking outreach (related)

If the user wants a cold/networking email to a recruiter or team member (not a formal cover letter), write it
short and in their voice. If Gmail is connected via Composio (`library/context/connectors.md`), offer to draft
in Gmail; otherwise write as a file for them to send. Draft-first — never send without their ok.
