require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "signs in with a valid magic link token" do
    user = users(:one)
    token = MagicLink.generate_for(user)

    get session_path(token: token)
    assert_redirected_to root_path
    follow_redirect!
    assert_match(/Signed in as reader@example.com/, response.body)
  end

  test "rejects an invalid token" do
    get session_path(token: "bad-token")
    assert_redirected_to new_magic_link_path
  end

  test "requires authentication for catalog" do
    get root_path
    assert_redirected_to new_magic_link_path
  end

  test "signed-in users land on the title catalog" do
    user = users(:one)
    token = MagicLink.generate_for(user)

    get session_path(token: token)
    assert_redirected_to root_path
    follow_redirect!
    assert_match(/Choose a title/, response.body)
    assert_match(/Can You Know God Personally/, response.body)
  end
end
