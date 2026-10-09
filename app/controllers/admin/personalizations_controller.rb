# frozen_string_literal: true

module Admin
  class PersonalizationsController < BaseController
    def index
      @filter = params[:filter]
      scope = Personalization.includes(:user, :title_locale, :title_revision, :last_saved_by_user)
      scope = scope.joins(:title_locale).merge(TitleLocale.where(status: "draft")) if @filter == "unpublished"
      scope = scope.outdated if @filter == "outdated"
      @personalizations = scope.order(last_saved_at: :desc)
    end

    def edit
      @personalization = Personalization.find(params[:id])
      @title_locale = @personalization.title_locale
      @title_meta = @title_locale.load_package!
      @save_url = admin_personalization_path(@personalization)
      @admin_edit = true
      render "booklets/show", layout: "application"
    end

    def update
      @personalization = Personalization.find(params[:id])
      incoming = if params[:regions].is_a?(ActionController::Parameters) || params[:regions].is_a?(Hash)
        params.require(:regions).permit!.to_h
      else
        {}
      end
      @personalization.merge_regions!(incoming) if incoming.present?
      @personalization.title_revision = @personalization.title_locale.current_revision
      @personalization.last_saved_at = Time.current
      @personalization.last_saved_by_user = current_user
      @personalization.lock_version = params[:lock_version].to_i if params[:lock_version]

      if @personalization.save
        if request.format.json?
          render json: { last_saved_at: @personalization.last_saved_at.iso8601, lock_version: @personalization.lock_version }
        else
          redirect_to admin_personalizations_path, notice: "Saved for #{@personalization.user.email}."
        end
      else
        render json: { errors: @personalization.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActiveRecord::StaleObjectError
      render json: { error: "This story was changed elsewhere. Reload to see the latest version." }, status: :conflict
    end
  end
end
