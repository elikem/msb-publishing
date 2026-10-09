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
end
