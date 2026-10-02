class TitleCatalog
  ROOT = Rails.root.join("titles")

  def self.slugs
    ROOT.children
      .select(&:directory?)
      .map { |path| path.basename.to_s }
      .reject { |name| name.start_with?(".") }
      .sort
  end

  def self.find!(slug)
    path = ROOT.join(slug, "meta.json")
    raise ActiveRecord::RecordNotFound, "Unknown title: #{slug}" unless path.exist?

    meta = JSON.parse(path.read)
    story_rel = meta.dig("template", "storyCss") || "template/story.css"
    story_path = ROOT.join(slug, story_rel)
    raise ActiveRecord::RecordNotFound, "Missing story CSS for title: #{slug}" unless story_path.exist?

    meta.merge("templateCss" => story_path.read)
  end
end
