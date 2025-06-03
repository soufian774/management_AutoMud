/**
 * Test della connessione a PostgreSQL
 * Esegui con: npx ts-node src/db/test-connection.ts
 */

import { pool } from './pool';

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🧪 Connessione riuscita:', result.rows[0]);
  } catch (error) {
    console.error('❌ Errore durante la connessione al database:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
