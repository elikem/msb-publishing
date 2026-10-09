# Admin: packages, import, and personalizations

## Create a language package (Phase C)

One form, two file fields:

| Field | Required | Purpose |
| --- | --- | --- |
| Trim PDF | Yes | Rasterize `pages/page-{nn}.png`; seed `pageCount` and trim in `meta.json` |
| IDML | No | Writes `template/hints.json` only (suggested boxes/styles). Admin confirms in mapper. |
| INDD | Not accepted | Designer files stay outside the app |

After upload, use the bounding-box mapper and `story.css` editor to define `editableRegions`, then register a revision and publish the locale.

## Agent-editable packages

Admin upload bootstraps `PACKAGE_ROOT/<book>/<locale>/`. Fidelity improvements are edits to `meta.json`, `template/story.css`, and `template/NOTES.md`, then `bin/rails titles:register[book,locale]`. Re-upload PDF only when fixed-page art changes.

Admin-made packages on the production volume: download the package zip from the admin UI and copy into `titles/<book>/<locale>/` in git before agent edits.

## Deploy sync

`bin/rails titles:sync` (docker entrypoint) copies repo packages into the production package root and registers when the digest changes. Locales whose current revision has `source: admin` are skipped and marked `sync_status: blocked`.

Back up `/rails/storage` in production (SQLite, packages, Active Storage).

## Admin access

- First **verified** sign-in promotes one admin when none exist.
- `thesignificanceproject@cru.org` is always admin.
- Other admins are granted in `/admin/admins`.
- Admins use **Switch to reader** for their own booklets; `/admin` for books, personalizations, and admins.

## Reader personalizations

One saved draft per user per language edition. Explicit Save; leaving with unsaved changes prompts. Drafts pin a `title_revision_id`; outdated drafts warn when the locale’s published revision advances. Admins can list, edit, and override drafts in `/admin/personalizations`.
