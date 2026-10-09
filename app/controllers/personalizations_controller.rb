# frozen_string_literal: true

class PersonalizationsController < ApplicationController
  include RegionParams

  before_action :require_authentication

  def update
    title_locale = TitleLocale.find_published!(params[:slug], params[:locale])
    personalization = current_user.personalizations.find_or_initialize_by(title_locale: title_locale)

    incoming = permitted_regions(title_locale)
    merged = personalization.persisted? ? personalization.regions_hash.merge(incoming) : incoming
    personalization.regions = merged.to_json
    personalization.user = current_user
    personalization.title_revision = title_locale.current_revision
    personalization.last_saved_at = Time.current
    personalization.last_saved_by_user = current_user
    personalization.lock_version = params[:lock_version].to_i if params[:lock_version].present?

    if personalization.save
      render json: {
        last_saved_at: personalization.last_saved_at.iso8601,
        lock_version: personalization.lock_version,
        outdated: false
      }
    else
      render json: { errors: personalization.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::StaleObjectError
    render json: { error: "This story was changed elsewhere. Reload to see the latest version." }, status: :conflict
  end
end
