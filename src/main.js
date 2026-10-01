import './styles/main.css';
import meta from '../titles/cykgp/meta.json';
import { layoutStoryPages, paragraphsFromEditor } from './story/storyLayout.js';
import { createBookNavigator } from './book/navigator.js';
import { downloadPersonalizedPdf } from './export/pdfExport.js';

const editor = document.getElementById('story-editor');
const stage = document.getElementById('page-stage');
const indicator = document.getElementById('page-indicator');
const layoutHost = document.getElementById('layout-host');
const titleEl = document.getElementById('book-title');
const mobileTitle = document.getElementById('mobile-title');
const mobileEyebrow = document.getElementById('mobile-eyebrow');
const editableBadge = document.getElementById('editable-badge');
const fillLabel = document.getElementById('fill-label');
const fillBars = [...document.querySelectorAll('#fill-meter .fill-bars i')];
const openWriterBtn = document.getElementById('open-writer');
const closeWriterBtn = document.getElementById('close-writer');
const peekBookBtn = document.getElementById('peek-book');
const savePreviewBtn = document.getElementById('save-preview');
const sheetBackdrop = document.getElementById('sheet-backdrop');
const finishScreen = document.getElementById('finish-screen');
const finishStoryPages = document.getElementById('finish-story-pages');
const openFinishBtn = document.getElementById('open-finish');
const finishEditBtn = document.getElementById('finish-edit');
const finishCloseBtn = document.getElementById('finish-close');
const finishDownloadBtn = document.getElementById('finish-download');
const downloadPdfBtn = document.getElementById('download-pdf');

titleEl.textContent = meta.title;
if (mobileTitle) mobileTitle.textContent = meta.title;
editor.value = '';

const storyPageStart = meta.editableRegions?.[0]?.pages?.[0] ?? 5;
const storyPageCapacity = meta.editableRegions?.[0]?.pages?.length ?? 3;

/** @type {HTMLElement[]} */
let latestStoryPages = [];

function isMobilePocket() {
  return window.matchMedia('(max-width: 860px)').matches;
}

function updateFillMeter(filledCount) {
  const filled = Math.min(storyPageCapacity, Math.max(0, filledCount));
  const hasText = Boolean(editor.value.trim());
  fillBars.forEach((bar, index) => {
    bar.classList.toggle('full', index < filled);
    bar.classList.toggle('partial', hasText && filled === 0 && index === 0);
  });
  fillLabel.textContent = `${filled} of ${storyPageCapacity} pages`;
  if (finishStoryPages) finishStoryPages.textContent = String(filled);
}

function syncWriterCta() {
  if (!openWriterBtn) return;
  openWriterBtn.textContent = editor.value.trim() ? 'Continue writing' : 'Write your story';
}

function openWriter() {
  document.body.classList.add('writer-open');
  sheetBackdrop.hidden = false;
  sheetBackdrop.setAttribute('aria-hidden', 'false');
  // Focus after the sheet transition so mobile keyboards behave.
  window.setTimeout(() => editor.focus(), 280);
}

function closeWriter() {
  document.body.classList.remove('writer-open');
  sheetBackdrop.hidden = true;
  sheetBackdrop.setAttribute('aria-hidden', 'true');
  editor.blur();
}

function openFinish() {
  closeWriter();
  updateFillMeter(latestStoryPages.length);
  finishScreen.hidden = false;
  document.body.classList.add('finish-open');
}

function closeFinish() {
  finishScreen.hidden = true;
  document.body.classList.remove('finish-open');
}

function onPageChange(page, info) {
  const onStory = Boolean(info?.isStoryPage);
  editableBadge.hidden = !onStory;
  if (mobileEyebrow) {
    mobileEyebrow.textContent = onStory
      ? `Your story · pages ${info.storyPages[0]}–${info.storyPages[info.storyPages.length - 1]}`
      : 'My Story Booklet';
  }
}

const book = createBookNavigator({
  meta,
  stageEl: stage,
  indicatorEl: indicator,
  onPageChange,
});

let layoutTimer = null;
let layoutGeneration = 0;

async function relayoutStory() {
  const generation = ++layoutGeneration;
  const paragraphs = paragraphsFromEditor(editor.value);
  layoutHost.innerHTML = '';
  const pages = await layoutStoryPages(paragraphs, layoutHost);
  if (generation !== layoutGeneration) return;
  latestStoryPages = pages;
  book.setStoryPages(pages);
  updateFillMeter(pages.length);
  syncWriterCta();
}

function scheduleRelayout() {
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(() => {
    relayoutStory().catch(console.error);
  }, 280);
}

async function runDownload(button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparing PDF…';
  try {
    await relayoutStory();
    await downloadPersonalizedPdf(meta, latestStoryPages);
  } catch (err) {
    console.error(err);
    alert('PDF export failed. See console for details.');
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

editor.addEventListener('input', () => {
  syncWriterCta();
  scheduleRelayout();
});

document.getElementById('prev-page').addEventListener('click', () => book.prev());
document.getElementById('next-page').addEventListener('click', () => book.next());
document.getElementById('jump-story').addEventListener('click', () => {
  book.goTo(storyPageStart);
  if (isMobilePocket()) closeWriter();
});

openWriterBtn?.addEventListener('click', () => {
  book.goTo(storyPageStart);
  openWriter();
});
closeWriterBtn?.addEventListener('click', closeWriter);
peekBookBtn?.addEventListener('click', () => {
  closeWriter();
  book.goTo(storyPageStart);
});
savePreviewBtn?.addEventListener('click', async () => {
  await relayoutStory();
  closeWriter();
  book.goTo(storyPageStart);
});
sheetBackdrop?.addEventListener('click', closeWriter);

openFinishBtn?.addEventListener('click', openFinish);
finishCloseBtn?.addEventListener('click', closeFinish);
finishEditBtn?.addEventListener('click', () => {
  closeFinish();
  openWriter();
});

downloadPdfBtn.addEventListener('click', () => runDownload(downloadPdfBtn));
finishDownloadBtn?.addEventListener('click', () => runDownload(finishDownloadBtn));

document.addEventListener('keydown', (event) => {
  if (event.target === editor) return;
  if (document.body.classList.contains('finish-open')) {
    if (event.key === 'Escape') closeFinish();
    return;
  }
  if (document.body.classList.contains('writer-open')) {
    if (event.key === 'Escape') closeWriter();
    return;
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    book.prev();
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    book.next();
  }
});

// Touch swipe on book viewport
const viewport = document.getElementById('book-viewport');
let touchStartX = null;
viewport.addEventListener(
  'touchstart',
  (e) => {
    if (document.body.classList.contains('writer-open')) return;
    touchStartX = e.changedTouches[0]?.clientX ?? null;
  },
  { passive: true },
);
viewport.addEventListener(
  'touchend',
  (e) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) book.next();
    else book.prev();
  },
  { passive: true },
);

window.addEventListener('resize', () => {
  if (!isMobilePocket()) {
    closeWriter();
    closeFinish();
  }
  const sheet = stage.querySelector('.page-sheet.story-page');
  if (!sheet) return;
  const overlay = sheet.querySelector('.story-overlay');
  if (!overlay) return;
  const scale = sheet.clientWidth / (3.5 * 96);
  overlay.style.transform = `scale(${scale})`;
});

updateFillMeter(0);
syncWriterCta();
relayoutStory().catch(console.error);
