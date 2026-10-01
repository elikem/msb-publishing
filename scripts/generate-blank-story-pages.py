#!/usr/bin/env python3
"""Rasterize blank story pages 5–7 from the CYKGP demo template PDF."""
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "source/cykgp/CYKGP_Demo_Template.pdf"
OUT = ROOT / "public/assets/cykgp/pages"
SCALE = 3

# Demo template PDF page index -> booklet page number.
# PDF page 5 (index 4) is printed page 5 with the "One Person's Search" heading.
PAGE_MAP = (
    (4, 5),
    (5, 6),
    (6, 7),
)


def main() -> None:
    if not PDF.is_file():
        raise SystemExit(f"Missing demo template PDF: {PDF}")
    OUT.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF)
    for pdf_index, page_number in PAGE_MAP:
        if pdf_index >= doc.page_count:
            raise SystemExit(f"PDF has no page index {pdf_index}")
        pix = doc[pdf_index].get_pixmap(matrix=pymupdf.Matrix(SCALE, SCALE), alpha=False)
        name = f"page-{page_number:02d}.png"
        pix.save(OUT / name)
        print("Wrote", name)
    doc.close()


if __name__ == "__main__":
    main()
