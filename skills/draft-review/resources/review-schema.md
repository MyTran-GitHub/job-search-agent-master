# Reviewer Feedback Schema

The reviewer subagent returns feedback in two parts. The drafter applies Part A mechanically and Part B with judgment.

---

## Part A — Structured edits (JSON array)

Each edit is an object:

```json
{
  "file": "cv-v1.md",
  "old_string": "<exact text currently in the draft — must match once>",
  "new_string": "<replacement text>",
  "reason": "<one-line: keyword match | company angle | reframing | style>"
}
```

**Rules:**
- `file` must be `cv-v1.md` or `cover-letter-v1.md` (or `cv-v2.md` / `cover-letter-v2.md` if version bumped).
- `old_string` must be quoted exactly from the inline drafts passed to the reviewer — unique enough to match once.
- Skip any edit whose `new_string` would fabricate skills, employers, years, or credentials not in `library/context/experience/`.

**Example:**

```json
[
  {
    "file": "cv-v1.md",
    "old_string": "Built spatial data pipelines with Python",
    "new_string": "Built PostGIS spatial data pipelines with Python and GDAL geoprocessing",
    "reason": "keyword match — posting requires PostGIS and GDAL"
  },
  {
    "file": "cover-letter-v1.md",
    "old_string": "I am excited to apply for this role.",
    "new_string": "EcoSpatial's recent wetland-mapping initiative maps directly to my Sentinel-2 segmentation work.",
    "reason": "company angle — replace generic opener with firm-specific hook"
  }
]
```

---

## Part B — Narrative suggestions (prose)

Produce each category even if the finding is "no issues."

### Missed keywords / requirements
What to add and roughly where, when a clean Part A string replacement is not possible. Prefer experience bullets over summary claims.

### Company / department-specific angles
Connections between candidate experience and company priorities. Based on lightweight WebSearch or `research-brief-v1.md` if present. Flag unverified claims for drafter to WebFetch before including.

### Action-oriented reframing
Passive, generic, or low-energy statements to rewrite. Structural weakness that does not fit a single-sentence swap (e.g. "restructure opening paragraph around strongest posting match").

### Tone and voice issues
Check against `library/context/voice/anti-patterns.md`, `voice-profile.md`, and `identity.md`. Flag clichés, hedging, over-humility, register mismatch. Cover letter must sound like the candidate, not generic AI.

---

## Persisted artifact

Save combined feedback to:

`workspace/applications/{company}-{role}/review-feedback-v1.json`

```json
{
  "reviewed_at": "2026-07-06",
  "company": "EcoSpatial Inc",
  "role": "Junior Geospatial Engineer",
  "part_a_edits": [ ... ],
  "part_b": {
    "missed_keywords": "...",
    "company_angles": "...",
    "action_reframing": "...",
    "tone_voice": "..."
  }
}
```

Bump to `review-feedback-v2.json` only when re-running reviewer on a distinct draft version.
