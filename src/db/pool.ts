/**
 * Gestione della connessione a PostgreSQL usando pg.Pool.
 * Le credenziali sono lette da variabili d'ambiente (.env).
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carica variabili da .env
dotenv.config();

// Variabili ambientali necessarie
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Verifica presenza di tutte le variabili
const isEnvMissing = !DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME;

if (isEnvMissing) {
  throw new Error('❌ Variabili ambiente mancanti. Verifica il file .env.');
}

// Crea pool di connessione PostgreSQL
const pool = new Pool({
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

// Log su connessione riuscita
pool.on('connect', () => {
  console.log('✅ Connessione al database PostgreSQL riuscita');
});

export { pool };
