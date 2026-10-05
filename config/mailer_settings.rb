# Env-driven Action Mailer settings shared by production/development.
# Production Edge must send magic-link email through Gmail SMTP, never localhost:25.
module MailerSettings
  DEFAULT_FROM = "noreply@mystorybooklet.local"
  DEFAULT_PRODUCTION_HOST = "msb-publishing.srv2019231.hstgr.cloud"
  DEFAULT_SMTP_ADDRESS = "smtp.gmail.com"
  DEFAULT_SMTP_PORT = 587

  module_function

  def smtp_configured?
    ENV["SMTP_USERNAME"].present? && ENV["SMTP_PASSWORD"].present?
  end

  def smtp_settings
    {
      address: ENV.fetch("SMTP_ADDRESS", DEFAULT_SMTP_ADDRESS),
      port: Integer(ENV.fetch("SMTP_PORT", DEFAULT_SMTP_PORT)),
      enable_starttls_auto: true,
      authentication: :plain,
      user_name: ENV["SMTP_USERNAME"],
      password: ENV["SMTP_PASSWORD"]
    }
  end

  def from_address
    ENV["MAIL_FROM"].presence || ENV["SMTP_USERNAME"].presence || DEFAULT_FROM
  end

  def production_url_options
    {
      host: ENV.fetch("APP_HOST", DEFAULT_PRODUCTION_HOST),
      protocol: "https"
    }
  end
end
