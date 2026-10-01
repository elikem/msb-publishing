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

titleEl.textContent = meta.title;
editor.value = '';

/** @type {HTMLElement[]} */
let latestStoryPages = [];

const book = createBookNavigator({
  meta,
  stageEl: stage,
  indicatorEl: indicator,
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
}

function scheduleRelayout() {
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(() => {
    relayoutStory().catch(console.error);
  }, 280);
}

editor.addEventListener('input', scheduleRelayout);

document.getElementById('prev-page').addEventListener('click', () => book.prev());
document.getElementById('next-page').addEventListener('click', () => book.next());
document.getElementById('jump-story').addEventListener('click', () => book.goTo(5));

document.getElementById('download-pdf').addEventListener('click', async () => {
  const btn = document.getElementById('download-pdf');
  btn.disabled = true;
  btn.textContent = 'Preparing PDF…';
  try {
    await relayoutStory();
    await downloadPersonalizedPdf(meta, latestStoryPages);
  } catch (err) {
    console.error(err);
    alert('PDF export failed. See console for details.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Download PDF';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.target === editor) return;
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
  const sheet = stage.querySelector('.page-sheet.story-page');
  if (!sheet) return;
  const overlay = sheet.querySelector('.story-overlay');
  if (!overlay) return;
  const scale = sheet.clientWidth / (3.5 * 96);
  overlay.style.transform = `scale(${scale})`;
});

relayoutStory().catch(console.error);
