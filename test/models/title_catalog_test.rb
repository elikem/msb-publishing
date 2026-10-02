require "test_helper"

class TitleCatalogTest < ActiveSupport::TestCase
  test "lists title package slugs" do
    assert_includes TitleCatalog.slugs, "cykgp"
  end

  test "loads cykgp package with template CSS" do
    title = TitleCatalog.find!("cykgp")

    assert_equal 1, title["schemaVersion"]
    assert_equal "cykgp", title["slug"]
    assert_equal "titles/cykgp", title["packagePath"]
    assert_equal 24, title["pageCount"]
    assert_equal "/booklets/cykgp/pages/page-{nn}.png", title.dig("assets", "pagePattern")
    assert_equal [ 5, 6, 7 ], title.dig("editableRegions", 0, "pages")
    assert_equal 52, title.dig("editableRegions", 0, "textBoxes", "5", "topPt")
    assert_includes title["templateCss"], "EB Garamond"
    refute_match(/^\s*@page\b/, title["templateCss"])
  end

  test "load_package! reads an explicit package path" do
    title = TitleCatalog.load_package!("titles/cykgp")
    assert_equal "cykgp", title["slug"]
  end

  test "raises for unknown slug" do
    assert_raises(ActiveRecord::RecordNotFound) do
      TitleCatalog.find!("missing-title")
    end
  end
end
