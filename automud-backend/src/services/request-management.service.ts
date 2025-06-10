import { pool } from '../db/pool';
import { RequestManagementRecord } from '../models/request-management.model';

/**
 * Restituisce i dati di gestione per una richiesta specifica.
 * @param requestId ID della richiesta
 */
export async function getManagementByRequestId(requestId: string): Promise<RequestManagementRecord | null> {
  const query = `
    SELECT 
      "RequestId", 
      COALESCE("Notes", '') AS "Notes",
      COALESCE("RangeMin", 0) AS "RangeMin",
      COALESCE("RangeMax", 0) AS "RangeMax", 
      COALESCE("RegistrationCost", 0) AS "RegistrationCost",
      COALESCE("TransportCost", 0) AS "TransportCost",
      COALESCE("PurchasePrice", 0) AS "PurchasePrice",
      COALESCE("SalePrice", 0) AS "SalePrice",
      COALESCE("RequestCloseReason", 0) AS "RequestCloseReason",
      "FinalOutcome"
    FROM "RequestManagements"
    WHERE "RequestId" = $1
  `;

  const result = await pool.query(query, [requestId]);
  
  // 🎯 Se non esiste record, ritorna default values invece di null
  if (result.rows.length === 0) {
    return {
      RequestId: requestId,
      Notes: '',
      RangeMin: 0,
      RangeMax: 0,
      RegistrationCost: 0,
      TransportCost: 0,
      PurchasePrice: 0,
      SalePrice: 0,
      RequestCloseReason: 0,
      FinalOutcome: undefined
    };
  }
  
  return result.rows[0];
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
      "SalePrice", "RequestCloseReason", "FinalOutcome"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT ("RequestId") DO UPDATE SET
      "Notes" = EXCLUDED."Notes",
      "RangeMin" = EXCLUDED."RangeMin",
      "RangeMax" = EXCLUDED."RangeMax",
      "RegistrationCost" = EXCLUDED."RegistrationCost",
      "TransportCost" = EXCLUDED."TransportCost",
      "PurchasePrice" = EXCLUDED."PurchasePrice",
      "SalePrice" = EXCLUDED."SalePrice",
      "RequestCloseReason" = EXCLUDED."RequestCloseReason",
      "FinalOutcome" = EXCLUDED."FinalOutcome"
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
    management.RequestCloseReason,
    management.FinalOutcome || null
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
  // ✅ Ora aggiorniamo sia FinalOutcome che RequestCloseReason
  const query = `
    UPDATE "RequestManagements"
    SET "FinalOutcome" = $2, "RequestCloseReason" = $3
    WHERE "RequestId" = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    requestId,
    finalOutcome || null,
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