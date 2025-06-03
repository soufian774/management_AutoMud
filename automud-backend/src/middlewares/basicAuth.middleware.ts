import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import bcrypt from 'bcrypt';

/**
 * 🛡️ Middleware per autenticazione Basic HTTP
 */
export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Nessuna autorizzazione → chiedi credenziali
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic');
    res.status(401).json({ error: 'Autenticazione richiesta' });
    return;
  }

  // Decodifica base64 → "username:password"
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (!username || !password) {
    res.status(400).json({ error: 'Credenziali malformate' });
    return;
  }

  // Cerca l'utente nel database
  const query = 'SELECT * FROM "Users" WHERE username = $1';

  pool.query(query, [username])
    .then(result => {
      const user = result.rows[0];

      if (!user) {
        res.status(401).json({ error: 'Utente non trovato' });
        return;
      }

      // Verifica password
      bcrypt.compare(password, user.password)
        .then(isValid => {
          if (!isValid) {
            res.status(401).json({ error: 'Password errata' });
            return;
          }

          // ✅ Autenticazione riuscita
          next();
        })
        .catch(err => {
          console.error('Errore nella verifica password:', err);
          res.status(500).json({ error: 'Errore interno del server' });
        });
    })
    .catch(err => {
      console.error('Errore durante la query utente:', err);
      res.status(500).json({ error: 'Errore interno del server' });
    });
}
