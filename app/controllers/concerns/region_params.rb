# frozen_string_literal: true

module RegionParams
  extend ActiveSupport::Concern

  private

  def permitted_regions(title_locale)
    allowed = title_locale.current_revision&.region_id_list || []
    return {} if allowed.empty?

    params.require(:regions).permit(*allowed).to_h.stringify_keys
  end
end
