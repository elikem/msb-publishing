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
    load_package!("titles/#{slug}")
  end

  def self.load_package!(package_path)
    root = Rails.root.join(package_path)
    path = root.join("meta.json")
    raise ActiveRecord::RecordNotFound, "Unknown title package: #{package_path}" unless path.exist?

    meta = JSON.parse(path.read)
    story_rel = meta.dig("template", "storyCss") || "template/story.css"
    story_path = root.join(story_rel)
    raise ActiveRecord::RecordNotFound, "Missing story CSS for package: #{package_path}" unless story_path.exist?

    meta.merge("templateCss" => story_path.read, "packagePath" => package_path.to_s)
  end
end
