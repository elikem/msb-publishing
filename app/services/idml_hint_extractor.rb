# frozen_string_literal: true

require "zip"
require "nokogiri"

class IdmlHintExtractor
  MAX_ENTRIES = 2000
  MAX_UNCOMPRESSED = 200.megabytes
  IDPKG = "http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  CONTINUATION_TOP_FUDGE_PT = 5
  OPENING_TOP_EXTRA_PT = 20
  PACKAGE_SIDE_FUDGE_PT = 9
  TYPICAL_BOTTOM_PT = 28
  OPENING_COLUMN_TARGET_PT = 180

  def self.extract!(idml_path, package_dir)
    trim = read_trim(package_dir)
    hints = extract_hints(idml_path, trim: trim)
    package_dir.join("template/hints.json").write(JSON.pretty_generate(hints))
  end

  def self.extract_hints(idml_path, trim:)
    new(idml_path, trim).extract_hints
  end

  def initialize(idml_path, trim)
    @idml_path = idml_path
    @trim_w = trim.fetch("widthPt").to_f
    @trim_h = trim.fetch("heightPt").to_f
  end

  def extract_hints
    entries = 0
    total = 0
    frames_by_page = Hash.new { |h, k| h[k] = [] }

    Zip::File.open(@idml_path) do |zip|
      zip.each do |entry|
        entries += 1
        raise "IDML zip too large" if entries > MAX_ENTRIES

        total += entry.size
        raise "IDML uncompressed too large" if total > MAX_UNCOMPRESSED
      end

      page_order(zip).each do |slot|
        spread_xml = zip.read(slot[:spread_src])
        doc = Nokogiri::XML(spread_xml) { |cfg| cfg.strict.nonet }
        page_el = doc.at_xpath("//Page[@Self='#{slot[:page_self]}']")
        next unless page_el

        page_rect = page_rect_spread(page_el)
        page_rect[:number] = slot[:page]
        spread_pages = doc.xpath("//Page").map do |page|
          rect = page_rect_spread(page)
          rect[:number] = page["Self"] == slot[:page_self] ? slot[:page] : nil
          rect
        end

        doc.xpath("//TextFrame").each do |frame|
          next if frame["ParentStory"].blank? || frame["ParentStory"] == "n"

          rect = frame_rect_spread(frame)
          next unless rect

          page_number = page_for_rect(spread_pages, rect)
          next unless page_number == slot[:page]

          raw = raw_insets(page_rect, rect)
          next unless raw

          frames_by_page[page_number] << {
            "self" => frame["Self"],
            "story" => frame["ParentStory"],
            "previous" => frame["PreviousTextFrame"],
            "next" => frame["NextTextFrame"],
            "raw" => raw
          }
        end
      end
    end

    thread = pick_story_thread(frames_by_page)
    polished = polish_thread(thread)

    {
      "frames" => polished.map do |page, insets|
        { "page" => page, "primary" => true, "insets" => insets }
      end
    }
  end

  def self.read_trim(package_dir)
    meta_path = package_dir.join("meta.json")
    if meta_path.exist?
      JSON.parse(meta_path.read).fetch("trim")
    else
      { "widthPt" => 252, "heightPt" => 306 }
    end
  end

  private

  def page_order(zip)
    design = zip.read("designmap.xml")
    doc = Nokogiri::XML(design) { |cfg| cfg.strict.nonet }
    pages = []
    page_num = 0
    doc.xpath("//idPkg:Spread", "idPkg" => IDPKG).each do |spread|
      spread_src = spread["src"]
      spread_xml = zip.read(spread_src)
      sdoc = Nokogiri::XML(spread_xml) { |cfg| cfg.strict.nonet }
      sdoc.xpath("//Page").each do |page|
        page_num += 1
        pages << { page: page_num, spread_src: spread_src, page_self: page["Self"] }
      end
    end
    pages
  rescue StandardError
    []
  end

  def parse_transform(matrix)
    values = matrix.to_s.split.map(&:to_f)
    raise "bad transform" unless values.length == 6

    values
  end

  def apply_transform(matrix, x, y)
    a, b, c, d, tx, ty = matrix
    [ a * x + c * y + tx, b * x + d * y + ty ]
  end

  def page_rect_spread(page)
    matrix = parse_transform(page["ItemTransform"])
    y0, x0, y1, x1 = page["GeometricBounds"].to_s.split.map(&:to_f)
    corners = [ [ x0, y0 ], [ x1, y0 ], [ x1, y1 ], [ x0, y1 ] ]
    spread_corners = corners.map { |x, y| apply_transform(matrix, x, y) }
    xs = spread_corners.map(&:first)
    ys = spread_corners.map(&:last)
    {
      number: nil,
      left: xs.min,
      right: xs.max,
      top: ys.min,
      bottom: ys.max
    }
  end

  def frame_rect_spread(frame)
    matrix = parse_transform(frame["ItemTransform"])
    anchors = frame.xpath(".//PathPointType").map do |point|
      ax, ay = point["Anchor"].to_s.split.map(&:to_f)
      apply_transform(matrix, ax, ay)
    end
    return nil if anchors.empty?

    xs = anchors.map(&:first)
    ys = anchors.map(&:last)
    { left: xs.min, top: ys.min, right: xs.max, bottom: ys.max }
  rescue StandardError
    nil
  end

  def page_for_rect(pages, rect)
    cx = (rect[:left] + rect[:right]) / 2.0
    cy = (rect[:top] + rect[:bottom]) / 2.0
    hit = pages.find { |page| cx >= page[:left] && cx <= page[:right] && cy >= page[:top] && cy <= page[:bottom] }
    hit&.dig(:number)
  end

  def raw_insets(page_rect, rect)
    return nil unless page_rect

    width = rect[:right] - rect[:left]
    height = rect[:bottom] - rect[:top]
    return nil if width < 40 || height < 12

    {
      top_pt: rect[:top] - page_rect[:top],
      left_pt: rect[:left] - page_rect[:left],
      right_pt: page_rect[:right] - rect[:right],
      bottom_pt: page_rect[:bottom] - rect[:bottom],
      width_pt: width,
      height_pt: height
    }
  end

  def pick_story_thread(frames_by_page)
    threads = Hash.new { |h, k| h[k] = [] }
    frames_by_page.each do |page, frames|
      frames.each do |frame|
        threads[frame["story"]] << frame.merge("page" => page)
      end
    end

    best = []
    threads.each_value do |frames|
      starts = frames.select { |f| f["previous"].blank? || f["previous"] == "n" }
      starts = frames if starts.empty?
      starts.each do |start|
        chain = []
        current = start
        seen = {}
        while current && !seen[current["self"]]
          seen[current["self"]] = true
          chain << current
          nxt = current["next"]
          break if nxt.blank? || nxt == "n"

          current = frames.find { |f| f["self"] == nxt }
        end
        best = chain if chain.length > best.length
      end
    end

    best
  end

  def polish_thread(thread)
    return {} if thread.empty?

    raw_by_page = thread.to_h { |frame| [ frame["page"], frame["raw"] ] }
    pages = raw_by_page.keys.sort
    continuation = raw_by_page[pages[1]] || raw_by_page[pages.first]
    col_w = continuation[:width_pt]
    centered_side = (@trim_w - col_w) / 2.0
    side = centered_side < 33 ? centered_side + PACKAGE_SIDE_FUDGE_PT : centered_side
    side = side.round
    cont_top = (continuation[:top_pt] + CONTINUATION_TOP_FUDGE_PT).round
    bottom = TYPICAL_BOTTOM_PT

    pages.each_with_index.to_h do |page, index|
      if index.zero?
        open_col = raw_by_page[page][:width_pt]
        open_col = OPENING_COLUMN_TARGET_PT if open_col < 175
        side_open = ((@trim_w - open_col) / 2.0).round
        [
          page,
          {
            "topPt" => cont_top + OPENING_TOP_EXTRA_PT,
            "leftPt" => side_open,
            "rightPt" => side_open,
            "bottomPt" => bottom
          }
        ]
      else
        raw = raw_by_page[page]
        bottom_pt = raw[:bottom_pt] < 20 ? bottom : raw[:bottom_pt].round
        [
          page,
          {
            "topPt" => cont_top,
            "leftPt" => side,
            "rightPt" => side,
            "bottomPt" => bottom_pt
          }
        ]
      end
    end
  end
end
