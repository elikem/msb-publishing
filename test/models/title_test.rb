require "test_helper"

class TitleTest < ActiveSupport::TestCase
  test "published locales scope" do
    assert_includes TitleLocale.published.map { |l| l.title.slug }, "cykgp"
    refute_includes TitleLocale.published.map { |l| l.title.slug }, "draft-book"
  end

  test "find_published locale" do
    locale = TitleLocale.find_published!("cykgp", "en")
    assert_equal "en", locale.locale
  end

  test "locale publish requires revision" do
    locale = title_locales(:draft_en)
    assert_raises(ArgumentError) { locale.publish! }
  end

  test "load_package merges registry metadata" do
    meta = title_locales(:cykgp_en).load_package!

    assert_equal "cykgp", meta["slug"]
    assert_equal "en", meta.dig("registry", "locale")
    assert_equal "published", meta.dig("registry", "status")
    assert_includes meta["templateCss"], "EB Garamond"
  end
end
