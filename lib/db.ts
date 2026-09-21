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
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    // Corta una consulta atascada en vez de dejarla retener su conexión
    // para siempre — bajo carga alta, una sola consulta colgada puede ir
    // acaparando conexión tras conexión hasta agotar el pool para todos.
    statement_timeout: 15_000,
    query_timeout: 15_000,
  });
  // Un cliente inactivo del pool que se cae (red, DB reiniciada, etc.)
  // emite "error" en el propio Pool — sin este listener, Node lo trata
  // como excepción no capturada y tumba toda la instancia de la función,
  // afectando a otras peticiones que compartían ese pool en caliente.
  pool.on("error", (err) => {
    console.error("[Enganche] Error inesperado en un cliente inactivo del pool de PostgreSQL:", err);
  });
  return pool;
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
