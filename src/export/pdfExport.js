import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TRIM_W_IN = 3.5;
const TRIM_H_IN = 4.25;

function pageAssetUrl(pageNumber) {
  return `/assets/cykgp/pages/page-${String(pageNumber).padStart(2, '0')}.png`;
}

function buildExportPage(pageNumber, storyPageNode) {
  const page = document.createElement('div');
  page.className = 'export-page';

  if (storyPageNode) {
    const overlay = document.createElement('div');
    overlay.className = 'story-overlay';
    overlay.style.transform = 'none';
    overlay.style.width = '3.5in';
    overlay.style.height = '4.25in';
    overlay.style.position = 'relative';
    overlay.appendChild(storyPageNode.cloneNode(true));
    page.appendChild(overlay);
    return page;
  }

  const img = document.createElement('img');
  img.src = pageAssetUrl(pageNumber);
  img.crossOrigin = 'anonymous';
  page.appendChild(img);

  if (pageNumber >= 5 && pageNumber <= 7) {
    const plate = document.createElement('div');
    plate.className = 'story-blank-plate';
    plate.style.position = 'absolute';
    plate.style.inset = '0';
    page.appendChild(plate);
  }

  return page;
}

/**
 * @param {{ pageCount: number, slug: string }} meta
 * @param {HTMLElement[]} storyPageNodes - up to 3 nodes for pages 5–7
 */
export async function downloadPersonalizedPdf(meta, storyPageNodes) {
  const host = document.getElementById('export-host');
  host.innerHTML = '';
  host.classList.remove('offscreen');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = `${TRIM_W_IN}in`;
  host.style.height = 'auto';
  host.style.opacity = '1';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';

  const pages = [];
  for (let n = 1; n <= meta.pageCount; n += 1) {
    let storyNode = null;
    if (n >= 5 && n <= 7) {
      storyNode = storyPageNodes[n - 5] ?? null;
    }
    const el = buildExportPage(n, storyNode);
    host.appendChild(el);
    pages.push(el);
  }

  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [TRIM_W_IN, TRIM_H_IN],
  });

  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) pdf.addPage([TRIM_W_IN, TRIM_H_IN]);
    pdf.addImage(imgData, 'JPEG', 0, 0, TRIM_W_IN, TRIM_H_IN);
  }

  pdf.save(`${meta.slug}-personalized.pdf`);

  host.innerHTML = '';
  host.classList.add('offscreen');
  host.removeAttribute('style');
}
