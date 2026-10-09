# frozen_string_literal: true

class PackageTemplateWriter
  AGENTS_TEMPLATE = Rails.root.join("titles/cykgp/en/AGENTS.md")

  def self.write_agents!(dest)
    template = AGENTS_TEMPLATE.exist? ? AGENTS_TEMPLATE.read : default_agents
    dest.join("AGENTS.md").write(template)
  end

  def self.default_agents
    <<~MD
      # Package agent instructions
      1. Scope work to this package path only.
      2. Placement in meta.json; type in template/story.css only.
      3. Use pages/ PNGs as visual reference.
      4. Record changes in template/NOTES.md.
      5. Run yarn check:titles and bin/rails titles:register[book,locale].
    MD
  end
end
