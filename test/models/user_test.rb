require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "normalizes and finds by email" do
    user = User.find_or_create_by_email!("Reader@Example.com")
    assert_equal "reader@example.com", user.email
    assert_equal user.id, User.find_or_create_by_email!("reader@example.com").id
  end

  test "rejects invalid email" do
    user = User.new(email: "not-an-email")
    assert_not user.valid?
  end
end
