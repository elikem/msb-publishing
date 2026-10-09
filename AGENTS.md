# AGENTS.md — My Story Booklet

## Mission

Ship a **Rails** app that personalizes titles (starting with CYKGP), provides a **title catalog**, **book-style page navigator**, **web PDF download**, and **magic-link authentication**. Book families and language editions are registered in the database; placement packages stay on disk under `titles/<book-slug>/<locale>/`. Do not expand into print PDF with bleed/crop, or store EPUB unless explicitly asked.

## Sources of truth

1. `docs/brief.md` — product intent and constraints
2. `source/cykgp/*.idml` — page size, frame geometry, styles, story linkage
3. `source/cykgp/*.pdf` — visual reference and fixed-page rasters (trim confirmed 252×306 pt)
4. `titles/<book>/<locale>/` — language package (`meta.json` + `template/story.css`); see `docs/title-packages.md`
5. `.indd` — designer canonical file; do not treat as a parse target in-app

## App rules

- Rails 8 + Hotwire/Stimulus + esbuild; booklet UI is server-rendered ERB with Stimulus controllers.
- Auth is passwordless magic links (signed tokens + session cookie).
- Editable region comes from **title metadata**, not hardcoded “pages 5–7” scattered in logic.
- Fixed pages may use PDF page images; editable pages must be real HTML/CSS text flow (Paged.js).
- **Book preview:** one page at a time with prev/next — not a vertical scroll through all pages.
- **PDF download:** client-side web PDF from the same Paged.js layout; no server required for prototype.
- Prefer visual equivalence over pixel-perfect InDesign parity.
- Do not embed commercial Adobe/Requiem fonts without confirmed rights; use documented substitutes.
- Respect rights-holder restrictions in the brief when handling devotional text.
- Keep marketing chrome minimal; core UI is sign-in + title catalog + book preview + story editor + download.
- Reader-facing routes load **published language editions** only (`TitleLocale.find_published!(slug, locale)`). Package geometry stays in `meta.json`, not columns.
- Reader story text is stored in SQLite `personalizations` rows, not in package files.

## Improving a title package

Target path: `titles/<book-slug>/<locale>/` (see per-package `AGENTS.md` in that folder).

- Edit only `meta.json` (`editableRegions` / `textBoxes`), `template/story.css`, `template/NOTES.md`.
- Visual reference: package `pages/` PNGs; optional `source/<slug>/` PDF and IDML.
- Validate: `yarn check:titles <book>/<locale>`, then `bin/rails titles:register[book,locale]`.
- Region ids are permanent; never rename or remove one referenced by reader drafts.
- Do not hardcode page numbers or insets in `app/javascript/booklet/` or controllers.
- Do not use admin PDF re-upload for CSS or box tweaks.
- Admin-made packages: download zip from admin UI into `titles/<book>/<locale>/` before editing in git.
- Drafts are DB rows; package files are template fidelity only.

## Cursor Cloud specific instructions

- Canonical setup: `bundle install`, `yarn install`, `bin/rails db:prepare`, `bin/rails db:seed`, then `bin/dev` (or `bin/rails server` with `yarn build --watch` / CSS watch). App at http://127.0.0.1:3000. Seed registers and publishes CYKGP.
- Ruby via rbenv if needed (`.ruby-version`); Node for esbuild/Tailwind.
- Confirm assets with `yarn build && yarn build:css`.
- Fixed-page PNGs live in each package under `titles/<book>/<locale>/pages/` (served via `/packages/...`). Regenerating from PDF uses admin import or libvips in development.
- Development magic links: Letter Opener + a flash shortcut on the sign-in page.
- Preview loads EB Garamond and Cinzel from Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).
