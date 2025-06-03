import { pool } from '../db/pool';

/**
 * Restituisce un elenco paginato di richieste con ricerca mirata.
 * @param page Numero di pagina (1-based)
 * @param limit Numero massimo di risultati per pagina
 * @param search Termine di ricerca opzionale
 */
export async function getRequestsPaged(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const params: any[] = [];
  
  let query = `
    SELECT r.*,
           COALESCE(json_agg(i."Name") FILTER (WHERE i."Id" IS NOT NULL), '[]') AS "Images"
    FROM "Requests" r
    LEFT JOIN "RequestImages" i ON r."Id" = i."RequestId"
  `;

  // Ricerca solo sui campi essenziali
  if (search && search.trim()) {
    query += ` WHERE (
      r."Id" ILIKE $${params.length + 1} OR 
      r."LicensePlate" ILIKE $${params.length + 1} OR
      CONCAT(r."FirstName", ' ', r."LastName") ILIKE $${params.length + 1} OR
      r."Make" ILIKE $${params.length + 1} OR
      r."Model" ILIKE $${params.length + 1} OR
      CONCAT(r."Make", ' ', r."Model") ILIKE $${params.length + 1}
    )`;
    params.push(`%${search.trim()}%`);
  }

  query += ` GROUP BY r."Id"
             ORDER BY r."DateTime" DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Conta il numero totale di richieste con ricerca mirata.
 * @param search Termine di ricerca opzionale
 */
export async function getTotalRequestCount(search?: string): Promise<number> {
  const params: any[] = [];
  
  let query = `SELECT COUNT(DISTINCT r."Id") FROM "Requests" r`;
  
  // Ricerca solo sui campi essenziali
  if (search && search.trim()) {
    query += ` WHERE (
      r."Id" ILIKE $${params.length + 1} OR 
      r."LicensePlate" ILIKE $${params.length + 1} OR
      CONCAT(r."FirstName", ' ', r."LastName") ILIKE $${params.length + 1} OR
      r."Make" ILIKE $${params.length + 1} OR
      r."Model" ILIKE $${params.length + 1} OR
      CONCAT(r."Make", ' ', r."Model") ILIKE $${params.length + 1}
    )`;
    params.push(`%${search.trim()}%`);
  }
  
  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Restituisce i dettagli di una richiesta specifica.
 * @param id ID univoco della richiesta
 */
export async function getRequestById(id: string) {
  const query = `
    SELECT r.*,
           COALESCE(json_agg(i."Name") FILTER (WHERE i."Id" IS NOT NULL), '[]') AS "Images"
    FROM "Requests" r
    LEFT JOIN "RequestImages" i ON r."Id" = i."RequestId"
    WHERE r."Id" = $1
    GROUP BY r."Id"
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}