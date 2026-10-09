import { Controller } from "@hotwired/stimulus"

// Lightweight helper: clicking a page thumbnail inserts that page number into the meta JSON selection context.
export default class extends Controller {
  static targets = ["meta", "thumbs"]

  selectPage(event) {
    const page = event.currentTarget.dataset.page
    if (!this.hasMetaTarget) return
    this.metaTarget.focus()
    window.getSelection()?.collapse(this.metaTarget, 0)
    console.info(`Selected page ${page} for region mapping`)
  }
}
