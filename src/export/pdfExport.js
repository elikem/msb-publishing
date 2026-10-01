import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { pageAssetUrl, regionForPage } from '../titles/region.js';

function storyNodeFor(title, pageNumber, pagesByRegion) {
  const region = regionForPage(title, pageNumber);
  if (!region) return null;
  const index = region.pages.indexOf(pageNumber);
  return pagesByRegion[region.id]?.[index] ?? null;
}

function buildExportPage(title, pageNumber, storyPageNode) {
  const page = document.createElement('div');
  page.className = 'export-page';

  if (storyPageNode) {
    const overlay = document.createElement('div');
    overlay.className = 'story-overlay';
    overlay.style.transform = 'none';
    overlay.style.width = `${title.trim.widthIn}in`;
    overlay.style.height = `${title.trim.heightIn}in`;
    overlay.style.position = 'relative';
    overlay.appendChild(storyPageNode.cloneNode(true));
    page.appendChild(overlay);
    return page;
  }

  const img = document.createElement('img');
  img.src = pageAssetUrl(title, pageNumber);
  img.crossOrigin = 'anonymous';
  page.appendChild(img);
  return page;
}

/**
 * @param {object} title
 * @param {Record<string, HTMLElement[]>} pagesByRegion
 */
export async function downloadPersonalizedPdf(title, pagesByRegion) {
  const widthIn = title.trim.widthIn;
  const heightIn = title.trim.heightIn;
  const host = document.getElementById('export-host');
  host.innerHTML = '';
  host.classList.remove('offscreen');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = `${widthIn}in`;
  host.style.height = 'auto';
  host.style.opacity = '1';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';

  const pages = [];
  for (let pageNumber = 1; pageNumber <= title.pageCount; pageNumber += 1) {
    const el = buildExportPage(title, pageNumber, storyNodeFor(title, pageNumber, pagesByRegion));
    host.appendChild(el);
    pages.push(el);
  }

  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [widthIn, heightIn],
  });

  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) pdf.addPage([widthIn, heightIn]);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthIn, heightIn);
  }

  pdf.save(`${title.slug}-personalized.pdf`);

  host.innerHTML = '';
  host.classList.add('offscreen');
  host.removeAttribute('style');
}
