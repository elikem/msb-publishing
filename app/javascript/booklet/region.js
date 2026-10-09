const PT_PER_IN = 72;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACCENT = /^#[0-9A-Fa-f]{6}$/;

/**
 * A title package is the recreated book the app knows how to personalize.
 * Placement lives in meta.json. The InDesign recreation lives in template/story.css.
 * This module is the only place that interprets that contract.
 */

export function validateTitle(title) {
  const errors = [];
  const fail = (message) => errors.push(message);

  if (!title || typeof title !== "object") {
    throw new Error("Title package must be an object");
  }

  const version = title.schemaVersion;
  if (version !== 1 && version !== 2) fail("schemaVersion must be 1 or 2");
  if (typeof title.slug !== "string" || !SLUG.test(title.slug)) {
    fail("slug must be lowercase letters, numbers, and hyphens");
  }
  if (version === 2) {
    if (typeof title.locale !== "string" || !title.locale.trim()) fail("locale is required for schema v2");
    const expectedId = `${title.slug}-${title.locale}`;
    if (title.id !== expectedId) fail(`id must be ${expectedId}`);
  } else if (title.id !== title.slug) {
    fail("id must match slug");
  }
  if (typeof title.title !== "string" || !title.title.trim()) fail("title is required");
  if (!Number.isInteger(title.pageCount) || title.pageCount < 1) {
    fail("pageCount must be a positive integer");
  }
  if (typeof title.color?.accent !== "string" || !ACCENT.test(title.color.accent)) {
    fail("color.accent must be a #RRGGBB color");
  }
  if (typeof title.assets?.pagePattern !== "string" || !title.assets.pagePattern.includes("{nn}")) {
    fail("assets.pagePattern must include {nn}");
  }
  if (typeof title.template?.storyCss !== "string" || !isRelativePackagePath(title.template?.storyCss)) {
    fail("template.storyCss must be a relative path inside the title package");
  }
  if (typeof title.templateCss !== "string" || !title.templateCss.trim()) {
    fail("template/story.css is missing");
  } else {
    const css = cssWithoutComments(title.templateCss);
    if (/@page\b/.test(css)) {
      fail("template/story.css must not contain @page rules; text boxes live in meta.json");
    }
    if (/@import\b/.test(css)) fail("template/story.css must not contain @import");
    if (/url\s*\(\s*['"]?(?!data:)/i.test(css)) {
      fail("template/story.css must not contain external url()");
    }
    if (title.templateCss.includes("</style")) fail("template/story.css must not contain </style");
  }

  const trim = title.trim;
  if (!isPositiveNumber(trim?.widthIn) || !isPositiveNumber(trim?.heightIn)) {
    fail("trim.widthIn and trim.heightIn must be positive numbers");
  }
  if (!isPositiveNumber(trim?.widthPt) || !isPositiveNumber(trim?.heightPt)) {
    fail("trim.widthPt and trim.heightPt must be positive numbers");
  }
  if (trim && isPositiveNumber(trim.widthIn) && isPositiveNumber(trim.widthPt)) {
    if (Math.abs(trim.widthPt - trim.widthIn * PT_PER_IN) > 0.01) {
      fail("trim.widthPt must equal widthIn × 72");
    }
  }
  if (trim && isPositiveNumber(trim.heightIn) && isPositiveNumber(trim.heightPt)) {
    if (Math.abs(trim.heightPt - trim.heightIn * PT_PER_IN) > 0.01) {
      fail("trim.heightPt must equal heightIn × 72");
    }
  }

  if (!Array.isArray(title.editableRegions) || title.editableRegions.length === 0) {
    fail("editableRegions must contain at least one region");
  } else {
    const seenIds = new Set();
    const seenPages = new Set();
    title.editableRegions.forEach((region, index) => {
      validateRegion(title, region, index, seenIds, seenPages, fail);
    });
  }

  if (errors.length > 0) {
    const name = title.slug ? `"${title.slug}"` : "(unnamed)";
    throw new Error(`Invalid title package ${name}:\n- ${errors.join("\n- ")}`);
  }
}

export function primaryRegion(title) {
  return title.editableRegions[0];
}

export function regionForPage(title, pageNumber) {
  return title.editableRegions.find((region) => region.pages.includes(pageNumber)) ?? null;
}

export function textBoxFor(region, pageNumber) {
  const box = region.textBoxes?.[String(pageNumber)];
  if (!box) {
    throw new Error(`Region "${region.id}" has no text box for page ${pageNumber}`);
  }
  return box;
}

export function pageAssetUrl(title, pageNumber) {
  const nn = String(pageNumber).padStart(2, "0");
  return title.assets.pagePattern.replaceAll("{nn}", nn);
}

/** Typography stylesheet with the book accent substituted in. */
export function renderTemplateCss(title) {
  return title.templateCss.replaceAll("var(--book-accent)", title.color.accent);
}

/**
 * Paged.js page boxes for one continuous region.
 * Flow page 1 is region.pages[0], not booklet page 1.
 * `:first` covers the opening page. `@page` covers the following pages when
 * they share one box. `:nth(n)` covers a different box on every page.
 */
export function compileRegionPageCss(title, region) {
  const { widthPt, heightPt } = title.trim;
  const size = `size: ${widthPt}pt ${heightPt}pt;`;
  const first = textBoxFor(region, region.pages[0]);
  const following = region.pages.length > 1 ? textBoxFor(region, region.pages[1]) : first;
  const nthRules = region.pages.map((pageNumber, index) => {
    const box = textBoxFor(region, pageNumber);
    return `@page :nth(${index + 1}) {\n  ${size}\n  margin: ${marginOf(box)};\n}`;
  });
  return [
    `/* Generated from ${title.slug} region ${region.id}. Text boxes live in meta.json. */`,
    `@page {\n  ${size}\n  margin: ${marginOf(following)};\n}`,
    `@page :first {\n  ${size}\n  margin: ${marginOf(first)};\n}`,
    ...nthRules,
  ].join("\n\n");
}

/** Inline the text box onto a paginated page so it survives being shown alone. */
export function pinTextBox(pageEl, title, region, pageNumber) {
  const box = textBoxFor(region, pageNumber);
  const { widthPt, heightPt } = title.trim;
  pageEl.style.setProperty("--pagedjs-margin-top", `${box.topPt}pt`);
  pageEl.style.setProperty("--pagedjs-margin-right", `${box.rightPt}pt`);
  pageEl.style.setProperty("--pagedjs-margin-bottom", `${box.bottomPt}pt`);
  pageEl.style.setProperty("--pagedjs-margin-left", `${box.leftPt}pt`);
  pageEl.style.setProperty("--pagedjs-pagebox-width", `${widthPt}pt`);
  pageEl.style.setProperty("--pagedjs-pagebox-height", `${heightPt}pt`);
  pageEl.style.setProperty("--pagedjs-width", `${widthPt}pt`);
  pageEl.style.setProperty("--pagedjs-height", `${heightPt}pt`);
}

export function formatPageSpan(pages) {
  if (!pages?.length) return "no pages";
  if (pages.length === 1) return `page ${pages[0]}`;
  const contiguous = pages.every((page, index) => page === pages[0] + index);
  if (contiguous) return `pages ${pages[0]}–${pages[pages.length - 1]}`;
  return `pages ${pages.join(", ")}`;
}

export function applyTitleChrome(title) {
  const root = document.documentElement;
  root.style.setProperty("--trim-w", `${title.trim.widthIn}in`);
  root.style.setProperty("--trim-h", `${title.trim.heightIn}in`);
  root.style.setProperty("--trim-w-num", String(title.trim.widthIn));
  root.style.setProperty("--trim-h-num", String(title.trim.heightIn));
  root.style.setProperty("--accent", title.color.accent);
  root.dataset.title = title.slug;

  let style = document.getElementById("title-template");
  if (!style) {
    style = document.createElement("style");
    style.id = "title-template";
    document.head.appendChild(style);
  }
  style.textContent = renderTemplateCss(title);
}

function validateRegion(title, region, index, seenIds, seenPages, fail) {
  const label = `editableRegions[${index}]`;
  if (!region || typeof region !== "object") {
    fail(`${label} must be an object`);
    return;
  }
  if (typeof region.id !== "string" || !SLUG.test(region.id)) {
    fail(`${label}.id must be lowercase letters, numbers, and hyphens`);
  } else if (seenIds.has(region.id)) {
    fail(`${label}.id "${region.id}" is duplicated`);
  } else {
    seenIds.add(region.id);
  }
  if (typeof region.label !== "string" || !region.label.trim()) fail(`${label}.label is required`);
  if (region.flow !== "continuous") fail(`${label}.flow must be "continuous"`);
  if (region.opening !== "drop-cap" && region.opening !== "plain") {
    fail(`${label}.opening must be "drop-cap" or "plain"`);
  }
  if (!Array.isArray(region.pages) || region.pages.length === 0) {
    fail(`${label}.pages must list at least one page`);
    return;
  }

  const pageKeys = new Set();
  region.pages.forEach((pageNumber) => {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > title.pageCount) {
      fail(`${label} page ${pageNumber} is outside 1–${title.pageCount}`);
      return;
    }
    if (seenPages.has(pageNumber)) fail(`page ${pageNumber} belongs to more than one region`);
    seenPages.add(pageNumber);
    pageKeys.add(String(pageNumber));
    const box = region.textBoxes?.[String(pageNumber)];
    if (!box) {
      fail(`${label} is missing textBoxes["${pageNumber}"]`);
      return;
    }
    for (const side of ["topPt", "rightPt", "bottomPt", "leftPt"]) {
      if (!isNonNegativeNumber(box[side])) fail(`${label} page ${pageNumber} ${side} must be a number ≥ 0`);
    }
    if (
      isNonNegativeNumber(box.topPt) &&
      isNonNegativeNumber(box.bottomPt) &&
      box.topPt + box.bottomPt >= title.trim.heightPt
    ) {
      fail(`${label} page ${pageNumber} vertical insets leave no room for text`);
    }
    if (
      isNonNegativeNumber(box.leftPt) &&
      isNonNegativeNumber(box.rightPt) &&
      box.leftPt + box.rightPt >= title.trim.widthPt
    ) {
      fail(`${label} page ${pageNumber} horizontal insets leave no room for text`);
    }
  });

  if (region.textBoxes && typeof region.textBoxes === "object") {
    for (const key of Object.keys(region.textBoxes)) {
      if (!pageKeys.has(key)) fail(`${label}.textBoxes has unused page "${key}"`);
    }
  }
}

function marginOf(box) {
  return `${box.topPt}pt ${box.rightPt}pt ${box.bottomPt}pt ${box.leftPt}pt`;
}

function cssWithoutComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function isRelativePackagePath(value) {
  return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.includes("..");
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
