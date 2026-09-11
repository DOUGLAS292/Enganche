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

export function regionParaCiudad(ciudad: string): string | null {
  return REGION_POR_CIUDAD[ciudad.trim()] ?? null;
}
