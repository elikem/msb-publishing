class CleanupTitlePublication < ActiveRecord::Migration[8.1]
  def up
    remove_reference :titles, :current_revision, foreign_key: { to_table: :title_revisions }
    remove_column :titles, :status, :string
    remove_column :titles, :published_at, :datetime
    remove_reference :title_revisions, :title, foreign_key: true
    change_column_null :title_revisions, :title_locale_id, false
    change_column_null :title_revisions, :package_digest, false
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
