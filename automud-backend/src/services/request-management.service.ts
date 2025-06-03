import { pool } from '../db/pool';
import { RequestManagementRecord } from '../models/request-management.model';

/**
 * Restituisce i dati di gestione per una richiesta specifica.
 * @param requestId ID della richiesta
 */
export async function getManagementByRequestId(requestId: string): Promise<RequestManagementRecord | null> {
  const query = `
    SELECT "RequestId", "Notes", "RangeMin", "RangeMax", 
           "RegistrationCost", "TransportCost", "PurchasePrice", 
           "SalePrice", "RequestCloseReason"
    FROM "RequestManagements"
    WHERE "RequestId" = $1
  `;

  const result = await pool.query(query, [requestId]);
  return result.rows[0] || null;
}

/**
 * Crea o aggiorna i dati di gestione per una richiesta.
 * @param management Dati di gestione
 */
export async function upsertManagement(management: RequestManagementRecord): Promise<RequestManagementRecord> {
  const query = `
    INSERT INTO "RequestManagements" (
      "RequestId", "Notes", "RangeMin", "RangeMax", 
      "RegistrationCost", "TransportCost", "PurchasePrice", 
      "SalePrice", "RequestCloseReason"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT ("RequestId") DO UPDATE SET
      "Notes" = EXCLUDED."Notes",
      "RangeMin" = EXCLUDED."RangeMin",
      "RangeMax" = EXCLUDED."RangeMax",
      "RegistrationCost" = EXCLUDED."RegistrationCost",
      "TransportCost" = EXCLUDED."TransportCost",
      "PurchasePrice" = EXCLUDED."PurchasePrice",
      "SalePrice" = EXCLUDED."SalePrice",
      "RequestCloseReason" = EXCLUDED."RequestCloseReason"
    RETURNING *
  `;

  const result = await pool.query(query, [
    management.RequestId,
    management.Notes,
    management.RangeMin,
    management.RangeMax,
    management.RegistrationCost,
    management.TransportCost,
    management.PurchasePrice,
    management.SalePrice,
    management.RequestCloseReason
  ]);

  return result.rows[0];
}

/**
 * Aggiorna solo l'esito finale e il motivo di chiusura per una richiesta.
 * @param requestId ID della richiesta
 * @param finalOutcome Esito finale
 * @param closeReason Motivo di chiusura
 */
export async function updateFinalOutcome(
  requestId: string, 
  finalOutcome?: number, 
  closeReason?: number
): Promise<RequestManagementRecord | null> {
  // Per ora aggiorna solo il motivo di chiusura, dato che FinalOutcome non esiste nella tabella
  const query = `
    UPDATE "RequestManagements"
    SET "RequestCloseReason" = $2
    WHERE "RequestId" = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    requestId,
    closeReason || 0
  ]);

  return result.rows[0] || null;
}

/**
 * Restituisce i dati di gestione per più richieste (per performance).
 * @param requestIds Array di ID richieste
 */
export async function getManagementForRequests(requestIds: string[]): Promise<Map<string, RequestManagementRecord>> {
  if (requestIds.length === 0) return new Map();

  const query = `
    SELECT "RequestId", "Notes", "RangeMin", "RangeMax", 
           "RegistrationCost", "TransportCost", "PurchasePrice", 
           "SalePrice", "RequestCloseReason"
    FROM "RequestManagements"
    WHERE "RequestId" = ANY($1)
  `;

  const result = await pool.query(query, [requestIds]);
  
  const managementMap = new Map<string, RequestManagementRecord>();
  result.rows.forEach(row => {
    managementMap.set(row.RequestId, row);
  });
  
  return managementMap;
}