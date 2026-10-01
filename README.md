# My Story Booklet

Web personalization for pre-designed devotionals: a reader writes their own story into a defined section of a title, and the result should read as one continuous, professionally designed booklet — not a bolted-on insert.

First title: **Can You Know God Personally** (CYKGP). The system is designed for many titles; CYKGP is the prototype vehicle.

## Current phase: Prototype (pre-MVP)

A **single-page application** that:

- Recreates CYKGP at true trim size (**3.5in × 4.25in**, 24 pages)
- Makes **PDF/InDesign pages 5–7** a live editable personal-story region
- Shows **live pagination** as the reader types (Paged.js)
- Presents the booklet in a **book-style preview** (page-by-page navigation, not a vertical scroll of all pages)
- Provides a **Download PDF** of the personalized web edition (24 pages)

Not in this phase: accounts, saved drafts, multi-title CMS, print PDF with bleed/crop, store EPUB, or production font licensing.

InDesign (`.indd`) remains the durable design source. IDML + PDF in `source/cykgp/` drive recreation for this prototype. After the prototype works, we will define the MVP full-app stack and language.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Sources

- Product brief: [docs/brief.md](docs/brief.md)
- Design references: [source/cykgp/](source/cykgp/) (IDML, PDF)

## Font substitutes (prototype)

Adobe Garamond and Requiem are replaced with open-license stand-ins (EB Garamond, Cinzel). Confirm embedding rights before MVP.
