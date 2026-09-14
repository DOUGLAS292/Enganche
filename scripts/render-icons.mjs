import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "icon-source.html");
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const sizes = [1024, 512, 192, 180, 32, 16];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + htmlPath);

for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  const el = await page.$("#icon");
  await el.screenshot({ path: path.join(outDir, `icon-${size}.png`), omitBackground: true });
  console.log("wrote icon-" + size + ".png");
}

await browser.close();
