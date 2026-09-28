# AGENTS.md — My Story Booklet

## Mission

Ship a **prototype SPA** that proves live personalization of CYKGP pages 5–7, a **book-style page navigator**, and **web PDF download**. Do not expand into MVP (backend, auth, multi-title tooling, print PDF) unless explicitly asked.

## Sources of truth

1. `docs/brief.md` — product intent and constraints
2. `source/cykgp/*.idml` — page size, frame geometry, styles, story linkage
3. `source/cykgp/*.pdf` — visual reference and fixed-page rasters (trim confirmed 252×306 pt)
4. `.indd` — designer canonical file; do not treat as a parse target in-app

## Prototype rules

- SPA only (Vite + HTML/CSS/JS). No framework/backend language lock-in yet.
- Editable region comes from **title metadata**, not hardcoded “pages 5–7” scattered in logic.
- Fixed pages may use PDF page images; editable pages must be real HTML/CSS text flow.
- **Book preview:** one page at a time with prev/next — not a vertical scroll through all pages.
- **PDF download:** client-side web PDF from the same Paged.js layout; no server required for prototype.
- Prefer visual equivalence over pixel-perfect InDesign parity.
- Do not embed commercial Adobe/Requiem fonts without confirmed rights; use documented substitutes.
- Respect rights-holder restrictions in the brief when handling devotional text.
- Keep marketing chrome minimal; core UI is book preview + story editor + download.

## When moving to MVP (later)

Revisit: app language, persistence, repeatable IDML→HTML conversion workflow, server-side PDF (Paged.js CLI / WeasyPrint), print PDF with bleed/crop, true CMYK / PDF-X, licensed fonts, and hard overflow rules for the editable region.
