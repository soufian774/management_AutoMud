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

> Se i parametri non sono specificati, vengono usati i valori di default.  
> ⚠️ Non restituisce **tutte** le richieste se `limit` è assente.

**Risposta:**
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

Restituisce i dettagli completi di una singola richiesta dato un `Id`.

---

## ▶️ Avvio rapido (dev)

```bash
npm install
npm run dev
```

Assicurati che il file `.env` sia configurato con i parametri DB corretti.
