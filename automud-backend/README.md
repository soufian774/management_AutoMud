# 🚗 Automud Backend

**API REST Gestionario AutoMud**

Backend Node.js/TypeScript con PostgreSQL e autenticazione Basic HTTP.

## 🚀 **Setup veloce**

### Prerequisiti
- Node.js >= 18.x
- PostgreSQL >= 12.x

### Installazione
```bash
# Clone e dipendenze
git clone <repository-url>
cd automud-backend
npm install

# Tipi TypeScript
npm install --save-dev @types/node @types/express @types/cors @types/bcrypt @types/pg typescript ts-node

# Configura .env
cp .env.example .env
```

### Configurazione `.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=automud_db
PORT=3000
```

### Avvio
```bash
# Test connessione database
npx ts-node src/db/test-connection.ts

# Crea primo utente
npx ts-node src/scripts/create-user.ts

# Avvia server
npx ts-node src/server.ts
```

## 📁 **Struttura progetto**

```
src/
├── app.ts                      # Configurazione Express + CORS
├── server.ts                   # Entry point
├── controllers/
│   └── request.controller.ts   # Logica API
├── db/
│   ├── pool.ts                 # Connessione PostgreSQL
│   └── test-connection.ts      # Test database
├── middlewares/
│   └── basicAuth.middleware.ts # Autenticazione HTTP Basic
├── models/
│   └── request.model.ts        # Interfacce TypeScript
├── routes/
│   └── request.routes.ts       # Definizione endpoint
├── scripts/
│   └── create-user.ts          # Utility creazione utenti
└── services/
    └── request.service.ts      # Business logic
```

## 🔌 **API Endpoints**

**Base URL:** `http://localhost:3000/api`  
**Auth:** Basic HTTP (`Authorization: Basic base64(username:password)`)

### **GET /requests**
Lista paginata con ricerca opzionale.

**Query params:**
- `page=1` - Numero pagina
- `limit=12` - Elementi per pagina
- `search=terme` - Ricerca su ID, targa, cliente, marca/modello

**Esempio:**
```bash
curl -u username:password \
  "http://localhost:3000/api/requests?search=BMW&page=1&limit=10"
```

**Risposta:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 315,
    "totalPages": 32,
    "hasNext": true,
    "hasPrev": false
  },
  "search": "BMW"
}
```

### **GET /request/:id**
Dettagli richiesta specifica.

```bash
curl -u username:password \
  "http://localhost:3000/api/request/AM25005488"
```

### **GET /requests/count**
Conteggio totale (con ricerca opzionale).

```bash
curl -u username:password \
  "http://localhost:3000/api/requests/count?search=BMW"
```

## 🔒 **Sicurezza**

- **Autenticazione Basic HTTP** su tutte le route
- **Password hash** con bcrypt (10 salt rounds)
- **CORS** abilitato per richieste cross-origin
- **Query parametrizzate** per prevenire SQL injection

## 📊 **Performance**

- **Ricerca server-side** ottimizzata con PostgreSQL
- **Paginazione** per dataset grandi  
- **Connection pooling** per efficienza database

## 🔧 **Tecnologie**

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Database
- **bcrypt** - Hash password
- **pg** - Driver PostgreSQL
- **CORS** - Cross-origin requests

---