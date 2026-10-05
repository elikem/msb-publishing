class ApplicationMailer < ActionMailer::Base
  default from: -> { MailerSettings.from_address }
  layout "mailer"
end
