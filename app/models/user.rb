class User < ApplicationRecord
  NORMALIZED_EMAIL = ->(value) { value.to_s.strip.downcase }

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  before_validation :normalize_email

  def self.find_or_create_by_email!(email)
    normalized = NORMALIZED_EMAIL.call(email)
    find_or_create_by!(email: normalized)
  end

  private

  def normalize_email
    self.email = NORMALIZED_EMAIL.call(email)
  end
end
