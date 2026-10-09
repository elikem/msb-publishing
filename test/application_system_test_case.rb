# frozen_string_literal: true

require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [ 1400, 900 ]

  def sign_in_via_magic_link(user)
    token = MagicLink.generate_for(user)
    visit session_path(token: token)
  end
end
