import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TRIM_W_IN = 3.5;
const TRIM_H_IN = 4.25;
const CSS_PX_PER_IN = 96;
const TRIM_W_PX = TRIM_W_IN * CSS_PX_PER_IN;
const TRIM_H_PX = TRIM_H_IN * CSS_PX_PER_IN;

function pageAssetUrl(pageNumber) {
  return `/assets/cykgp/pages/page-${String(pageNumber).padStart(2, '0')}.png`;
}

function storyPagesFromMeta(meta) {
  const region = meta.editableRegions?.[0];
  if (!region?.pages?.length) return [5, 6, 7];
  return [...region.pages];
}

async function pngToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load page image: ${url}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read page image: ${url}`));
    reader.readAsDataURL(blob);
  });
}

function cloneStoryText(storyPageNode) {
  const clone = storyPageNode.cloneNode(true);
  clone.style.backgroundImage = 'none';
  clone.style.background = 'transparent';
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';
  clone.style.width = `${TRIM_W_PX}px`;
  clone.style.height = `${TRIM_H_PX}px`;
  clone.querySelectorAll('*').forEach((el) => {
    if (el.style?.backgroundImage) el.style.backgroundImage = 'none';
  });
  return clone;
}

function buildStoryExportPage(pageNumber, storyPageNode) {
  const page = document.createElement('div');
  page.className = 'export-page';
  page.style.width = `${TRIM_W_PX}px`;
  page.style.height = `${TRIM_H_PX}px`;

  const img = document.createElement('img');
  img.className = 'page-bg';
  img.src = pageAssetUrl(pageNumber);
  img.alt = '';
  page.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'story-overlay';
  overlay.style.transform = 'none';
  overlay.style.width = `${TRIM_W_PX}px`;
  overlay.style.height = `${TRIM_H_PX}px`;
  overlay.appendChild(cloneStoryText(storyPageNode));
  page.appendChild(overlay);
  return page;
}

async function waitForImage(img) {
  if (img.complete && img.naturalWidth > 0) return;
  await img.decode();
}

function prepareExportHost(host) {
  host.innerHTML = '';
  host.classList.remove('offscreen');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = `${TRIM_W_PX}px`;
  host.style.height = `${TRIM_H_PX}px`;
  host.style.opacity = '1';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '0';
  host.style.overflow = 'hidden';
}

function resetExportHost(host) {
  host.innerHTML = '';
  host.classList.add('offscreen');
  host.removeAttribute('style');
}

async function rasterizeStoryPage(host, pageEl) {
  host.innerHTML = '';
  host.appendChild(pageEl);

  const img = pageEl.querySelector('img.page-bg');
  if (img) await waitForImage(img);
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    width: TRIM_W_PX,
    height: TRIM_H_PX,
    windowWidth: TRIM_W_PX,
    windowHeight: TRIM_H_PX,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
  });
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * @param {{ pageCount: number, slug: string, editableRegions?: { pages?: number[] }[] }} meta
 * @param {HTMLElement[]} storyPageNodes
 */
export async function downloadPersonalizedPdf(meta, storyPageNodes) {
  const host = document.getElementById('export-host');
  const storyPages = storyPagesFromMeta(meta);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [TRIM_W_IN, TRIM_H_IN],
  });

  prepareExportHost(host);

  try {
    for (let n = 1; n <= meta.pageCount; n += 1) {
      if (n > 1) pdf.addPage([TRIM_W_IN, TRIM_H_IN]);

      const storyIndex = storyPages.indexOf(n);
      const storyNode = storyIndex >= 0 ? (storyPageNodes[storyIndex] ?? null) : null;

      if (storyNode) {
        const pageEl = buildStoryExportPage(n, storyNode);
        const imgData = await rasterizeStoryPage(host, pageEl);
        pdf.addImage(imgData, 'JPEG', 0, 0, TRIM_W_IN, TRIM_H_IN);
      } else {
        const dataUrl = await pngToDataUrl(pageAssetUrl(n));
        pdf.addImage(dataUrl, 'PNG', 0, 0, TRIM_W_IN, TRIM_H_IN);
      }
    }

    pdf.save(`${meta.slug}-personalized.pdf`);
  } finally {
    resetExportHost(host);
  }
}
