require "test_helper"

class BookletsControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in_as users(:one)
  end

  test "shows a published booklet by slug" do
    get booklet_path("cykgp")
    assert_response :success
    assert_match(/Can You Know God Personally/, response.body)
    assert_match(/All titles/, response.body)
  end

  test "hides unpublished titles" do
    get booklet_path("draft-book")
    assert_response :not_found
  end

  test "requires authentication" do
    delete session_path
    get booklet_path("cykgp")
    assert_redirected_to new_magic_link_path
  end
end
