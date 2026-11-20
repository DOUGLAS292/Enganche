// Uso: node explore.js <ruta> <salida.png> [estado.json]
const { chromium } = require('playwright');
(async () => {
  const [ruta, out, state] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'es-CO', geolocation: { latitude: 3.4516, longitude: -76.5320 }, permissions: ['geolocation'],
    ...(state ? { storageState: state } : {}),
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000' + ruta, { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out, fullPage: true });
  const txt = (await p.innerText('body')).replace(/\n{2,}/g, '\n').slice(0, 1500);
  console.log(txt);
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
