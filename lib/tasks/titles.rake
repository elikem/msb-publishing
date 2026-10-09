# frozen_string_literal: true

namespace :titles do
  desc "Register one package from disk (book slug and locale)"
  task :register, %i[book locale] => :environment do |_t, args|
    book = args[:book]
    locale = args[:locale]
    abort "Usage: bin/rails titles:register[book,locale]" if book.blank? || locale.blank?

    title_locale = TitleLocale.joins(:title).find_by!(titles: { slug: book }, locale: locale)
    rev = title_locale.register_revision!(source: "repo")
    puts "Registered #{book}/#{locale} revision #{rev.revision} digest=#{rev.package_digest[0, 12]}..."
  end

  desc "Sync repo packages into PACKAGE_ROOT and register when digest differs"
  task sync: :environment do
    TitleCatalog.discover_packages.each do |relative|
      parts = relative.split("/")
      book_slug = parts[0]
      locale_code = parts[1]
      title = Title.find_by(slug: book_slug)
      next unless title

      title_locale = title.locales.find_by(locale: locale_code)
      next unless title_locale

      current = title_locale.current_revision
      if current&.source == "admin"
        title_locale.update!(
          sync_status: "blocked",
          sync_message: "Current revision is admin-sourced; sync skipped."
        )
        puts "skip #{relative} (admin source)"
        next
      end

      dest = PackageRoot.package_dir(relative)
      src = PackageRoot.repo_path.join(relative)
      next unless src.exist?

      FileUtils.mkdir_p(dest.dirname)
      if Rails.env.production?
        FileUtils.rm_rf(dest) if dest.exist?
        FileUtils.cp_r(src, dest)
      end

      digest = PackageDigest.compute(relative)
      if current&.package_digest == digest
        puts "ok #{relative} (unchanged)"
        next
      end

      title_locale.register_revision!(source: "repo", notes: "titles:sync")
      title_locale.update!(sync_status: nil, sync_message: nil)
      puts "registered #{relative}"
    end
  end
end
