import express from 'express';
import requestRouter from './routes/request.routes';
import { basicAuth } from './middlewares/basicAuth.middleware'; // 🛡️ Importa il middleware
import cors from 'cors';

const app = express();
app.use(cors());

// Abilita CORS PRIMA del middleware di auth
app.use(cors());

// Abilita il parsing del corpo delle richieste in formato JSON
app.use(express.json());

// 🛡️ Autenticazione Basic su tutte le rotte
app.use(basicAuth);

// Tutte le rotte della nostra API iniziano con /api
app.use('/api', requestRouter);

// Catch-all per rotte non definite
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

export default app;
