# CYKGP package — agent instructions

Until Phase A migration, this package lives at `titles/cykgp/`. After migration it moves to `titles/cykgp/en/`.

1. Scope work to **this package path only**.
2. Placement goes in `meta.json` → `editableRegions` / `textBoxes` (pt insets). Type goes in `template/story.css` only: no `@page`, no `@import`, no external `url()`.
3. Use this package's `pages/` PNGs (or `public/booklets/cykgp/pages/` until rasters move), plus `source/cykgp/` PDF and IDML when present, as visual reference.
4. Record every change in `template/NOTES.md`.
5. Run `yarn check:titles` (or `yarn check:titles cykgp/en` after migration), fix all errors, then run `bin/rails titles:register[cykgp,en]` (adjust book/locale for path).
6. Never put book-specific page numbers or insets in `app/javascript/booklet/` or Rails controllers.
7. Never re-run the admin PDF upload for CSS or box tweaks.
