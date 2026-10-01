import { Previewer } from 'pagedjs';
import { compileRegionPageCss, pageAssetUrl, pinTextBox, renderTemplateCss } from '../titles/region.js';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStoryHtml(paragraphs, region) {
  const body = paragraphs
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((raw, index) => {
      const text = raw.trim();
      if (index === 0 && region.opening === 'drop-cap') {
        const characters = [...text];
        const letter = characters[0] ?? '';
        const rest = characters.slice(1).join('');
        return `<p class="story-first"><span class="drop-cap">${escapeHtml(letter)}</span><span class="drop-rest">${escapeHtml(rest)}</span></p>`;
      }
      return `<p>${escapeHtml(text)}</p>`;
    })
    .join('');

  return `
    <article class="story-document">
      <div class="story-sheet">${body}</div>
    </article>
  `;
}

function cssObjectUrl(cssText) {
  return URL.createObjectURL(new Blob([cssText], { type: 'text/css' }));
}

/**
 * Paginate one continuous region into one DOM page per booklet page.
 * @returns {Promise<HTMLElement[]>}
 */
export async function layoutStoryPages(paragraphs, hostEl, title, region) {
  hostEl.innerHTML = '';
  if (!paragraphs.some((paragraph) => paragraph.trim().length > 0)) return [];

  document.querySelectorAll('style[data-pagedjs-inserted-styles]').forEach((style) => {
    style.dataset.pagedjsStale = 'true';
  });
  const flow = document.createElement('div');
  flow.innerHTML = buildStoryHtml(paragraphs, region);
  hostEl.appendChild(flow);

  const sheetUrl = cssObjectUrl(`${renderTemplateCss(title)}\n${compileRegionPageCss(title, region)}`);
  try {
    const previewer = new Previewer();
    await previewer.preview(flow.innerHTML, [sheetUrl], hostEl);
  } finally {
    URL.revokeObjectURL(sheetUrl);
  }

  const pages = [...hostEl.querySelectorAll('.pagedjs_page')].slice(0, region.pages.length);
  pages.forEach((pageEl, index) => {
    const pageNumber = region.pages[index];
    pinTextBox(pageEl, title, region, pageNumber);
    pageEl.style.backgroundImage = `url(${pageAssetUrl(title, pageNumber)})`;
  });
  document.querySelectorAll('style[data-pagedjs-stale="true"]').forEach((style) => style.remove());
  return pages;
}

export function paragraphsFromEditor(text) {
  // One Enter starts a new paragraph; extra blank lines collapse to a single break.
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}
