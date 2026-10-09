Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resource :magic_link, only: %i[new create]
  get "session", to: "sessions#create", as: :session
  delete "session", to: "sessions#destroy"

  resources :titles, only: :index

  get "packages/:book/:locale/pages/:file", to: "package_assets#show", as: :package_page_asset,
      constraints: { file: /page-\d+\.png/ }

  get "booklets/:slug", to: "booklets#redirect_to_locale", as: :booklet
  get "booklets/:slug/:locale", to: "booklets#show", as: :booklet_locale
  patch "booklets/:slug/:locale/personalization", to: "personalizations#update", as: :booklet_personalization

  namespace :admin do
    root to: "home#show"
    resources :admins, only: %i[index update]
    resources :books, only: %i[index]
    resources :title_locales, only: [] do
      member do
        post :publish
        post :unpublish
        post :archive
        post :register
      end
    end
    resources :personalizations, only: %i[index edit update]
    resources :package_imports, only: %i[new create show index] do
      member do
        post :retry
      end
    end
    get "title_locales/:id/package", to: "packages#edit", as: :edit_package
    patch "title_locales/:id/package", to: "packages#update", as: :update_package
    get "title_locales/:id/package/download", to: "packages#download", as: :download_package
  end

  root "titles#index"
end
