---
visa:
  requires_sponsorship: true
  authorized: [F1-OPT, CPT]
location: [US, Remote-US]
exclude:
  clearance: [TS, SCI, TS/SCI]
  citizenship_only: true
experience:
  max_years_required: 2
---

# Candidate Constraints

Hard filters read this file. Edit values above to match your situation.

- **visa.requires_sponsorship**: If true, jobs requiring US citizenship or denying OPT/CPT are rejected.
- **visa.authorized**: Visa types you hold or will hold at start date.
- **location**: Acceptable work locations.
- **exclude.clearance**: Clearance levels that disqualify a role.
- **exclude.citizenship_only**: Reject roles that require US citizenship only.
- **experience.max_years_required**: Reject roles requiring more years than this (entry-level ceiling).
