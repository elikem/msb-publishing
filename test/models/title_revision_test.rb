require "test_helper"

class TitleRevisionTest < ActiveSupport::TestCase
  test "rejects a package path without meta.json" do
    rev = TitleRevision.new(
      title: titles(:cykgp),
      revision: "missing",
      package_path: "titles/does-not-exist"
    )

    refute rev.valid?
    assert_includes rev.errors[:package_path].join, "meta.json"
  end

  test "accepts an existing package path" do
    rev = title_revisions(:cykgp_v1)
    assert rev.package_present?
    assert rev.valid?
  end
end
