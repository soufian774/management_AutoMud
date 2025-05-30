import { pool } from '../db/pool';

/**
 * Restituisce un elenco paginato di richieste.
 * @param page Numero di pagina (1-based)
 * @param limit Numero massimo di risultati per pagina
 */
export async function getRequestsPaged(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const query = `
    SELECT * FROM "Requests"
    ORDER BY "DateTime" DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}


/**
 * Restituisce una singola richiesta tramite ID.
 * @param id ID della richiesta da cercare
 */
export async function getRequestById(id: string) {
  const query = `
    SELECT * FROM "Requests"
    WHERE "Id" = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Restituisce il numero totale di richieste nel database.
 */
export async function getTotalRequestCount(): Promise<number> {
  const query = `SELECT COUNT(*) FROM "Requests"`;
  const result = await pool.query(query);
  return parseInt(result.rows[0].count, 10);
}
