module Authentication
  extend ActiveSupport::Concern

  included do
    helper_method :current_user, :signed_in?, :current_user_admin?
  end

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = User.find_by(id: session[:user_id])
  end

  def signed_in?
    current_user.present?
  end

  def current_user_admin?
    current_user&.admin?
  end

  def require_authentication
    return if signed_in?

    redirect_to new_magic_link_path, alert: "Sign in with a magic link to continue."
  end

  def require_admin
    return if current_user&.admin?

    redirect_to root_path, alert: "Admin access required."
  end

  def sign_in(user)
    reset_session
    session[:user_id] = user.id
    user.update!(last_signed_in_at: Time.current)
  end

  def sign_out
    reset_session
  end
end
