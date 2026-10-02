class TitleRevision < ApplicationRecord
  belongs_to :title, inverse_of: :revisions

  validates :revision, presence: true, uniqueness: { scope: :title_id }
  validates :package_path, presence: true
  validate :package_must_exist

  def package_root
    Rails.root.join(package_path)
  end

  def package_present?
    package_root.join("meta.json").exist?
  end

  private

  def package_must_exist
    return if package_path.blank?
    return if package_present?

    errors.add(:package_path, "does not contain meta.json (#{package_path})")
  end
end
