# frozen_string_literal: true

class PackageDigest
  def self.compute(relative_path)
    root = PackageRoot.package_dir(relative_path)
    raise ArgumentError, "Package missing: #{relative_path}" unless root.join("meta.json").exist?

    meta = root.join("meta.json").read
    story_path = story_css_path(root)
    story = story_path.read

    digester = Digest::SHA256.new
    digester.update(meta)
    digester.update(story)
    raster_paths(root).each do |file|
      digester.update(file.read)
    end
    digester.hexdigest
  end

  def self.region_ids_from_meta(relative_path)
    meta = JSON.parse(PackageRoot.package_dir(relative_path).join("meta.json").read)
    (meta["editableRegions"] || []).map { |r| r["id"] }.compact
  end

  def self.story_css_path(root)
    meta = JSON.parse(root.join("meta.json").read)
    rel = meta.dig("template", "storyCss") || "template/story.css"
    path = root.join(rel)
    raise ArgumentError, "Missing story CSS" unless path.exist?
    path
  end

  def self.raster_paths(root)
    meta = JSON.parse(root.join("meta.json").read)
    page_count = meta["pageCount"].to_i
    pattern = meta.dig("assets", "pagePattern") || "pages/page-{nn}.png"
    (1..page_count).map do |n|
      nn = format("%02d", n)
      rel = pattern.gsub("{nn}", nn)
      file = root.join(rel)
      raise ArgumentError, "Missing raster #{rel}" unless file.exist?
      file
    end
  end
end
