import { pool } from '../db/pool';
import { RequestStatusRecord, StatusChangeRequest } from '../models/request-status.model';

/**
 * Restituisce lo storico degli stati per una richiesta specifica.
 * @param requestId ID della richiesta
 */
export async function getStatusHistoryByRequestId(requestId: string): Promise<RequestStatusRecord[]> {
  const query = `
    SELECT "Id", "RequestId", "Status", "ChangeDate"
    FROM "RequestStatuses"
    WHERE "RequestId" = $1
    ORDER BY "ChangeDate" ASC
  `;

  const result = await pool.query(query, [requestId]);
  return result.rows;
}

/**
 * Restituisce l'ultimo stato di una richiesta.
 * @param requestId ID della richiesta
 */
export async function getCurrentStatusByRequestId(requestId: string): Promise<RequestStatusRecord | null> {
  const query = `
    SELECT "Id", "RequestId", "Status", "ChangeDate"
    FROM "RequestStatuses"
    WHERE "RequestId" = $1
    ORDER BY "ChangeDate" DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [requestId]);
  return result.rows[0] || null;
}

/**
 * Aggiunge un nuovo stato per una richiesta.
 * @param statusChange Dati del cambio stato
 */
export async function addStatusChange(statusChange: StatusChangeRequest): Promise<RequestStatusRecord> {
  const query = `
    INSERT INTO "RequestStatuses" ("RequestId", "Status", "ChangeDate")
    VALUES ($1, $2, NOW())
    RETURNING "Id", "RequestId", "Status", "ChangeDate"
  `;

  const result = await pool.query(query, [
    statusChange.RequestId,
    statusChange.NewStatus
  ]);

  return result.rows[0];
}

/**
 * Restituisce gli stati di più richieste in una sola query (per performance).
 * @param requestIds Array di ID richieste
 */
export async function getCurrentStatusesForRequests(requestIds: string[]): Promise<Map<string, RequestStatusRecord>> {
  if (requestIds.length === 0) return new Map();

  const query = `
    SELECT DISTINCT ON ("RequestId") "Id", "RequestId", "Status", "ChangeDate"
    FROM "RequestStatuses"
    WHERE "RequestId" = ANY($1)
    ORDER BY "RequestId", "ChangeDate" DESC
  `;

  const result = await pool.query(query, [requestIds]);
  
  const statusMap = new Map<string, RequestStatusRecord>();
  result.rows.forEach(row => {
    statusMap.set(row.RequestId, row);
  });
  
  return statusMap;
}