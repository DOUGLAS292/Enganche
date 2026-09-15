// Mapeo inicial ciudad → región, usado al crear una publicación (Fase 2) para
// derivar `publicaciones.region` y poder agregar precios de referencia por zona
// sin mezclar ciudades de mercados distintos (ver spec §2, "Precio de referencia
// por zona"). Ampliar esta lista a medida que se abran nuevas plazas.
export const REGION_POR_CIUDAD: Record<string, string> = {
  // Suroccidente (Valle del Cauca, Cauca, Nariño)
  Cali: "Suroccidente",
  Jamundí: "Suroccidente",
  Palmira: "Suroccidente",
  Buenaventura: "Suroccidente",
  Tuluá: "Suroccidente",
  Buga: "Suroccidente",
  Cartago: "Suroccidente",
  Yumbo: "Suroccidente",
  Popayán: "Suroccidente",
  Pasto: "Suroccidente",
  Ipiales: "Suroccidente",
  Tumaco: "Suroccidente",

  // Antioquia
  Medellín: "Antioquia",
  Envigado: "Antioquia",
  Bello: "Antioquia",
  Itagüí: "Antioquia",
  Sabaneta: "Antioquia",
  Rionegro: "Antioquia",
  Apartadó: "Antioquia",
  Turbo: "Antioquia",

  // Caribe
  Barranquilla: "Caribe",
  Soledad: "Caribe",
  Malambo: "Caribe",
  Cartagena: "Caribe",
  "Santa Marta": "Caribe",
  Valledupar: "Caribe",
  Montería: "Caribe",
  Sincelejo: "Caribe",
  Riohacha: "Caribe",
  "San Andrés": "Caribe",

  // Centro (Bogotá y Cundinamarca)
  Bogotá: "Centro",
  Soacha: "Centro",
  Chía: "Centro",
  Zipaquirá: "Centro",
  Facatativá: "Centro",
  Fusagasugá: "Centro",
  Girardot: "Centro",

  // Eje Cafetero
  Pereira: "Eje Cafetero",
  Dosquebradas: "Eje Cafetero",
  Manizales: "Eje Cafetero",
  Armenia: "Eje Cafetero",

  // Santanderes
  Bucaramanga: "Santanderes",
  Floridablanca: "Santanderes",
  Girón: "Santanderes",
  Piedecuesta: "Santanderes",
  Cúcuta: "Santanderes",

  // Tolima Grande
  Ibagué: "Tolima Grande",
  Espinal: "Tolima Grande",
  Neiva: "Tolima Grande",

  // Boyacá
  Tunja: "Boyacá",
  Duitama: "Boyacá",
  Sogamoso: "Boyacá",

  // Orinoquía
  Villavicencio: "Orinoquía",
  Yopal: "Orinoquía",
  Arauca: "Orinoquía",
  "Puerto Carreño": "Orinoquía",

  // Amazonía y Pacífico
  Florencia: "Amazonía",
  Mocoa: "Amazonía",
  Leticia: "Amazonía",
  "San José del Guaviare": "Amazonía",
  Inírida: "Amazonía",
  Mitú: "Amazonía",
  Quibdó: "Pacífico",
};

// Quita tildes además de mayúsculas — "medellin" (muy común al escribir
// rápido desde el celular, sin tilde) debe calzar con "Medellín".
function llaveComparable(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function tituloSimple(ciudad: string): string {
  return ciudad
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((palabra) => (palabra ? palabra[0].toUpperCase() + palabra.slice(1).toLowerCase() : palabra))
    .join(" ");
}

// "cali", "CALI", "medellin" (sin tilde) → "Cali", "Medellín". Si la ciudad
// ya está en REGION_POR_CIUDAD (comparando sin tildes/mayúsculas), se guarda
// con esa ortografía exacta — así el campo `ciudad` de publicaciones nunca
// termina con dos filas distintas para la misma ciudad real. Si no está en
// el mapa, se guarda con capitalización simple.
export function normalizarCiudad(ciudad: string): string {
  const normalizado = llaveComparable(ciudad);
  const clave = Object.keys(REGION_POR_CIUDAD).find((c) => llaveComparable(c) === normalizado);
  return clave ?? tituloSimple(ciudad);
}

export function regionParaCiudad(ciudad: string): string | null {
  const normalizado = llaveComparable(ciudad);
  const clave = Object.keys(REGION_POR_CIUDAD).find((c) => llaveComparable(c) === normalizado);
  return clave ? REGION_POR_CIUDAD[clave] : null;
}
