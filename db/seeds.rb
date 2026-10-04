# Idempotent registry seed. Package art and placement stay on disk under titles/<slug>/.

cykgp = Title.find_or_initialize_by(slug: "cykgp")
cykgp.assign_attributes(
  name: "Can You Know God Personally",
  summary: "Write your own story into the sample-story pages of this booklet, then download a personalized PDF."
)
cykgp.save!

cykgp.register_revision!(
  revision: "1",
  package_path: "titles/cykgp",
  notes: "Initial web recreation from CYKGP IDML/PDF.",
  make_current: true
)

cykgp.publish! unless cykgp.published?
