require "test_helper"

class TitleRevisionTest < ActiveSupport::TestCase
  test "rejects a package path without meta.json" do
    rev = TitleRevision.new(
      title_locale: title_locales(:cykgp_en),
      revision: "missing",
      package_path: "does-not-exist/xx",
      package_digest: "abc",
      source: "repo"
    )

    refute rev.valid?
    assert_includes rev.errors[:package_path].join, "meta.json"
  end

  test "accepts an existing package path" do
    rev = title_revisions(:cykgp_rev1)
    assert rev.package_present?
    assert rev.valid?
  end
end
