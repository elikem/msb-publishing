import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "meta",
    "thumbs",
    "stage",
    "pageImage",
    "overlay",
    "pageLabel",
    "regionSelect",
  ]

  static values = {
    trim: Object,
    pageCount: Number,
    pageUrlTemplate: String,
    hints: Object,
  }

  connect() {
    this.currentPage = 1
    this.regionIndex = 0
    this.dragState = null
    this.parseMeta()
    this.renderThumbs()
    this.showPage(this.currentPage)
    this.metaTarget.addEventListener("change", () => this.parseMeta())
    this.metaTarget.addEventListener("blur", () => {
      this.parseMeta()
      this.redrawBox()
    })
  }

  parseMeta() {
    try {
      this.meta = JSON.parse(this.metaTarget.value)
      this.regionIndex = Math.min(this.regionIndex, (this.meta.editableRegions?.length || 1) - 1)
      if (this.regionIndex < 0) this.regionIndex = 0
    } catch {
      this.meta = null
    }
  }

  writeMeta() {
    if (!this.meta) return
    this.metaTarget.value = JSON.stringify(this.meta, null, 2)
  }

  region() {
    return this.meta?.editableRegions?.[this.regionIndex] ?? null
  }

  renderThumbs() {
    if (!this.hasThumbsTarget) return
    this.thumbsTarget.querySelectorAll("[data-page]").forEach((thumb) => {
      thumb.classList.toggle("is-active", Number(thumb.dataset.page) === this.currentPage)
    })
  }

  selectPage(event) {
    const page = Number(event.currentTarget.dataset.page)
    this.showPage(page)
  }

  showPage(page) {
    this.currentPage = page
    if (this.hasPageLabelTarget) this.pageLabelTarget.textContent = `Page ${page}`
    if (this.hasPageImageTarget) {
      const nn = String(page).padStart(2, "0")
      this.pageImageTarget.src = this.pageUrlTemplateValue.replace("{nn}", nn)
      this.pageImageTarget.alt = `Page ${page}`
    }
    this.renderThumbs()
    this.redrawBox()
  }

  pageUrlFor(page) {
    const nn = String(page).padStart(2, "0")
    return this.pageUrlTemplateValue.replace("{nn}", nn)
  }

  scale() {
    if (!this.hasPageImageTarget || !this.trimValue?.widthPt) return 1
    return this.pageImageTarget.clientWidth / this.trimValue.widthPt
  }

  boxForPage() {
    const region = this.region()
    if (!region?.textBoxes) return null
    return region.textBoxes[String(this.currentPage)] ?? null
  }

  redrawBox() {
    if (!this.hasOverlayTarget || !this.hasPageImageTarget) return
    this.overlayTarget.innerHTML = ""
    const box = this.boxForPage()
    if (!box) return

    const scale = this.scale()
    const imgW = this.pageImageTarget.clientWidth
    const imgH = this.pageImageTarget.clientHeight
    const left = box.leftPt * scale
    const top = box.topPt * scale
    const width = imgW - (box.leftPt + box.rightPt) * scale
    const height = imgH - (box.topPt + box.bottomPt) * scale

    const el = document.createElement("div")
    el.className = "package-mapper-box"
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    el.dataset.action = "mousedown->package-mapper#startDrag"

    ;["nw", "ne", "sw", "se", "n", "s", "e", "w"].forEach((handle) => {
      const knob = document.createElement("span")
      knob.className = `package-mapper-handle package-mapper-handle--${handle}`
      knob.dataset.handle = handle
      knob.dataset.action = "mousedown->package-mapper#startResize"
      el.appendChild(knob)
    })

    this.overlayTarget.appendChild(el)
  }

  onImageLoad() {
    this.redrawBox()
  }

  startDrag(event) {
    if (event.target.dataset.handle) return
    event.preventDefault()
    const box = this.boxForPage()
    if (!box) return
    this.dragState = { mode: "move", startX: event.clientX, startY: event.clientY, box: { ...box } }
    this.bindPointer()
  }

  startResize(event) {
    event.preventDefault()
    event.stopPropagation()
    const box = this.boxForPage()
    if (!box) return
    this.dragState = {
      mode: "resize",
      handle: event.currentTarget.dataset.handle,
      startX: event.clientX,
      startY: event.clientY,
      box: { ...box },
    }
    this.bindPointer()
  }

  bindPointer() {
    this.boundMove = (event) => this.onPointerMove(event)
    this.boundUp = () => this.onPointerUp()
    window.addEventListener("mousemove", this.boundMove)
    window.addEventListener("mouseup", this.boundUp)
  }

  unbindPointer() {
    window.removeEventListener("mousemove", this.boundMove)
    window.removeEventListener("mouseup", this.boundUp)
  }

  onPointerMove(event) {
    if (!this.dragState) return
    const scale = this.scale()
    const dx = (event.clientX - this.dragState.startX) / scale
    const dy = (event.clientY - this.dragState.startY) / scale
    const next = { ...this.dragState.box }
    const trim = this.trimValue

    if (this.dragState.mode === "move") {
      next.leftPt = this.clamp(next.leftPt + dx, 0, trim.widthPt - 20)
      next.rightPt = this.clamp(next.rightPt - dx, 0, trim.widthPt - 20)
      next.topPt = this.clamp(next.topPt + dy, 0, trim.heightPt - 20)
      next.bottomPt = this.clamp(next.bottomPt - dy, 0, trim.heightPt - 20)
    } else {
      const handle = this.dragState.handle
      if (handle.includes("n")) {
        next.topPt = this.clamp(next.topPt + dy, 0, trim.heightPt - 20)
      }
      if (handle.includes("s")) {
        next.bottomPt = this.clamp(next.bottomPt - dy, 0, trim.heightPt - 20)
      }
      if (handle.includes("w")) {
        next.leftPt = this.clamp(next.leftPt + dx, 0, trim.widthPt - 20)
      }
      if (handle.includes("e")) {
        next.rightPt = this.clamp(next.rightPt - dx, 0, trim.widthPt - 20)
      }
    }

    this.applyBox(next)
    this.dragState.startX = event.clientX
    this.dragState.startY = event.clientY
    this.dragState.box = { ...next }
  }

  onPointerUp() {
    this.dragState = null
    this.unbindPointer()
    this.writeMeta()
  }

  applyBox(box) {
    const region = this.region()
    if (!region) return
    region.textBoxes ||= {}
    const rounded = {
      topPt: Math.round(box.topPt),
      rightPt: Math.round(box.rightPt),
      bottomPt: Math.round(box.bottomPt),
      leftPt: Math.round(box.leftPt),
    }
    region.textBoxes[String(this.currentPage)] = rounded
    this.redrawBox()
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  ensurePageBox() {
    const region = this.region()
    if (!region) return
    region.textBoxes ||= {}
    if (!region.textBoxes[String(this.currentPage)]) {
      region.textBoxes[String(this.currentPage)] = {
        topPt: 36,
        rightPt: 36,
        bottomPt: 28,
        leftPt: 36,
      }
      this.writeMeta()
    }
  }

  addPageToRegion() {
    const region = this.region()
    if (!region) return
    region.pages ||= []
    if (!region.pages.includes(this.currentPage)) {
      region.pages.push(this.currentPage)
      region.pages.sort((a, b) => a - b)
    }
    this.ensurePageBox()
    this.writeMeta()
    this.redrawBox()
  }

  useHint() {
    const hint = (this.hintsValue?.frames || []).find(
      (frame) => frame.page === this.currentPage || frame.page === Number(this.currentPage),
    )
    if (!hint?.insets) return
    this.addPageToRegion()
    this.applyBox(hint.insets)
    this.writeMeta()
  }

  changeRegion(event) {
    this.regionIndex = Number(event.target.value)
    this.redrawBox()
  }
}
