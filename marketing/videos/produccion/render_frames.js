// Renderiza cuadros [from, to) de la plantilla animada a PNG 1080x1920.
// Uso: node render_frames.js <html> <dir_salida> <desde> <hasta> <fps>
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const [html, outDir, from, to, fps] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(html), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const f0 = Number(from), f1 = Number(to), rate = Number(fps);
  for (let f = f0; f < f1; f++) {
    const t = f / rate;
    await page.evaluate((tt) => window.render(tt), t);
    const name = `f_${String(f + 1).padStart(5, '0')}.png`;
    await page.screenshot({ path: path.join(outDir, name) });
  }
  await browser.close();
  console.log(`cuadros ${f0}-${f1}`);
})().catch((e) => { console.error(e); process.exit(1); });
