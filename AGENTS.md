# AGENTS.md — My Story Booklet

## Mission

Ship a **prototype SPA** that proves live personalization of CYKGP pages 5–7, a **book-style page navigator**, and **web PDF download**. Do not expand into MVP (backend, auth, multi-title tooling, print PDF) unless explicitly asked.

## Sources of truth

1. `docs/brief.md` — product intent and constraints
2. `docs/title-packages.md` — how a recreated book is stored, and how text boxes are applied
3. `titles/<slug>/` — the title package: `meta.json` placement plus `template/story.css`
4. `source/<slug>/` — IDML and PDF. Page size, frame geometry, and visual reference. Not imported by the app
5. `.indd` — designer canonical file; do not treat as a parse target in-app

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

## Cursor Cloud specific instructions

- Canonical setup is in the README: `npm ci`, then `npm run dev`. Vite serves the SPA at http://127.0.0.1:5173. There is no backend, database, or secret.
- Confirm a production bundle with `npm run build`. There is no lint or test script in `package.json`.
- Fixed-page PNGs are already in `public/assets/cykgp/pages/`. `npm run generate:pages` only regenerates those images and needs the Python package `pymupdf`, which is not required to install, build, or run the app.
- `npm run check:titles` validates every title package. Story typography is `titles/<slug>/template/story.css`; page insets are compiled from `meta.json` and are not hand-written CSS.
- The preview loads EB Garamond and Cinzel from Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).
