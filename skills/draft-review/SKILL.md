---
name: draft-review
description: Orchestrate drafter-reviewer CV and cover letter workflow with mandatory PDF layout check and final verification. Triggers on /draft-review, draft review, tailor with review.
---

# draft-review

Two-agent application workflow: **drafter** writes, **reviewer** critiques in fresh context, drafter revises, then export + layout inspect + single verifier pass.

Follow these steps **exactly in order**. Do not skip steps.

---

## Token-efficiency rules

- Never re-Read a file whose contents are already in your context from an earlier step.
- Pass draft content **inline in the reviewer agent prompt** — do not ask the reviewer to Read files you already have.
- Run the full verifier checklist **exactly once**, at the end (Step 6). The reviewer focuses on content critique, not verification.
- Step 5 (export and inspect PDFs) is **mandatory and non-skippable**.

---

## Routing: when to use this skill

| Scenario | Path |
|---|---|
| Tier S/A, high-stakes apply | **This skill** (full loop) — recommended after `npm run apply` |
| Tier B, user wants speed | `skills/cv/` + `skills/cover-letter/` directly (skip reviewer) |
| Minor CV tweak on existing app | `skills/cv/` only |
| Tier C | Warn user; offer this skill optionally |

---

## Step 0: Parse input and locate application folder

**From ranked pipeline:**
- Application folder should exist from `npm run apply <jobId>`.
- Read `workspace/applications/{company}-{role}/job.md` and `verdict.json`.

**From pasted JD or URL:**
- If no folder exists, seed one via `skills/find-job/` or create `application.md` with frontmatter + verbatim JD.
- No `verdict.json` — manual path (Step 1 asks user to proceed).

Extract: company, role, location, posting URL. Store for the workflow.

---

## Step 1: Proceed gate (no redundant fit score)

**If `verdict.json` exists** (ranked pipeline):
- Present tier, job function, and justification from `verdict.json` / `job.md`.
- Present optimization summary from ranked plan.
- **Do NOT compute a new fit score** — tier engine already classified this job.
- If tier is **D**, stop — do not draft.
- If tier is **C**, warn about low ROI; ask if user still wants full draft-review.
- Ask: "Should I proceed with drafting CV and cover letter for this role?"

**If manual path** (no `verdict.json`):
- Brief alignment summary: which experience bullets map to posting requirements, obvious gaps.
- Ask: "Should I proceed with drafting the CV and cover letter?"

**If user says no, stop here.**

---

## Step 2: DRAFTER — Draft CV + cover letter

Read once (do not re-read in Step 4):

- `verdict.json` → `plan_path` → `optimized-resume-plan.json` (if present)
- Selected `library/profiles/{profile}` from optimization plan
- Relevant `library/context/experience/` files (bullets in `bullets_to_promote`)
- `library/context/voice/identity.md`, `voice-profile.md`, `anti-patterns.md`
- `research-brief-v1.md` in application folder if it exists
- `skills/cv/resources/ats.md`, `skills/cv/resources/format.md`
- `skills/cover-letter/resources/architecture.md`

**CV** (`cv-v1.md`):
- Follow `skills/cv/SKILL.md` rules and optimization plan (section order, bullets to promote, terminology swaps, keywords to mirror).
- One page US default; up to two pages Canadian if justified.
- Never fabricate experience.

**Cover letter** (`cover-letter-v1.md`):
- Follow `skills/cover-letter/SKILL.md` — HCPA structure, voice rules, word ceiling.
- If no `research-brief-v1.md` and no firm-specific hook material: draft best effort OR flag that `company-research` would strengthen the Hook — do not use generic consulting truisms.

Write both files to `workspace/applications/{company}-{role}/`.

**Keep exact draft text in working memory** for Step 3 and Step 4.

Update tracker row to `tailoring` (`application-tracker` skill).

---

## Step 3: REVIEWER — Research and critique

Spawn a **reviewer subagent** via the Task tool (`generalPurpose`, `readonly: true`).

Pass drafts **inline** in the prompt. The reviewer must NOT Read the draft files.

Reviewer reads only:
- Relevant `library/context/experience/` files
- `library/context/voice/identity.md`, `voice-profile.md`, `anti-patterns.md`
- Job posting text (inline or from `job.md`)
- `research-brief-v1.md` if it exists
- Optional: lightweight **WebSearch** for hook angles only — not a full `company-research` brief

Reviewer prompt template — replace placeholders with actual values:

```
You are a hiring manager proxy reviewing a job application. Make the application as targeted and compelling as possible without fabricating experience.

## Read (content-critique only)
- library/context/experience/ (relevant bullets)
- library/context/voice/identity.md, voice-profile.md, anti-patterns.md
- research-brief-v1.md in application folder IF it exists

Optional: WebSearch for company hook angles only. Do NOT produce a full research brief.

## Drafts (inline — do NOT Read files)
<CV_DRAFT file="cv-v1.md">
{INSERT_CV_DRAFT}
</CV_DRAFT>

<COVER_LETTER_DRAFT file="cover-letter-v1.md">
{INSERT_COVER_LETTER_DRAFT}
</COVER_LETTER_DRAFT>

## Job posting
<JOB_POSTING>
{INSERT_JOB_POSTING}
</JOB_POSTING>

## Output format
Follow skills/draft-review/resources/review-schema.md exactly.

Part A: JSON array of structured edits (file, old_string, new_string, reason).
Part B: Narrative suggestions in four categories (missed keywords, company angles, action reframing, tone/voice).

CRITICAL: All suggestions must be grounded in actual profile data. Do NOT suggest fabricating skills, experience, or achievements. Do NOT run a verification checklist.
```

Save reviewer output to `review-feedback-v1.json` per review-schema.md.

---

## Step 4: DRAFTER — Revise based on feedback

1. **Apply Part A** with exact string replacements on `.md` files. Use text you have in context from Step 2 — do not re-read unless an edit fails because text shifted. Skip edits that would fabricate content.
2. **Apply Part B** with judgment:
   - **Missed keywords:** add where experience supports it; prefer bullets over summary.
   - **Company angles:** verify claims via WebFetch/WebSearch before weaving in.
   - **Action reframing:** rewrite passive/generic phrasing.
   - **Tone/voice:** apply anti-patterns fixes; run `humanizer` on cover letter if tone is still generic.
3. If revision is substantial, bump to `cv-v2.md` / `cover-letter-v2.md` and update `review-feedback-v2.json`.
4. Reject any suggestion that fabricates skills, years, or credentials.

After edits, files on disk are the final markdown drafts for export.

---

## Step 5: Export and inspect PDFs (MANDATORY)

Follow `skills/draft-review/resources/layout-checklist.md` exactly.

1. Run `skills/doc-export/` — markdown → HTML → PDF.
2. Inspect both PDFs against the checklist.
3. If layout fails: cut using relevance-weighted logic, re-export, re-inspect.
4. **Do not proceed to Step 6 until both PDFs pass.**

---

## Step 6: Final verification and present output

Run `skills/verifier/` **once** on final markdown. Write:
- `cv-verification-report.md`
- `cover-letter-verification-report.md`

Re-read both `.md` files once here to confirm disk state matches your model after Steps 4–5.

### Present to user

1. **Verification checklist** — pass/fail per verifier categories.
2. **Key tailoring decisions** — 3–5 bullets: what was emphasized, company angles used, most impactful reviewer suggestion, gaps acknowledged.
3. **Files created/updated:**
   - `cv-v{n}.md`, `cover-letter-v{n}.md`
   - `review-feedback-v{n}.json`
   - `cv-v{n}.html`, `cv-v{n}.pdf`
   - `cover-letter-v{n}.html`, `cover-letter-v{n}.pdf`
   - verification reports

4. Bump tracker to `ready` if both materials pass verification (`application-tracker`).

Tell the user: "Materials are ready for your review. Open the PDFs before submitting."

---

## Company research alignment

- Reviewer may do light WebSearch for hook critique only.
- Full `skills/company-research/` runs only when user selects job OR Tier S + user confirms — not automatically in this workflow.
- If cover letter Hook is weak and no `research-brief-v1.md`: suggest running `company-research` before final submit.

---

## Related skills (not replaced)

- `skills/cv/` and `skills/cover-letter/` — rules the drafter follows in Step 2
- `skills/doc-export/` — Step 5
- `skills/verifier/` — Step 6 only
- `skills/company-research/` — optional, gated, for strong hooks
