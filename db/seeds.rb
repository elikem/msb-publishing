# Idempotent registry seed. Packages live under titles/<book>/<locale>/.

cykgp = Title.find_or_initialize_by(slug: "cykgp")
cykgp.assign_attributes(name: "Can You Know God Personally", default_locale: "en")
cykgp.save!

locale = cykgp.locales.find_or_initialize_by(locale: "en")
locale.assign_attributes(
  name: "Can You Know God Personally",
  summary: "Write your own story into the sample-story pages of this booklet, then download a personalized PDF."
)
locale.save!

if locale.current_revision.nil?
  rev = locale.register_revision!(source: "repo", notes: "Initial web recreation from CYKGP PDF.")
  locale.update!(current_revision: rev)
end

locale.publish! unless locale.published?
