require "test_helper"

class PackageRegistrarTest < ActiveSupport::TestCase
  test "register is no-op when digest unchanged" do
    locale = title_locales(:cykgp_en)
    rev = locale.current_revision
    result = PackageRegistrar.register!(locale, source: "repo")
    assert_equal rev.id, result.id
    assert_equal 1, locale.revisions.count
  end
end
