import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { pageAssetUrl, regionForPage } from "./region"

const CSS_PX_PER_IN = 96

function trimSize(title) {
  return {
    widthIn: title.trim.widthIn,
    heightIn: title.trim.heightIn,
    widthPx: title.trim.widthIn * CSS_PX_PER_IN,
    heightPx: title.trim.heightIn * CSS_PX_PER_IN,
  }
}

function storyNodeFor(title, pageNumber, pagesByRegion) {
  const region = regionForPage(title, pageNumber)
  if (!region) return null
  const index = region.pages.indexOf(pageNumber)
  return pagesByRegion[region.id]?.[index] ?? null
}

async function pageArtToJpeg(url) {
  const img = new Image()
  img.src = url
  await img.decode()
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL("image/jpeg", 0.92)
}

function cloneStoryText(storyPageNode, trim) {
  const clone = storyPageNode.cloneNode(true)
  clone.style.backgroundImage = "none"
  clone.style.background = "transparent"
  clone.style.boxShadow = "none"
  clone.style.margin = "0"
  clone.style.width = `${trim.widthPx}px`
  clone.style.height = `${trim.heightPx}px`
  clone.querySelectorAll("*").forEach((el) => {
    if (el.style?.backgroundImage) el.style.backgroundImage = "none"
  })
  return clone
}

function buildStoryExportPage(title, pageNumber, storyPageNode, trim) {
  const page = document.createElement("div")
  page.className = "export-page"
  page.style.width = `${trim.widthPx}px`
  page.style.height = `${trim.heightPx}px`

  const img = document.createElement("img")
  img.className = "page-bg"
  img.src = pageAssetUrl(title, pageNumber)
  img.alt = ""
  page.appendChild(img)

  const overlay = document.createElement("div")
  overlay.className = "story-overlay"
  overlay.style.transform = "none"
  overlay.style.width = `${trim.widthPx}px`
  overlay.style.height = `${trim.heightPx}px`
  overlay.appendChild(cloneStoryText(storyPageNode, trim))
  page.appendChild(overlay)
  return page
}

async function waitForImage(img) {
  if (img.complete && img.naturalWidth > 0) return
  await img.decode()
}

function prepareExportHost(host, trim) {
  host.innerHTML = ""
  host.classList.remove("offscreen")
  // Keep opacity at 1 for html2canvas, but park off-viewport so users
  // never see the temporary capture surface during "Preparing PDF…".
  host.style.position = "fixed"
  host.style.left = `-${trim.widthPx + 100}px`
  host.style.top = "0"
  host.style.width = `${trim.widthPx}px`
  host.style.height = `${trim.heightPx}px`
  host.style.opacity = "1"
  host.style.pointerEvents = "none"
  host.style.zIndex = "0"
  host.style.overflow = "hidden"
}

function resetExportHost(host) {
  host.innerHTML = ""
  host.classList.add("offscreen")
  host.removeAttribute("style")
}

async function rasterizeStoryPage(host, pageEl, trim) {
  host.innerHTML = ""
  host.appendChild(pageEl)

  const img = pageEl.querySelector("img.page-bg")
  if (img) await waitForImage(img)
  await document.fonts.ready
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    width: trim.widthPx,
    height: trim.heightPx,
    windowWidth: trim.widthPx,
    windowHeight: trim.heightPx,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
  })
  return canvas.toDataURL("image/jpeg", 0.92)
}

/**
 * @param {object} title
 * @param {Record<string, HTMLElement[]>} pagesByRegion
 * @param {HTMLElement|null} exportHost
 */
export async function downloadPersonalizedPdf(title, pagesByRegion, exportHost = null) {
  const host = exportHost || document.getElementById("export-host")
  if (!host) throw new Error("Missing export host element")
  const trim = trimSize(title)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: [trim.widthIn, trim.heightIn],
  })

  prepareExportHost(host, trim)

  try {
    for (let pageNumber = 1; pageNumber <= title.pageCount; pageNumber += 1) {
      if (pageNumber > 1) pdf.addPage([trim.widthIn, trim.heightIn])

      const storyNode = storyNodeFor(title, pageNumber, pagesByRegion)
      if (storyNode) {
        const pageEl = buildStoryExportPage(title, pageNumber, storyNode, trim)
        const imgData = await rasterizeStoryPage(host, pageEl, trim)
        pdf.addImage(imgData, "JPEG", 0, 0, trim.widthIn, trim.heightIn)
      } else {
        const dataUrl = await pageArtToJpeg(pageAssetUrl(title, pageNumber))
        pdf.addImage(dataUrl, "JPEG", 0, 0, trim.widthIn, trim.heightIn)
      }
    }

    pdf.save(`${title.slug}-personalized.pdf`)
  } finally {
    resetExportHost(host)
  }
}
