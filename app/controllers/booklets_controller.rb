class BookletsController < ApplicationController
  before_action :require_authentication

  def redirect_to_locale
    title = Title.find_by!(slug: params[:slug])
    locale = title.default_published_locale
    raise ActiveRecord::RecordNotFound unless locale

    redirect_to booklet_locale_path(slug: title.slug, locale: locale.locale)
  end

  def show
    @title_locale = TitleLocale.find_published!(params[:slug], params[:locale])
    @title_meta = @title_locale.load_package!
    @personalization = current_user.personalizations.find_by(title_locale: @title_locale)
    @save_url = booklet_personalization_path(slug: params[:slug], locale: params[:locale])
    @admin_edit = false
  end
end
