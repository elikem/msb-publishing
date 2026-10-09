# frozen_string_literal: true

module Admin
  class BooksController < BaseController
    def index
      @titles = Title.includes(locales: :current_revision).order(:name)
    end
  end
end
