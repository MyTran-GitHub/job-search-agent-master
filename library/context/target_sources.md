# Target ATS Sources

Priority employer boards scraped during `npm run scrape` in addition to TinyFish search.
Only public JSON feeds — no login. Edit tokens to match employers you care about.

Format (one board per bullet):

`- {ats}:{token} | {Company Display Name}`

Where `ats` is `greenhouse`, `lever`, or `ashby`.

## Boards

- greenhouse:planet | Planet
- greenhouse:indigog | Indigo Ag
- lever:watershed | Watershed
- ashby:pachama | Pachama
- greenhouse:muirai | Muir AI

## Notes

- Wrong or stale tokens are skipped with a warning; scrape continues.
- Prefer climate / EO / sustainability employers over general tech boards.
- Keep this list short (5–20). Discovery quality beats volume.
