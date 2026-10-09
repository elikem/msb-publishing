# frozen_string_literal: true

class PackageRegistrar
  class RegistrationError < StandardError; end

  def self.register!(title_locale, source: "repo", notes: nil)
    new(title_locale, source: source, notes: notes).register!
  end

  def initialize(title_locale, source:, notes: nil)
    @locale = title_locale
    @source = source
    @notes = notes
    @relative_path = title_locale.package_relative_path
  end

  def register!
    TitlePackageValidator.validate!(@relative_path)
    digest = PackageDigest.compute(@relative_path)
    region_ids = PackageDigest.region_ids_from_meta(@relative_path)

    current = @locale.current_revision
    if current&.package_digest == digest
      return current
    end

    referenced = Personalization.where(title_locale_id: @locale.id).pluck(:regions).flat_map { |r| JSON.parse(r).keys }.uniq
    dropped = referenced - region_ids
    if dropped.any?
      raise RegistrationError, "Cannot drop region ids referenced by reader drafts: #{dropped.join(', ')}"
    end

    next_label = (@locale.revisions.maximum(:revision).to_i + 1).to_s

    if current && current.revision == next_label
      raise RegistrationError, "Revision label collision"
    end

    rev = @locale.revisions.create!(
      revision: next_label,
      package_path: @relative_path,
      package_digest: digest,
      region_ids: region_ids.to_json,
      source: @source,
      notes: @notes
    )
    @locale.update!(current_revision: rev)
    rev
  end
end
