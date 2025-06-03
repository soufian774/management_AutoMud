export interface RequestRecord {
  Id: string;                    // ID univoco della richiesta
  DateTime: string;              // Data e ora della richiesta
  LicensePlate: string;          // Targa del veicolo
  Km: number;                    // Chilometraggio
  Make: string;                  // Marca del veicolo
  Model: string;                 // Modello del veicolo
  RegistrationYear: number;     // Anno di immatricolazione
  EngineSize: number;           // Cilindrata (cc)
  FuelType: number;             // Tipo di carburante (codificato)
  TransmissionType: number;     // Tipo di cambio (codificato)
  CarCondition: number;         // Condizione generale (codificata)
  EngineCondition: number;      // Condizione del motore (codificata)
  InteriorConditions: string;   // Descrizione condizioni interni
  ExteriorConditions: string;   // Descrizione condizioni esterni
  MechanicalConditions?: string; // Condizioni meccaniche (opzionali)
  Cap: string;                  // CAP del richiedente
  City: string;                 // Città del richiedente
  FirstName: string;            // Nome
  LastName: string;             // Cognome
  Email: string;                // Email
  Phone: string;                // Numero di telefono
  DesiredPrice: number;         // Prezzo desiderato
  Images: string[];             // Lista nomi immagine associate alla richiesta
}
