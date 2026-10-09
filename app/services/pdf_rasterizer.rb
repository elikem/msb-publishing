# frozen_string_literal: true

class PdfRasterizer
  DPI = 300

  def self.rasterize!(pdf_path, output_dir, book_slug, locale)
    require "vips"

    pages_dir = output_dir.join("pages")
    FileUtils.mkdir_p(pages_dir)

    doc = Vips::Image.pdfload(pdf_path, dpi: DPI, n: -1, page: 0)
    page_count = doc.get("n-pages") || 1

    raise ArgumentError, "PDF exceeds 200 pages" if page_count > 200

    width_pt = (doc.width * 72.0 / DPI).round(2)
    height_pt = (doc.height * 72.0 / DPI).round(2)

    (0...page_count).each do |index|
      page = Vips::Image.pdfload(pdf_path, dpi: DPI, page: index)
      nn = format("%02d", index + 1)
      page.write_to_file(pages_dir.join("page-#{nn}.png").to_s)
    end

    meta = {
      "schemaVersion" => 2,
      "slug" => book_slug,
      "locale" => locale,
      "id" => "#{book_slug}-#{locale}",
      "title" => output_dir.join("meta.json").exist? ? JSON.parse(output_dir.join("meta.json").read)["title"] : book_slug.upcase,
      "trim" => {
        "widthIn" => (width_pt / 72.0).round(4),
        "heightIn" => (height_pt / 72.0).round(4),
        "widthPt" => width_pt,
        "heightPt" => height_pt
      },
      "pageCount" => page_count,
      "color" => { "accent" => "#112233" },
      "assets" => { "pagePattern" => "pages/page-{nn}.png" },
      "template" => { "storyCss" => "template/story.css" },
      "editableRegions" => []
    }

    output_dir.join("meta.json").write(JSON.pretty_generate(meta))
    story_path = output_dir.join("template/story.css")
    FileUtils.mkdir_p(story_path.dirname)
    unless story_path.exist?
      story_path.write(default_story_css)
    end
    output_dir.join("template/NOTES.md").write("# Imported from PDF\n")
  end

  def self.default_story_css
    <<~CSS
      .story-document .story-sheet,
      .pagedjs_page {
        font-family: "EB Garamond", Georgia, serif;
        font-size: 9pt;
        line-height: 12pt;
        text-align: justify;
        color: #1a1a1a;
      }
    CSS
  end
end
