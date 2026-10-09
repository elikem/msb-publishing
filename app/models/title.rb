# frozen_string_literal: true

class Title < ApplicationRecord
  has_many :locales, class_name: "TitleLocale", dependent: :destroy, inverse_of: :title

  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/, message: "must be a lowercase slug" }
  validates :name, presence: true
  validates :default_locale, presence: true

  def default_published_locale
    locales.published.find_by(locale: default_locale) || locales.published.order(:locale).first
  end
end
