# frozen_string_literal: true

module Admin
  class AdminsController < BaseController
    def index
      @users = User.order(:email)
    end

    def update
      user = User.find(params[:id])
      grant = params[:admin] == "true"

      if user.operator?
        redirect_to admin_admins_path, alert: "Operator account is always admin."
        return
      end

      if !grant && user.admin?
        remaining = User.all.count { |u| u.admin? && u.id != user.id }
        if remaining.zero?
          redirect_to admin_admins_path, alert: "Cannot remove the last admin."
          return
        end
      end

      user.update!(admin: grant)
      redirect_to admin_admins_path, notice: "Updated #{user.email}."
    end
  end
end
