require "test_helper"

class MailerSettingsTest < ActiveSupport::TestCase
  KEYS = %w[SMTP_USERNAME SMTP_PASSWORD SMTP_ADDRESS SMTP_PORT MAIL_FROM APP_HOST].freeze

  setup do
    @original = KEYS.index_with { |key| ENV[key] }
    KEYS.each { |key| ENV.delete(key) }
  end

  teardown do
    KEYS.each do |key|
      value = @original[key]
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
  end

  test "smtp_configured requires username and password" do
    assert_not MailerSettings.smtp_configured?

    ENV["SMTP_USERNAME"] = "sender@example.com"
    assert_not MailerSettings.smtp_configured?

    ENV["SMTP_PASSWORD"] = "app-password"
    assert MailerSettings.smtp_configured?
  end

  test "smtp_settings use Gmail defaults from env" do
    ENV["SMTP_USERNAME"] = "sender@example.com"
    ENV["SMTP_PASSWORD"] = "app-password"

    settings = MailerSettings.smtp_settings

    assert_equal "smtp.gmail.com", settings[:address]
    assert_equal 587, settings[:port]
    assert_equal true, settings[:enable_starttls_auto]
    assert_equal :plain, settings[:authentication]
    assert_equal "sender@example.com", settings[:user_name]
    assert_equal "app-password", settings[:password]
  end

  test "from_address prefers MAIL_FROM then SMTP_USERNAME" do
    assert_equal MailerSettings::DEFAULT_FROM, MailerSettings.from_address

    ENV["SMTP_USERNAME"] = "sender@example.com"
    assert_equal "sender@example.com", MailerSettings.from_address

    ENV["MAIL_FROM"] = "My Story Booklet <hello@example.com>"
    assert_equal "My Story Booklet <hello@example.com>", MailerSettings.from_address
  end

  test "production_url_options use APP_HOST and https" do
    assert_equal MailerSettings::DEFAULT_PRODUCTION_HOST, MailerSettings.production_url_options[:host]
    assert_equal "https", MailerSettings.production_url_options[:protocol]

    ENV["APP_HOST"] = "books.example.com"
    options = MailerSettings.production_url_options
    assert_equal "books.example.com", options[:host]
    assert_equal "https", options[:protocol]
  end
end
