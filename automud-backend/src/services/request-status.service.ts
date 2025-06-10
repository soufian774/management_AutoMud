import { pool } from '../db/pool';
import { RequestStatusRecord, StatusChangeRequest } from '../models/request-status.model';

/**
 * Restituisce lo storico degli stati per una richiesta specifica.
 * @param requestId ID della richiesta
 */
export async function getStatusHistoryByRequestId(requestId: string): Promise<RequestStatusRecord[]> {
  const query = `
    SELECT 
      rs."Id", 
      rs."RequestId", 
      rs."Status", 
      rs."ChangeDate",
      rs."Notes",
      rm."FinalOutcome",
      rm."RequestCloseReason" as "CloseReason"
    FROM "RequestStatuses" rs
    LEFT JOIN "RequestManagements" rm ON rs."RequestId" = rm."RequestId" 
      AND rs."Status" = 40  -- Solo per stati "Esito finale"
    WHERE rs."RequestId" = $1
    ORDER BY rs."ChangeDate" ASC
  `;

  const result = await pool.query(query, [requestId]);
  
  // 🎯 Se non ci sono stati, crea uno stato default "Da chiamare"
  if (result.rows.length === 0) {
    // Ottieni la data/ora della richiesta per usarla come ChangeDate
    const requestQuery = `SELECT "DateTime" FROM "Requests" WHERE "Id" = $1`;
    const requestResult = await pool.query(requestQuery, [requestId]);
    
    const requestDateTime = requestResult.rows[0]?.DateTime || new Date().toISOString();
    
    return [{
      Id: 0, // ID fittizio per il frontend
      RequestId: requestId,
      Status: 10, // "Da chiamare"
      ChangeDate: requestDateTime, // Data/ora della richiesta originale
      Notes: undefined,
      FinalOutcome: undefined,
      CloseReason: undefined
    }];
  }
  
  return result.rows;
}

/**
 * Restituisce l'ultimo stato di una richiesta.
 * @param requestId ID della richiesta
 */
export async function getCurrentStatusByRequestId(requestId: string): Promise<RequestStatusRecord | null> {
  const query = `
    SELECT "Id", "RequestId", "Status", "ChangeDate", "Notes"
    FROM "RequestStatuses"
    WHERE "RequestId" = $1
    ORDER BY "ChangeDate" DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [requestId]);
  
  // 🎯 Se non esiste stato, ritorna "Da chiamare" con data richiesta
  if (result.rows.length === 0) {
    const requestQuery = `SELECT "DateTime" FROM "Requests" WHERE "Id" = $1`;
    const requestResult = await pool.query(requestQuery, [requestId]);
    
    const requestDateTime = requestResult.rows[0]?.DateTime || new Date().toISOString();
    
    return {
      Id: 0, // ID fittizio
      RequestId: requestId,
      Status: 10, // "Da chiamare"
      ChangeDate: requestDateTime,
      Notes: undefined
    };
  }
  
  return result.rows[0];
}

/**
 * Aggiunge un nuovo stato per una richiesta.
 * @param statusChange Dati del cambio stato
 */
export async function addStatusChange(statusChange: StatusChangeRequest): Promise<RequestStatusRecord> {
  const query = `
    INSERT INTO "RequestStatuses" ("RequestId", "Status", "ChangeDate", "Notes")
    VALUES ($1, $2, NOW(), $3)
    RETURNING "Id", "RequestId", "Status", "ChangeDate", "Notes"
  `;

  const result = await pool.query(query, [
    statusChange.RequestId,
    statusChange.NewStatus,
    statusChange.Notes || null
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