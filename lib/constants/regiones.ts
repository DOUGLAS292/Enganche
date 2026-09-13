// Mapeo inicial ciudad → región, usado al crear una publicación (Fase 2) para
// derivar `publicaciones.region` y poder agregar precios de referencia por zona
// sin mezclar ciudades de mercados distintos (ver spec §2, "Precio de referencia
// por zona"). Ampliar esta lista a medida que se abran nuevas plazas.
export const REGION_POR_CIUDAD: Record<string, string> = {
  Cali: "Suroccidente",
  Jamundí: "Suroccidente",
  Palmira: "Suroccidente",
  Buenaventura: "Suroccidente",
  Popayán: "Suroccidente",
  Medellín: "Antioquia",
  Envigado: "Antioquia",
  Bello: "Antioquia",
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
// con esa ortografía exacta — así ciudades_piloto nunca termina con dos
// filas distintas para la misma ciudad real. Si no está en el mapa, se
// guarda con capitalización simple.
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
