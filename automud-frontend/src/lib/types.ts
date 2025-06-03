// ✅ ENUM come oggetti costanti leggibili
export const TransmissionTypeEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Manuale',
  20: 'Automatico'
};

export const FuelTypeEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Benzina',
  15: 'Benzina Ibrida',
  20: 'Diesel',
  25: 'Diesel Ibrida',
  30: 'Elettrico',
  35: 'GPL',
  40: 'Metano',
  45: 'Etanolo'
};

export const EngineConditionEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Avvia e si muove',
  20: 'Avvia ma non si muove',
  30: 'Non avvia'
};

export const CarConditionEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Incidentato',
  20: 'Guasto',
  30: 'Usato'
};

// ✅ ENUM per gli stati delle richieste AutoMUD
export const RequestStatusEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Da chiamare',
  20: 'In corso',
  30: 'Prati-ritiro',
  40: 'Esito finale'
};

// ✅ Helper per ottenere il colore del badge per stato
export const getStatusColor = (status: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 40: return 'default';      // 'Esito finale' = Verde
    case 30: return 'secondary';    // 'Prati-ritiro' = Giallo
    case 20: return 'outline';      // 'In corso' = Grigio
    case 10: return 'outline';      // 'Da chiamare' = Grigio chiaro
    default: return 'destructive';  // Altro = Rosso
  }
};

// ✅ ENUM per gli esiti finali quando stato = "Esito finale"
export const FinalOutcomeEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Acquistata',
  20: 'Demolita',
  30: 'Non acquistata'
};

// ✅ ENUM per i motivi di "Non acquistata"
export const CloseReasonEnum: Record<number, string> = {
  0: 'N/A',
  10: 'Cliente vuole troppo',
  20: 'Automud non la ritira',
  30: 'Range rifiutato',
  40: 'Il cliente l\'ha venduta',
  50: 'Nessuna risposta',
  60: 'Appuntamento fallito',
  70: 'No offerta'
};

// ✅ Mapping delle azioni automatiche per i motivi di chiusura
export const AutomaticActionsMap: Record<number, string> = {
  20: 'Invio automatico di un\'email al cliente', // Automud non la ritira
  // Altri motivi hanno "Nessuna azione" come default
};

// ===== INTERFACCE BASE =====

export interface AutoRequest {
  Id: string;
  DateTime: string;
  LicensePlate: string;
  Km: number;
  Make: string;
  Model: string;
  RegistrationYear: number;
  EngineSize: number;
  FuelType: number;
  TransmissionType: number;
  CarCondition: number;
  EngineCondition: number;
  InteriorConditions: string;
  ExteriorConditions: string;
  MechanicalConditions?: string;
  Cap: string;
  City: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  DesiredPrice: number;
  Images: string[];
}

// ===== NUOVE INTERFACCE =====

export interface RequestManagement {
  RequestId: string;
  Notes: string;
  RangeMin: number;
  RangeMax: number;
  RegistrationCost: number;
  TransportCost: number;
  PurchasePrice: number;
  SalePrice: number;
  RequestCloseReason: number;
  FinalOutcome?: number; // Per distinguere Acquistata/Demolita/Non acquistata quando Status = 40
}

export interface RequestOffer {
  Id: number;
  RequestId: string;
  OfferDescription: string;
  OfferPrice: number;
  OfferDate: string; // ISO string
}

export interface RequestStatus {
  Id: number;
  RequestId: string;
  Status: number;
  ChangeDate: string; // ISO string
}

export interface RequestImage {
  Id: number;
  RequestId: string;
  Name: string;
}

// ===== INTERFACCIA COMPLETA PER IL DETTAGLIO =====

export interface CompleteRequestDetail extends AutoRequest {
  Management?: RequestManagement;
  Offers: RequestOffer[];
  StatusHistory: RequestStatus[];
  CurrentStatus?: RequestStatus; // Ultimo stato
}

// ===== UTILITY TYPES PER LA GESTIONE STATI =====

export interface StatusChangeRequest {
  RequestId: string;
  NewStatus: number;
  FinalOutcome?: number; // Solo se NewStatus = 40 (Esito finale)
  CloseReason?: number; // Solo se FinalOutcome = 30 (Non acquistata)
  Notes?: string;
}