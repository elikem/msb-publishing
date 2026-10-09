class TitlesController < ApplicationController
  before_action :require_authentication

  def index
    @locales = TitleLocale.published.ordered.includes(:title, :current_revision)
    @personalizations = current_user.personalizations.where(title_locale_id: @locales.map(&:id)).index_by(&:title_locale_id)
  end
end
