// Baseline visual: captura el HTML original de referencia.
// Uso: node scripts/baseline.mjs [ruta-html] [carpeta-salida]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const html =
  process.argv[2] ??
  '/home/landy/Descargas/app/Me-proyecto-/reference/my_novel_visual_novel_node_studio.html';
const outDir = process.argv[3] ?? 'baseline';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    '/home/landy/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
await page.goto(`file://${html}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/home.png` });
const viewport = await page.$('#canvasViewport');
if (viewport) {
  await viewport.screenshot({ path: `${outDir}/canvas.png` });
}
console.log(JSON.stringify({ errors, outDir }));
await browser.close();
if (errors.length > 0) process.exitCode = 2;
