require "test_helper"

class MagicLinkTest < ActiveSupport::TestCase
  test "generates and verifies a token for a user" do
    user = users(:one)
    token = MagicLink.generate_for(user)
    assert_equal user, MagicLink.verify(token)
  end

  test "rejects forged tokens" do
    assert_nil MagicLink.verify("not-a-real-token")
  end
end
