import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:5173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const indicator = await page.locator('#page-indicator').innerText();
console.log('indicator', indicator);

await page.click('#next-page');
await page.waitForTimeout(200);
console.log('page2', await page.locator('#page-indicator').innerText());

await page.click('#jump-story');
await page.waitForTimeout(500);
console.log('story', await page.locator('#page-indicator').innerText());

await page.fill('#story-editor', 'First paragraph here.\n\nSecond paragraph with more words to test flow across pages in the booklet preview system.');
await page.waitForTimeout(1200);
await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/cykgp-story-page.png' });

await page.click('#download-pdf');
await page.waitForTimeout(8000);

await browser.close();
console.log('smoke ok');
