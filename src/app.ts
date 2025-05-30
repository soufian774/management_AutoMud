import express from 'express';
import requestRouter from './routes/request.routes';

const app = express();

// Abilita il parsing del corpo delle richieste in formato JSON
app.use(express.json());

// Tutte le rotte della nostra API iniziano con /api
app.use('/api', requestRouter);

// Catch-all per rotte non definite
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

export default app;
