require "test_helper"

class TitlePackageValidatorTest < ActiveSupport::TestCase
  test "validates cykgp en package" do
    assert TitlePackageValidator.validate!("cykgp/en")
  end
end
