export interface RequestManagementRecord {
  RequestId: string;             // ID della richiesta (PK/FK)
  Notes: string;                 // Note di gestione
  RangeMin: number;              // Valore minimo range valutazione
  RangeMax: number;              // Valore massimo range valutazione
  RegistrationCost: number;      // Costi di pratica/registrazione
  TransportCost: number;         // Costi di trasporto
  PurchasePrice: number;         // Prezzo di acquisto
  SalePrice: number;             // Prezzo di vendita
  RequestCloseReason: number;    // Motivo di chiusura (se applicabile)
  // FinalOutcome?: number;      // TODO: Aggiungere quando si crea la colonna nel DB
}