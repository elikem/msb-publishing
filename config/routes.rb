Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resource :magic_link, only: %i[new create]
  get "session", to: "sessions#create", as: :session
  delete "session", to: "sessions#destroy"

  root "booklets#show"
end
