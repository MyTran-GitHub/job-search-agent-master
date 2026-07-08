---
name: apply
description: Bridge a ranked job into the application pipeline. Triggers on /apply.
---

# apply

Seed an application folder from a ranked job.

## Run

```bash
npm run apply <jobId>
```

`jobId` is the 16-char hash from `workspace/jobs/ranked/{jobId}/`.

## What it creates

```
workspace/applications/{company}-{role}/
├── job.md              # JD + tier summary + decision justification
├── application.md      # same (skills compatibility)
├── verdict.json        # tier, optimization summary, plan path
```

Also seeds a row in `workspace/applications/tracker.md` at stage `tailoring`.

## Next steps (agent skills, in order)

**Tier S/A (recommended):** run `skills/draft-review/` — full drafter → reviewer → revise → export → verify loop.

**Tier B or quick path:** run `skills/cv/` then `skills/cover-letter/` then `skills/verifier/` then `skills/doc-export/` individually.

1. **`skills/draft-review/`** — orchestrates CV + cover letter with reviewer pass (Tier S/A)
2. **`skills/company-research/`** — ONLY if Tier S and user confirms, OR user explicitly requests (strengthens cover letter Hook)
3. **`skills/verifier/`** + **`skills/doc-export/`** — included inside draft-review; run separately only on quick path

## Gate

Tier D jobs are blocked by the CLI. Warn user if applying to Tier C.
