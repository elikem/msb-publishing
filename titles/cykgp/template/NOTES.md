# CYKGP story template

This folder is the recreated editable region for *Can You Know God Personally*. It is the web template. The InDesign file remains the design source; this is what the app actually renders.

| Piece | Where it lives |
| --- | --- |
| Which pages accept the story, and the text box on each page | `../meta.json` → `editableRegions` |
| Body type, leading, indent, drop cap | `story.css` |
| Fixed-page artwork | `public/assets/cykgp/pages/page-{nn}.png` |
| Designer inputs this recreation was matched to | `source/cykgp/` |

`story.css` must not contain `@page` rules. A text box change belongs in `meta.json`. The engine compiles those insets into Paged.js page rules and pins them onto each page before the page is shown on its own.

## Recreation notes

- Trim is 252pt × 306pt (3.5in × 4.25in).
- Page 5 clears the “One Person’s Search” heading (`topPt: 52`). Pages 6 and 7 use `topPt: 32`. Left, right, and bottom insets match on all three.
- Adobe Garamond is substituted with EB Garamond. Requiem is substituted with Cinzel. Both are loaded by the app shell.
- Raster pages come from `npm run generate:pages` and `npm run generate:blank-story-pages`. Re-run those after a PDF export changes, then re-check the text boxes against the new art.

When InDesign changes, update this folder and `meta.json` together, and record what changed here. Do not teach `src/book`, `src/story`, or `src/export` anything about this title.
