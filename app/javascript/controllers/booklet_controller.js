import { Controller } from "@hotwired/stimulus"
import { createBookNavigator } from "../booklet/navigator"
import { layoutStoryPages, paragraphsFromEditor } from "../booklet/story_layout"
import { downloadPersonalizedPdf } from "../booklet/pdf_export"
import { applyTitleChrome, formatPageSpan, primaryRegion } from "../booklet/region"

export default class extends Controller {
  static targets = [
    "title",
    "editor",
    "editorHeading",
    "storyHint",
    "jumpStory",
    "stage",
    "indicator",
    "layoutHost",
    "exportHost",
    "mobileTitle",
    "mobileEyebrow",
    "editableBadge",
    "fillLabel",
    "fillBars",
    "openWriter",
    "sheetBackdrop",
    "finishScreen",
    "finishStoryPages",
    "finishPageCount",
    "finishLede",
    "viewport",
    "lastSaved",
    "saveButton",
    "outdatedBanner",
    "overflowBanner",
    "orphanBanner",
    "leaveDialog",
  ]

  static values = {
    meta: Object,
    draft: Object,
    saveUrl: String,
  }

  connect() {
    this.meta = this.metaValue
    this.region = primaryRegion(this.meta)
    this.pageSpan = formatPageSpan(this.region.pages)
    this.storyPageStart = this.region.pages[0]
    this.storyPageCapacity = this.region.pages.length
    this.latestStoryPages = []
    this.pagesByRegion = {}
    this.layoutTimer = null
    this.layoutGeneration = 0
    this.touchStartX = null
    this.dirty = false
    this.savedSnapshot = ""
    this.lockVersion = this.draftValue?.lock_version ?? 0
    this.pendingLeaveHref = null

    applyTitleChrome(this.meta)

    if (this.hasTitleTarget) this.titleTarget.textContent = this.meta.title
    if (this.hasMobileTitleTarget) this.mobileTitleTarget.textContent = this.meta.title
    if (this.hasEditorHeadingTarget) this.editorHeadingTarget.textContent = this.region.label
    if (this.hasStoryHintTarget) {
      const lead = this.pageSpan.charAt(0).toUpperCase() + this.pageSpan.slice(1)
      this.storyHintTarget.textContent =
        `${lead} in the booklet. Press Enter for a new paragraph. The preview updates as you type.`
    }
    if (this.hasJumpStoryTarget) {
      this.jumpStoryTarget.textContent = `Jump to story (page ${this.storyPageStart})`
    }
    if (this.hasFinishPageCountTarget) {
      this.finishPageCountTarget.textContent = String(this.meta.pageCount)
    }
    if (this.hasFinishLedeTarget) {
      this.finishLedeTarget.textContent =
        `${this.meta.pageCount} pages including your story on ${this.pageSpan}. Download the personalized PDF to keep or print.`
    }
    if (this.hasIndicatorTarget) {
      this.indicatorTarget.textContent = `Page 1 of ${this.meta.pageCount}`
    }

    this.buildFillBars()
    const primaryId = this.draftValue?.primary_region_id || this.region.id
    const regions = this.draftValue?.regions || {}
    this.editorTarget.value = regions[primaryId] || ""
    this.savedSnapshot = this.editorTarget.value
    this.updateLastSavedLabel()
    this.showBanners()

    this.book = createBookNavigator({
      meta: this.meta,
      stageEl: this.stageTarget,
      indicatorEl: this.indicatorTarget,
      onPageChange: (page, info) => this.onPageChange(page, info),
    })

    this.boundKeydown = (event) => this.onKeydown(event)
    this.boundResize = () => this.onResize()
    this.boundBeforeUnload = (event) => this.onBeforeUnload(event)
    document.addEventListener("keydown", this.boundKeydown)
    window.addEventListener("resize", this.boundResize)
    window.addEventListener("beforeunload", this.boundBeforeUnload)

    this.element.querySelectorAll("[data-booklet-leave-link]").forEach((link) => {
      link.addEventListener("click", (event) => this.onLeaveClick(event))
    })

    this.updateFillMeter(0)
    this.syncWriterCta()
    this.relayoutStory().catch(console.error)
  }

  disconnect() {
    document.removeEventListener("keydown", this.boundKeydown)
    window.removeEventListener("resize", this.boundResize)
    window.removeEventListener("beforeunload", this.boundBeforeUnload)
    clearTimeout(this.layoutTimer)
  }

  showBanners() {
    if (this.hasOutdatedBannerTarget && this.draftValue?.outdated) {
      this.outdatedBannerTarget.hidden = false
      this.outdatedBannerTarget.textContent =
        "This book's layout was updated since you last saved. Review how your story fits, then Save to confirm."
    }
    if (this.hasOrphanBannerTarget && this.draftValue?.orphaned?.length) {
      this.orphanBannerTarget.hidden = false
      this.orphanBannerTarget.textContent =
        `Some saved text uses region ids no longer in this layout: ${this.draftValue.orphaned.join(", ")}.`
    }
  }

  updateLastSavedLabel() {
    if (!this.hasLastSavedTarget) return
    const at = this.draftValue?.last_saved_at
    if (!at) {
      this.lastSavedTarget.hidden = true
      return
    }
    this.lastSavedTarget.hidden = false
    let label = `Last saved ${new Date(at).toLocaleString()}`
    if (this.draftValue?.last_saved_by_admin) label += " (edited by an administrator)"
    this.lastSavedTarget.textContent = label
  }

  markDirty() {
    this.dirty = this.editorTarget.value !== this.savedSnapshot
  }

  onBeforeUnload(event) {
    if (!this.dirty) return
    event.preventDefault()
    event.returnValue = ""
  }

  onLeaveClick(event) {
    if (!this.dirty) return
    event.preventDefault()
    this.pendingLeaveHref = event.currentTarget.href || event.currentTarget.action
    this.leaveDialogTarget.showModal()
  }

  leaveSave() {
    this.leaveDialogTarget.close()
    this.saveDraft().then(() => {
      if (this.pendingLeaveHref) window.location.href = this.pendingLeaveHref
    })
  }

  leaveDiscard() {
    this.dirty = false
    this.leaveDialogTarget.close()
    if (this.pendingLeaveHref) window.location.href = this.pendingLeaveHref
  }

  leaveCancel() {
    this.pendingLeaveHref = null
    this.leaveDialogTarget.close()
  }

  async saveDraft() {
    if (!this.saveUrlValue) return
    const primaryId = this.draftValue?.primary_region_id || this.region.id
    const body = {
      regions: { [primaryId]: this.editorTarget.value },
      lock_version: this.lockVersion,
    }
    if (this.hasSaveButtonTarget) {
      this.saveButtonTarget.disabled = true
      this.saveButtonTarget.textContent = "Saving…"
    }
    try {
      const response = await fetch(this.saveUrlValue, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.csrfToken(),
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (response.status === 409) {
        alert(data.error || "Conflict")
        return
      }
      if (!response.ok) {
        alert((data.errors || [data.error]).join("\n"))
        return
      }
      this.lockVersion = data.lock_version
      this.savedSnapshot = this.editorTarget.value
      this.dirty = false
      this.draftValue.outdated = false
      if (this.hasOutdatedBannerTarget) this.outdatedBannerTarget.hidden = true
      this.draftValue.last_saved_at = data.last_saved_at
      this.updateLastSavedLabel()
    } finally {
      if (this.hasSaveButtonTarget) {
        this.saveButtonTarget.disabled = false
        this.saveButtonTarget.textContent = "Save"
      }
    }
  }

  csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content
  }

  buildFillBars() {
    if (!this.hasFillBarsTarget) return
    this.fillBarsTarget.replaceChildren(
      ...this.region.pages.map(() => document.createElement("i")),
    )
  }

  fillBarElements() {
    return this.hasFillBarsTarget ? [...this.fillBarsTarget.children] : []
  }

  isMobilePocket() {
    return window.matchMedia("(max-width: 480px)").matches
  }

  updateFillMeter(filledCount) {
    const filled = Math.min(this.storyPageCapacity, Math.max(0, filledCount))
    const hasText = Boolean(this.editorTarget.value.trim())
    this.fillBarElements().forEach((bar, index) => {
      bar.classList.toggle("full", index < filled)
      bar.classList.toggle("partial", hasText && filled === 0 && index === 0)
    })
    this.fillLabelTarget.textContent = `${filled} of ${this.storyPageCapacity} pages`
    if (this.hasFinishStoryPagesTarget) {
      this.finishStoryPagesTarget.textContent = String(filled)
    }
  }

  syncWriterCta() {
    if (!this.hasOpenWriterTarget) return
    this.openWriterTarget.textContent = this.editorTarget.value.trim()
      ? "Continue writing"
      : "Write your story"
  }

  openWriter() {
    this.book.goTo(this.storyPageStart)
    document.body.classList.add("writer-open")
    this.sheetBackdropTarget.hidden = false
    this.sheetBackdropTarget.setAttribute("aria-hidden", "false")
    window.setTimeout(() => this.editorTarget.focus(), 280)
  }

  closeWriter() {
    document.body.classList.remove("writer-open")
    this.sheetBackdropTarget.hidden = true
    this.sheetBackdropTarget.setAttribute("aria-hidden", "true")
    this.editorTarget.blur()
  }

  openFinish() {
    this.closeWriter()
    this.updateFillMeter(this.latestStoryPages.length)
    this.finishScreenTarget.hidden = false
    document.body.classList.add("finish-open")
  }

  closeFinish() {
    this.finishScreenTarget.hidden = true
    document.body.classList.remove("finish-open")
  }

  finishEdit() {
    this.closeFinish()
    this.openWriter()
  }

  onPageChange(_page, info) {
    const onStory = Boolean(info?.isStoryPage)
    this.editableBadgeTarget.hidden = !onStory
    if (this.hasMobileEyebrowTarget) {
      this.mobileEyebrowTarget.textContent = onStory
        ? `Your story · ${formatPageSpan(info.regionPages)}`
        : "My Story Booklet"
    }
  }

  async relayoutStory() {
    const generation = ++this.layoutGeneration
    const paragraphs = paragraphsFromEditor(this.editorTarget.value)
    this.layoutHostTarget.innerHTML = ""
    const result = await layoutStoryPages(paragraphs, this.layoutHostTarget, this.meta, this.region)
    if (generation !== this.layoutGeneration) return
    const pages = result.pages || []
    this.latestStoryPages = pages
    this.pagesByRegion = { [this.region.id]: pages }
    this.book.setRegionPages(this.region.id, pages)
    this.updateFillMeter(pages.length)
    this.syncWriterCta()
    if (this.hasOverflowBannerTarget) {
      if (result.overflow) {
        const last = this.region.pages[this.region.pages.length - 1]
        this.overflowBannerTarget.hidden = false
        this.overflowBannerTarget.textContent =
          `Your story is longer than the ${this.storyPageCapacity} pages available; text past page ${last} will not appear in the PDF.`
      } else {
        this.overflowBannerTarget.hidden = true
      }
    }
  }

  scheduleRelayout() {
    clearTimeout(this.layoutTimer)
    this.layoutTimer = setTimeout(() => {
      this.relayoutStory().catch(console.error)
    }, 280)
  }

  onEditorInput() {
    this.markDirty()
    this.syncWriterCta()
    this.scheduleRelayout()
  }

  prevPage() {
    this.book.prev()
  }

  nextPage() {
    this.book.next()
  }

  jumpStory() {
    this.book.goTo(this.storyPageStart)
    if (this.isMobilePocket()) this.closeWriter()
  }

  peekBook() {
    this.closeWriter()
    this.book.goTo(this.storyPageStart)
  }

  async previewStory() {
    await this.relayoutStory()
    this.closeWriter()
    this.book.goTo(this.storyPageStart)
  }

  async downloadPdf(event) {
    const button = event.currentTarget
    const original = button.textContent
    button.disabled = true
    button.textContent = "Preparing PDF…"
    try {
      await this.relayoutStory()
      await downloadPersonalizedPdf(this.meta, this.pagesByRegion, this.exportHostTarget)
    } catch (err) {
      console.error(err)
      alert("PDF export failed. See console for details.")
    } finally {
      button.disabled = false
      button.textContent = original
    }
  }

  onKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault()
      this.saveDraft()
      return
    }
    if (event.target === this.editorTarget) return
    if (document.body.classList.contains("finish-open")) {
      if (event.key === "Escape") this.closeFinish()
      return
    }
    if (document.body.classList.contains("writer-open")) {
      if (event.key === "Escape") this.closeWriter()
      return
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      this.book.prev()
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      this.book.next()
    }
  }

  onTouchStart(event) {
    if (document.body.classList.contains("writer-open")) return
    this.touchStartX = event.changedTouches[0]?.clientX ?? null
  }

  onTouchEnd(event) {
    if (this.touchStartX == null) return
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX
    const delta = endX - this.touchStartX
    this.touchStartX = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) this.book.next()
    else this.book.prev()
  }

  onResize() {
    if (!this.isMobilePocket()) {
      this.closeWriter()
      this.closeFinish()
    }
    this.book.refit()
  }
}
