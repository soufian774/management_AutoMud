export interface RequestOfferRecord {
  Id: number;                    // ID univoco dell'offerta
  RequestId: string;             // ID della richiesta (FK)
  OfferDescription: string;      // Descrizione dell'offerta
  OfferPrice: number;            // Prezzo offerto
  OfferDate: string;             // Data dell'offerta (ISO string)
}