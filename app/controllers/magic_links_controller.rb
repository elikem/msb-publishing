class MagicLinksController < ApplicationController
  rate_limit to: 10, within: 1.minute, only: :create, with: -> {
    redirect_to new_magic_link_path, alert: "Too many sign-in attempts. Please wait a minute."
  }

  def new
    redirect_to root_path if signed_in?
  end

  def create
    email = params.require(:email)
    user = User.find_or_create_by_email!(email)
    token = MagicLink.generate_for(user)
    magic_url = session_url(token: token)

    AuthMailer.magic_link(user, magic_url).deliver_now

    # In development, surface the link so Cloud/local testing works without a mailbox UI.
    flash[:notice] = "Check your email for a sign-in link."
    flash[:dev_magic_link] = magic_url if Rails.env.development?

    redirect_to new_magic_link_path
  rescue ActionController::ParameterMissing, ActiveRecord::RecordInvalid
    redirect_to new_magic_link_path, alert: "Enter a valid email address."
  end
end
