import readline from 'readline';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool';

// 🔐 Numero di cicli per l'hash (più è alto, più sicuro ma lento)
const SALT_ROUNDS = 10;

// 📚 Funzione per inserire l'utente nel DB
async function createUser(username: string, plainPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    const query = `
      INSERT INTO "Users" (username, password)
      VALUES ($1, $2)
      RETURNING id
    `;
    const values = [username, hashedPassword];

    const result = await pool.query(query, values);
    const userId = result.rows[0].id;

    console.log(`✅ Utente creato con ID: ${userId}`);
  } catch (error) {
    console.error('❌ Errore nella creazione utente:', error);
  } finally {
    await pool.end(); // Chiude la connessione
  }
}

// 🧠 Prompt da terminale
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Avvio interazione
rl.question('👤 Username: ', (username) => {
  rl.question('🔑 Password: ', (password) => {
    rl.close();
    createUser(username, password);
  });
});
