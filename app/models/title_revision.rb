# frozen_string_literal: true

class TitleRevision < ApplicationRecord
  belongs_to :title_locale, inverse_of: :revisions
  has_many :personalizations, dependent: :restrict_with_error

  validates :revision, presence: true, uniqueness: { scope: :title_locale_id }
  validates :package_path, presence: true
  validates :package_digest, presence: true
  validates :source, inclusion: { in: %w[repo admin] }
  validate :package_must_exist

  def package_root
    PackageRoot.package_dir(package_path)
  end

  def package_present?
    package_root.join("meta.json").exist?
  end

  def region_id_list
    JSON.parse(region_ids.presence || "[]")
  rescue JSON::ParserError
    []
  end

  private

  def package_must_exist
    return if package_path.blank?
    return if package_present?

    errors.add(:package_path, "does not contain meta.json (#{package_path})")
  end
end
