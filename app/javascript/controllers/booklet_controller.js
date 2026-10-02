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
  ]

  static values = {
    meta: Object,
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
    this.editorTarget.value = ""

    this.book = createBookNavigator({
      meta: this.meta,
      stageEl: this.stageTarget,
      indicatorEl: this.indicatorTarget,
      onPageChange: (page, info) => this.onPageChange(page, info),
    })

    this.boundKeydown = (event) => this.onKeydown(event)
    this.boundResize = () => this.onResize()
    document.addEventListener("keydown", this.boundKeydown)
    window.addEventListener("resize", this.boundResize)

    this.updateFillMeter(0)
    this.syncWriterCta()
    this.relayoutStory().catch(console.error)
  }

  disconnect() {
    document.removeEventListener("keydown", this.boundKeydown)
    window.removeEventListener("resize", this.boundResize)
    clearTimeout(this.layoutTimer)
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
    return window.matchMedia("(max-width: 640px)").matches
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
    const pages = await layoutStoryPages(paragraphs, this.layoutHostTarget, this.meta, this.region)
    if (generation !== this.layoutGeneration) return
    this.latestStoryPages = pages
    this.pagesByRegion = { [this.region.id]: pages }
    this.book.setRegionPages(this.region.id, pages)
    this.updateFillMeter(pages.length)
    this.syncWriterCta()
  }

  scheduleRelayout() {
    clearTimeout(this.layoutTimer)
    this.layoutTimer = setTimeout(() => {
      this.relayoutStory().catch(console.error)
    }, 280)
  }

  onEditorInput() {
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

  async savePreview() {
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
