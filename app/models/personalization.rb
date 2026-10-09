# frozen_string_literal: true

class Personalization < ApplicationRecord
  MAX_REGIONS = 10
  MAX_REGION_LENGTH = 50_000

  belongs_to :user
  belongs_to :title_locale
  belongs_to :title_revision
  belongs_to :last_saved_by_user, class_name: "User"

  scope :outdated, lambda {
    joins(:title_locale).where("personalizations.title_revision_id != title_locales.current_revision_id")
  }

  validates :regions, presence: true
  validate :regions_shape

  def regions_hash
    JSON.parse(regions)
  rescue JSON::ParserError
    {}
  end

  def outdated?
    title_revision_id != title_locale.current_revision_id
  end

  def orphaned_region_ids
    current_ids = title_locale.current_revision&.region_id_list || []
    regions_hash.keys - current_ids
  end

  def last_saved_by_admin?
    last_saved_by_user_id != user_id
  end

  def merge_regions!(incoming)
    merged = regions_hash.merge(incoming.stringify_keys)
    self.regions = merged.to_json
  end

  private

  def regions_shape
    hash = regions_hash
    fail_keys = hash.keys.length > MAX_REGIONS
    errors.add(:regions, "too many regions") if fail_keys
    hash.each_value do |text|
      errors.add(:regions, "region too long") if text.to_s.length > MAX_REGION_LENGTH
    end
  end
end
