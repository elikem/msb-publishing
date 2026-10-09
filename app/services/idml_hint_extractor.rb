# frozen_string_literal: true

require "zip"
require "nokogiri"

class IdmlHintExtractor
  MAX_ENTRIES = 2000
  MAX_UNCOMPRESSED = 200.megabytes

  def self.extract!(idml_path, package_dir)
    new(idml_path, package_dir).extract!
  end

  def initialize(idml_path, package_dir)
    @idml_path = idml_path
    @package_dir = package_dir
  end

  def extract!
    entries = 0
    total = 0
    hints = { "frames" => [] }

    Zip::File.open(@idml_path) do |zip|
      zip.each do |entry|
        entries += 1
        raise "IDML zip too large" if entries > MAX_ENTRIES
        total += entry.size
        raise "IDML uncompressed too large" if total > MAX_UNCOMPRESSED
      end

      spread_pages = page_order(zip)
      spread_pages.each do |page_number, spread_file|
        spread_xml = zip.read(spread_file)
        doc = Nokogiri::XML(spread_xml) { |cfg| cfg.strict.nonet }
        doc.xpath("//TextFrame").each do |frame|
          bounds = frame_bounds(frame, doc)
          next unless bounds

          hints["frames"] << {
            "page" => page_number,
            "insets" => bounds
          }
        end
      end
    end

    @package_dir.join("template/hints.json").write(JSON.pretty_generate(hints))
  end

  def page_order(zip)
    design = zip.read("designmap.xml")
    doc = Nokogiri::XML(design) { |cfg| cfg.strict.nonet }
    pages = []
    page_num = 0
    doc.xpath("//idPkg:Spread", "idPkg" => "http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging").each do |spread|
      spread_src = spread["src"]
      spread_xml = zip.read(spread_src)
      sdoc = Nokogiri::XML(spread_xml) { |cfg| cfg.strict.nonet }
      sdoc.xpath("//Page").each do |_page|
        page_num += 1
        pages << [ page_num, spread_src ]
      end
    end
    pages
  rescue StandardError
    []
  end

  def frame_bounds(frame, _doc)
    geo = frame.at_xpath(".//Properties/PathGeometry/GeometryPathType/PathPointArray/PathPointType/Anchor")
    return nil unless geo

    anchor = geo["Anchor"].to_s.split.map(&:to_f)
    return nil unless anchor.length >= 2

    { "topPt" => anchor[1].abs, "leftPt" => anchor[0].abs, "rightPt" => 36, "bottomPt" => 28 }
  end
end
