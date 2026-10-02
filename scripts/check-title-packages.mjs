import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { compileRegionPageCss, validateTitle } from "../app/javascript/booklet/region.js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const titlesDir = join(root, "titles")
const publicDir = join(root, "public")

const slugs = readdirSync(titlesDir).filter((name) => {
  if (name.startsWith(".")) return false
  return statSync(join(titlesDir, name)).isDirectory()
})

if (slugs.length === 0) {
  throw new Error("No title packages found in titles/")
}

for (const slug of slugs) {
  const dir = join(titlesDir, slug)
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"))
  const storyPath = join(dir, meta.template.storyCss)
  const templateCss = readFileSync(storyPath, "utf8")
  const title = { ...meta, templateCss }
  validateTitle(title)
  if (title.slug !== slug) {
    throw new Error(`Folder "${slug}" does not match slug "${title.slug}"`)
  }

  for (let pageNumber = 1; pageNumber <= title.pageCount; pageNumber += 1) {
    const nn = String(pageNumber).padStart(2, "0")
    const urlPath = title.assets.pagePattern.replaceAll("{nn}", nn)
    const filePath = join(publicDir, urlPath.replace(/^\//, ""))
    if (!existsSync(filePath)) {
      throw new Error(`${slug}: missing page asset ${urlPath} (expected ${filePath})`)
    }
  }

  for (const region of title.editableRegions) {
    const css = compileRegionPageCss(title, region)
    region.pages.forEach((pageNumber, index) => {
      const box = region.textBoxes[String(pageNumber)]
      const margin = `${box.topPt}pt ${box.rightPt}pt ${box.bottomPt}pt ${box.leftPt}pt`
      const rule = `@page :nth(${index + 1})`
      if (!css.includes(rule) || !css.includes(margin)) {
        throw new Error(`${slug} region ${region.id} did not compile page ${pageNumber}`)
      }
    })
  }

  console.log(`ok ${slug} (${title.editableRegions.length} region, ${title.pageCount} pages)`)
}

assertRejects(() => {
  validateTitle({
    schemaVersion: 1,
    id: "sample",
    slug: "sample",
    title: "Sample",
    trim: { widthIn: 3.5, heightIn: 4.25, widthPt: 252, heightPt: 306 },
    pageCount: 4,
    color: { accent: "#112233" },
    assets: { pagePattern: "/booklets/sample/pages/page-{nn}.png" },
    template: { storyCss: "template/story.css" },
    templateCss: "p { font-size: 9pt; }",
    editableRegions: [
      {
        id: "story",
        label: "Story",
        flow: "continuous",
        opening: "plain",
        pages: [2, 3],
        textBoxes: {
          2: { topPt: 10, rightPt: 10, bottomPt: 10, leftPt: 10 },
        },
      },
    ],
  })
}, "missing text box")

console.log(`checked ${slugs.length} title package${slugs.length === 1 ? "" : "s"}`)

function assertRejects(run, label) {
  try {
    run()
  } catch {
    return
  }
  throw new Error(`Expected failure: ${label}`)
}
