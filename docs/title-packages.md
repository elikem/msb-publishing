# Title packages

Each book is a folder. The personalization engine reads that folder and does not contain page numbers, trim sizes, or text-box insets for any title.

This is the prototype shape. A later app can store the same folder in object storage or a database without changing what a package means.

## Three layers

```text
source/<slug>/                         designer inputs
  IDML, PDF, linked art                the app never imports these

titles/<slug>/                         the recreated template
  meta.json                            placement contract
  template/story.css                   typography recreation
  template/NOTES.md                    what was matched, and when

public/booklets/<slug>/pages/          fixed-page rasters
  page-01.png …                        addressed by meta.json

app/models/title.rb                    publication registry (status, current revision)
app/models/title_revision.rb           package_path + revision label
app/models/title_catalog.rb            loads packages from disk for Rails
app/javascript/booklet/                paginate, preview, download
```

`source/` is where a revision starts. `titles/<slug>/` is where the revision lands after someone recreates it for the web. Fixed pages stay under `public/` so the preview can request them by URL. `meta.json` points at those files with `assets.pagePattern`. The database registry decides which packages are published to readers.

## What is data, and what is the template

**Placement is data** in `editableRegions`. A region names the booklet pages that share one reader-written story, in reading order, and the text box on each of those pages. Insets are points from the trim edge: `topPt`, `rightPt`, `bottomPt`, `leftPt`.

**The template is the recreation** in `template/story.css`: font, size, leading, justification, indent, drop cap. That file is mounted into the page and also handed to Paged.js so line breaks and the preview use the same type. It must not contain `@page` rules. Those are generated from the text boxes so the CSS cannot drift from `meta.json`.

At layout time the engine compiles `@page` rules from those insets: `:first` for the opening page, the base `@page` for the pages that follow when they share a box, and `:nth(n)` when each page has its own box. It paginates the reader’s text with that CSS plus `story.css`, then writes the same insets onto each page element. The inline box travels with the page into the one-page preview and the PDF.

## Contract

`schemaVersion` is `1`. The folder name, `id`, and `slug` are the same value.

```json
{
  "schemaVersion": 1,
  "id": "cykgp",
  "slug": "cykgp",
  "title": "Can You Know God Personally",
  "trim": { "widthIn": 3.5, "heightIn": 4.25, "widthPt": 252, "heightPt": 306 },
  "pageCount": 24,
  "color": { "accent": "#B23600" },
  "assets": { "pagePattern": "/booklets/cykgp/pages/page-{nn}.png" },
  "template": { "storyCss": "template/story.css" },
  "editableRegions": [
    {
      "id": "personal-story",
      "label": "Your story",
      "flow": "continuous",
      "opening": "drop-cap",
      "pages": [5, 6, 7],
      "textBoxes": {
        "5": { "topPt": 52, "rightPt": 36, "bottomPt": 28, "leftPt": 36 },
        "6": { "topPt": 32, "rightPt": 36, "bottomPt": 28, "leftPt": 36 },
        "7": { "topPt": 32, "rightPt": 36, "bottomPt": 28, "leftPt": 36 }
      }
    }
  ]
}
```

`flow` is `continuous`: one story runs through every page in `pages`, in order. `opening` is `drop-cap` or `plain`.

A second insert, on a different title or a later revision of this one, is another object in `editableRegions`. Pages cannot belong to two regions. The prototype editor binds to the first region. Preview and PDF already walk every region, so a second region does not require a new exporter.

`{nn}` in `pagePattern` is the booklet page number padded to two digits.

`yarn check:titles` checks every package: folder name, schema, text boxes, that `story.css` exists and has no `@page` rules, and that page rasters exist for `pagePattern`.

## Adding a book

1. Export IDML and PDF into `source/<slug>/`.
2. Rasterize fixed pages into `public/booklets/<slug>/pages/`.
3. Add `titles/<slug>/meta.json` with trim, page count, and one text box per editable page.
4. Recreate the editable type in `titles/<slug>/template/story.css`.
5. Write `titles/<slug>/template/NOTES.md` with the source revision and anything that was matched by eye.
6. Run `yarn check:titles`.
7. Register the title in the database (see seeds / `Title` + `TitleRevision`), set `package_path` to `titles/<slug>`, then `publish!`.

No change under `app/javascript/booklet/` is required for a book that fits this contract: one continuous story per region, fixed pages as images, web PDF at trim size.

## Title registry

The filesystem package is still the placement contract. The Rails `Title` / `TitleRevision` models are the publication registry:

| Field | Role |
| --- | --- |
| `Title.slug` / `name` / `summary` | Catalog identity and copy |
| `Title.status` | `draft`, `published`, or `archived` |
| `TitleRevision.revision` | Opaque revision label (e.g. `"1"`) |
| `TitleRevision.package_path` | Path to the package root (`titles/<slug>`) |
| `Title.current_revision` | Which package revision readers get |

Readers hit `/` for published titles and `/booklets/:slug` for the editor. Unpublished slugs 404. Placement insets are never columns on `titles`.

Example (also what `db/seeds.rb` does for CYKGP):

```ruby
title = Title.find_or_initialize_by(slug: "cykgp")
title.update!(name: "Can You Know God Personally", summary: "…")
title.register_revision!(revision: "1", package_path: "titles/cykgp")
title.publish!
```

## How this grows further

Keep the package as the unit of publication. Split the repository later; do not invent a second way to describe a text box.

| Later piece | What it stores |
| --- | --- |
| Conversion pipeline | Reads `source/<slug>/`, writes a title package. Re-run when InDesign changes. Still a human-guided recreation. |
| Admin UI | Create/edit registry rows, publish/unpublish, point at a new revision. |
| Reader draft | `{ titleSlug, revision, regions: { "personal-story": "…" } }`. Text is keyed by region id. |
| Web app | The same engine. It loads a package and previews one page at a time. |
| Print PDF | A second renderer can consume the same `meta.json`. Bleed and CMYK do not belong in the placement contract. |

The app shell (catalog, editor, page navigator, download) stays title-agnostic. Book-specific logic stays in the package that was recreated from that book’s InDesign file.
