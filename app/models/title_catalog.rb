class TitleCatalog
  ROOT = Rails.root.join("titles")

  def self.find!(slug)
    path = ROOT.join(slug, "meta.json")
    raise ActiveRecord::RecordNotFound, "Unknown title: #{slug}" unless path.exist?

    JSON.parse(path.read)
  end
end
