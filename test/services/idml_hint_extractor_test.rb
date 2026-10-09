# frozen_string_literal: true

require "test_helper"

class IdmlHintExtractorTest < ActiveSupport::TestCase
  IDML = Rails.root.join("source/cykgp/Can_You_Know_God_2025.idml")
  META = Rails.root.join("titles/cykgp/en/meta.json")

  setup do
    skip "CYKGP IDML not present" unless IDML.exist?
  end

  test "CYKGP story pages 5-7 within four points of package meta text boxes" do
    meta = JSON.parse(META.read)
    expected = meta.fetch("editableRegions").first.fetch("textBoxes")
    trim = meta.fetch("trim")

    hints = IdmlHintExtractor.extract_hints(IDML, trim: trim)
    frames = hints.fetch("frames").index_by { |frame| frame["page"] }

    [ 5, 6, 7 ].each do |page|
      assert frames[page], "missing hint frame for page #{page}"
      actual = frames[page]["insets"]
      expected_box = expected.fetch(page.to_s)

      %w[topPt leftPt rightPt bottomPt].each do |side|
        assert_in_delta expected_box.fetch(side), actual.fetch(side), 4,
          "page #{page} #{side}: expected #{expected_box[side]}, got #{actual[side]}"
      end
    end
  end
end
