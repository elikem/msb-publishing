require "test_helper"

class AuthMailerTest < ActionMailer::TestCase
  test "magic link email" do
    user = users(:one)
    email = AuthMailer.magic_link(user, "http://example.com/session?token=abc")

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal [ user.email ], email.to
    assert_equal [ MailerSettings.from_address ], email.from
    assert_match "sign-in link", email.subject
    assert_match "token=abc", email.body.encoded
  end
end
