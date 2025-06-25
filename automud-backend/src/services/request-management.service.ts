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
      COALESCE("SalePrice", 0) AS "SalePrice"
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
      SalePrice: 0
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
      "RegistrationCost", "TransportCost", "PurchasePrice", "SalePrice"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT ("RequestId") DO UPDATE SET
      "Notes" = EXCLUDED."Notes",
      "RangeMin" = EXCLUDED."RangeMin",
      "RangeMax" = EXCLUDED."RangeMax",
      "RegistrationCost" = EXCLUDED."RegistrationCost",
      "TransportCost" = EXCLUDED."TransportCost",
      "PurchasePrice" = EXCLUDED."PurchasePrice",
      "SalePrice" = EXCLUDED."SalePrice"
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
    management.SalePrice
  ]);

  return result.rows[0];
}

/**
 * Restituisce i dati di gestione per più richieste (per performance).
 * @param requestIds Array di ID richieste
 */
export async function getManagementForRequests(requestIds: string[]): Promise<Map<string, RequestManagementRecord>> {
  if (requestIds.length === 0) return new Map();

  const query = `
    SELECT "RequestId", "Notes", "RangeMin", "RangeMax", 
           "RegistrationCost", "TransportCost", "PurchasePrice", "SalePrice"
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