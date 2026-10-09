class CreatePackageImports < ActiveRecord::Migration[8.1]
  def change
    create_table :package_imports do |t|
      t.references :title_locale, null: false, foreign_key: true
      t.string :status, null: false, default: "uploaded"
      t.text :error
      t.text :warning
      t.datetime :started_at
      t.datetime :finished_at
      t.timestamps
    end
  end
end
