---
name: cv
description: Tailor a one-page CV to a specific job description from the user's master CV.
---

# cv

Turn a JD + the user's master CV into a tailored, one-page CV.

## Before you start (cold-start check)
- If `library/context/experience/` or `master-cv.md` still says FILL-ME → ask the user to paste their resume, run
  `skills/setup/` first, THEN tailor.
- Read `library/context/positioning.md` for target firms/track (ask if still FILL-ME and it matters).
- **If applying from ranked pipeline:** read `workspace/jobs/ranked/{jobId}/optimized-resume-plan.json` and
  `verdict.json` in the application folder. Follow the plan's `section_order`, `bullets_to_promote`, and
  `keywords_to_mirror`. Read the selected profile from `library/profiles/{profile}`.

## Steps
1. **Load inputs.** If `verdict.json` exists in the application folder, read it plus
   `optimized-resume-plan.json` from the ranked job folder (path in `verdict.plan_path`). Otherwise proceed
   with manual JD tailoring. Save/update `application.md` or `job.md` with fixed facts.
2. **Read source material.** Primary: `library/context/experience/` files matching promoted bullet IDs.
   Fallback: `master-cv.md`. Read selected `library/profiles/{profile}` for framing. For stories: scan ROSTER
   lines in `stories/*.md`, read full body of 2–3 matches.
3. **Tailor per optimization plan.** If a plan exists:
   - Use `section_order` for section ordering
   - Lead with `bullets_to_promote` experience entries
   - Apply `terminology_swaps` honestly (no fabrication)
   - Mirror `keywords_to_mirror` where experience is real
   - **Constraint enforcer:** never add employers, years, or credentials not in `experience/`
   - **Order sections by what the JD values.** If the JD explicitly values something the user has a strong,
     differentiated section for (e.g. AI/applied projects, research), promote it HIGH — even above older work
     experience. A JD that says "curiosity about AI" + a candidate with a real AI project = lead with it.
   - **Dense bullets:** action → mechanism → quantified outcome, chained in one bullet. "Built X that did Y →
     Z result" beats two thin bullets.
4. **ATS keyword pass** (`resources/ats.md`). Read it on a first draft and on any big edit. Pull the JD's
   must-have terms (exact job title, hard skills, tools, certs), make sure the CV **mirrors them honestly** where
   the experience is real — exact-match the title in the summary, put high-priority keywords in the most recent
   roles, embed skills in metric bullets (not a keyword dump) — and **flag any true-but-missing gap** to the
   user rather than inventing it.
5. **Format** per `resources/format.md` (single column, standard headings, `Month YYYY` dates — these are the
   ATS-parse rules, not just looks).
6. **Self-critique before showing it:** Does it lead with what THIS JD values most? Every bullet earn its place
   with an outcome? Right length (one page; up to two is OK for a Canadian role with real tenure)? Title
   mirrored, must-have keywords present, no invented experience? Fix, then show.
7. **Write** to `workspace/applications/{company}-{role}/cv-v1.md` (flat, versioned — bump to `cv-v2.md` only
   for a distinct draft worth keeping, not every edit).
8. Offer `skills/doc-export/` to render the submission PDF (and a `.docx` for editing or a Taleo/legacy ATS),
   and `skills/cover-letter/` for the letter. Once both CV and cover letter are done, bump the tracker row to `ready`.

## The output goal is the markdown
**The deliverable is a sharp `cv.md` — that's what you're optimizing.** Iterate it as many times as the user
wants: tighten bullets, re-tailor to the JD, run it through their voice (`voice/voice-profile.md`), cut to one page. Get the *content*
right. That polished markdown is the real product; when it's done, `doc-export` pours it into an ATS-safe,
one-page HTML template the student prints to PDF — no hand-formatting needed.

## Rules
- One page for US roles (default). Canadian roles may run **1–2 pages** when there's real tenure — don't pad to
  fill a second page, but don't force-cut strong content to one either.
- Every bullet earns its place against the JD. No filler.
- Real experience only — if the JD wants something they haven't done, don't fake it; flag the gap to the user.
- **GPA** only if **> 3.5/4.0**. For an international grade, append the US equivalent in parentheses
  (e.g. `14/20 (US GPA ~3.8)`) so an ATS doesn't read it as a low percentage.
- **Quebec (Montreal) roles:** highlight French fluency (Bill 96 makes it near-essential even at global firms);
  use Canadian spelling for Canadian applications. See `resources/ats.md`.
- Match the firm's screen where known (`resources/ats.md`): BCG (Eightfold) evidences integrity/curiosity/
  creativity/collaboration/drive; Bain (Avature) ambitious/curious/entrepreneurial; McKinsey is human-reviewed
  (readability + STAR + academic signal).
- Iterate freely on the markdown until it's right — that's the point. Don't rush to export.
