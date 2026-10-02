class AuthMailer < ApplicationMailer
  def magic_link(user, magic_url)
    @user = user
    @magic_url = magic_url
    mail(to: @user.email, subject: "Your My Story Booklet sign-in link")
  end
end
