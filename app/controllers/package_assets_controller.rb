# frozen_string_literal: true

class PackageAssetsController < ApplicationController
  before_action :require_authentication

  def show
    book = params[:book]
    locale = params[:locale]
    file = File.basename(params[:file].to_s)

    title_locale = TitleLocale.joins(:title).find_by!(titles: { slug: book }, locale: locale)

    unless current_user.admin?
      raise ActiveRecord::RecordNotFound unless title_locale.published?
    end

    path = PackageRoot.package_dir(title_locale.package_relative_path).join("pages", file)
    raise ActiveRecord::RecordNotFound unless path.exist? && path.to_s.start_with?(PackageRoot.package_dir(title_locale.package_relative_path).join("pages").to_s)

    expires_in 1.year, public: false
    send_file path, disposition: "inline", type: "image/png"
  end
end
