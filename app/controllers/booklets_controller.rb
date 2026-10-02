class BookletsController < ApplicationController
  before_action :require_authentication

  def show
    @title_meta = TitleCatalog.find!("cykgp")
  end
end
