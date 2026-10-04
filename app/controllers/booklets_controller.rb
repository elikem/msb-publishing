class BookletsController < ApplicationController
  before_action :require_authentication

  def show
    @title = Title.find_published!(params[:slug])
    @title_meta = @title.load_package!
  end
end
