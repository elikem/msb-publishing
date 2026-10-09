# frozen_string_literal: true

class PackageImportJob < ApplicationJob
  queue_as :default

  def perform(package_import_id)
    import = PackageImport.find(package_import_id)
    import.update!(status: "processing", started_at: Time.current, error: nil)
    tmp = nil

    locale = import.title_locale
    relative = locale.package_relative_path
    dest = PackageRoot.package_dir(relative)
    tmp = PackageRoot.path.join(".tmp", "#{relative}-#{import.id}")
    FileUtils.rm_rf(tmp)
    FileUtils.mkdir_p(tmp)

    pdf_path = import.source_pdf.download
    PdfRasterizer.rasterize!(pdf_path, tmp, locale.title.slug, locale.locale)

    refresh = dest.join("meta.json").exist?
    if refresh
      meta = JSON.parse(dest.join("meta.json").read)
      meta["pageCount"] = JSON.parse(tmp.join("meta.json").read)["pageCount"]
      meta["trim"] = JSON.parse(tmp.join("meta.json").read)["trim"]
      FileUtils.cp_r(tmp.join("pages"), dest.join("pages"), remove_destination: true)
      dest.join("meta.json").write(JSON.pretty_generate(meta))
      locale.register_revision!(source: "admin", notes: "PDF refresh import #{import.id}")
    else
      FileUtils.mkdir_p(dest.parent)
      FileUtils.rm_rf(dest) if dest.exist?
      FileUtils.mv(tmp, dest)
      PackageTemplateWriter.write_agents!(dest)
    end

    if import.source_idml.attached?
      begin
        IdmlHintExtractor.extract!(import.source_idml.download, dest)
      rescue StandardError => e
        import.update!(warning: "IDML hints skipped: #{e.message}")
      end
    end

    import.update!(status: "ready", finished_at: Time.current)
  rescue StandardError => e
    import.update!(status: "failed", error: e.message, finished_at: Time.current)
    raise
  ensure
    FileUtils.rm_rf(tmp) if tmp&.exist?
  end
end
