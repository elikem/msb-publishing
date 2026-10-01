#!/usr/bin/env python3
"""Rasterize source PDF into public/assets/cykgp/pages/page-NN.png."""
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "source/cykgp/Can_You_Know_God_2025.pdf"
OUT = ROOT / "public/assets/cykgp/pages"
SCALE = 3


def main() -> None:
    if not PDF.is_file():
        raise SystemExit(f"Missing PDF: {PDF}")
    OUT.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF)
    for i in range(doc.page_count):
        pix = doc[i].get_pixmap(matrix=pymupdf.Matrix(SCALE, SCALE), alpha=False)
        name = f"page-{i + 1:02d}.png"
        pix.save(OUT / name)
        print("Wrote", name)


if __name__ == "__main__":
    main()
