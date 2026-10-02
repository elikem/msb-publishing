require "test_helper"

class MagicLinksControllerTest < ActionDispatch::IntegrationTest
  test "sends a magic link email" do
    assert_difference "User.count", 1 do
      assert_emails 1 do
        post magic_link_path, params: { email: "new.reader@example.com" }
      end
    end

    assert_redirected_to new_magic_link_path
    follow_redirect!
    assert_match(/Check your email/, response.body)
  end
end
