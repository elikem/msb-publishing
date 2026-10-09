# frozen_string_literal: true

require "application_system_test_case"

class BookletSaveTest < ApplicationSystemTestCase
  test "leave prompt saves story before navigating away" do
    sign_in_via_magic_link(users(:one))

    visit booklet_locale_path(slug: "cykgp", locale: "en")
    assert_selector "[data-booklet-target='editor']"

    fill_in_editor("My cloud agent story paragraph.")
    click_link "All titles"

    within "dialog[open]" do
      assert_text "Unsaved changes"
      click_button "Save"
    end

    assert_text "Choose a title", wait: 10

    visit booklet_locale_path(slug: "cykgp", locale: "en")
    assert_selector "[data-booklet-target='editor']"
    assert_includes find("[data-booklet-target='editor']").value, "My cloud agent story"
  end

  private

  def fill_in_editor(text)
    editor = find("[data-booklet-target='editor']")
    editor.fill_in with: text
    editor.send_keys(:tab)
  end
end
