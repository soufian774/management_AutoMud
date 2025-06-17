/**
 * Router per le richieste (Requests).
 * Tutte le rotte utilizzano il singolare "request" per consistenza.
 * 
 * API Endpoints:
 * - GET  /api/request           → elenco richieste (paginato con ricerca)
 * - GET  /api/request/count     → numero totale richieste  
 * - GET  /api/request/:id       → dettaglio completo di una richiesta
 * - PUT  /api/request/:id/status    → cambio stato richiesta
 * - PUT  /api/request/:id/notes     → aggiornamento note
 * - PUT  /api/request/:id/pricing   → aggiornamento prezzi e costi
 * - PUT  /api/request/:id/range     → aggiornamento range valutazione
 * - PUT  /api/request/:id/vehicle   → aggiornamento info veicolo
 * - POST /api/request/:id/offers    → aggiunta offerta
 * - PUT  /api/request/:id/offers/:offerId  → modifica offerta
 * - DELETE /api/request/:id/offers/:offerId → eliminazione offerta
 */

import { Router, Request, Response } from 'express';
import { 
  getRequests, 
  getRequest, 
  changeRequestStatus, 
  updateRequestNotes, 
  updateRequestPricing, 
  updateRequestRange, 
  updateRequestVehicle,
  addRequestOffer,
  updateRequestOffer,
  deleteRequestOffer,
  getStatusCountsController 
} from '../controllers/request.controller';
import { getTotalRequestCount } from '../services/request.service';

const requestRouter = Router();

// ✅ Elenco richieste (con paginazione e ricerca)
// Cambiato da /requests a /request
requestRouter.get('/request', getRequests);

requestRouter.get('/request/status-counts', getStatusCountsController);

// ✅ Numero totale richieste
// Spostato prima del parametro /:id per evitare conflitti di routing
requestRouter.get('/request/count', async (_req: Request, res: Response) => {
  try {
    const total = await getTotalRequestCount();
    res.json({ total });
  } catch (error) {
    console.error('❌ Errore nel conteggio richieste:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ✅ Dettaglio richiesta completa tramite ID
requestRouter.get('/request/:id', getRequest);

// ✅ Cambio stato richiesta
requestRouter.put('/request/:id/status', changeRequestStatus);

// ✅ Aggiornamento note richiesta
requestRouter.put('/request/:id/notes', updateRequestNotes);

// ✅ Aggiornamento prezzi e costi richiesta
requestRouter.put('/request/:id/pricing', updateRequestPricing);

// ✅ Aggiornamento range valutazione richiesta
requestRouter.put('/request/:id/range', updateRequestRange);

// ✅ Aggiornamento informazioni veicolo richiesta
requestRouter.put('/request/:id/vehicle', updateRequestVehicle);

// ✅ Gestione offerte
requestRouter.post('/request/:id/offers', addRequestOffer);
requestRouter.put('/request/:id/offers/:offerId', updateRequestOffer);
requestRouter.delete('/request/:id/offers/:offerId', deleteRequestOffer);

export default requestRouter;