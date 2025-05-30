import { Request, Response } from 'express';
import {
  getRequestsPaged,
  getRequestById,
  getTotalRequestCount
} from '../services/request.service';
import { RequestRecord } from '../models/request.model';

/**
 * Gestisce GET /api/requests
 * Restituisce richieste in modo paginato. Applica valori di default se non forniti.
 */
export async function getRequests(req: Request, res: Response) {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;

  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;

  if (page <= 0 || limit <= 0) {
    res.status(400).json({ error: 'Parametri di paginazione non validi' });
    return;
  }

  try {
    const [requests, total] = await Promise.all([
      getRequestsPaged(page, limit),
      getTotalRequestCount()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Errore durante il recupero delle richieste:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}

/**
 * Gestisce GET /api/request/:id
 * Restituisce i dettagli di una singola richiesta.
 */
export async function getRequest(req: Request, res: Response) {
  const id = req.params.id;

  try {
    const request = await getRequestById(id);

    if (!request) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Errore durante il recupero della richiesta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}
