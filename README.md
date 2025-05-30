# 🚗 AutoMud Backend API

API REST per la gestione delle richieste nel sistema **AutoMud**.  
Costruita con Node.js, Express.js, TypeScript e PostgreSQL.

---

## 🧱 Stack Tecnologico

- **Node.js** – runtime JavaScript lato server  
- **Express.js** – framework web leggero  
- **TypeScript** – tipizzazione statica  
- **PostgreSQL** – database relazionale  
- **pg** – client PostgreSQL per Node.js  

---

## 📚 Endpoints Disponibili

### ✅ `GET /api/requests?page=1&limit=10`

Restituisce un array di richieste ordinate dalla più recente.

**Query parametri (opzionali):**
- `page`: numero della pagina (default: `1`)
- `limit`: risultati per pagina (default: `10`)

> ⚠️ Se i parametri non sono specificati, vengono usati i valori di default.  
> Non restituisce **tutti** i record se `limit` è assente.

**Esempio di risposta:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1324,
    "totalPages": 133
  }
}
```

---

### ✅ `GET /api/request/:id`

Restituisce i dettagli completi di una singola richiesta.

**Esempio:**
```http
GET /api/request/AM25005488
```

**Esempio di risposta:**
```json
{
  "Id": "AM25005488",
  "DateTime": "2025-05-14T16:52:32.863Z",
  "LicensePlate": "DK366PF",
  "Km": 200000,
  "Make": "Ford",
  "Model": "Consul",
  "RegistrationYear": 2007,
  "EngineSize": 1500,
  "FuelType": 45,
  "TransmissionType": 10,
  "CarCondition": 10,
  "EngineCondition": 30,
  "InteriorConditions": "dsadasdasd",
  "ExteriorConditions": "asdasdasd",
  "MechanicalConditions": "asdasdasd",
  "Cap": "20811",
  "City": "Cesano Maderno (MB)",
  "FirstName": "Reda",
  "LastName": "Charf",
  "Email": "reda875@hotmail.it",
  "Phone": "3281352136",
  "DesiredPrice": 200
}
```

---

## ▶️ Avvio rapido (dev)

```bash
npm install
npm run dev
```

Assicurati che il file `.env` sia presente nella root e contenga le variabili per la connessione al database PostgreSQL.
