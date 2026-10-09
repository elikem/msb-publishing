# frozen_string_literal: true

module PackageRoot
  module_function

  def path
    if Rails.env.production?
      Pathname.new(ENV.fetch("PACKAGE_ROOT", "/rails/storage/packages"))
    else
      Rails.root.join("titles")
    end
  end

  def repo_path
    Rails.root.join("titles")
  end

  def package_dir(relative_path)
    path.join(relative_path)
  end

  SLUG_FORMAT = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
  LOCALE_FORMAT = /\A[a-z]{2,3}(-[a-z0-9]{2,8})*\z/

  def relative_path_for(slug, locale)
    slug = slug.to_s
    locale = locale.to_s
    raise ArgumentError, "invalid slug" unless SLUG_FORMAT.match?(slug)
    raise ArgumentError, "invalid locale" unless LOCALE_FORMAT.match?(locale)

    "#{slug}/#{locale}"
  end
end
