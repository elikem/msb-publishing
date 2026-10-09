# Title packages

Each **language edition** is a folder under `titles/<book-slug>/<locale>/`. The personalization engine reads that folder; page numbers, trim, and text-box insets never live in app code.

## Layout

```text
source/<slug>/                    designer inputs (optional reference)
titles/<book>/<locale>/           package root (also PACKAGE_ROOT in dev)
  meta.json                       placement contract (schema v2)
  template/story.css              typography
  template/NOTES.md               recreation log
  template/hints.json             IDML hints only (optional)
  pages/page-01.png …             fixed-page rasters
  AGENTS.md                       per-package agent rules

app/models/title_locale.rb        publication + current revision
app/models/title_revision.rb      immutable digest-backed revision
app/models/title_catalog.rb       loads package from PACKAGE_ROOT
app/javascript/booklet/           paginate, preview, download
```

Page images are served at `/packages/<book>/<locale>/pages/page-{nn}.png?v=<digest>` (not under `public/`).

## Placement vs template

**Placement** — `editableRegions[]`: region id, label, `flow`, `opening`, `pages[]`, per-page `textBoxes` (insets in pt from trim).

**Template** — `template/story.css`: fonts, size, leading, indent, drop cap. No `@page`, `@import`, or external `url()`.

## schemaVersion 2

```json
{
  "schemaVersion": 2,
  "slug": "cykgp",
  "locale": "en",
  "id": "cykgp-en",
  "title": "Can You Know God Personally",
  "trim": { "widthIn": 3.5, "heightIn": 4.25, "widthPt": 252, "heightPt": 306 },
  "pageCount": 24,
  "color": { "accent": "#B23600" },
  "assets": { "pagePattern": "pages/page-{nn}.png" },
  "template": { "storyCss": "template/story.css" },
  "editableRegions": [ … ]
}
```

Region ids are **permanent** once readers may have saved text keyed by them.

## Registry

| Model | Role |
| --- | --- |
| `Title` | Book family: `slug`, `name`, `default_locale` |
| `TitleLocale` | Language edition: `locale`, reader `name`, `status`, `current_revision_id` |
| `TitleRevision` | Immutable: `package_path` (relative to PACKAGE_ROOT), `package_digest`, `region_ids`, `source` (`repo` / `admin`) |

Readers: `TitleLocale.find_published!(slug, locale)` → `load_package!`. Catalog lists published locales. `/booklets/:slug` redirects to the default published locale.

Register after disk edits: `bin/rails titles:register[book,locale]`. Deploy: `bin/rails titles:sync`.

## Reader drafts (`personalizations`)

SQLite rows: one per user per `title_locale`. `regions` JSON keyed by region id; `title_revision_id` pin; `lock_version` for conflicts. Text only — no PDF blobs. See `docs/admin-import.md`.

## Validation

- `yarn check:titles` — all packages, or `yarn check:titles cykgp/en` for one scope.
- Ruby `TitlePackageValidator` — registrar, admin save, import (production has no Node).
- Shared invalid fixtures under `test/fixtures/packages/invalid/`.

## Adding a book

Use the admin wizard (PDF required, IDML optional) or manually:

1. Create `titles/<book>/<locale>/` with `meta.json`, `story.css`, rasters in `pages/`.
2. `yarn check:titles <book>/<locale>`
3. Register locale in DB and `bin/rails titles:register[book,locale]`
4. Publish the `TitleLocale`

The booklet navigator, layout, and PDF export stay title-agnostic.
