import { Request, Response } from 'express';
import { getRequestsPaged, getAllRequests, getRequestById } from '../services/request.service';
import { RequestRecord } from '../models/request.model';

/**
 * Gestisce la rotta GET /api/requests
 * Restituisce una lista di richieste, paginata se specificati i parametri.
 */
export async function getRequests(req: Request, res: Response) {
  const pageQuery = req.query.page;
  const limitQuery = req.query.limit;

  const page = pageQuery ? parseInt(pageQuery as string, 10) : 1;
  const limit = limitQuery ? parseInt(limitQuery as string, 10) : null;

  const pageIsInvalid = pageQuery && isNaN(page);
  const limitIsInvalid = limitQuery && limit !== null && isNaN(limit);

  if (pageIsInvalid || limitIsInvalid) {
    res.status(400).json({ error: 'Parametri di paginazione non validi' });
    return;
  }

  try {
    if (limit === null) {
      // Nessun limite: restituisco tutte le richieste
      const allRequests: RequestRecord[] = await getAllRequests();
      res.status(200).json(allRequests);
    } else {
      // Paginazione: restituisco solo il blocco richiesto
      const pagedRequests: RequestRecord[] = await getRequestsPaged(page, limit);
      res.status(200).json(pagedRequests);
    }
  } catch (error) {
    console.error('Errore durante il recupero delle richieste:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}

/**
 * Gestisce la rotta GET /api/request/:id
 * Restituisce i dettagli di una richiesta specifica per ID.
 */
export async function getRequest(req: Request, res: Response) {
  const requestId = req.params.id;

  try {
    const request = await getRequestById(requestId);

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
