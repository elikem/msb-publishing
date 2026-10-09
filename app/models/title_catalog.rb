# frozen_string_literal: true

class TitleCatalog
  def self.discover_packages
    root = PackageRoot.repo_path
    packages = []
    root.children.select(&:directory?).each do |book_dir|
      next if book_dir.basename.to_s.start_with?(".")

      book_dir.children.select(&:directory?).each do |locale_dir|
        next if locale_dir.basename.to_s.start_with?(".")
        next unless locale_dir.join("meta.json").exist?

        packages << "#{book_dir.basename}/#{locale_dir.basename}"
      end
    end
    packages.sort
  end

  def self.load_package!(relative_path, digest: nil)
    root = PackageRoot.package_dir(relative_path)
    path = root.join("meta.json")
    raise ActiveRecord::RecordNotFound, "Unknown title package: #{relative_path}" unless path.exist?

    meta = JSON.parse(path.read)
    story_rel = meta.dig("template", "storyCss") || "template/story.css"
    story_path = root.join(story_rel)
    raise ActiveRecord::RecordNotFound, "Missing story CSS for package: #{relative_path}" unless story_path.exist?

    meta = meta.merge(
      "templateCss" => story_path.read,
      "packagePath" => relative_path.to_s
    )

    rewrite_asset_urls!(meta, relative_path, digest)
    meta
  end

  def self.rewrite_asset_urls!(meta, relative_path, digest)
    pattern = meta.dig("assets", "pagePattern").to_s
    return if pattern.blank?

    parts = relative_path.split("/")
    book = parts[0]
    locale = parts[1]
    version = digest ? "?v=#{digest}" : ""

    if pattern.start_with?("/")
      meta["assets"]["pagePattern"] = "/packages/#{book}/#{locale}/pages/page-{nn}.png#{version}"
    else
      # relative pattern pages/page-{nn}.png
      meta["assets"]["pagePattern"] = "/packages/#{book}/#{locale}/#{pattern.gsub('{nn}', '{nn}')}#{version}"
      # Fix: pattern already has {nn}, URL should be /packages/book/locale/pages/page-{nn}.png
      meta["assets"]["pagePattern"] = "/packages/#{book}/#{locale}/pages/page-{nn}.png#{version}"
    end
  end
end
