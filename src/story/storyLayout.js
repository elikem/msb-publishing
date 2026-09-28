import { Previewer } from 'pagedjs';

const TRIM_WIDTH = '3.5in';
const TRIM_HEIGHT = '4.25in';

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
        const letter = text.charAt(0) || 'Y';
        const rest = text.slice(1);
        return `<p class="story-first"><span class="drop-cap">${escapeHtml(letter)}</span><span class="drop-rest">${escapeHtml(rest)}</span></p>`;
      }
      return `<p>${escapeHtml(text)}</p>`;
    })
    .join('');

  return `
    <style>
      @page { size: ${TRIM_WIDTH} ${TRIM_HEIGHT}; margin: 0; }
      .story-sheet p + p { break-before: auto; }
    </style>
    <article class="story-document">
      <div class="story-sheet">${body || '<p class="story-first"><span class="drop-cap">Y</span><span class="drop-rest">our story begins here.</span></p>'}</div>
    </article>
  `;
}

/**
 * Paginate story paragraphs into up to three page DOM nodes (pages 5–7).
 * @returns {Promise<HTMLElement[]>}
 */
export async function layoutStoryPages(paragraphs, hostEl) {
  hostEl.innerHTML = '';
  const flow = document.createElement('div');
  flow.innerHTML = buildStoryHtml(paragraphs);
  hostEl.appendChild(flow);

  const previewer = new Previewer();
  await previewer.preview(flow.innerHTML, [], hostEl);

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

export function editorTextFromParagraphs(paragraphs) {
  return paragraphs.join('\n\n');
}
