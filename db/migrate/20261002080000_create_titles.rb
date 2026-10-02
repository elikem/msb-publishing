class CreateTitles < ActiveRecord::Migration[8.1]
  def change
    create_table :titles do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.string :status, null: false, default: "draft"
      t.text :summary
      t.datetime :published_at

      t.timestamps
    end

    add_index :titles, :slug, unique: true
    add_index :titles, :status

    create_table :title_revisions do |t|
      t.references :title, null: false, foreign_key: true
      t.string :revision, null: false
      t.string :package_path, null: false
      t.text :notes

      t.timestamps
    end

    add_index :title_revisions, [ :title_id, :revision ], unique: true

    add_reference :titles, :current_revision, foreign_key: { to_table: :title_revisions }, null: true
  end
end
