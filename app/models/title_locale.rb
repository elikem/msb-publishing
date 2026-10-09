# frozen_string_literal: true

class TitleLocale < ApplicationRecord
  STATUSES = %w[draft published archived].freeze
  LOCALE_FORMAT = /\A[a-z]{2,3}(-[a-z0-9]{2,8})*\z/

  belongs_to :title
  belongs_to :current_revision, class_name: "TitleRevision", optional: true
  has_many :revisions, class_name: "TitleRevision", dependent: :destroy, inverse_of: :title_locale
  has_many :personalizations, dependent: :restrict_with_error
  has_many :package_imports, dependent: :destroy
  validates :locale, presence: true, format: { with: LOCALE_FORMAT }
  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :locale, uniqueness: { scope: :title_id }

  scope :published, -> { where(status: "published") }
  scope :ordered, -> { joins(:title).order("titles.name", :locale) }

  def self.find_published!(slug, locale)
    joins(:title).merge(Title.where(slug: slug)).published.find_by!(locale: locale)
  end

  def published?
    status == "published"
  end

  def package_relative_path
    "#{title.slug}/#{locale}"
  end

  def publish!
    raise ArgumentError, "Cannot publish without a current revision" unless current_revision
    raise ArgumentError, "Package missing" unless current_revision.package_present?

    update!(status: "published", published_at: published_at || Time.current)
  end

  def unpublish!
    update!(status: "draft")
  end

  def archive!
    update!(status: "archived")
  end

  def register_revision!(source: "repo", notes: nil)
    PackageRegistrar.register!(self, source: source, notes: notes)
  end

  def load_package!
    raise ActiveRecord::RecordNotFound, "No current revision" unless current_revision

    digest = current_revision.package_digest
    meta = TitleCatalog.load_package!(current_revision.package_path, digest: digest).merge(
      "registry" => {
        "slug" => title.slug,
        "locale" => locale,
        "revision" => current_revision.revision,
        "status" => status,
        "title_locale_id" => id
      }
    )
    meta
  end

  def outdated_personalizations
    return Personalization.none unless current_revision_id

    personalizations.where.not(title_revision_id: current_revision_id)
  end
end
