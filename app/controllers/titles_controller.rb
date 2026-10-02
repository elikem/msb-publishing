class TitlesController < ApplicationController
  before_action :require_authentication

  def index
    @titles = Title.published.ordered.includes(:current_revision)
  end
end
