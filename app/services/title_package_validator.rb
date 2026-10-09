# frozen_string_literal: true

class TitlePackageValidator
  class ValidationError < StandardError; end

  SLUG = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
  ACCENT = /\A#[0-9A-Fa-f]{6}\z/

  def self.validate!(relative_path)
    new(relative_path).validate!
  end

  def initialize(relative_path)
    @root = PackageRoot.package_dir(relative_path)
    @relative_path = relative_path
    @errors = []
  end

  def validate!
    fail!("Package missing at #{@relative_path}") unless @root.join("meta.json").exist?

    @meta = JSON.parse(@root.join("meta.json").read)
    @story_css = PackageDigest.story_css_path(@root).read

    check_schema
    check_story_css
    check_regions
    check_rasters

    raise ValidationError, @errors.join("\n") if @errors.any?

    true
  end

  private

  def fail!(message)
    @errors << message
  end

  def check_schema
    version = @meta["schemaVersion"]
    fail!("schemaVersion must be 1 or 2") unless [ 1, 2 ].include?(version)

    slug = @meta["slug"]
    fail!("slug invalid") unless slug.is_a?(String) && SLUG.match?(slug)

    if version == 2
      fail!("locale required") unless @meta["locale"].is_a?(String)
      expected_id = "#{slug}-#{@meta['locale']}"
      fail!("id must be #{expected_id}") unless @meta["id"] == expected_id
    else
      fail!("id must match slug") unless @meta["id"] == slug
    end

    fail!("title required") unless @meta["title"].to_s.strip.present?
    fail!("pageCount invalid") unless @meta["pageCount"].is_a?(Integer) && @meta["pageCount"] >= 1
    fail!("accent invalid") unless ACCENT.match?(@meta.dig("color", "accent").to_s)

    pattern = @meta.dig("assets", "pagePattern")
    fail!("pagePattern must include {nn}") unless pattern.to_s.include?("{nn}")
  end

  def check_story_css
    css = @story_css.gsub(%r{/\*.*?\*/}m, "")
    fail!("story.css must not contain @page") if css.match?(/@page\b/)
    fail!("story.css must not contain @import") if css.match?(/@import\b/)
    fail!("story.css must not contain external url()") if css.match?(/url\s*\(\s*['"]?(?!data:)/i)
    fail!("story.css must not contain </style") if @story_css.include?("</style")
  end

  def check_regions
    regions = @meta["editableRegions"]
    fail!("editableRegions required") unless regions.is_a?(Array) && regions.any?

    seen_pages = Set.new
    seen_ids = Set.new
    regions.each_with_index do |region, index|
      label = "editableRegions[#{index}]"
      id = region["id"]
      fail!("#{label}.id invalid") unless id.is_a?(String) && SLUG.match?(id)
      fail!("#{label}.id duplicated") if seen_ids.include?(id)
      seen_ids << id

      region["pages"].each do |page|
        fail!("page #{page} out of range") unless page.is_a?(Integer) && page.between?(1, @meta["pageCount"])
        fail!("page #{page} duplicated") if seen_pages.include?(page)
        seen_pages << page
        box = region.dig("textBoxes", page.to_s)
        fail!("missing textBoxes[#{page}]") unless box
      end
    end
  end

  def check_rasters
    PackageDigest.raster_paths(@root)
  rescue ArgumentError => e
    fail!(e.message)
  end
end
