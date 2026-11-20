// Recorre la app Enganche (local) y guarda capturas de cada pantalla en shots/.
// Requiere haber corrido seed.js (stateA.json = empresa, stateB.json = taller).
const { chromium, request } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:3000';
const OUT = 'shots';

const CTX = {
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  locale: 'es-CO', geolocation: { latitude: 3.4372, longitude: -76.5225 }, permissions: ['geolocation'],
};


// Oculta artefactos de desarrollo (indicador de Next.js y aviso de código OTP de modo desarrollo)
async function nuevoContexto(browser, extra = {}) {
  const ctx = await browser.newContext({ ...CTX, ...extra });
  await ctx.addInitScript(() => {
    const ocultar = () => {
      if (!document.getElementById('sin-dev')) {
        const st = document.createElement('style');
        st.id = 'sin-dev';
        st.textContent = 'nextjs-portal{display:none!important}';
        (document.head || document.documentElement).appendChild(st);
      }
      document.querySelectorAll('p, span, div, small').forEach((el) => {
        if (/Modo desarrollo/i.test(el.textContent || '') && ![...el.children].some((c) => /Modo desarrollo/i.test(c.textContent || ''))) el.style.visibility = 'hidden';
      });
    };
    document.addEventListener('DOMContentLoaded', ocultar);
    new MutationObserver(ocultar).observe(document, { childList: true, subtree: true });
  });
  return ctx;
}

async function shot(page, name, { full = false } = {}) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log('captura', name);
}

const campo = (page, etiqueta, tag = 'input') =>
  page.locator(`xpath=//label[contains(normalize-space(.), "${etiqueta}")]/following::${tag}[1]`);

async function api(state) {
  return request.newContext({ baseURL: BASE, storageState: state });
}

(async () => {
  const browser = await chromium.launch();

  // 1) Ingreso y registro de un usuario nuevo, por la interfaz
  {
    const ctx = await nuevoContexto(browser);
    const page = await ctx.newPage();
    let codigo = null;
    page.on('response', async (r) => {
      if (r.url().includes('/api/auth/otp/solicitar')) codigo = (await r.json().catch(() => ({}))).codigoDesarrollo;
    });
    await page.goto(BASE + '/entrar', { waitUntil: 'networkidle' });
    await page.locator('input[type="tel"]').fill('300 777 8899');
    await shot(page, '01_entrar_celular');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill(codigo || '');
    await shot(page, '02_entrar_codigo');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/registro/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.getByText('Independiente', { exact: true }).click();
    await campo(page, 'Nombre completo').fill('Andrés Instalaciones');
    await campo(page, 'Ciudad').fill('Cali');
    await page.getByText('Instalación', { exact: true }).click();
    await campo(page, 'Sistema o línea').fill('Serie 50, Koncept 70');
    await campo(page, 'Años de experiencia').fill('6');
    await shot(page, '03_registro');
    await page.locator('input[type="checkbox"]').check();
    await shot(page, '03b_registro_completo', { full: true });
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await shot(page, '04_inicio');
    await ctx.close();
  }

  // 2) La empresa llena el formulario de publicar (sin enviarlo: ya hay ofertas sembradas)
  {
    const ctx = await nuevoContexto(browser, { storageState: 'stateA.json' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await shot(page, '05_inicio_empresa');
    await page.goto(BASE + '/publicar', { waitUntil: 'networkidle' });
    await shot(page, '06_publicar_vacio');
    await page.getByText('Instalación', { exact: true }).click();
    await page.getByText('Nivel 1 · Tradicional', { exact: true }).click();
    await campo(page, 'Descripción', 'textarea').fill('Divisiones de baño en vidrio templado · 6 apartamentos').catch(async () => {
      await campo(page, 'Descripción').fill('Divisiones de baño en vidrio templado · 6 apartamentos');
    });
    await campo(page, 'Cantidad de productos').fill('6');
    await campo(page, 'm² (opcional)').fill('18');
    await campo(page, 'Valor ofertado').fill('2400000');
    await shot(page, '07_publicar_lleno');
    await shot(page, '07b_publicar_lleno_completo', { full: true });
    await ctx.close();
  }

  // Identificadores
  const A = await api('stateA.json');
  const B = await api('stateB.json');
  const yoB = await (await B.get('/api/auth/yo')).json();
  const idB = yoB.usuario?.id ?? yoB.id;
  const pubs = await (await B.get('/api/publicaciones?lat=3.4372&lng=-76.5225&radioKm=50')).json();
  const lista = pubs.publicaciones ?? pubs.items ?? pubs;
  const pub = lista.find((p) => String(p.sistema_o_proyecto || '').includes('Serie 50')) || lista[0];
  const pubId = pub.id;
  fs.writeFileSync('ids.json', JSON.stringify({ idB, pubId }, null, 2));

  // 3) El taller ve el feed y la oferta, y se postula
  {
    const ctx = await nuevoContexto(browser, { storageState: 'stateB.json' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/feed', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await shot(page, '08_feed');
    await page.goto(BASE + `/publicaciones/${pubId}`, { waitUntil: 'networkidle' });
    await shot(page, '09_oferta_taller');
    await shot(page, '09b_oferta_taller_completo', { full: true });
    const r = await B.post(`/api/publicaciones/${pubId}/postular`);
    console.log('postular', r.status());
    await page.reload({ waitUntil: 'networkidle' });
    await shot(page, '10_oferta_postulado');
    await page.goto(BASE + '/postulaciones', { waitUntil: 'networkidle' });
    await shot(page, '11_mis_postulaciones');
    await ctx.close();
  }

  // 4) La empresa ve postulantes, elige, y conversan por chat
  {
    const ctx = await nuevoContexto(browser, { storageState: 'stateA.json' });
    const page = await ctx.newPage();
    await page.goto(BASE + `/publicaciones/${pubId}`, { waitUntil: 'networkidle' });
    await shot(page, '12_oferta_postulantes');
    await shot(page, '12b_oferta_postulantes_completo', { full: true });
    await page.goto(BASE + `/perfil/${idB}`, { waitUntil: 'networkidle' });
    await shot(page, '13_perfil_postulante');
    const e = await A.post(`/api/publicaciones/${pubId}/elegir`, { data: { postulanteId: idB } });
    console.log('elegir', e.status(), (await e.text()).slice(0, 120));
    await A.post(`/api/publicaciones/${pubId}/mensajes`, { data: { contenido: 'Hola, te elegimos para la instalación. ¿Puedes empezar el lunes?' } });
    await B.post(`/api/publicaciones/${pubId}/mensajes`, { data: { contenido: 'Claro que sí. El lunes a las 7 a.m. estoy en la obra con mi equipo.' } });
    await A.post(`/api/publicaciones/${pubId}/mensajes`, { data: { contenido: 'Perfecto. Te comparto la ubicación exacta por aquí.' } });
    await page.goto(BASE + `/publicaciones/${pubId}`, { waitUntil: 'networkidle' });
    await shot(page, '14_oferta_elegido');
    await page.goto(BASE + `/publicaciones/${pubId}/chat`, { waitUntil: 'networkidle' });
    await shot(page, '15_chat');
    await page.goto(BASE + '/mis-publicaciones', { waitUntil: 'networkidle' });
    await shot(page, '16_mis_publicaciones');
    const c = await A.post(`/api/publicaciones/${pubId}/completar`);
    console.log('completar', c.status(), (await c.text()).slice(0, 120));
    await page.goto(BASE + `/publicaciones/${pubId}`, { waitUntil: 'networkidle' });
    await shot(page, '17_completado_empresa');
    await shot(page, '17b_completado_empresa_completo', { full: true });
    await ctx.close();
  }

  // 5) El taller ve el trabajo completado (calificación y comisión)
  {
    const ctx = await nuevoContexto(browser, { storageState: 'stateB.json' });
    const page = await ctx.newPage();
    await page.goto(BASE + `/publicaciones/${pubId}`, { waitUntil: 'networkidle' });
    await shot(page, '18_completado_taller');
    await shot(page, '18b_completado_taller_completo', { full: true });
    await page.goto(BASE + `/perfil/${idB}`, { waitUntil: 'networkidle' });
    await shot(page, '19_mi_perfil_taller');
    await ctx.close();
  }

  await A.dispose(); await B.dispose();
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
