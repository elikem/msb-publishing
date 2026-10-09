# AGENTS.md — My Story Booklet

## Mission

Ship a **Rails** app that personalizes titles (starting with CYKGP), provides a **title catalog**, **book-style page navigator**, **web PDF download**, and **magic-link authentication**. Titles are registered in the database (publish/unpublish + revisions) while placement packages stay on disk under `titles/<slug>/`. Do not expand into print PDF with bleed/crop, or store EPUB unless explicitly asked.

## Sources of truth

1. `docs/brief.md` — product intent and constraints
2. `source/cykgp/*.idml` — page size, frame geometry, styles, story linkage
3. `source/cykgp/*.pdf` — visual reference and fixed-page rasters (trim confirmed 252×306 pt)
4. `titles/<slug>/` — title package (`meta.json` placement + `template/story.css`); see `docs/title-packages.md`
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
- Reader-facing routes load **published** titles only (`Title.find_published!`). Package geometry stays in `meta.json`, not columns.

## Cursor Cloud specific instructions

- Ruby 3.3.6 lives at `/opt/ruby` and Node 22.14.0 at `/opt/node`. `ruby`, `bundle`, `node`, and `yarn` are symlinked into `/usr/local/bin`, and login shells prepend those directories via `/etc/profile.d/msb-toolchain.sh`. `libvips` is installed. Do not install rbenv.
- On boot the environment runs `bin/rails db:prepare`, `bin/rails db:seed`, and `bin/dev` in tmux session `msb-dev`. The app is http://127.0.0.1:3000. If `/up` already returns 200, do not start a second server. If it is down, read `/tmp/cursor/start-user/start-user.log`, then run `bin/rails db:prepare`, `bin/rails db:seed`, and `bin/dev`.
- When Gemfile or JS dependencies change on a branch: `bundle install`, `yarn install --frozen-lockfile`, `yarn build`, and `yarn build:css`. Seed registers and publishes CYKGP.
- Fixed-page PNGs are in `public/booklets/cykgp/pages/`. Regenerating them is optional and needs `pymupdf`.
- Development magic links: Letter Opener + a flash shortcut on the sign-in page.
- Preview loads EB Garamond and Cinzel from Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).
