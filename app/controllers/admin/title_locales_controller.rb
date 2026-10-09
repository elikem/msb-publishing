# frozen_string_literal: true

module Admin
  class TitleLocalesController < BaseController
    before_action :set_locale

    def publish
      @title_locale.publish!
      redirect_to admin_books_path, notice: "Published #{@title_locale.name} (#{@title_locale.locale})."
    end

    def unpublish
      @title_locale.unpublish!
      redirect_to admin_books_path, notice: "Unpublished #{@title_locale.name}."
    end

    def archive
      @title_locale.archive!
      redirect_to admin_books_path, notice: "Archived #{@title_locale.name}."
    end

    def register
      @title_locale.register_revision!(source: "repo")
      redirect_to admin_books_path, notice: "Registered new revision for #{@title_locale.package_relative_path}."
    end

    private

    def set_locale
      @title_locale = TitleLocale.find(params[:id])
    end
  end
end
