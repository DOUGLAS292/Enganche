import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _enganchePool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }
  return new Pool({ connectionString, max: 5 });
}

// Perezoso a propósito: `next build` importa las rutas para analizarlas sin
// tener DATABASE_URL disponible, así que el Pool no se crea hasta la primera
// consulta real (en runtime), nunca al importar este módulo.
function getPool(): Pool {
  if (!global._enganchePool) {
    global._enganchePool = createPool();
  }
  return global._enganchePool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}
