require "test_helper"

class TitleCatalogTest < ActiveSupport::TestCase
  test "discover_packages lists cykgp en" do
    assert_includes TitleCatalog.discover_packages, "cykgp/en"
  end

  test "loads cykgp en package with template CSS" do
    title = TitleCatalog.load_package!("cykgp/en", digest: title_revisions(:cykgp_rev1).package_digest)

    assert_equal 2, title["schemaVersion"]
    assert_equal "cykgp", title["slug"]
    assert_equal "en", title["locale"]
    assert_equal "cykgp/en", title["packagePath"]
    assert_equal 24, title["pageCount"]
    assert_includes title["assets"]["pagePattern"], "/packages/cykgp/en/pages/page-{nn}.png"
    assert_equal [ 5, 6, 7 ], title.dig("editableRegions", 0, "pages")
    assert_includes title["templateCss"], "EB Garamond"
  end

  test "raises for unknown package" do
    assert_raises(ActiveRecord::RecordNotFound) do
      TitleCatalog.load_package!("missing/title")
    end
  end
end
