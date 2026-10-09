# frozen_string_literal: true

module Admin
  class PackageImportsController < BaseController
    def index
      PackageImport.stale_processing.find_each(&:mark_stale_failed!)
      @imports = PackageImport.includes(title_locale: :title).order(created_at: :desc)
    end

    def new
      @import = PackageImport.new
      @titles = Title.order(:name)
    end

    def create
      title = params[:book_slug].present? ? Title.find_by!(slug: params[:book_slug]) : Title.create!(
        slug: params.require(:new_book_slug),
        name: params.require(:new_book_name),
        default_locale: params[:locale]
      )

      locale = title.locales.find_or_create_by!(locale: params.require(:locale)) do |loc|
        loc.name = params.require(:locale_name)
        loc.summary = params[:locale_summary]
      end

      pdf = params.require(:source_pdf)
      raise ArgumentError, "PDF required" unless pdf.respond_to?(:read)
      raise ArgumentError, "INDD not accepted" if params[:source_indd].present?

      import = locale.package_imports.create!(status: "uploaded")
      import.source_pdf.attach(pdf)
      import.source_idml.attach(params[:source_idml]) if params[:source_idml].present?

      PackageImportJob.perform_later(import.id)
      redirect_to admin_package_import_path(import), notice: "Import queued."
    rescue StandardError => e
      redirect_to new_admin_package_import_path, alert: e.message
    end

    def show
      @import = PackageImport.find(params[:id])
    end

    def retry
      import = PackageImport.find(params[:id])
      import.update!(status: "uploaded", error: nil)
      PackageImportJob.perform_later(import.id)
      redirect_to admin_package_import_path(import), notice: "Retry queued."
    end
  end
end
