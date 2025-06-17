// src/services/request.service.ts - VERSIONE COMPLETA E CORRETTA

import { pool } from '../db/pool';

export interface StatusFilter {
  all?: boolean;
  dChiamare?: boolean;    // Status 10
  inCorso?: boolean;      // Status 20  
  pratiRitiro?: boolean;  // Status 30
  esitoFinale?: boolean;  // Status 40
}

/**
 * Restituisce un elenco paginato di richieste con ricerca mirata e filtri stati.
 * @param page Numero di pagina (1-based)
 * @param limit Numero massimo di risultati per pagina
 * @param search Termine di ricerca opzionale
 * @param statusFilter Filtri per stati opzionale
 */
export async function getRequestsPaged(
  page: number, 
  limit: number, 
  search?: string, 
  statusFilter?: StatusFilter
) {
  const offset = (page - 1) * limit;
  const params: any[] = [];
  
  let query = `
    SELECT r.*,
           COALESCE(json_agg(i."Name") FILTER (WHERE i."Id" IS NOT NULL), '[]') AS "Images",
           rs_current."Status" as "CurrentStatus"
    FROM "Requests" r
    LEFT JOIN "RequestImages" i ON r."Id" = i."RequestId"
    LEFT JOIN (
      SELECT DISTINCT ON ("RequestId") 
             "RequestId", "Status" 
      FROM "RequestStatuses" 
      ORDER BY "RequestId", "ChangeDate" DESC
    ) rs_current ON r."Id" = rs_current."RequestId"
  `;

  const whereConditions: string[] = [];

  // 🔍 FILTRO RICERCA (esistente)
  if (search && search.trim()) {
    whereConditions.push(`(
      r."Id" ILIKE $${params.length + 1} OR 
      r."LicensePlate" ILIKE $${params.length + 1} OR
      CONCAT(r."FirstName", ' ', r."LastName") ILIKE $${params.length + 1} OR
      r."Make" ILIKE $${params.length + 1} OR
      r."Model" ILIKE $${params.length + 1} OR
      CONCAT(r."Make", ' ', r."Model") ILIKE $${params.length + 1}
    )`);
    params.push(`%${search.trim()}%`);
  }

  // 🎯 FILTRI STATI SEMPLICI
  if (statusFilter && !statusFilter.all) {
    const statusConditions: string[] = [];

    if (statusFilter.dChiamare) {
      statusConditions.push(`(COALESCE(rs_current."Status", 10) = 10)`);
    }
    if (statusFilter.inCorso) {
      statusConditions.push(`rs_current."Status" = 20`);
    }
    if (statusFilter.pratiRitiro) {
      statusConditions.push(`rs_current."Status" = 30`);
    }
    if (statusFilter.esitoFinale) {
      statusConditions.push(`rs_current."Status" = 40`);
    }

    if (statusConditions.length > 0) {
      whereConditions.push(`(${statusConditions.join(' OR ')})`);
    }
  }

  // Applica condizioni WHERE
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  query += ` GROUP BY r."Id", rs_current."Status"
             ORDER BY r."DateTime" DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Conta il numero totale di richieste con ricerca mirata e filtri stati.
 * @param search Termine di ricerca opzionale
 * @param statusFilter Filtri per stati opzionale
 */
export async function getTotalRequestCount(search?: string, statusFilter?: StatusFilter): Promise<number> {
  const params: any[] = [];
  
  let query = `
    SELECT COUNT(DISTINCT r."Id") as count
    FROM "Requests" r
    LEFT JOIN (
      SELECT DISTINCT ON ("RequestId") 
             "RequestId", "Status" 
      FROM "RequestStatuses" 
      ORDER BY "RequestId", "ChangeDate" DESC
    ) rs_current ON r."Id" = rs_current."RequestId"
  `;
  
  const whereConditions: string[] = [];

  // Filtro ricerca
  if (search && search.trim()) {
    whereConditions.push(`(
      r."Id" ILIKE $${params.length + 1} OR 
      r."LicensePlate" ILIKE $${params.length + 1} OR
      CONCAT(r."FirstName", ' ', r."LastName") ILIKE $${params.length + 1} OR
      r."Make" ILIKE $${params.length + 1} OR
      r."Model" ILIKE $${params.length + 1} OR
      CONCAT(r."Make", ' ', r."Model") ILIKE $${params.length + 1}
    )`);
    params.push(`%${search.trim()}%`);
  }

  // Filtri stati
  if (statusFilter && !statusFilter.all) {
    const statusConditions: string[] = [];

    if (statusFilter.dChiamare) {
      statusConditions.push(`(COALESCE(rs_current."Status", 10) = 10)`);
    }
    if (statusFilter.inCorso) {
      statusConditions.push(`rs_current."Status" = 20`);
    }
    if (statusFilter.pratiRitiro) {
      statusConditions.push(`rs_current."Status" = 30`);
    }
    if (statusFilter.esitoFinale) {
      statusConditions.push(`rs_current."Status" = 40`);
    }

    if (statusConditions.length > 0) {
      whereConditions.push(`(${statusConditions.join(' OR ')})`);
    }
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

/**
 * 🆕 NUOVA FUNZIONE: Ottieni contatori per ogni stato
 */
export async function getStatusCounts(search?: string): Promise<{
  all: number;
  dChiamare: number;
  inCorso: number;
  pratiRitiro: number;
  esitoFinale: number;
}> {
  const params: any[] = [];
  
  let baseQuery = `
    FROM "Requests" r
    LEFT JOIN (
      SELECT DISTINCT ON ("RequestId") 
             "RequestId", "Status" 
      FROM "RequestStatuses" 
      ORDER BY "RequestId", "ChangeDate" DESC
    ) rs_current ON r."Id" = rs_current."RequestId"
  `;

  let whereClause = '';
  
  // Applica filtro ricerca se presente
  if (search && search.trim()) {
    whereClause = ` WHERE (
      r."Id" ILIKE $${params.length + 1} OR 
      r."LicensePlate" ILIKE $${params.length + 1} OR
      CONCAT(r."FirstName", ' ', r."LastName") ILIKE $${params.length + 1} OR
      r."Make" ILIKE $${params.length + 1} OR
      r."Model" ILIKE $${params.length + 1} OR
      CONCAT(r."Make", ' ', r."Model") ILIKE $${params.length + 1}
    )`;
    params.push(`%${search.trim()}%`);
  }

  const query = `
    SELECT 
      COUNT(*) as all,
      COUNT(CASE WHEN COALESCE(rs_current."Status", 10) = 10 THEN 1 END) as d_chiamare,
      COUNT(CASE WHEN rs_current."Status" = 20 THEN 1 END) as in_corso,
      COUNT(CASE WHEN rs_current."Status" = 30 THEN 1 END) as prati_ritiro,
      COUNT(CASE WHEN rs_current."Status" = 40 THEN 1 END) as esito_finale
    ${baseQuery}
    ${whereClause}
  `;

  const result = await pool.query(query, params);
  const row = result.rows[0];
  
  return {
    all: parseInt(row.all, 10),
    dChiamare: parseInt(row.d_chiamare, 10),
    inCorso: parseInt(row.in_corso, 10),
    pratiRitiro: parseInt(row.prati_ritiro, 10),
    esitoFinale: parseInt(row.esito_finale, 10)
  };
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