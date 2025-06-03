export interface RequestStatusRecord {
  Id: number;                    // ID univoco del record di stato
  RequestId: string;             // ID della richiesta (FK)
  Status: number;                // Codice stato (10=Da chiamare, 20=In corso, 30=Prati-ritiro, 40=Esito finale)
  ChangeDate: string;            // Data e ora del cambio stato (ISO string)
}

export interface StatusChangeRequest {
  RequestId: string;
  NewStatus: number;
  FinalOutcome?: number;         // Solo se NewStatus = 40 (Esito finale)
  CloseReason?: number;          // Solo se FinalOutcome = 30 (Non acquistata)
  Notes?: string;                // Note opzionali sul cambio stato
}