# frozen_string_literal: true

module Admin
  class PackagesController < BaseController
    before_action :set_locale

    def edit
      @relative = @title_locale.package_relative_path
      @meta_json = PackageRoot.package_dir(@relative).join("meta.json").read
      @story_css = PackageRoot.package_dir(@relative).join("template/story.css").read
      @hints = read_hints
      @page_count = JSON.parse(@meta_json)["pageCount"]
    end

    def update
      relative = @title_locale.package_relative_path
      root = PackageRoot.package_dir(relative)
      meta = JSON.parse(params.require(:meta_json))
      css = params.require(:story_css)

      root.join("meta.json").write(JSON.pretty_generate(meta))
      root.join("template/story.css").write(css)
      TitlePackageValidator.validate!(relative)
      @title_locale.register_revision!(source: "admin", notes: "Admin package editor")

      redirect_to admin_edit_package_path(@title_locale), notice: "Package saved and revision registered."
    rescue TitlePackageValidator::ValidationError => e
      flash[:alert] = e.message
      redirect_to admin_edit_package_path(@title_locale)
    end

    def download
      relative = PackageRoot.relative_path_for(@title_locale.title.slug, @title_locale.locale)
      root = PackageRoot.package_dir(relative)
      require "zip"

      archive_name = relative.tr("/", "-")
      zip_path = Rails.root.join("tmp", "#{archive_name}-package.zip")
      Zip::File.open(zip_path, create: true) do |zip|
        zip.add("meta.json", root.join("meta.json").to_s)
        zip.add("AGENTS.md", root.join("AGENTS.md").to_s) if root.join("AGENTS.md").exist?
        root.glob("template/**/*").each do |file|
          zip.add(file.relative_path_from(root).to_s, file.to_s) if file.file?
        end
        root.glob("pages/**/*").each do |file|
          zip.add(file.relative_path_from(root).to_s, file.to_s) if file.file?
        end
      end
      send_file zip_path, filename: "#{archive_name}.zip", type: "application/zip"
    end

    private

    def set_locale
      @title_locale = TitleLocale.find(params[:id])
    end

    def read_hints
      path = PackageRoot.package_dir(@title_locale.package_relative_path).join("template/hints.json")
      path.exist? ? JSON.parse(path.read) : {}
    rescue JSON::ParserError
      {}
    end
  end
end
