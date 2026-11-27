// Valor mínimo de referencia de una instalación por metro cuadrado (COP).
// Una oferta de instalación con m² y un valor por debajo de este mínimo casi
// siempre es un error de digitación (metros de más, ceros de menos) o una
// publicación falsa, y confunde a quienes se postulan. Se ajusta aquí.
export const PRECIO_MINIMO_INSTALACION_M2 = 20_000;

export function valorMinimoInstalacion(mtr2: number): number {
  return Math.round(mtr2 * PRECIO_MINIMO_INSTALACION_M2);
}
