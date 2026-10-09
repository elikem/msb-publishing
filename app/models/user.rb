# frozen_string_literal: true

class User < ApplicationRecord
  OPERATOR_EMAIL = "thesignificanceproject@cru.org"

  NORMALIZED_EMAIL = ->(value) { value.to_s.strip.downcase }

  has_many :personalizations, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  before_validation :normalize_email

  def self.find_or_create_by_email!(email)
    normalized = NORMALIZED_EMAIL.call(email)
    find_or_create_by!(email: normalized)
  end

  def admin?
    admin || email == OPERATOR_EMAIL
  end

  def operator?
    email == OPERATOR_EMAIL
  end

  private

  def normalize_email
    self.email = NORMALIZED_EMAIL.call(email)
  end
end
