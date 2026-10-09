# frozen_string_literal: true

class PackageImport < ApplicationRecord
  STATUSES = %w[uploaded processing ready failed].freeze
  STALE_MINUTES = 30

  belongs_to :title_locale

  has_one_attached :source_pdf
  has_one_attached :source_idml

  validates :status, inclusion: { in: STATUSES }

  scope :stale_processing, lambda {
    where(status: "processing").where("started_at < ?", STALE_MINUTES.minutes.ago)
  }

  def mark_stale_failed!
    update!(status: "failed", error: "Import timed out", finished_at: Time.current)
  end
end
