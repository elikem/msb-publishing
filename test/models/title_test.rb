require "test_helper"

class TitleTest < ActiveSupport::TestCase
  test "published scope lists only published titles" do
    assert_includes Title.published.pluck(:slug), "cykgp"
    refute_includes Title.published.pluck(:slug), "draft-book"
  end

  test "find_published! returns cykgp and rejects drafts" do
    assert_equal "cykgp", Title.find_published!("cykgp").slug

    assert_raises(ActiveRecord::RecordNotFound) do
      Title.find_published!("draft-book")
    end
  end

  test "publish! and unpublish! toggle status" do
    title = titles(:draft_title)
    title.publish!
    assert title.published?
    assert title.published_at.present?

    title.unpublish!
    assert title.draft?
  end

  test "publish! requires a current revision with a package" do
    title = Title.create!(slug: "empty-book", name: "Empty", status: "draft")

    assert_raises(ArgumentError) { title.publish! }
  end

  test "register_revision! sets current revision" do
    title = Title.create!(slug: "new-book", name: "New Book", status: "draft")
    rev = title.register_revision!(revision: "1", package_path: "titles/cykgp", notes: "reuse package")

    assert_equal rev, title.reload.current_revision
    assert_equal "1", rev.revision
  end

  test "load_package! merges registry metadata" do
    meta = titles(:cykgp).load_package!

    assert_equal "cykgp", meta["slug"]
    assert_equal "cykgp", meta.dig("registry", "slug")
    assert_equal "1", meta.dig("registry", "revision")
    assert_equal "published", meta.dig("registry", "status")
    assert_includes meta["templateCss"], "EB Garamond"
  end
end
