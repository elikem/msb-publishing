# frozen_string_literal: true

class PackageAssetsController < ApplicationController
  before_action :require_authentication

  def show
    book = params[:book]
    locale = params[:locale]
    file = params[:file].to_s
    raise ActiveRecord::RecordNotFound unless file.match?(/\Apage-\d{2}\.png\z/)

    title_locale = TitleLocale.joins(:title).find_by!(titles: { slug: book }, locale: locale)

    unless current_user.admin?
      raise ActiveRecord::RecordNotFound unless title_locale.published?
    end

    relative = PackageRoot.relative_path_for(title_locale.title.slug, title_locale.locale)
    pages_dir = PackageRoot.package_dir(relative).join("pages")
    path = pages_dir.join(file)
    raise ActiveRecord::RecordNotFound unless path.exist? && path.to_s.start_with?(pages_dir.to_s)

    expires_in 1.year, public: false
    send_file path, disposition: "inline", type: "image/png"
  end
end
