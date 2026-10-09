require "test_helper"

class TitlesControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in_as users(:one)
  end

  test "requires authentication" do
    delete session_path
    get root_path
    assert_redirected_to new_magic_link_path
  end

  test "lists published titles only" do
    get root_path
    assert_response :success
    assert_match(/Can You Know God Personally/, response.body)
    assert_match(/booklets\/cykgp\/en/, response.body)
    refute_match(/Draft Book/, response.body)
  end
end
