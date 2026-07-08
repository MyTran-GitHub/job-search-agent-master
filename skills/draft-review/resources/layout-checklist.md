# Layout Checklist — HTML/PDF (Mandatory)

**Never skip this step.** Markdown that looks fine often produces broken PDFs: CV spilling to page 2, cover letter cut off, orphaned section headers at page breaks.

This repo uses **markdown → HTML template → PDF** via `skills/doc-export/` and `scripts/export_pdf.mjs` — not LaTeX.

---

## 5a. Export

1. Fill `resources/resume-template.html` / `resources/cover-letter-template.html` from final markdown.
2. Write `cv-v{n}.html` and `cover-letter-v{n}.html` to the application folder.
3. **Linkify** bare URLs and emails (blue underlined links):
   ```bash
   node scripts/linkify.mjs --file workspace/applications/{company}-{role}/cv-v{n}.html --in-place
   node scripts/linkify.mjs --file workspace/applications/{company}-{role}/cover-letter-v{n}.html --in-place
   ```
4. Render PDFs:

```bash
node scripts/export_pdf.mjs workspace/applications/{company}-{role}/cv-v{n}.html
node scripts/export_pdf.mjs workspace/applications/{company}-{role}/cover-letter-v{n}.html
```

If render fails, fix HTML and re-run until clean.

---

## 5b. Inspect layout

Read both PDFs (or HTML in browser) and verify:

### CV (`cv-v{n}.pdf`)

- [ ] Exactly **1 page** for US roles (default)
- [ ] **≤2 pages** for Canadian roles with real tenure (per `skills/cv/`)
- [ ] No orphaned section heading at bottom of page 1 with content on page 2
- [ ] No job/education title line separated from its bullets
- [ ] No awkward whitespace gaps or near-empty trailing page

### Cover letter (`cover-letter-v{n}.pdf`)

- [ ] Exactly **1 page**
- [ ] Closing / signature block visible — not cut off or pushed to page 2
- [ ] Word count within ceiling (see `skills/cover-letter/resources/architecture.md`)

---

## 5c. Iterate until clean

If layout fails, edit markdown (not HTML style block) and re-export.

**Relevance-weighted cutting** (when content must be trimmed):

Score each candidate line by:
1. Relevance to THIS posting's keywords and responsibilities
2. Uniqueness (duplicated elsewhere in CV or cover letter?)
3. Narrative load (does the cover letter depend on it?)

Cut lowest total score first — **not** by static section order. An older-role bullet that hits posting keywords beats a recent bullet that does not.

**Common fixes:**
- CV spills to page 2: cut lowest-relevance bullet; shorten summary; drop oldest irrelevant role
- Cover letter spills to page 2: cut sentences that restate CV bullets; trim Hook if over word ceiling
- Orphaned heading: move a bullet up or cut a less relevant entry to pull section together

Do not shrink font or margins in the HTML template to cheat pagination.

---

## 5d. Clean up

Keep `.md`, `.html`, and `.pdf` in the application folder. No LaTeX build artifacts apply.
