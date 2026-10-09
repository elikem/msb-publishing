# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_09_080400) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.integer "record_id", null: false
    t.integer "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.integer "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "package_imports", force: :cascade do |t|
    t.integer "title_locale_id", null: false
    t.string "status", default: "uploaded", null: false
    t.text "error"
    t.text "warning"
    t.datetime "started_at"
    t.datetime "finished_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["title_locale_id"], name: "index_package_imports_on_title_locale_id"
  end

  create_table "personalizations", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "title_locale_id", null: false
    t.integer "title_revision_id", null: false
    t.text "regions", default: "{}", null: false
    t.datetime "last_saved_at", null: false
    t.integer "last_saved_by_user_id", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["last_saved_by_user_id"], name: "index_personalizations_on_last_saved_by_user_id"
    t.index ["title_locale_id"], name: "index_personalizations_on_title_locale_id"
    t.index ["title_revision_id"], name: "index_personalizations_on_title_revision_id"
    t.index ["user_id", "title_locale_id"], name: "index_personalizations_on_user_id_and_title_locale_id", unique: true
    t.index ["user_id"], name: "index_personalizations_on_user_id"
  end

  create_table "title_locales", force: :cascade do |t|
    t.integer "title_id", null: false
    t.string "locale", null: false
    t.string "name", null: false
    t.text "summary"
    t.string "status", default: "draft", null: false
    t.datetime "published_at"
    t.integer "current_revision_id"
    t.string "sync_status"
    t.text "sync_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["current_revision_id"], name: "index_title_locales_on_current_revision_id"
    t.index ["status"], name: "index_title_locales_on_status"
    t.index ["title_id", "locale"], name: "index_title_locales_on_title_id_and_locale", unique: true
    t.index ["title_id"], name: "index_title_locales_on_title_id"
  end

  create_table "title_revisions", force: :cascade do |t|
    t.string "revision", null: false
    t.string "package_path", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "title_locale_id", null: false
    t.string "package_digest", null: false
    t.text "region_ids"
    t.string "source", default: "repo", null: false
    t.index ["revision"], name: "index_title_revisions_on_title_id_and_revision", unique: true
    t.index ["title_locale_id"], name: "index_title_revisions_on_title_locale_id"
  end

  create_table "titles", force: :cascade do |t|
    t.string "slug", null: false
    t.string "name", null: false
    t.text "summary"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "default_locale", default: "en", null: false
    t.index ["slug"], name: "index_titles_on_slug", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.datetime "last_signed_in_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "admin", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "package_imports", "title_locales"
  add_foreign_key "personalizations", "title_locales"
  add_foreign_key "personalizations", "title_revisions"
  add_foreign_key "personalizations", "users"
  add_foreign_key "personalizations", "users", column: "last_saved_by_user_id"
  add_foreign_key "title_locales", "title_revisions", column: "current_revision_id"
  add_foreign_key "title_locales", "titles"
  add_foreign_key "title_revisions", "title_locales"
end
