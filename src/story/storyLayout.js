import { Previewer } from 'pagedjs';

const STORY_PAGE_CSS = '/story-page.css';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStoryHtml(paragraphs) {
  const body = paragraphs
    .filter((p) => p.trim().length > 0)
    .map((raw, index) => {
      const text = raw.trim();
      if (index === 0) {
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

/**
 * Paginate story paragraphs into up to three page DOM nodes (pages 5–7).
 * @returns {Promise<HTMLElement[]>}
 */
export async function layoutStoryPages(paragraphs, hostEl) {
  hostEl.innerHTML = '';
  if (!paragraphs.some((paragraph) => paragraph.trim().length > 0)) return [];

  const flow = document.createElement('div');
  flow.innerHTML = buildStoryHtml(paragraphs);
  hostEl.appendChild(flow);

  const previewer = new Previewer();
  await previewer.preview(flow.innerHTML, [STORY_PAGE_CSS], hostEl);

  const pages = [...hostEl.querySelectorAll('.pagedjs_page')];
  const slice = pages.slice(0, 3);
  slice.forEach((pageEl, index) => {
    const pageNumber = 5 + index;
    pageEl.style.backgroundImage = `url(/assets/cykgp/pages/page-${String(pageNumber).padStart(2, '0')}.png)`;
  });
  return slice;
}

export function paragraphsFromEditor(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}
