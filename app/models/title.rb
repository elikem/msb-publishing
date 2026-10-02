class Title < ApplicationRecord
  STATUSES = %w[draft published archived].freeze

  has_many :revisions, class_name: "TitleRevision", dependent: :destroy, inverse_of: :title
  belongs_to :current_revision, class_name: "TitleRevision", optional: true

  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/, message: "must be a lowercase slug" }
  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :published, -> { where(status: "published") }
  scope :ordered, -> { order(:name) }

  def self.find_published!(slug)
    published.find_by!(slug: slug)
  end

  def published?
    status == "published"
  end

  def draft?
    status == "draft"
  end

  def archived?
    status == "archived"
  end

  def publish!
    raise ArgumentError, "Cannot publish without a current revision" unless current_revision
    raise ArgumentError, "Package missing at #{current_revision.package_path}" unless current_revision.package_present?

    update!(status: "published", published_at: published_at || Time.current)
  end

  def unpublish!
    update!(status: "draft")
  end

  def archive!
    update!(status: "archived")
  end

  def register_revision!(revision:, package_path: nil, notes: nil, make_current: true)
    path = package_path.presence || "titles/#{slug}"
    rev = revisions.find_or_initialize_by(revision: revision.to_s)
    rev.package_path = path
    rev.notes = notes if notes
    rev.save!

    update!(current_revision: rev) if make_current || current_revision_id.nil?
    rev
  end

  def load_package!
    raise ActiveRecord::RecordNotFound, "Title #{slug} has no current revision" unless current_revision

    TitleCatalog.load_package!(current_revision.package_path).merge(
      "registry" => {
        "slug" => slug,
        "revision" => current_revision.revision,
        "status" => status
      }
    )
  end
end
