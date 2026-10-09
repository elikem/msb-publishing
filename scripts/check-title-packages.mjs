import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { compileRegionPageCss, validateTitle } from "../app/javascript/booklet/region.js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const titlesDir = join(root, "titles")
const scope = process.argv[2]

function discoverPackages() {
  const packages = []
  for (const book of readdirSync(titlesDir)) {
    if (book.startsWith(".")) continue
    const bookPath = join(titlesDir, book)
    if (!statSync(bookPath).isDirectory()) continue

    const metaAtBook = join(bookPath, "meta.json")
    if (existsSync(metaAtBook)) {
      packages.push({ book, locale: null, dir: bookPath })
      continue
    }

    for (const locale of readdirSync(bookPath)) {
      if (locale.startsWith(".")) continue
      const dir = join(bookPath, locale)
      if (!statSync(dir).isDirectory()) continue
      if (!existsSync(join(dir, "meta.json"))) continue
      packages.push({ book, locale, dir })
    }
  }
  return packages
}

let packages = discoverPackages()
if (scope) {
  const [book, locale] = scope.split("/")
  packages = packages.filter((p) => p.book === book && (!locale || p.locale === locale))
}

if (packages.length === 0) {
  throw new Error("No title packages found")
}

for (const pkg of packages) {
  const label = pkg.locale ? `${pkg.book}/${pkg.locale}` : pkg.book
  const meta = JSON.parse(readFileSync(join(pkg.dir, "meta.json"), "utf8"))
  const storyPath = join(pkg.dir, meta.template.storyCss)
  const templateCss = readFileSync(storyPath, "utf8")
  const title = { ...meta, templateCss }
  validateTitle(title)

  for (let pageNumber = 1; pageNumber <= title.pageCount; pageNumber += 1) {
    const nn = String(pageNumber).padStart(2, "0")
    const pattern = title.assets.pagePattern.replace(/^\//, "")
    const rel = pattern.includes("{nn}") ? pattern.replaceAll("{nn}", nn) : `pages/page-${nn}.png`
    const filePath = join(pkg.dir, rel)
    if (!existsSync(filePath)) {
      throw new Error(`${label}: missing page asset ${rel}`)
    }
  }

  for (const region of title.editableRegions) {
    const css = compileRegionPageCss(title, region)
    region.pages.forEach((pageNumber, index) => {
      const box = region.textBoxes[String(pageNumber)]
      const margin = `${box.topPt}pt ${box.rightPt}pt ${box.bottomPt}pt ${box.leftPt}pt`
      const rule = `@page :nth(${index + 1})`
      if (!css.includes(rule) || !css.includes(margin)) {
        throw new Error(`${label} region ${region.id} did not compile page ${pageNumber}`)
      }
    })
  }

  console.log(`ok ${label} (${title.editableRegions.length} region, ${title.pageCount} pages)`)
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
    assets: { pagePattern: "pages/page-{nn}.png" },
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

console.log(`checked ${packages.length} title package${packages.length === 1 ? "" : "s"}`)

function assertRejects(run, label) {
  try {
    run()
  } catch {
    return
  }
  throw new Error(`Expected failure: ${label}`)
}
