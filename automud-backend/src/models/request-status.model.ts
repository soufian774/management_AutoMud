export interface RequestStatusRecord {
  Id: number;
  RequestId: string;
  Status: number;
  ChangeDate: string;
  Notes?: string;         
  FinalOutcome?: number;  
  CloseReason?: number;   
}

export interface StatusChangeRequest {
  RequestId: string;
  NewStatus: number;
  FinalOutcome?: number;         // Solo se NewStatus = 40 (Esito finale)
  CloseReason?: number;          // Solo se FinalOutcome = 30 (Non acquistata)
  Notes?: string;                // Note opzionali sul cambio stato
}