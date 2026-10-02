class SessionsController < ApplicationController
  def create
    user = MagicLink.verify(params[:token].to_s)
    unless user
      redirect_to new_magic_link_path, alert: "That sign-in link is invalid or has expired."
      return
    end

    sign_in(user)
    redirect_to root_path, notice: "Signed in as #{user.email}."
  end

  def destroy
    sign_out
    redirect_to new_magic_link_path, notice: "Signed out."
  end
end
