# My Story Booklet — Personalization Pipeline

## Goal

A web application that lets a reader personalize a pre-designed devotional booklet by writing their own story into a defined section of it, then produces a finished, book-quality PDF (and eventually other formats) that reads as one continuous, professionally designed publication — not a template with an obvious insert bolted on.

The first title is *Can You Know God Personally* (CYKGP), but the system is being built to hold many titles, not just this one.

## InDesign is the durable source

Every title's canonical design lives in InDesign, indefinitely. Designers will keep revising `.indd` files over time — the pipeline has to assume ongoing edits, not a one-time, frozen source. Whatever gets built needs a *repeatable* conversion step (something that can be re-run each time a title changes), not a one-off port that goes stale.

## Core mechanism

1. **Per-title editable-region metadata.** Every book gets a small record identifying which page range accepts the reader's own text. For CYKGP, that's **PDF pages 5–7** — a first-person "sample story" section in the original booklet, which the reader's own story replaces. This is data, not a hardcoded assumption: different titles will have different ranges, different page counts, and possibly more than one insert point.
2. **Template conversion.** Each InDesign master gets rebuilt as an HTML/CSS "Paged.js template" — real typography, real colors, real page geometry, matched as closely as practical to the `.indd` source. Target is *visually equivalent*, not literally pixel-identical. IDML export is the practical bridge for this: it's machine-readable XML, so fonts, point sizes, leading, and colors can be pulled out precisely instead of eyeballed off a rendered PDF.
3. **Editable region.** Within the template, the defined page range becomes a live text-input area. The surrounding pages stay fixed. Paged.js paginates the input live, so the person sees in real time how their story fills the pages allotted to it.
4. **Output.** Once finalized, the whole document — fixed pages plus the personalized insert — renders to PDF via Paged.js's own CLI or WeasyPrint, in two variants: an online/web PDF and a print PDF (using CSS's native bleed and crop-mark support).

## Downstream, separate branch: store discovery

One static, non-personalized edition of each title also gets packaged as EPUB (plus PDF, for Google Play) for Kindle Direct Publishing and Google Play Books — for store discovery, not per-user delivery. Neither platform supports publishing a unique edition per user; this branch is a one-time export per title/revision and doesn't touch the personalization pipeline.

## What's confirmed for CYKGP specifically (pulled from the uploaded IDML)

| | |
|---|---|
| Trim size | 3.5in × 4.25in |
| Body type | Adobe Garamond, 9pt / 12pt leading, 9pt first-line indent, justified |
| Opening-paragraph / drop-cap type | Hoefler&Co Requiem (Display HTF Small Caps) |
| Accent color | CMYK 0/70/100/30 → **#B23600** |
| Editable region | PDF pages 5–7 of 24, one continuous story (InDesign story ID spans all three) |

## Known constraints to carry forward

- **Licensed fonts.** Adobe Garamond and Requiem are both commercial typefaces. Confirm web-embedding rights before this goes past prototyping.
- **No native CMYK.** The HTML/CSS render path outputs RGB. If a print vendor needs true CMYK/PDF-X separations, that's a real gap — either a different renderer for that one output, or keep true print exports coming from InDesign directly.
- **Linked assets aren't in the IDML.** CYKGP's photography and paper-texture backgrounds are linked files (EPS), not embedded in the package — each title's actual art needs to be supplied separately (an InDesign "Package" export collects everything into one folder).
- **Content-use notice.** CYKGP's printed matter carries a restriction on reproduction and AI-system use without permission from the rights holder. Confirm the project has that clearance before pipeline work touches the actual devotional text at scale — not just the structural/typographic specs.
- **Ongoing sync cost.** Every InDesign revision needs a human to re-match the HTML/CSS template. There's no reliable automatic bridge for a design this custom — budget for it as recurring work, not a one-time build.

## Explicitly out of scope for now

- Strict hard-limit enforcement on the editable region's page count. The immediate focus is correctly identifying and isolating the editable range per title, not perfecting overflow behavior for this one book.
- Kindle/Google Play personalization. Confirmed as a single static edition per title, not a per-user artifact.
