import { pageAssetUrl, regionForPage } from '../titles/region.js';

export function createBookNavigator({ meta, stageEl, indicatorEl, onPageChange }) {
  let currentPage = 1;
  const pageCount = meta.pageCount;
  const trimWidthPx = meta.trim.widthIn * 96;
  /** @type {Map<number, HTMLElement>} */
  const fixedPageCache = new Map();
  /** @type {Map<number, HTMLElement>} */
  const storyNodes = new Map();

  function buildFixedPage(pageNumber) {
    const sheet = document.createElement('div');
    sheet.className = 'page-sheet';
    const img = document.createElement('img');
    img.className = 'page-bg';
    img.alt = `Book page ${pageNumber}`;
    img.src = pageAssetUrl(meta, pageNumber);
    img.loading = 'lazy';
    sheet.appendChild(img);
    return sheet;
  }

  function buildStoryPage(pageNumber) {
    const sheet = document.createElement('div');
    sheet.className = 'page-sheet story-page';

    const node = storyNodes.get(pageNumber);
    if (!node) {
      const img = document.createElement('img');
      img.className = 'page-bg';
      img.alt = `Book page ${pageNumber}`;
      img.src = pageAssetUrl(meta, pageNumber);
      sheet.appendChild(img);
      return sheet;
    }

    const overlay = document.createElement('div');
    overlay.className = 'story-overlay';
    overlay.appendChild(node.cloneNode(true));
    sheet.appendChild(overlay);
    return sheet;
  }

  function fitStoryOverlay(sheet) {
    const overlay = sheet.querySelector('.story-overlay');
    if (!overlay) return;
    overlay.style.transform = `scale(${sheet.clientWidth / trimWidthPx})`;
  }

  function render() {
    stageEl.replaceChildren();

    const region = regionForPage(meta, currentPage);
    let sheet;
    if (region) {
      sheet = buildStoryPage(currentPage);
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
    onPageChange?.(currentPage, {
      isStoryPage: Boolean(region),
      regionPages: region?.pages ?? [],
      pageCount,
    });
  }

  function setRegionPages(regionId, nodes) {
    const region = meta.editableRegions.find((item) => item.id === regionId);
    if (!region) return;
    region.pages.forEach((pageNumber, index) => {
      const node = nodes[index];
      if (node) storyNodes.set(pageNumber, node);
      else storyNodes.delete(pageNumber);
    });
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

  function refit() {
    const sheet = stageEl.querySelector('.page-sheet.story-page');
    if (sheet) fitStoryOverlay(sheet);
  }

  function getCurrentPage() {
    return currentPage;
  }

  render();

  return { goTo, next, prev, refit, setRegionPages, getCurrentPage };
}
