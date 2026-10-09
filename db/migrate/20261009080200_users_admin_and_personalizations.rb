class UsersAdminAndPersonalizations < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :admin, :boolean, null: false, default: false

    create_table :personalizations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :title_locale, null: false, foreign_key: true
      t.references :title_revision, null: false, foreign_key: true
      t.text :regions, null: false, default: "{}"
      t.datetime :last_saved_at, null: false
      t.references :last_saved_by_user, null: false, foreign_key: { to_table: :users }
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :personalizations, [ :user_id, :title_locale_id ], unique: true
  end
end
