const STORY_PAGES = [5, 6, 7];

export function createBookNavigator({
  meta,
  stageEl,
  indicatorEl,
  onPageChange,
}) {
  let currentPage = 1;
  const pageCount = meta.pageCount;
  /** @type {Map<number, HTMLElement>} */
  const fixedPageCache = new Map();
  /** @type {HTMLElement[]} */
  let storyPageNodes = [];

  function pageAssetUrl(pageNumber) {
    return `/assets/cykgp/pages/page-${String(pageNumber).padStart(2, '0')}.png`;
  }

  function buildFixedPage(pageNumber) {
    const sheet = document.createElement('div');
    sheet.className = 'page-sheet';
    const img = document.createElement('img');
    img.className = 'page-bg';
    img.alt = `Book page ${pageNumber}`;
    img.src = pageAssetUrl(pageNumber);
    img.loading = 'lazy';
    sheet.appendChild(img);
    return sheet;
  }

  function buildStoryPage(pageNumber, storyIndex) {
    const sheet = document.createElement('div');
    sheet.className = 'page-sheet story-page';

    const overlay = document.createElement('div');
    overlay.className = 'story-overlay';
    const node = storyPageNodes[storyIndex];
    if (node) {
      overlay.appendChild(node.cloneNode(true));
    } else {
      const img = document.createElement('img');
      img.className = 'page-bg';
      img.alt = `Book page ${pageNumber}`;
      img.src = pageAssetUrl(pageNumber);
      sheet.appendChild(img);
    }
    sheet.appendChild(overlay);
    return sheet;
  }

  function fitStoryOverlay(sheet) {
    const overlay = sheet.querySelector('.story-overlay');
    if (!overlay) return;
    const scale = sheet.clientWidth / (3.5 * 96);
    overlay.style.transform = `scale(${scale})`;
  }

  function render() {
    stageEl.replaceChildren();

    let sheet;
    if (STORY_PAGES.includes(currentPage)) {
      const storyIndex = currentPage - STORY_PAGES[0];
      sheet = buildStoryPage(currentPage, storyIndex);
    } else {
      if (!fixedPageCache.has(currentPage)) {
        fixedPageCache.set(currentPage, buildFixedPage(currentPage));
      }
      sheet = fixedPageCache.get(currentPage).cloneNode(true);
    }

    stageEl.appendChild(sheet);
    if (sheet.classList.contains('story-page')) {
      requestAnimationFrame(() => fitStoryOverlay(sheet));
    }
    indicatorEl.textContent = `Page ${currentPage} of ${pageCount}`;
    onPageChange?.(currentPage);
  }

  function setStoryPages(nodes) {
    storyPageNodes = nodes;
    render();
  }

  function goTo(page) {
    currentPage = Math.min(pageCount, Math.max(1, page));
    render();
  }

  function next() {
    goTo(currentPage + 1);
  }

  function prev() {
    goTo(currentPage - 1);
  }

  function getCurrentPage() {
    return currentPage;
  }

  render();

  return { goTo, next, prev, setStoryPages, getCurrentPage };
}
