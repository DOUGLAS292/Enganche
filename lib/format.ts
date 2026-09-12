export function formatCOP(valor: number): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(valor);
  } catch {
    return `$${valor}`;
  }
}

export function formatDistanciaKm(metros: number): string {
  const km = metros / 1000;
  return km < 1 ? `${Math.round(metros)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatFecha(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
