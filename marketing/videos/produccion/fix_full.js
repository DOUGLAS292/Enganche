// Recaptura las pantallas largas (página completa) sin la barra inferior fija.
const { chromium } = require('playwright');
const ids = require('./ids.json');
const BASE = 'http://localhost:3000';
const CSS = 'nextjs-portal,.nav-inferior{display:none!important} html,body{background-attachment:scroll!important;background-size:100% 100%!important;min-height:100%}';
const campo = (p, t, tag = 'input') => p.locator(`xpath=//label[contains(normalize-space(.), "${t}")]/following::${tag}[1]`);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'es-CO', geolocation: { latitude: 3.4372, longitude: -76.5225 }, permissions: ['geolocation'], storageState: 'stateA.json' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/publicar', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: CSS });
  await p.getByText('Instalación', { exact: true }).click();
  await p.getByText('Nivel 1 · Tradicional', { exact: true }).click();
  await campo(p, 'Descripción').fill('Divisiones de baño en vidrio templado · 6 apartamentos');
  await campo(p, 'Cantidad de productos').fill('6');
  await campo(p, 'm² (opcional)').fill('18');
  await campo(p, 'Valor ofertado').fill('2400000');
  await campo(p, 'Ciudad').fill('Cali');
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/07b_publicar_lleno_completo.png', fullPage: true });
  await p.goto(BASE + `/publicaciones/${ids.pubId}`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: CSS });
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/17b_completado_empresa_completo.png', fullPage: true });
  await b.close();
  console.log('ok');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
