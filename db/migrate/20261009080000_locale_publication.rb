class LocalePublication < ActiveRecord::Migration[8.1]
  def up
    add_column :titles, :default_locale, :string, null: false, default: "en"

    create_table :title_locales do |t|
      t.references :title, null: false, foreign_key: true
      t.string :locale, null: false
      t.string :name, null: false
      t.text :summary
      t.string :status, null: false, default: "draft"
      t.datetime :published_at
      t.references :current_revision, foreign_key: { to_table: :title_revisions }, null: true
      t.string :sync_status
      t.text :sync_message
      t.timestamps
    end
    add_index :title_locales, [ :title_id, :locale ], unique: true
    add_index :title_locales, :status

    add_reference :title_revisions, :title_locale, foreign_key: true, null: true
    add_column :title_revisions, :package_digest, :string
    add_column :title_revisions, :region_ids, :text
    add_column :title_revisions, :source, :string, null: false, default: "repo"

    migrate_titles_to_locales
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end

  def migrate_titles_to_locales
    Title.reset_column_information
    TitleRevision.reset_column_information

    Title.find_each do |title|
      locale = TitleLocale.create!(
        title: title,
        locale: title.default_locale || "en",
        name: title.name,
        summary: title.summary,
        status: title.status,
        published_at: title.published_at
      )

      title.revisions.find_each do |rev|
        relative = rev.package_path.to_s.sub(%r{\Atitles/}, "")
        relative = "cykgp/en" if relative == "cykgp"

        rev.update!(
          title_locale_id: locale.id,
          package_path: relative,
          source: "repo"
        )
      end

      if title.current_revision_id
        locale.update!(current_revision_id: title.current_revision_id)
      end

      locale.revisions.find_each do |rev|
        next unless rev.package_present?

        digest = PackageDigest.compute(rev.package_path)
        rev.update!(package_digest: digest, region_ids: PackageDigest.region_ids_from_meta(rev.package_path).to_json)
      end
    end
  end
end
