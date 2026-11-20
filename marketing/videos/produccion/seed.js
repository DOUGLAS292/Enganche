// Crea datos de demostración en la base LOCAL de Enganche usando la API real de la app.
// Guarda las sesiones de cada usuario en stateA.json (empresa) y stateB.json (taller).
const { request } = require('playwright');
const BASE = 'http://localhost:3000';

async function ok(res, paso) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok() || body.ok === false) throw new Error(`${paso}: ${res.status()} ${JSON.stringify(body)}`);
  return body;
}

async function crearUsuario(celular, perfil, estado) {
  const api = await request.newContext({ baseURL: BASE });
  const sol = await ok(await api.post('/api/auth/otp/solicitar', { data: { celular } }), 'solicitar OTP');
  await ok(await api.post('/api/auth/otp/verificar', { data: { celular, codigo: sol.codigoDesarrollo } }), 'verificar OTP');
  await ok(await api.post('/api/auth/registro', { data: { ...perfil, aceptaTerminos: true } }), 'registro');
  await api.storageState({ path: estado });
  return api;
}

(async () => {
  const empresa = await crearUsuario('3001112233', {
    tipoUsuario: 'empresa', ofrece: 'ambos', nombreRazonSocial: 'Constructora Ejemplo S.A.S.',
    ciudad: 'Cali', documento: '900000000', sistemaLinea: 'Serie 50', anosExperiencia: 12,
  }, 'stateA.json');
  const taller = await crearUsuario('3004445566', {
    tipoUsuario: 'taller', ofrece: 'ambos', nombreRazonSocial: 'Taller El Vidriero',
    ciudad: 'Cali', sistemaLinea: 'Serie 50, Koncept 70', anosExperiencia: 8,
  }, 'stateB.json');
  await ok(await taller.post('/api/perfil/ubicacion', { data: { lat: 3.4372, lng: -76.5225 } }), 'ubicación taller');

  const hoy = new Date();
  const dia = (n) => new Date(hoy.getTime() + n * 86400000).toISOString().slice(0, 10);
  const instalacion = await ok(await empresa.post('/api/publicaciones', { data: {
    tipoTrabajo: 'instalacion', nivelSistema: 'tradicional', sistemaOProyecto: 'Ventanas corredizas Serie 50 · conjunto de vivienda',
    cantidad: '12', valorOfertado: 4800000, ciudad: 'Cali', lat: 3.4516, lng: -76.532,
    fechaInicio: dia(3), fechaFin: dia(11), requiereSeguridad: true, mtr2: 28,
  } }), 'publicación instalación');
  await ok(await empresa.post('/api/publicaciones', { data: {
    tipoTrabajo: 'produccion', nivelSistema: 'superior', sistemaOProyecto: 'Ventanería línea superior para edificio',
    cantidad: '40', valorOfertado: 9600000, ciudad: 'Cali', lat: 3.4516, lng: -76.532,
    fechaInicio: dia(5), fechaFin: dia(20), requiereSeguridad: false, mtr2: 40, lugarFabricacion: 'taller_postulante',
  } }), 'publicación producción');

  const pubId = instalacion.id ?? instalacion.publicacion?.id;
  console.log('publicación instalación:', pubId);
  console.log(JSON.stringify(instalacion).slice(0, 300));
  await empresa.dispose(); await taller.dispose();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
