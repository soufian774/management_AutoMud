import { pool } from '../db/pool';
import { RequestOfferRecord } from '../models/request-offer.model';

/**
 * Restituisce tutte le offerte per una richiesta specifica.
 * @param requestId ID della richiesta
 */
export async function getOffersByRequestId(requestId: string): Promise<RequestOfferRecord[]> {
  const query = `
    SELECT "Id", "RequestId", "OfferDescription", "OfferPrice", "OfferDate"
    FROM "RequestOffers"
    WHERE "RequestId" = $1
    ORDER BY "OfferDate" DESC
  `;

  const result = await pool.query(query, [requestId]);
  return result.rows;
}

/**
 * Aggiunge una nuova offerta per una richiesta.
 * @param offer Dati dell'offerta
 */
export async function addOffer(offer: Omit<RequestOfferRecord, 'Id'>): Promise<RequestOfferRecord> {
  const query = `
    INSERT INTO "RequestOffers" ("RequestId", "OfferDescription", "OfferPrice", "OfferDate")
    VALUES ($1, $2, $3, $4)
    RETURNING "Id", "RequestId", "OfferDescription", "OfferPrice", "OfferDate"
  `;

  const result = await pool.query(query, [
    offer.RequestId,
    offer.OfferDescription,
    offer.OfferPrice,
    offer.OfferDate
  ]);

  return result.rows[0];
}

/**
 * Elimina un'offerta specifica.
 * @param offerId ID dell'offerta
 */
export async function deleteOffer(offerId: number): Promise<boolean> {
  const query = `
    DELETE FROM "RequestOffers"
    WHERE "Id" = $1
  `;

  const result = await pool.query(query, [offerId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Aggiorna un'offerta esistente.
 * @param offerId ID dell'offerta
 * @param updates Dati da aggiornare
 */
export async function updateOffer(
  offerId: number, 
  updates: Partial<Pick<RequestOfferRecord, 'OfferDescription' | 'OfferPrice'>>
): Promise<RequestOfferRecord | null> {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.OfferDescription !== undefined) {
    fields.push(`"OfferDescription" = $${paramIndex++}`);
    values.push(updates.OfferDescription);
  }

  if (updates.OfferPrice !== undefined) {
    fields.push(`"OfferPrice" = $${paramIndex++}`);
    values.push(updates.OfferPrice);
  }

  if (fields.length === 0) {
    throw new Error('Nessun campo da aggiornare');
  }

  values.push(offerId);

  const query = `
    UPDATE "RequestOffers"
    SET ${fields.join(', ')}
    WHERE "Id" = $${paramIndex}
    RETURNING "Id", "RequestId", "OfferDescription", "OfferPrice", "OfferDate"
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Restituisce le offerte per più richieste (per performance).
 * @param requestIds Array di ID richieste
 */
export async function getOffersForRequests(requestIds: string[]): Promise<Map<string, RequestOfferRecord[]>> {
  if (requestIds.length === 0) return new Map();

  const query = `
    SELECT "Id", "RequestId", "OfferDescription", "OfferPrice", "OfferDate"
    FROM "RequestOffers"
    WHERE "RequestId" = ANY($1)
    ORDER BY "RequestId", "OfferDate" DESC
  `;

  const result = await pool.query(query, [requestIds]);
  
  const offersMap = new Map<string, RequestOfferRecord[]>();
  
  result.rows.forEach(row => {
    if (!offersMap.has(row.RequestId)) {
      offersMap.set(row.RequestId, []);
    }
    offersMap.get(row.RequestId)!.push(row);
  });
  
  return offersMap;
}