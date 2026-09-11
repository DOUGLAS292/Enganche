// Normaliza números celulares colombianos a formato E.164 (+57XXXXXXXXXX).
// Acepta variantes con espacios, guiones, o el prefijo +57 / 57 al inicio.
export function normalizarCelularCO(input: string): string | null {
  const soloDigitos = input.replace(/\D/g, "");
  let numero = soloDigitos;

  if (numero.startsWith("57") && numero.length === 12) {
    numero = numero.slice(2);
  }

  if (numero.length !== 10 || !numero.startsWith("3")) {
    return null;
  }

  return `+57${numero}`;
}
